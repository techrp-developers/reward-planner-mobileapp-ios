import { AppState, Linking, Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  deleteToken,
  getAPNSToken,
  onTokenRefresh,
  onMessage,
  setBackgroundMessageHandler,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';
import type { RemoteMessage } from '@react-native-firebase/messaging';
import { requestNotifications, checkNotifications, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import notifee, { EventType } from '@notifee/react-native';
import { registerFCMToken } from '../dashboard/notification/NotificationAPI';
import { queryClient } from '../../query/queryClient';
import { notificationEvents } from './notificationEvents';
import { setAppIconBadge, syncNotificationBadge } from './notificationBadge';
import {
  clearPendingNotification,
  openFromNotification,
} from './notificationRouting';

// Only used to send this device's token on logout when Firebase cannot return
// it. The backend signs out every device of an employee if the token is omitted.
const FCM_TOKEN_KEY = '@rewardsplanners_fcm_token';
const PERMISSION_PROMPTED_KEY = '@rewardsplanners_push_permission_prompted';
// Set while the logged-out account's Firebase token still has to be deleted.
const TOKEN_DELETE_PENDING_KEY = '@rewardsplanners_fcm_delete_pending';
const NO_DEVICE_TOKEN = 'no-device-token';
const LOGOUT_TOKEN_TIMEOUT_MS = 3000;

export const FIREBASE_PROJECT_ID = 'reward-planners-2324d';

export function maskToken(token: string | null | undefined): string {
  if (!token) return 'none';
  return token.length <= 12 ? '***' : `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export type PushDiagnostics = {
  firebaseProjectId: string | null;
  permission: string;
  apnsToken: boolean;
  apnsEnvironment: 'development' | 'production' | null;
  fcmToken: string;
  backendRegistration: 'none' | 'registered' | 'unattributed' | 'failed' | 'rejected_project';
  backendProjectId: string | null;
  lastError: string | null;
  lastReceivedAt: number | null;
};

const diagnostics: PushDiagnostics = {
  firebaseProjectId: null,
  permission: 'unknown',
  apnsToken: false,
  apnsEnvironment: Platform.OS === 'ios' ? (__DEV__ ? 'development' : 'production') : null,
  fcmToken: 'none',
  backendRegistration: 'none',
  backendProjectId: null,
  lastError: null,
  lastReceivedAt: null,
};

export const getPushDiagnostics = (): PushDiagnostics => ({ ...diagnostics });

function recordError(stage: string, error: unknown): void {
  diagnostics.lastError = `${stage}: ${error instanceof Error ? error.message : 'failed'}`;
  if (__DEV__) console.warn(`[FCM] ${stage} failed`);
}

// Returns 'granted' | 'denied' | 'blocked' | 'unavailable' | 'limited'.
// On iOS 'denied' means not asked yet; 'blocked' means the user refused, and a
// provisional grant reads as 'granted'. Never shows the system dialog.
export async function getNotificationPermissionStatus(): Promise<string> {
  if (Platform.OS !== 'ios') return RESULTS.GRANTED;
  const { status } = await checkNotifications();
  diagnostics.permission = status;
  return status;
}

export function isPermissionGranted(status: string): boolean {
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
}

export async function shouldOfferPushPermission(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  if (await getNotificationPermissionStatus() !== RESULTS.DENIED) return false;
  return await AsyncStorage.getItem(PERMISSION_PROMPTED_KEY) === null;
}

export async function markPushPermissionOffered(): Promise<void> {
  await AsyncStorage.setItem(PERMISSION_PROMPTED_KEY, '1');
}

// Shows the system dialog. Call only after the user chose to enable.
export async function requestPushPermission(): Promise<string> {
  await markPushPermissionOffered();
  const { status } = await requestNotifications(['alert', 'sound', 'badge']);
  diagnostics.permission = status;
  if (isPermissionGranted(status)) await ensureTokenRegistered();
  return status;
}

export async function openNotificationSettings(): Promise<void> {
  await Linking.openSettings();
}

// Bumped by every session start/stop so an in-flight registration from a
// previous session can never attach this device to the wrong employee.
let session = 0;
let sessionActive = false;
let registeredToken: string | null = null;
let registration: Promise<void> | null = null;
let tokenDeletion: Promise<unknown> = Promise.resolve();

const isCurrent = (id: number) => sessionActive && id === session;

async function submitToken(token: string, id: number): Promise<void> {
  if (!isCurrent(id) || token === registeredToken) return;

  const projectId = getApp().options.projectId;
  diagnostics.firebaseProjectId = projectId ?? null;
  // Android reports whichever project its packaged config names; the iOS build
  // must never register a token issued by another project.
  if (Platform.OS === 'ios' && projectId !== FIREBASE_PROJECT_ID) {
    diagnostics.backendRegistration = 'rejected_project';
    diagnostics.lastError = 'unexpected Firebase project';
    return;
  }

  try {
    const result = await registerFCMToken(token, projectId);
    if (!isCurrent(id)) return;
    registeredToken = token;
    diagnostics.backendProjectId = result.firebase_project_id;
    // A null or different project means stored, but not attributed to Firebase.
    diagnostics.backendRegistration =
      result.firebase_project_id === projectId ? 'registered' : 'unattributed';
    diagnostics.lastError = null;
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
  } catch (error) {
    diagnostics.backendRegistration = 'failed';
    recordError('backend registration', error);
  }
}

async function waitForAPNSToken(): Promise<boolean> {
  // RNFirebase auto-registers with APNs (firebase.json keeps the default); the
  // token can land just after notification permission resolves.
  let apnsToken = await getAPNSToken(getMessaging());
  for (let attempt = 0; attempt < 6 && !apnsToken; attempt++) {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    apnsToken = await getAPNSToken(getMessaging());
  }
  diagnostics.apnsToken = Boolean(apnsToken);
  return Boolean(apnsToken);
}

async function deleteFirebaseToken(): Promise<void> {
  await AsyncStorage.setItem(TOKEN_DELETE_PENDING_KEY, '1');
  await deleteToken(getMessaging());
  await AsyncStorage.removeItem(TOKEN_DELETE_PENDING_KEY);
}

// Safe to call often: it does nothing once this session's token is registered,
// and missed registrations retry on app resume and network recovery.
export function ensureTokenRegistered(): Promise<void> {
  if (registration) return registration;
  const id = session;
  registration = (async () => {
    try {
      await tokenDeletion;
      // A deletion that failed earlier must finish first, or the next account
      // would inherit a token the backend may still map to the old one.
      if (await AsyncStorage.getItem(TOKEN_DELETE_PENDING_KEY)) await deleteFirebaseToken();
      if (!isCurrent(id) || registeredToken) return;
      if (!isPermissionGranted(await getNotificationPermissionStatus())) return;
      if (Platform.OS === 'ios' && !(await waitForAPNSToken())) {
        diagnostics.lastError = 'APNs token unavailable';
        return;
      }
      const token = await getToken(getMessaging());
      diagnostics.fcmToken = maskToken(token);
      if (token) await submitToken(token, id);
    } catch (error) {
      recordError('token', error);
    }
  })().finally(() => {
    registration = null;
  });
  return registration;
}

// For the logout request. The backend signs out EVERY device of the employee
// when fcm_token is missing, so this always returns a value: with no known
// token the placeholder matches no row and other devices stay registered.
// Never waits long on Firebase; logout must work offline.
export async function getLogoutFCMToken(): Promise<string> {
  if (registeredToken) return registeredToken;
  try {
    const stored = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (stored) return stored;
    const token = await Promise.race([
      getToken(getMessaging()),
      new Promise<null>(resolve => setTimeout(() => resolve(null), LOGOUT_TOKEN_TIMEOUT_MS)),
    ]);
    if (token) return token;
  } catch (error) {
    recordError('logout token', error);
  }
  return NO_DEVICE_TOKEN;
}

function handleMessageTap(message: RemoteMessage, appState: 'background' | 'terminated'): void {
  openFromNotification(message.data, appState, message.messageId);
}

function handleNotifeePress(
  type: EventType,
  notification: { id?: string; data?: Record<string, unknown> } | undefined,
  appState: 'foreground' | 'background',
): void {
  if (type === EventType.PRESS) openFromNotification(notification?.data, appState, notification?.id);
}

let stopListeners: (() => void) | null = null;

// Call this after the user logs in. Returns an unsubscribe function.
export function setupFCM(): () => void {
  if (stopListeners) return stopListeners;

  session += 1;
  sessionActive = true;
  registeredToken = null;
  const id = session;

  const subscriptions: Array<() => void> = [
    onTokenRefresh(getMessaging(), (token) => {
      diagnostics.fcmToken = maskToken(token);
      submitToken(token, id).catch(() => {});
    }),

    // iOS draws the banner itself (firebase.json foreground presentation
    // options), so showing it through Notifee as well would duplicate it.
    onMessage(getMessaging(), async () => {
      diagnostics.lastReceivedAt = Date.now();
      notificationEvents.emitNotificationReceived();
      notificationEvents.emitBadgeRefresh();
    }),

    // Which of these fires for a tap depends on native delegate order;
    // openFromNotification handles a tap reported by both exactly once.
    onNotificationOpenedApp(getMessaging(), (message: RemoteMessage) => {
      handleMessageTap(message, 'background');
    }),
    notifee.onForegroundEvent(({ type, detail }) => {
      handleNotifeePress(type, detail.notification, 'foreground');
    }),

    notificationEvents.onBadgeRefresh(() => {
      syncNotificationBadge().catch(() => {});
    }),
    NetInfo.addEventListener((state) => {
      if (state.isConnected) ensureTokenRegistered().catch(() => {});
    }),
  ];

  const appStateSubscription = AppState.addEventListener('change', (state) => {
    if (state !== 'active') return;
    ensureTokenRegistered().catch(() => {});
    notificationEvents.emitBadgeRefresh();
  });
  subscriptions.push(() => appStateSubscription.remove());

  ensureTokenRegistered().catch(() => {});
  notificationEvents.emitBadgeRefresh();

  // Both are consumed once natively, so a later login cannot replay a tap.
  getInitialNotification(getMessaging()).then((message) => {
    if (message) handleMessageTap(message, 'terminated');
  }).catch(() => {});
  notifee.getInitialNotification().then((initial) => {
    if (initial) {
      openFromNotification(initial.notification?.data, 'terminated', initial.notification?.id);
    }
  }).catch(() => {});

  stopListeners = () => {
    stopListeners = null;
    sessionActive = false;
    session += 1;
    subscriptions.forEach((unsubscribe) => unsubscribe());
  };
  return stopListeners;
}

// Call this on every logout path (voluntary, 401 force-logout, session restore
// failure), after the logout request. Stops this device receiving pushes for
// the old account and removes that account's notification data from it.
export async function cleanupFCMOnLogout(): Promise<void> {
  stopListeners?.();
  registeredToken = null;
  diagnostics.fcmToken = 'none';
  diagnostics.backendRegistration = 'none';
  diagnostics.backendProjectId = null;
  clearPendingNotification();
  queryClient.removeQueries({ queryKey: ['notification'] });

  // Not awaited: Firebase may be unreachable and logout must still finish.
  // The next session's registration waits for this.
  tokenDeletion = Promise.resolve()
    .then(deleteFirebaseToken)
    .catch((error) => {
      recordError('token deletion', error);
    });

  await Promise.allSettled([
    AsyncStorage.removeItem(FCM_TOKEN_KEY),
    notifee.cancelDisplayedNotifications(),
    setAppIconBadge(0),
  ]);
}

// Must be called at the top of index.js (outside React) so taps and messages
// are handled when iOS or Android starts the app in the background.
export function registerBackgroundHandler(): void {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    handleNotifeePress(type, detail.notification, 'background');
  });
  setBackgroundMessageHandler(
    getMessaging(),
    async (_message: RemoteMessage) => {
      // Avoid heavy work — the OS kills headless tasks quickly. iOS and Android
      // draw alert pushes themselves; displaying here would duplicate them.
    },
  );
}
