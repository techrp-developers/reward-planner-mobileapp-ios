/** Pure helpers for the dashboard's total unread-message count. */
export type UnreadConversation = {
  conversation_id: unknown;
  unread_count?: unknown;
};

export function nonNegativeUnread(value: unknown): number {
  const valueNumber = typeof value === "number" || typeof value === "string"
    ? Number(value)
    : Number.NaN;
  return Number.isFinite(valueNumber) && valueNumber > 0
    ? Math.min(Math.trunc(valueNumber), Number.MAX_SAFE_INTEGER)
    : 0;
}

export function toUnreadCounts(
  conversations: readonly UnreadConversation[]
): Map<number, number> {
  const result = new Map<number, number>();
  for (const item of conversations) {
    const id = Number(item.conversation_id);
    if (Number.isSafeInteger(id) && id > 0) {
      result.set(id, nonNegativeUnread(item.unread_count));
    }
  }
  return result;
}

export function totalUnreadMessages(counts: ReadonlyMap<number, number>): number {
  let total = 0;
  for (const count of counts.values()) {
    total = Math.min(Number.MAX_SAFE_INTEGER, total + nonNegativeUnread(count));
  }
  return total;
}

export function unreadBadgeLabel(count: number): string {
  const safe = nonNegativeUnread(count);
  return safe > 99 ? "99+" : String(safe);
}
