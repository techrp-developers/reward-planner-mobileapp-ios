import { Platform } from 'react-native';
import {
  getMessaging,
  getToken,
  onTokenRefresh,
  onMessage,
  setBackgroundMessageHandler,
  registerDeviceForRemoteMessages,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';
import type { RemoteMessage } from '@react-native-firebase/messaging';
import { requestNotifications, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerFCMToken } from '../dashboard/notification/NotificationAPI';
import { navigate } from '../../navigation/navigationRef';
import { notificationEvents } from './notificationEvents';

const FCM_TOKEN_KEY = '@rewardsplanners_fcm_token';

async function requestIOSPermission(): Promise<boolean> {
  if (Platform.OS !== 'ios') return true;

  const { status } = await requestNotifications(['alert', 'sound', 'badge']);
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
}

async function getAndRegisterToken(): Promise<string | null> {
  try {
    const granted = await requestIOSPermission();
    if (!granted) {
      console.log('[FCM] Permission denied');
      return null;
    }

    // iOS requires explicit APNs registration before getToken works.
    await registerDeviceForRemoteMessages(getMessaging());

    const token = await getToken(getMessaging());
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

// Called once when the user logs in. Returns an unsubscribe function.
export function setupFCM(): () => void {
  getAndRegisterToken();

  const unsubscribeTokenRefresh = onTokenRefresh(getMessaging(), async (token) => {
    try {
      await registerFCMToken(token);
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    } catch (err) {
      console.warn('[FCM] onTokenRefresh error:', err);
    }
  });

  // Foreground: iOS native layer shows the banner via AppDelegate.
  // Emit badge refresh so the bell dot updates immediately.
  const unsubscribeForeground = onMessage(
    getMessaging(),
    async (_message: RemoteMessage) => {
      notificationEvents.emitBadgeRefresh();
    },
  );

  // Background tap: user tapped the notification while app was suspended.
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
