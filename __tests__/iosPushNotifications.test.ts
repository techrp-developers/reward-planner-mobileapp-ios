import { AppState, Platform } from 'react-native';
import fs from 'fs';
import path from 'path';
import notifee from '@notifee/react-native';
import { getApp } from '@react-native-firebase/app';
import * as messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { checkNotifications, requestNotifications } from 'react-native-permissions';

jest.mock('../src/modules/dashboard/notification/NotificationAPI', () => ({
  registerFCMToken: jest.fn(),
  getNotificationBadge: jest.fn(),
  markNotificationAsRead: jest.fn(async () => ({})),
  recordNotificationOpened: jest.fn(async () => ({})),
}));
jest.mock('../src/query/queryClient', () => ({
  queryClient: {
    fetchQuery: jest.fn(async ({ queryFn }) => queryFn()),
    removeQueries: jest.fn(),
  },
}));
jest.mock('../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: jest.fn(), getRootState: jest.fn(), dispatch: jest.fn() },
}));

import {
  cleanupFCMOnLogout,
  getLogoutFCMToken,
  getPushDiagnostics,
  maskToken,
  registerBackgroundHandler,
  requestPushPermission,
  setupFCM,
  shouldOfferPushPermission,
} from '../src/modules/notifications/FCMService';
import {
  clearPendingNotification,
  flushPendingNotification,
  openFromNotification,
  openNotificationRoute,
  parseNotificationRoute,
} from '../src/modules/notifications/notificationRouting';
import { setAppIconBadge, syncNotificationBadge } from '../src/modules/notifications/notificationBadge';
import { notificationEvents } from '../src/modules/notifications/notificationEvents';
import { navigationRef } from '../src/navigation/navigationRef';
import {
  getNotificationBadge,
  markNotificationAsRead,
  recordNotificationOpened,
  registerFCMToken,
} from '../src/modules/dashboard/notification/NotificationAPI';

const nav = navigationRef as unknown as Record<'isReady' | 'getRootState' | 'dispatch', jest.Mock>;
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
const registered = (project: string | null = 'reward-planners-2324d') =>
  (registerFCMToken as jest.Mock).mockResolvedValue({ success: true, firebase_project_id: project });
const mountApp = (mounted = true) => {
  nav.isReady.mockReturnValue(mounted);
  nav.getRootState.mockReturnValue({ routeNames: mounted ? ['App'] : ['Auth'] });
};
const permission = (status: string) => (checkNotifications as jest.Mock).mockResolvedValue({ status, settings: {} });

let stop: (() => void) | null = null;
const start = async () => {
  stop = setupFCM();
  await flush();
  await flush();
};

beforeEach(async () => {
  jest.clearAllMocks();
  (Platform as { OS: string }).OS = 'ios';
  await AsyncStorage.clear();
  clearPendingNotification();
  permission('granted');
  registered();
  mountApp();
  (getApp as jest.Mock).mockReturnValue({ options: { projectId: 'reward-planners-2324d' } });
  (messaging.getToken as jest.Mock).mockResolvedValue('fcm-token-value-1234');
  (messaging.getAPNSToken as jest.Mock).mockResolvedValue('apns');
  (messaging.getInitialNotification as jest.Mock).mockResolvedValue(null);
  (notifee.getInitialNotification as jest.Mock).mockResolvedValue(null);
  (notifee.getNotificationSettings as jest.Mock).mockResolvedValue({ ios: { badge: 1 } });
  (getNotificationBadge as jest.Mock).mockResolvedValue({ success: true, count: 3 });
});
afterEach(async () => {
  await cleanupFCMOnLogout();
  await flush();
  stop = null;
});

describe('packaged configuration', () => {
  const root = path.join(__dirname, '..');
  const plist = fs.readFileSync(path.join(root, 'ios/GoogleService-Info.plist'), 'utf8');

  it('targets the primary Firebase project and the iOS bundle id', () => {
    expect(plist).toContain('<string>reward-planners-2324d</string>');
    expect(plist).toContain('<string>1072834182730</string>');
    expect(plist).toContain('<string>com.mpstech.rewardsplanners</string>');
    expect(plist).toContain('<string>1:1072834182730:ios:0d7e19dd87dda6056cf0b3</string>');
    expect(plist).not.toContain('rewardplanners-ebbe4');
  });

  it('keeps native foreground presentation so Notifee never needs to redisplay', () => {
    const config = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'));
    expect(config['react-native'].messaging_ios_foreground_presentation_options)
      .toEqual(expect.arrayContaining(['banner', 'list', 'sound', 'badge']));
    expect(config['react-native'].messaging_ios_auto_register_for_remote_messages).not.toBe(false);
  });
});

describe('permission', () => {
  it('registers for authorized and provisional users (both read as granted)', async () => {
    await start();
    expect(registerFCMToken).toHaveBeenCalledWith('fcm-token-value-1234', 'reward-planners-2324d');
  });

  it('does not register or prompt a denied user', async () => {
    permission('blocked');
    await start();
    expect(registerFCMToken).not.toHaveBeenCalled();
    expect(requestNotifications).not.toHaveBeenCalled();
    expect(await shouldOfferPushPermission()).toBe(false);
  });

  it('never opens the system dialog on login', async () => {
    permission('denied');
    await start();
    expect(requestNotifications).not.toHaveBeenCalled();
  });

  it('offers the branded sheet only once, and never on Android', async () => {
    permission('denied');
    expect(await shouldOfferPushPermission()).toBe(true);
    (requestNotifications as jest.Mock).mockResolvedValue({ status: 'blocked', settings: {} });
    await requestPushPermission();
    expect(await shouldOfferPushPermission()).toBe(false);
    await AsyncStorage.clear();
    (Platform as { OS: string }).OS = 'android';
    expect(await shouldOfferPushPermission()).toBe(false);
  });
});

describe('token registration', () => {
  it('stops when the APNs token is unavailable', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });
    (messaging.getAPNSToken as jest.Mock).mockResolvedValue(null);
    stop = setupFCM();
    for (let i = 0; i < 12; i += 1) {
      await flush();
      jest.advanceTimersByTime(500);
    }
    jest.useRealTimers();
    expect(messaging.getToken).not.toHaveBeenCalled();
    expect(registerFCMToken).not.toHaveBeenCalled();
    expect(getPushDiagnostics().lastError).toBe('APNs token unavailable');
  });

  it('does not claim registration when the backend attributes no project', async () => {
    registered(null);
    await start();
    expect(getPushDiagnostics().backendRegistration).toBe('unattributed');
  });

  it('rejects a token from another Firebase project', async () => {
    (getApp as jest.Mock).mockReturnValue({ options: { projectId: 'rewardplanners-ebbe4' } });
    await start();
    expect(registerFCMToken).not.toHaveBeenCalled();
    expect(getPushDiagnostics().backendRegistration).toBe('rejected_project');
  });

  it('keeps the token unregistered on failure and retries when back online', async () => {
    (registerFCMToken as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await start();
    expect(getPushDiagnostics().backendRegistration).toBe('failed');
    registered();
    const online = (NetInfo.addEventListener as jest.Mock).mock.calls.at(-1)[0];
    online({ isConnected: true });
    await flush();
    await flush();
    expect(registerFCMToken).toHaveBeenCalledTimes(2);
    expect(getPushDiagnostics().backendRegistration).toBe('registered');
  });

  it('registers a rotated token and does not re-register an unchanged one', async () => {
    await start();
    const refresh = (messaging.onTokenRefresh as jest.Mock).mock.calls.at(-1)[1];
    refresh('fcm-token-value-1234');
    await flush();
    expect(registerFCMToken).toHaveBeenCalledTimes(1);
    refresh('rotated-token-value-5678');
    await flush();
    expect(registerFCMToken).toHaveBeenLastCalledWith('rotated-token-value-5678', 'reward-planners-2324d');
  });

  it('ignores a response or refresh from a previous session', async () => {
    let finish: (value: unknown) => void = () => {};
    (registerFCMToken as jest.Mock).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    await start();
    const refresh = (messaging.onTokenRefresh as jest.Mock).mock.calls.at(-1)[1];
    await cleanupFCMOnLogout();
    stop = null;
    finish({ success: true, firebase_project_id: 'reward-planners-2324d' });
    await flush();
    expect(getPushDiagnostics().backendRegistration).toBe('none');
    (registerFCMToken as jest.Mock).mockClear();
    refresh('old-session-token-value');
    await flush();
    expect(registerFCMToken).not.toHaveBeenCalled();
  });

  it('registers again for the next account on the same device', async () => {
    await start();
    await cleanupFCMOnLogout();
    await start();
    expect(registerFCMToken).toHaveBeenCalledTimes(2);
  });

  it('adds a single set of listeners however often setup runs', async () => {
    await start();
    const first = stop;
    stop = setupFCM();
    expect(stop).toBe(first);
    expect(messaging.onMessage).toHaveBeenCalledTimes(1);
    expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('masks tokens', () => {
    expect(maskToken('abcdef1234567890wxyz')).toBe('abcdef...wxyz');
    expect(maskToken('short')).toBe('***');
    expect(maskToken(null)).toBe('none');
  });
});

describe('logout', () => {
  it('returns this device token so other devices stay registered', async () => {
    await start();
    expect(await getLogoutFCMToken()).toBe('fcm-token-value-1234');
  });

  it('uses the stored token without calling Firebase', async () => {
    await AsyncStorage.setItem('@rewardsplanners_fcm_token', 'stored-token');
    (messaging.getToken as jest.Mock).mockClear();
    expect(await getLogoutFCMToken()).toBe('stored-token');
    expect(messaging.getToken).not.toHaveBeenCalled();
  });

  it('never omits fcm_token when no token is available', async () => {
    (messaging.getToken as jest.Mock).mockRejectedValue(new Error('no APNs token'));
    expect(await getLogoutFCMToken()).toBe('no-device-token');
    (messaging.getToken as jest.Mock).mockResolvedValue(null);
    expect(await getLogoutFCMToken()).toBe('no-device-token');
  });

  it('does not let a hanging Firebase call block logout', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });
    (messaging.getToken as jest.Mock).mockReturnValue(new Promise(() => {}));
    const result = getLogoutFCMToken();
    await flush();
    jest.advanceTimersByTime(3000);
    await expect(result).resolves.toBe('no-device-token');
    jest.useRealTimers();
  });

  it('finishes a failed token deletion before the next account registers', async () => {
    await start();
    (messaging.deleteToken as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await cleanupFCMOnLogout();
    await flush();
    expect(await AsyncStorage.getItem('@rewardsplanners_fcm_delete_pending')).toBe('1');
    (messaging.deleteToken as jest.Mock).mockClear();
    (registerFCMToken as jest.Mock).mockClear();
    await start();
    expect(messaging.deleteToken).toHaveBeenCalledTimes(1);
    expect(registerFCMToken).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem('@rewardsplanners_fcm_delete_pending')).toBeNull();
  });

  it('clears the previous account from the device', async () => {
    const { queryClient } = jest.requireMock('../src/query/queryClient');
    await start();
    mountApp(false);
    openFromNotification({ notification_id: '7' }, 'background');
    await cleanupFCMOnLogout();
    expect(messaging.deleteToken).toHaveBeenCalled();
    expect(notifee.cancelDisplayedNotifications).toHaveBeenCalled();
    expect(notifee.setBadgeCount).toHaveBeenLastCalledWith(0);
    expect(queryClient.removeQueries).toHaveBeenCalledWith({ queryKey: ['notification'] });
    expect(await AsyncStorage.getItem('@rewardsplanners_fcm_token')).toBeNull();
    mountApp();
    flushPendingNotification();
    expect(nav.dispatch).not.toHaveBeenCalled();
  });
});

describe('receiving', () => {
  it('foreground: never displays through Notifee, refreshes badge and inbox', async () => {
    await start();
    const received = jest.fn();
    const unsubscribe = notificationEvents.onNotificationReceived(received);
    (getNotificationBadge as jest.Mock).mockClear();
    await (messaging.onMessage as jest.Mock).mock.calls.at(-1)[1]({ data: {} });
    await flush();
    unsubscribe();
    expect(received).toHaveBeenCalledTimes(1);
    expect(getNotificationBadge).toHaveBeenCalled();
    expect((notifee as unknown as { displayNotification?: jest.Mock }).displayNotification).toBeUndefined();
    expect(getPushDiagnostics().lastReceivedAt).not.toBeNull();
  });

  it('background: registers handlers without displaying anything', async () => {
    registerBackgroundHandler();
    await (messaging.setBackgroundMessageHandler as jest.Mock).mock.calls.at(-1)[1]({ data: {} });
    expect(notifee.onBackgroundEvent).toHaveBeenCalledTimes(1);
  });
});

describe('tap routing', () => {
  const productRoute = JSON.stringify({ path: ['App', 'ProductDetails'], params: { productId: 42 } });

  it('opens the target through nested parents and reports the open', async () => {
    openFromNotification(
      { notification_id: '11', target_route: productRoute, destination_type: 'product' },
      'background',
    );
    await flush();
    expect(nav.dispatch.mock.calls[0][0].payload).toMatchObject({
      name: 'App',
      params: { screen: 'ProductDetails', params: { productId: 42 } },
    });
    expect(recordNotificationOpened).toHaveBeenCalledWith(11, {
      app_state: 'background', outcome: 'opened_target', destination_type: 'product',
    });
    expect(markNotificationAsRead).toHaveBeenCalledWith(11);
  });

  it('maps the backend chat path onto this app navigator', () => {
    openFromNotification({ target_route: JSON.stringify({ path: ['App', 'Chat', 'ChatInbox'] }) }, 'background', 'm1');
    expect(nav.dispatch.mock.calls[0][0].payload).toMatchObject({
      name: 'App', params: { screen: 'ChatStack', params: { screen: 'ChatInbox' } },
    });
  });

  it.each([
    ['unknown screen', { path: ['App', 'AdminPanel'] }],
    ['outside the app stack', { path: ['Auth', 'Login'] }],
    ['allowed leaf on a forged path', { path: ['App', 'Home', 'Cart'] }],
    ['non-string segment', { path: ['App', 1] }],
  ])('rejects %s', (_name, route) => {
    expect(parseNotificationRoute(JSON.stringify(route))).toBeNull();
  });

  it('rejects malformed JSON and strips nested params', () => {
    expect(parseNotificationRoute('{oops')).toBeNull();
    expect(parseNotificationRoute({ path: ['App', 'ProductDetails'], params: { productId: 1, x: { y: 2 } } })?.params)
      .toEqual({ productId: 1 });
  });

  it('falls back to the fallback route, then the inbox, and reports it', async () => {
    openFromNotification({
      notification_id: '12',
      target_route: '{"path":["App","Nope"]}',
      fallback_route: JSON.stringify({ path: ['App', 'WalletHistory'] }),
    }, 'background');
    openFromNotification({ notification_id: '13' }, 'background');
    await flush();
    expect(nav.dispatch.mock.calls[0][0].payload.params.screen).toBe('WalletHistory');
    expect(nav.dispatch.mock.calls[1][0].payload.params.screen).toBe('Notification');
    expect(recordNotificationOpened).toHaveBeenCalledWith(12, expect.objectContaining({ outcome: 'fallback' }));
  });

  it('holds a terminated tap until the app stack is mounted, then opens once', async () => {
    mountApp(false);
    (messaging.getInitialNotification as jest.Mock).mockResolvedValue({
      messageId: 'm2', data: { notification_id: '14', target_route: productRoute },
    });
    (notifee.getInitialNotification as jest.Mock).mockResolvedValue({
      notification: { id: 'n2', data: { notification_id: '14', target_route: productRoute } },
    });
    await start();
    expect(nav.dispatch).not.toHaveBeenCalled();
    mountApp();
    flushPendingNotification();
    flushPendingNotification();
    expect(nav.dispatch).toHaveBeenCalledTimes(1);
    expect(recordNotificationOpened).toHaveBeenCalledWith(14, expect.objectContaining({ app_state: 'terminated' }));
  });

  it('opens once when RNFirebase and Notifee both report a tap', async () => {
    await start();
    const data = { notification_id: '15', target_route: productRoute };
    (messaging.onNotificationOpenedApp as jest.Mock).mock.calls.at(-1)[1]({ messageId: 'm3', data });
    (notifee.onForegroundEvent as jest.Mock).mock.calls.at(-1)[0]({ type: 1, detail: { notification: { id: 'x', data } } });
    expect(nav.dispatch).toHaveBeenCalledTimes(1);
  });

  it('ignores a non-numeric notification id for read tracking', async () => {
    openFromNotification({ notification_id: '../read-all' }, 'background');
    await flush();
    expect(nav.dispatch).toHaveBeenCalledTimes(1);
    expect(markNotificationAsRead).not.toHaveBeenCalled();
    expect(recordNotificationOpened).not.toHaveBeenCalled();
  });

  it('inbox rows open valid metadata routes and report false otherwise', () => {
    expect(openNotificationRoute({ path: ['App', 'Orders'] })).toBe(true);
    expect(openNotificationRoute({ path: ['App', 'Nope'] })).toBe(false);
    expect(openNotificationRoute(null)).toBe(false);
  });
});

describe('badge', () => {
  it('sets the icon to the backend unread count, not a local increment', async () => {
    await syncNotificationBadge();
    await syncNotificationBadge();
    expect(notifee.setBadgeCount).toHaveBeenCalledTimes(2);
    expect(notifee.setBadgeCount).toHaveBeenLastCalledWith(3);
  });

  it('respects a user who turned badges off', async () => {
    (notifee.getNotificationSettings as jest.Mock).mockResolvedValue({ ios: { badge: 0 } });
    await setAppIconBadge(3);
    expect(notifee.setBadgeCount).not.toHaveBeenCalled();
  });

  it('leaves the app-update badge alone when nothing is unread', async () => {
    await AsyncStorage.setItem('@rewardsplanners_update_badge_owned', '1');
    await setAppIconBadge(0);
    expect(notifee.setBadgeCount).not.toHaveBeenCalled();
  });

  it('does not touch the Android launcher badge', async () => {
    (Platform as { OS: string }).OS = 'android';
    await setAppIconBadge(5);
    expect(notifee.setBadgeCount).not.toHaveBeenCalled();
  });
});

describe('Android coexistence', () => {
  it('registers without an iOS permission or APNs step', async () => {
    (Platform as { OS: string }).OS = 'android';
    (messaging.getAPNSToken as jest.Mock).mockResolvedValue(null);
    await start();
    expect(messaging.getAPNSToken).not.toHaveBeenCalled();
    expect(checkNotifications).not.toHaveBeenCalled();
    expect(registerFCMToken).toHaveBeenCalledTimes(1);
  });

  it('does not apply the iOS project gate to Android', async () => {
    (Platform as { OS: string }).OS = 'android';
    (getApp as jest.Mock).mockReturnValue({ options: { projectId: 'other-project' } });
    await start();
    expect(registerFCMToken).toHaveBeenCalledWith('fcm-token-value-1234', 'other-project');
  });
});
