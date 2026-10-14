// The deployed auth profile uses userId; the local auth controller uses user_id.
// Both were checked against the JWT's customer user_id and chat sender/member IDs.
export function normalizeChatId(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (typeof value === "string" && !/^\d+$/.test(value.trim()))
    return undefined;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

export function sameChatId(left: unknown, right: unknown): boolean {
  const id = normalizeChatId(left);
  return id !== undefined && id === normalizeChatId(right);
}

export function getChatUserId(profile: unknown): number | undefined {
  if (!profile || typeof profile !== "object") return undefined;
  const user = profile as { user_id?: unknown; userId?: unknown };
  const snake = normalizeChatId(user.user_id);
  const camel = normalizeChatId(user.userId);
  if (snake !== undefined && camel !== undefined && snake !== camel)
    return undefined;
  return snake ?? camel;
}

export function uniqueChatRecords<T>(
  items: T[],
  identify: (item: T) => unknown
): T[] {
  const records = new Map<number, T>();
  for (const item of items) {
    const id = normalizeChatId(identify(item));
    if (id !== undefined) records.set(id, { ...records.get(id), ...item });
  }
  return [...records.values()];
}
