import storage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import notifee, { IOSNotificationSetting } from '@notifee/react-native';

// App icon badges currently have no unread-count writer in this app. Preserve
// pre-existing remote badges: only clear a badge this service created from zero.
let queue: Promise<void> = Promise.resolve();
const OWNER_KEY = '@rewardsplanners_update_badge_owned';

export function setIosUpdateBadge(updatePending: boolean): Promise<void> {
  if (Platform.OS !== 'ios') return Promise.resolve();
  queue = queue.then(async () => {
    try {
      const settings = await notifee.getNotificationSettings();
      if (settings.ios.badge !== IOSNotificationSetting.ENABLED) return;
      const current = await notifee.getBadgeCount();
      const owned = await storage.getItem(OWNER_KEY) === '1';
      if (updatePending && current === 0) {
        await notifee.setBadgeCount(1);
        await storage.setItem(OWNER_KEY, '1');
      } else if (!updatePending) {
        if (owned && current === 1) await notifee.setBadgeCount(0);
        await storage.removeItem(OWNER_KEY);
      }
    } catch (error) {
      console.warn('[UpdateBadge]', error);
    }
  });
  return queue;
}
