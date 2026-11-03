import { Alert, Linking } from 'react-native';
import i18n from '../../i18n';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../../navigation/navigationRef';
import {
  markNotificationAsRead,
  recordNotificationOpened,
  type NotificationAppState,
} from '../dashboard/notification/NotificationAPI';
import { notificationEvents } from './notificationEvents';

type Data = Record<string, string | undefined>;
type Route = { path: string[]; params: Record<string, unknown> };

const INBOX: Route = { path: ['App', 'Notification'], params: {} };

// Backend registry paths (mobile-push-deep-linking.md §3) that exist in this
// app's navigator. A route outside this list is never navigated to.
const ALLOWED_ROUTES = new Set([
  'App/Dashboard',
  'App/Notification',
  'App/MyTickets',
  'App/ProductDetails',
  'App/Cart',
  'App/Orders',
  'App/Profile',
  'App/Quiz',
  'App/TodoList',
  'App/WalletHistory',
  'App/RewardStack/Dashboard',
  'App/Chat/ChatInbox',
  'App/Home/ProductModule/Home',
  'App/Home/ProductModule/Category',
  // Collections, offer campaigns and promotional banners (productIds | campaignId | contentId).
  'App/Home/ProductModule/CampaignProducts',
  'App/Home/ServicesModule/Home',
  'App/Home/ServicesModule/ServiceDescription',
  'App/Home/ServicesModule/ServiceOrderDetail',
  'App/Home/PaymentsModule/Home',
  'App/Home/DineOutModule/BookingHomeScreen',
  'App/Home/DineOutModule/BusOrdersScreen',
  'App/Home/DineOutModule/BusOrderDetailScreen',
]);

// The backend names the chat navigator "Chat"; this app mounts it as "ChatStack".
const SEGMENT_ALIASES: Record<string, string> = { Chat: 'ChatStack' };

export function parseNotificationRoute(raw: unknown): Route | null {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!value || !Array.isArray(value.path)) return null;
    if (!value.path.every((part: unknown) => typeof part === 'string')) return null;
    if (!ALLOWED_ROUTES.has(value.path.join('/'))) return null;

    // Destination screens only take ids and titles; drop anything nested.
    const params: Record<string, unknown> = {};
    if (value.params && typeof value.params === 'object') {
      for (const [key, param] of Object.entries(value.params)) {
        if (['string', 'number', 'boolean'].includes(typeof param)) params[key] = param;
      }
    }
    return { path: value.path, params };
  } catch {
    return null;
  }
}

// The only sites a notification may open outside the app.
const APPROVED_EXTERNAL_HOSTS = new Set(['rewardplanners.com', 'www.rewardplanners.com']);

export function parseExternalUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const match = raw.trim().match(/^https:\/\/([^/?#:@\\]+)(?:[/?#]|$)/i);
  return match && APPROVED_EXTERNAL_HOSTS.has(match[1].toLowerCase()) ? raw.trim() : null;
}

function toNestedAction({ path, params }: Route) {
  const names = path.map((segment) => SEGMENT_ALIASES[segment] ?? segment);
  let nested: Record<string, unknown> | undefined = params;
  for (let index = names.length - 1; index >= 1; index -= 1) {
    nested = { screen: names[index], params: nested };
  }
  return CommonActions.navigate({ name: names[0], params: nested });
}

// "App" exists only once the user is logged in, past terms and language.
function isAppMounted(): boolean {
  return navigationRef.isReady() &&
    Boolean(navigationRef.getRootState()?.routeNames?.includes('App'));
}

// RNFirebase and Notifee can both report one tap, depending on which native
// delegate wraps the other. Later taps of the same notification work again.
const DEDUPE_MS = 30_000;
const recentTaps = new Map<string, number>();

function isDuplicateTap(key: string | undefined): boolean {
  if (!key) return false;
  const now = Date.now();
  recentTaps.forEach((at, tapKey) => {
    if (now - at > DEDUPE_MS) recentTaps.delete(tapKey);
  });
  if (recentTaps.has(key)) return true;
  recentTaps.set(key, now);
  return false;
}

type PendingTap = { data: Data; appState: NotificationAppState; messageId?: string };
let pendingTap: PendingTap | null = null;

function toStringData(raw: Record<string, unknown> | undefined): Data {
  const data: Data = {};
  Object.entries(raw ?? {}).forEach(([key, value]) => {
    if (typeof value === 'string') data[key] = value;
    else if (typeof value === 'number') data[key] = String(value);
    else if (value && typeof value === 'object') data[key] = JSON.stringify(value);
  });
  return data;
}

export function reportNotificationOpened(
  notificationId: string | number | undefined,
  appState: NotificationAppState,
  outcome: 'opened_target' | 'fallback',
  destinationType?: string,
): void {
  if (!/^\d+$/.test(String(notificationId ?? ''))) return;
  recordNotificationOpened(Number(notificationId), {
    app_state: appState,
    outcome,
    ...(destinationType ? { destination_type: destinationType } : {}),
  }).catch(() => {});
}

// Every push tap comes through here. Taps made before login, terms or
// navigation are ready are held and replayed by flushPendingNotification.
export function openFromNotification(
  raw: Record<string, unknown> | undefined,
  appState: NotificationAppState,
  messageId?: string,
): void {
  const data = toStringData(raw);
  if (!isAppMounted()) {
    pendingTap = { data, appState, messageId };
    return;
  }
  if (isDuplicateTap(data.notification_id || messageId)) return;

  const externalUrl = data.destination_type === 'external' ? parseExternalUrl(data.action_url) : null;
  const target = parseNotificationRoute(data.target_route);
  const route = target ?? parseNotificationRoute(data.fallback_route) ?? INBOX;
  // A destination was chosen but this app cannot open it (removed, unknown or
  // not allowed): land somewhere safe and say so, once.
  const unavailable = !target && !externalUrl && Boolean(data.target_route || data.destination_type === 'external');
  if (externalUrl) {
    Linking.openURL(externalUrl).catch(() => navigationRef.dispatch(toNestedAction(route)));
  } else {
    navigationRef.dispatch(toNestedAction(route));
  }
  if (unavailable) {
    Alert.alert(
      i18n.t('dashboard:notifications.unavailableTitle'),
      i18n.t('dashboard:notifications.unavailableBody'),
    );
  }

  // Analytics and read state never delay navigation. The backend answers 404
  // for a notification the signed-in employee does not own.
  reportNotificationOpened(
    data.notification_id,
    appState,
    target || externalUrl ? 'opened_target' : 'fallback',
    data.destination_type,
  );
  if (/^\d+$/.test(data.notification_id ?? '')) {
    markNotificationAsRead(Number(data.notification_id))
      .then(() => notificationEvents.emitBadgeRefresh())
      .catch(() => {});
  }
}

// For inbox rows: true when the row carried a valid destination.
export function openNotificationRoute(raw: unknown): boolean {
  const route = parseNotificationRoute(raw);
  if (!route || !isAppMounted()) return false;
  navigationRef.dispatch(toNestedAction(route));
  return true;
}

// Called from NavigationContainer onReady/onStateChange.
export function flushPendingNotification(): void {
  if (!pendingTap || !isAppMounted()) return;
  const next = pendingTap;
  pendingTap = null;
  openFromNotification(next.data, next.appState, next.messageId);
}

// A held tap must not survive into the next account's session.
export function clearPendingNotification(): void {
  pendingTap = null;
  recentTaps.clear();
}
