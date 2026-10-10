import { CHAT_SERVER_URL } from '../../../config/apiConfig';
import type { ChatSocketEvent } from '../types';

type Listener = (event: ChatSocketEvent) => void;

class ChatSocketClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private retry: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private token: string | null = null;
  private manuallyClosed = false;

  connect(token: string) {
    if (this.token === token && (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING)) return;
    this.disconnect();
    this.token = token;
    this.manuallyClosed = false;
    const origin = CHAT_SERVER_URL.replace(/^http/, 'ws');
    this.socket = new WebSocket(`${origin}/ws/chat?token=${encodeURIComponent(token)}`);
    this.socket.onopen = () => { this.retryCount = 0; };
    this.socket.onmessage = message => {
      try {
        const event = JSON.parse(String(message.data)) as ChatSocketEvent;
        this.listeners.forEach(listener => listener(event));
      } catch {}
    };
    this.socket.onclose = () => {
      this.socket = null;
      if (!this.manuallyClosed && this.token) {
        const delay = Math.min(1000 * 2 ** this.retryCount++, 15000);
        this.retry = setTimeout(() => this.token && this.connect(this.token), delay);
      }
    };
  }

  disconnect() {
    this.manuallyClosed = true;
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    this.socket?.close();
    this.socket = null;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  send(type: string, conversationId: number, data: Record<string, unknown> = {}) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify({ type, conversation_id: conversationId, ...data }));
    return true;
  }
}

export const chatSocket = new ChatSocketClient();
