import { AppState, type NativeEventSubscription } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { getAuthToken } from "../../common/auth/api/AuthAPI";
import { isTokenExpiringSoon } from "../../common/auth/utils/jwtUtils";
import { CHAT_SERVER_URL } from "../../../config/apiConfig";
import { fetchConversations } from "../api/chatApi";
import type { ChatSocketEvent } from "../types";

type Listener = (event: ChatSocketEvent) => void;
type ConnectionStatus = "connecting" | "connected" | "disconnected";

const isForeground = () =>
  AppState.currentState !== "background" &&
  AppState.currentState !== "inactive";

/** One authenticated WebSocket per logged-in app session.
 *
 * The backend must broadcast `message:new`, `presence`, `typing:start`,
 * `typing:stop`, and `message:read` to the appropriate authenticated peers.
 * This client doesn't invent online states or acknowledge delivery on behalf
 * of the server.
 */
export class ChatSocketClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private retry: ReturnType<typeof setTimeout> | null = null;
  private openingTimeout: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private token: string | null = null;
  private generation = 0;
  private reconnecting = false;
  private needsReconnect = false;
  private appState: NativeEventSubscription | null = null;
  private networkUnsubscribe: (() => void) | null = null;
  private reachable = true;
  private status: ConnectionStatus = "disconnected";

  /** Safe to call from the authenticated app root and from chat screens. */
  connect(token: string) {
    if (!token) return;
    this.observeAppState();
    const changed = this.token !== token;
    this.token = token;
    if (changed) {
      this.generation++;
      this.retryCount = 0;
      this.closeSocket();
    }
    if (!isForeground() || !this.reachable) return;
    if (this.socket?.readyState === WebSocket.OPEN ||
        this.socket?.readyState === WebSocket.CONNECTING) return;
    if (this.reconnecting) { this.needsReconnect = true; return; }
    if (this.retry) return;
    void this.reconnect();
  }

  /** Gets the currently authenticated token, rather than a stale render value. */
  ensureConnected(): boolean {
    const token = getAuthToken();
    if (!token) return false;
    this.connect(token);
    return true;
  }

  private observeAppState() {
    if (this.appState) return;
    this.networkUnsubscribe = NetInfo.addEventListener((state) => {
      const reachable = state.isConnected !== false && state.isInternetReachable !== false;
      const restored = reachable && !this.reachable;
      this.reachable = reachable;
      if (!reachable) this.closeSocket();
      else if (restored && this.token && isForeground()) {
        if (this.retry) clearTimeout(this.retry);
        this.retry = null;
        void this.reconnect();
      }
    });
    this.appState = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        if (this.isConnected()) this.requestResync();
        else void this.reconnect();
      } else {
        // RN WebSocket cannot be relied on while the process is suspended.
        this.closeSocket();
      }
    });
  }

  private setStatus(next: ConnectionStatus) {
    if (this.status === next) return;
    this.status = next;
    this.emit({ type: "connection:state", data: { status: next } } as ChatSocketEvent);
  }

  private clearOpeningTimeout() {
    if (this.openingTimeout) clearTimeout(this.openingTimeout);
    this.openingTimeout = null;
  }

  private open(token: string) {
    if (this.socket || !this.token || !isForeground() || !this.reachable) return;
    const origin = CHAT_SERVER_URL.replace(/\/+$/, "").replace(/^http(s?):\/\//i, (_match, secure: string) => secure ? "wss://" : "ws://");
    let socket: WebSocket;
    try {
      socket = new WebSocket(`${origin}/ws/chat?token=${encodeURIComponent(token)}`);
    } catch (error) {
      if (__DEV__) console.warn("[CHAT SOCKET] Could not open");
      this.scheduleRetry();
      return;
    }
    this.socket = socket;
    this.setStatus("connecting");
    // A TCP/WebSocket handshake can hang even though onclose never fires.
    this.openingTimeout = setTimeout(() => {
      if (this.socket === socket && socket.readyState === WebSocket.CONNECTING) {
        this.closeSocket();
        this.scheduleRetry();
      }
    }, 12000);

    socket.onopen = () => {
      if (this.socket !== socket) return;
      this.clearOpeningTimeout();
      this.retryCount = 0;
      this.setStatus("connected");
      // Catch events missed while the app was suspended or disconnected.
      this.requestResync();
    };

    socket.onmessage = (message) => {
      if (this.socket !== socket) return;
      let event: ChatSocketEvent;
      try {
        event = JSON.parse(String(message.data)) as ChatSocketEvent;
      } catch {
        return;
      }
      if (!event || typeof event.type !== "string") return;
      // Only reply to an application-level ping if the backend initiates it.
      if (String(event.type) === "ping") {
        try { socket.send(JSON.stringify({ type: "pong" })); } catch { /* connection closing */ }
        return;
      }
      this.emit(event);
    };

    socket.onclose = (closeEvent) => {
      if (this.socket !== socket) return;
      this.clearOpeningTimeout();
      this.socket = null;
      this.setStatus("disconnected");
      if (__DEV__) console.debug("[CHAT SOCKET] Closed", closeEvent.code);
      this.scheduleRetry();
    };
    socket.onerror = () => {
      if (this.socket === socket) {
        this.closeSocket();
        this.scheduleRetry();
      }
    };
  }

  /** Must be called when the user signs out or switches accounts. */
  disconnect() {
    this.generation++;
    this.token = null;
    this.retryCount = 0;
    this.needsReconnect = false;
    this.closeSocket();
    this.appState?.remove();
    this.appState = null;
    this.networkUnsubscribe?.();
    this.networkUnsubscribe = null;
    this.reachable = true;
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /** Local event only: asks active screens to re-fetch from REST. */
  requestResync() {
    this.emit({ type: "resync", data: null } as ChatSocketEvent);
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    try { listener({ type: "connection:state", data: { status: this.status } }); }
    catch { /* A subscriber must not interrupt connection setup. */ }
    return () => { this.listeners.delete(listener); };
  }

  send(type: string, conversationId: number, data: Record<string, unknown> = {}) {
    if (!this.isConnected()) return false;
    try {
      this.socket!.send(JSON.stringify({ type, conversation_id: conversationId, ...data }));
      return true;
    } catch {
      return false;
    }
  }

  private emit(event: ChatSocketEvent) {
    for (const listener of [...this.listeners]) {
      try { listener(event); }
      catch (error) { if (__DEV__) console.warn("[CHAT SOCKET] Listener failed"); }
    }
  }

  private closeSocket() {
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    this.clearOpeningTimeout();
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
      try { socket.close(); } catch { /* already closed */ }
    }
    this.setStatus("disconnected");
  }

  private scheduleRetry() {
    if (!this.token || this.retry || !isForeground() || !this.reachable) return;
    const base = Math.min(1000 * 2 ** Math.min(this.retryCount++, 4), 15000);
    const delay = Math.round(base * (0.8 + Math.random() * 0.4));
    this.retry = setTimeout(() => {
      this.retry = null;
      void this.reconnect();
    }, delay);
  }

  private async reconnect() {
    if (!this.token || !isForeground() || !this.reachable) return;
    if (this.reconnecting) { this.needsReconnect = true; return; }
    if (this.isConnected()) { this.requestResync(); return; }
    if (this.socket?.readyState === WebSocket.CONNECTING) return;

    this.reconnecting = true;
    const generation = this.generation;
    const sessionToken = this.token;
    try {
      let token = getAuthToken() || sessionToken;
      if (isTokenExpiringSoon(token, 30000)) {
        // The project's Axios auth interceptor is responsible for rotation.
        await fetchConversations();
        token = getAuthToken() || token;
      }
      if (!isForeground() || !this.reachable || generation !== this.generation || !this.token)
        return;
      this.token = token;
      this.open(token);
    } catch (error) {
      if (__DEV__) console.warn("[CHAT SOCKET] Reconnect failed");
      if (generation === this.generation) this.scheduleRetry();
    } finally {
      this.reconnecting = false;
      if (this.needsReconnect) {
        this.needsReconnect = false;
        if (this.token && isForeground() && !this.socket && !this.retry) void this.reconnect();
      }
    }
  }
}

export const chatSocket = new ChatSocketClient();
