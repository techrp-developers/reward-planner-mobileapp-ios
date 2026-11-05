// Only for public lookup data, never fares, seats, orders or passenger data.
export function createBusLookupCache<T>(ttlMs: number, maxEntries: number) {
  const values = new Map<string, { value: T; expiresAt: number }>();
  const pending = new Map<string, Promise<T>>();

  return (key: string, load: () => Promise<T>): Promise<T> => {
    const cached = values.get(key);
    if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);
    values.delete(key);
    const active = pending.get(key);
    if (active) return active;

    const request = Promise.resolve().then(load).then(value => {
      values.set(key, { value, expiresAt: Date.now() + ttlMs });
      while (values.size > maxEntries) values.delete(values.keys().next().value!);
      return value;
    }).finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  };
}
