type Listener = () => void;

const badgeListeners = new Set<Listener>();
const receivedListeners = new Set<Listener>();

export const notificationEvents = {
  onBadgeRefresh(cb: Listener): () => void {
    badgeListeners.add(cb);
    return () => badgeListeners.delete(cb);
  },
  emitBadgeRefresh(): void {
    badgeListeners.forEach((cb) => cb());
  },
  onNotificationReceived(cb: Listener): () => void {
    receivedListeners.add(cb);
    return () => receivedListeners.delete(cb);
  },
  emitNotificationReceived(): void {
    receivedListeners.forEach((cb) => cb());
  },
};
