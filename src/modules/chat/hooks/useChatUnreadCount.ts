import { useEffect, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { useAuth } from "../../common/auth/context/AuthContext";
import { getChatUserId, normalizeChatId, sameChatId } from "../identity";
import { fetchConversations } from "../api/chatApi";
import { chatSocket } from "../services/chatSocket";
import { subscribeChatReadConfirmed } from "../chatUnreadEvents";
import {
  nonNegativeUnread,
  toUnreadCounts,
  totalUnreadMessages,
  type UnreadConversation,
} from "../unreadCount";

/**
 * One authentication-scoped unread total shared by every Dashboard-style
 * bottom bar (Dashboard and Chat inbox). Socket events make increments visible
 * instantly; the server's unread_count from REST stays the authority for
 * missed events and read state. The app shell owns the single WebSocket
 * (useChatSocketSession); this store only listens to it while a bar is focused.
 */
const store = {
  owner: undefined as number | undefined,
  counts: new Map<number, number>(),
  total: 0,
  // Bumped by every local change so a slower REST response cannot undo it.
  revision: 0,
};
const storeListeners = new Set<() => void>();
const seenMessageIds = new Set<string>();

function publish(force = false) {
  const next = totalUnreadMessages(store.counts);
  if (!force && next === store.total) return;
  store.total = next;
  for (const listener of [...storeListeners]) listener();
}

/** Never carry one employee's private unread count into another session. */
function claim(owner: number | undefined) {
  if (store.owner === owner) return;
  store.owner = owner;
  store.counts = new Map();
  store.revision++;
  seenMessageIds.clear();
  publish(true);
}

export function chatUnreadRevision(): number {
  return store.revision;
}

/**
 * Lets a screen that already fetched conversations (the inbox) share that
 * result instead of the badge issuing its own request. Ignored if a socket
 * event changed the counts after `startedAtRevision`.
 */
export function reportChatUnreadSnapshot(
  owner: number | undefined,
  conversations: readonly UnreadConversation[],
  startedAtRevision: number
): void {
  if (owner === undefined || owner !== store.owner) return;
  if (store.revision !== startedAtRevision) return;
  store.counts = toUnreadCounts(conversations);
  publish();
}

const foreground = () =>
  AppState.currentState !== "background" &&
  AppState.currentState !== "inactive";

function startEngine(owner: number): () => void {
  let alive = true;
  let requestRunning = false;
  let rerunRequested = false;
  let lastReconciledAt = 0;
  let syncTimer: ReturnType<typeof setTimeout> | null = null;
  const current = () => alive && store.owner === owner;

  const scheduleReconcile = (delay = 220) => {
    if (!current() || !foreground()) return;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      void reconcile();
    }, delay);
  };

  // One in-flight request; a response that started before a newer socket
  // event is discarded and re-run, so old REST counts never hide new messages.
  async function reconcile() {
    if (!current() || !foreground()) return;
    if (requestRunning) {
      rerunRequested = true;
      return;
    }
    requestRunning = true;
    const startedAtRevision = store.revision;
    try {
      const conversations = await fetchConversations();
      if (!current()) return;
      if (store.revision !== startedAtRevision) {
        rerunRequested = true;
        return;
      }
      store.counts = toUnreadCounts(conversations);
      lastReconciledAt = Date.now();
      publish();
    } catch {
      // Keep the last known badge rather than falsely showing zero.
    } finally {
      requestRunning = false;
      if (rerunRequested && current()) {
        rerunRequested = false;
        scheduleReconcile(0);
      }
    }
  }

  // A confirmed read: fetch the authoritative unread_count rather than zeroing
  // messages that may have arrived during the read request.
  const offRead = subscribeChatReadConfirmed(() => scheduleReconcile(0));

  const offSocket = chatSocket.subscribe((event) => {
    if (!current()) return;
    const data = event.data;
    const envelope: Record<string, unknown> =
      data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const embedded = envelope.message;
    const message: Record<string, unknown> =
      embedded && typeof embedded === "object"
        ? (embedded as Record<string, unknown>)
        : envelope;

    switch (event.type) {
      case "message:new": {
        const conversationId = normalizeChatId(
          message.conversation_id ?? envelope.conversation_id
        );
        const messageId = normalizeChatId(message.message_id);
        const senderId = normalizeChatId(message.sender_id);
        // Only increment for messages unambiguously from another employee;
        // self echoes and duplicate deliveries must not change the count.
        if (conversationId && messageId && senderId && !sameChatId(senderId, owner)) {
          const key = `${conversationId}:${messageId}`;
          if (!seenMessageIds.has(key)) {
            seenMessageIds.add(key);
            if (seenMessageIds.size > 800) {
              const first = seenMessageIds.values().next().value;
              if (first !== undefined) seenMessageIds.delete(first);
            }
            const authoritative = envelope.unread_count;
            const previous = store.counts.get(conversationId) ?? 0;
            store.counts.set(
              conversationId,
              authoritative !== undefined
                ? nonNegativeUnread(authoritative)
                : previous + 1
            );
            store.revision++;
            publish();
            // A server-provided count is final; otherwise confirm the +1 once
            // a burst of messages settles.
            if (authoritative === undefined) scheduleReconcile(1500);
            break;
          }
        }
        scheduleReconcile();
        break;
      }
      case "conversation:updated": {
        const conversationId = normalizeChatId(envelope.conversation_id);
        if (conversationId && envelope.unread_count !== undefined) {
          store.counts.set(conversationId, nonNegativeUnread(envelope.unread_count));
          store.revision++;
          publish();
        } else {
          scheduleReconcile();
        }
        break;
      }
      case "message:read":
      case "message:deleted":
      case "conversation:available":
      case "resync":
      case "connected":
        scheduleReconcile();
        break;
      case "connection:state":
        if (envelope.status === "connected") scheduleReconcile();
        break;
      // Typing, presence and poll updates do not change unread messages.
    }
  });

  const appSubscription = AppState.addEventListener("change", (state) => {
    if (state === "active") scheduleReconcile(0);
  });

  // Recovery only: socket events take the fast path. No tight polling.
  const fallback = setInterval(() => {
    if (!foreground()) return;
    if (!chatSocket.isConnected() || Date.now() - lastReconciledAt > 60_000)
      scheduleReconcile(0);
  }, 20_000);

  void reconcile();
  return () => {
    alive = false;
    if (syncTimer) clearTimeout(syncTimer);
    clearInterval(fallback);
    appSubscription.remove();
    offSocket();
    offRead();
  };
}

let consumers = 0;
let engineOwner: number | undefined;
let stopEngine: (() => void) | null = null;

function acquire(owner: number): () => void {
  claim(owner);
  consumers++;
  if (!stopEngine || engineOwner !== owner) {
    stopEngine?.();
    engineOwner = owner;
    stopEngine = startEngine(owner);
  }
  return () => {
    consumers = Math.max(0, consumers - 1);
    if (consumers === 0) {
      stopEngine?.();
      stopEngine = null;
      engineOwner = undefined;
    }
  };
}

const subscribeStore = (listener: () => void) => {
  storeListeners.add(listener);
  return () => { storeListeners.delete(listener); };
};
const getTotal = () => store.total;

/** Total unread messages for the signed-in employee. Only `enabled` consumers
 * keep the socket listener and fallback reconciliation running. */
export function useChatUnreadCount(enabled: boolean): number {
  const { isAuthenticated, user } = useAuth();
  const userId = getChatUserId(user);
  const owner = isAuthenticated ? userId : undefined;

  useEffect(() => {
    if (owner === undefined) claim(undefined);
  }, [owner]);

  useEffect(() => {
    if (!enabled || owner === undefined) return;
    return acquire(owner);
  }, [enabled, owner]);

  const total = useSyncExternalStore(subscribeStore, getTotal, getTotal);
  return owner === undefined || store.owner !== owner ? 0 : total;
}

/** Test-only reset of the module-level store. */
export function __resetChatUnreadForTests() {
  stopEngine?.();
  stopEngine = null;
  engineOwner = undefined;
  consumers = 0;
  store.owner = undefined;
  store.counts = new Map();
  store.total = 0;
  store.revision = 0;
  seenMessageIds.clear();
  storeListeners.clear();
}
