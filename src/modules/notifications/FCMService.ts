import { Platform, Linking } from 'react-native';
import {
  getMessaging,
  getToken,
  deleteToken,
  getAPNSToken,
  onTokenRefresh,
  onMessage,
  setBackgroundMessageHandler,
  registerDeviceForRemoteMessages,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';
import type { RemoteMessage } from '@react-native-firebase/messaging';
import { requestNotifications, checkNotifications, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerFCMToken } from '../dashboard/notification/NotificationAPI';
import { navigate } from '../../navigation/navigationRef';
import { notificationEvents } from './notificationEvents';

const FCM_TOKEN_KEY = '@rewardsplanners_fcm_token';

// Returns true if granted or limited, false if denied or unavailable.
async function requestIOSPermission(): Promise<boolean> {
  if (Platform.OS !== 'ios') return true;

  // Check current status first so we know if we should direct user to Settings.
  const { status: currentStatus } = await checkNotifications();
  console.log('[FCM] Current notification status:', currentStatus);

  // BLOCKED = user explicitly denied AFTER seeing the system dialog.
  // The OS will not show the dialog again; must direct user to Settings.
  if (currentStatus === RESULTS.BLOCKED) {
    console.warn('[FCM] Notification permission is blocked. User must enable it in iOS Settings > RewardsPlanners > Notifications.');
    return false;
  }

  if (currentStatus === RESULTS.GRANTED || currentStatus === RESULTS.LIMITED) {
    return true;
  }

  // DENIED on iOS (react-native-permissions v5) = "not yet requested" (initial state).
  // This is NOT the same as the user having denied — we must call requestNotifications()
  // to trigger the system dialog and create the Notifications entry in iOS Settings.
  const { status } = await requestNotifications(['alert', 'sound', 'badge']);
  console.log('[FCM] Requested notification permission, result:', status);
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
}

// Call this when permission is denied/blocked to send user to iOS Settings.
export async function openNotificationSettings(): Promise<void> {
  await Linking.openURL('app-settings:');
}

// Returns 'granted' | 'denied' | 'blocked' | 'unavailable' | 'limited'.
// Use this to check status without triggering the system dialog.
export async function getNotificationPermissionStatus(): Promise<string> {
  if (Platform.OS !== 'ios') return 'granted';
  const { status } = await checkNotifications();
  return status;
}

// Call this on every logout path (voluntary, 401 force-logout, session restore failure).
// Invalidates the FCM token on Firebase's side so the device stops receiving
// push notifications for the logged-out user.
export async function cleanupFCMOnLogout(): Promise<void> {
  try {
    await deleteToken(getMessaging());
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    console.log('[FCM] Token deleted on logout');
  } catch (err) {
    console.warn('[FCM] deleteToken error:', err);
  }
}

async function getAndRegisterToken(): Promise<string | null> {
  try {
    const granted = await requestIOSPermission();
    if (!granted) {
      console.log('[FCM] Permission not granted — skipping token registration');
      return null;
    }

    // iOS requires explicit APNs registration before getToken works.
    await registerDeviceForRemoteMessages(getMessaging());

    // Verify APNs token is present — if null on a real device, APNs is broken.
    if (Platform.OS === 'ios') {
      const apnsToken = await getAPNSToken(getMessaging());
      console.log('[FCM] APNs token:', apnsToken ?? 'NULL — check Push Notifications capability and provisioning profile');
      if (!apnsToken) {
        console.warn('[FCM] APNs token is null. Cannot get FCM token. Possible causes:\n' +
          '  1. Running on Simulator (APNs not supported)\n' +
          '  2. Push Notifications capability missing in Xcode\n' +
          '  3. Provisioning profile does not include push entitlement\n' +
          '  4. APNs Auth Key not uploaded in Firebase Console');
        return null;
      }
    }

    const token = await getToken(getMessaging());
    console.log('[FCM] FCM token:', token ?? 'null');
    if (!token) return null;

    const cached = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (cached !== token) {
      await registerFCMToken(token);
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    }

    return token;
  } catch (err) {
    console.warn('[FCM] getAndRegisterToken error:', err);
    return null;
  }
}

function handleNotificationTap(_message: RemoteMessage): void {
  navigate('Notification');
}

// Call this after the user logs in. Returns an unsubscribe function.
export function setupFCM(): () => void {
  getAndRegisterToken().then((token) => {
    if (token) {
      console.log('[FCM] Setup complete. Token registered.');
    }
  });

  const unsubscribeTokenRefresh = onTokenRefresh(getMessaging(), async (token) => {
    try {
      console.log('[FCM] Token refreshed:', token);
      await registerFCMToken(token);
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    } catch (err) {
      console.warn('[FCM] onTokenRefresh error:', err);
    }
  });

  // Foreground: show badge refresh so notification bell updates immediately.
  const unsubscribeForeground = onMessage(
    getMessaging(),
    async (_message: RemoteMessage) => {
      notificationEvents.emitBadgeRefresh();
    },
  );

  // Background tap: user tapped while app was suspended.
  const unsubscribeBackgroundTap = onNotificationOpenedApp(
    getMessaging(),
    (message: RemoteMessage) => {
      handleNotificationTap(message);
    },
  );

  // Killed-state tap: notification that launched the app from terminated state.
  getInitialNotification(getMessaging()).then((message) => {
    if (message) {
      handleNotificationTap(message);
    }
  });

  return () => {
    unsubscribeTokenRefresh();
    unsubscribeForeground();
    unsubscribeBackgroundTap();
  };
}

// Must be called at the top of index.js (outside React) so Firebase can
// wake the app into a headless JS task when a message arrives in background/quit.
export function registerBackgroundHandler(): void {
  setBackgroundMessageHandler(
    getMessaging(),
    async (_message: RemoteMessage) => {
      // Avoid heavy work — the OS kills headless tasks quickly.
    },
  );
}
