import { AppState, type NativeEventSubscription } from "react-native";
import { getAuthToken } from "../../common/auth/api/AuthAPI";
import { isTokenExpiringSoon } from "../../common/auth/utils/jwtUtils";
import { CHAT_SERVER_URL } from "../../../config/apiConfig";
import { fetchConversations } from "../api/chatApi";
import type { ChatSocketEvent } from "../types";

type Listener = (event: ChatSocketEvent) => void;
export class ChatSocketClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private retry: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private token: string | null = null;
  private generation = 0;
  private reconnecting = false;
  private appState: NativeEventSubscription | null = null;

  connect(token: string) {
    if (!this.appState)
      this.appState = AppState.addEventListener("change", (state) => {
        if (state === "active" && this.token) void this.reconnect();
        else this.closeSocket();
      });
    if (
      this.token === token &&
      this.socket &&
      this.socket.readyState <= WebSocket.OPEN
    )
      return;
    this.generation++;
    this.closeSocket();
    this.token = token;
    if (AppState.currentState === "active" || AppState.currentState == null)
      this.open(token);
  }

  private open(token: string) {
    if (this.socket || !this.token) return;
    const origin = CHAT_SERVER_URL.replace(/^http/, "ws");
    const socket = new WebSocket(
      `${origin}/ws/chat?token=${encodeURIComponent(token)}`
    );
    this.socket = socket;
    socket.onopen = () => {
      if (this.socket !== socket) return;
      this.retryCount = 0;
      this.requestResync();
    };
    socket.onmessage = (message) => {
      if (this.socket !== socket) return;
      let event: ChatSocketEvent;
      try {
        event = JSON.parse(String(message.data));
      } catch {
        return;
      }
      if (event && typeof event.type === "string") this.emit(event);
    };
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.scheduleRetry();
    };
    socket.onerror = () => {
      if (this.socket === socket) socket.close();
    };
  }

  disconnect() {
    this.generation++;
    this.token = null;
    this.retryCount = 0;
    this.closeSocket();
    this.appState?.remove();
    this.appState = null;
  }
  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
  requestResync() {
    this.emit({ type: "resync", data: null });
  }
  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  send(
    type: string,
    conversationId: number,
    data: Record<string, unknown> = {}
  ) {
    if (!this.isConnected()) return false;
    try {
      this.socket!.send(
        JSON.stringify({ type, conversation_id: conversationId, ...data })
      );
      return true;
    } catch {
      return false;
    }
  }
  private emit(event: ChatSocketEvent) {
    this.listeners.forEach((listener) => listener(event));
  }
  private closeSocket() {
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
      socket.close();
    }
  }
  private scheduleRetry() {
    if (
      !this.token ||
      this.retry ||
      AppState.currentState === "background" ||
      AppState.currentState === "inactive"
    )
      return;
    const delay = Math.min(1000 * 2 ** this.retryCount++, 15000);
    this.retry = setTimeout(() => {
      this.retry = null;
      void this.reconnect();
    }, delay);
  }
  private async reconnect() {
    if (!this.token || this.reconnecting) return;
    if (this.isConnected()) {
      this.requestResync();
      return;
    }
    if (this.socket?.readyState === WebSocket.CONNECTING) return;
    this.reconnecting = true;
    const generation = this.generation;
    let token = getAuthToken() || this.token;
    try {
      // Reuse the authenticated Axios interceptor to rotate an expiring token.
      if (isTokenExpiringSoon(token, 30000)) {
        await fetchConversations();
        token = getAuthToken() || token;
      }
      if (
        generation !== this.generation ||
        !this.token ||
        AppState.currentState === "background" ||
        AppState.currentState === "inactive"
      )
        return;
      this.token = token;
      this.open(token);
    } catch {
      if (generation === this.generation) this.scheduleRetry();
    } finally {
      this.reconnecting = false;
    }
  }
}
export const chatSocket = new ChatSocketClient();
