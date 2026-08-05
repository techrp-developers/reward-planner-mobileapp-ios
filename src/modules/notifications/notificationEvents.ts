type Listener = () => void;

const listeners = new Set<Listener>();

export const notificationEvents = {
  onBadgeRefresh(cb: Listener): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  emitBadgeRefresh(): void {
    listeners.forEach((cb) => cb());
  },
};
