/** Lightweight local signal: a successful REST read needs badge reconciliation.
 * This does not send socket events or change the server's unread counts.
 */
type ReadListener = (conversationId: number) => void;
const listeners = new Set<ReadListener>();

export function subscribeChatReadConfirmed(listener: ReadListener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function notifyChatReadConfirmed(conversationId: number): void {
  if (!Number.isSafeInteger(conversationId) || conversationId <= 0) return;
  for (const listener of [...listeners]) {
    try { listener(conversationId); } catch { /* isolate subscribers */ }
  }
}
