import { Platform } from 'react-native';
import notifee, { IOSNotificationSetting } from '@notifee/react-native';
import { queryClient } from '../../query/queryClient';
import { isIosUpdateBadgeOwned } from '../common/versionupdate/iosUpdateBadge';
import { getNotificationBadge } from '../dashboard/notification/NotificationAPI';

export const NOTIFICATION_BADGE_QUERY_KEY = ['notification', 'badge'];

// The backend unread count is the only source. Incoming pushes never add to it.
export async function setAppIconBadge(count: number): Promise<void> {
  if (Platform.OS !== 'ios') return;
  const settings = await notifee.getNotificationSettings();
  if (settings.ios.badge !== IOSNotificationSetting.ENABLED) return;
  // The app-update badge owns the icon while no notification is unread.
  if (count === 0 && await isIosUpdateBadgeOwned()) return;
  await notifee.setBadgeCount(count);
}

// Refreshes the navbar bell (same query) and the iOS home-screen badge.
export async function syncNotificationBadge(): Promise<void> {
  try {
    const badge = await queryClient.fetchQuery({
      queryKey: NOTIFICATION_BADGE_QUERY_KEY,
      queryFn: getNotificationBadge,
      staleTime: 0,
    });
    if (badge.success) await setAppIconBadge(badge.count);
  } catch (error) {
    if (__DEV__) console.warn('[FCM] badge sync failed', error);
  }
}
