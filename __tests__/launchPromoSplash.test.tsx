import React from 'react';
import { Image, Linking, Modal, Platform, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../src/theme/ThemeContext', () => ({ useAppTheme: () => ({ isDark: false }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../src/modules/common/auth/api/axios', () => ({ api: { get: jest.fn() } }));
jest.mock('../src/modules/common/cms/splash/splashArtworkCache', () => ({
  cachedArtwork: jest.fn(async () => null),
  downloadArtwork: jest.fn(async () => null),
}));
jest.mock('../src/modules/notifications/notificationRouting', () => ({
  ...jest.requireActual('../src/modules/notifications/notificationRouting'),
  openNotificationRoute: jest.fn(() => true),
}));

import { api } from '../src/modules/common/auth/api/axios';
import { openNotificationRoute } from '../src/modules/notifications/notificationRouting';
import { getResolvedSplash, isCampaignLive, parseSplashResponse, validUntil } from '../src/modules/common/cms/splash/splashApi';
import { istDay, isSplashDue, markSplashShown, resetSplashSessionForTests, splashSeenKey } from '../src/modules/common/cms/splash/splashFrequency';
import { splashAction } from '../src/modules/common/cms/splash/splashNavigation';
import PromotionalSplashScreen from '../src/modules/common/cms/splash/PromotionalSplashScreen';
import SplashScreen from '../src/modules/common/auth/screens/SplashScreen';
import {
  LAUNCH_PROMO_BUDGET_MS,
  LaunchPresentationProvider,
  LaunchScreen,
  employeeScope,
  resetLaunchPresentationForTests,
  useLaunchPresentation,
} from '../src/modules/common/cms/splash/launchPresentation';
import { runSplashActionWhenReady } from '../src/modules/common/cms/splash/splashNavigation';
import { navigationRef } from '../src/navigation/navigationRef';
import { cachedArtwork, downloadArtwork } from '../src/modules/common/cms/splash/splashArtworkCache';

const get = api.get as jest.Mock;
const HOUR = 3600_000;

// Shape copied from the live local backend (GET /content/splashscreens/resolved).
const realResponse = (overrides: Record<string, any> = {}, campaign: Record<string, any> | null = {}) => ({
  success: true,
  data: {
    source: 'scheduled_campaign', page_key: 'app_launch', slot_key: 'promo_splash', platform: 'ios', audience: 'authenticated',
    server_time: new Date().toISOString(),
    expires_at: new Date(Date.now() + 9 * 24 * HOUR).toISOString(),
    next_change_at: null,
    cache_ttl_seconds: 300,
    campaign: campaign && {
      content_id: 21, placement_id: 1, title: 'Diwali Usaav', cta_text: 'Shop Now',
      image_url: 'https://cdn.rewardplanners.com/public/content-zone-entries/21/a.png',
      display_mode: 'single', motion: { effect: 'none', intensity: 'medium', speed: 'normal' },
      navigation: null, link: null, priority: 0,
      starts_at: new Date(Date.now() - HOUR).toISOString(),
      expires_at: new Date(Date.now() + 9 * 24 * HOUR).toISOString(),
      display: { frequency_rule: 'once_per_day', display_seconds: 3, auto_dismiss: true, dismissible: true },
      ...campaign,
    },
    ...overrides,
  },
});
const campaignOf = (campaign: Record<string, any> = {}) => parseSplashResponse(realResponse({}, campaign))!.campaign!;

beforeEach(async () => {
  jest.clearAllMocks();
  get.mockReset();
  await AsyncStorage.clear();
  resetSplashSessionForTests();
  resetLaunchPresentationForTests();
  (Platform as { OS: string }).OS = 'ios';
});

describe('employee scope', () => {
  it('reads the id the profile API actually returns ("userId")', () => {
    expect(employeeScope(true, { userId: 3 } as any)).toBe('u3');
  });
  it('still accepts the database name, and ignores anything else', () => {
    expect(employeeScope(true, { user_id: 3 })).toBe('u3');
    expect(employeeScope(true, { userId: '7' } as any)).toBe('u7');
    expect(employeeScope(false, { userId: 3 } as any)).toBeNull();
    expect(employeeScope(true, null)).toBeNull();
    expect(employeeScope(true, { userId: 0 } as any)).toBeNull();
    expect(employeeScope(true, { userId: 'abc' } as any)).toBeNull();
  });
});

describe('response contract', () => {
  it('reads the nested display and navigation fields of the real response', () => {
    const data = parseSplashResponse(realResponse({}, { navigation: { destination: 'product_details', targetId: 1125, contentId: 21 } }))!;
    expect(data.source).toBe('scheduled_campaign');
    expect(data.campaign!.display).toEqual({ frequency_rule: 'once_per_day', display_seconds: 3, auto_dismiss: true, dismissible: true });
    expect(data.campaign!.navigation).toEqual({ destination: 'product_details', targetId: 1125, contentId: 21 });
  });

  it.each([
    ['source none', realResponse({ source: 'none' }, null)],
    ['a null campaign', realResponse({}, null)],
    ['an http image', realResponse({}, { image_url: 'http://cdn.rewardplanners.com/a.png' })],
    ['a missing image', realResponse({}, { image_url: '' })],
  ])('treats %s as no promotion', (_label, body) => {
    expect(parseSplashResponse(body)!.campaign).toBeNull();
    expect(parseSplashResponse(body)!.source).toBe('none');
  });

  it.each([null, {}, { success: false }, { success: true, data: { source: 'weird' } }, { success: true, data: { source: 'none' } }])(
    'rejects the malformed body %j', (body) => {
      expect(parseSplashResponse(body)).toBeNull();
    });

  it('keeps display seconds in range and defaults unknown rules to once per day', () => {
    expect(campaignOf({ display: { display_seconds: 99, frequency_rule: 'hourly' } }).display)
      .toMatchObject({ display_seconds: 15, frequency_rule: 'once_per_day', auto_dismiss: true, dismissible: true });
    expect(campaignOf({ display: {} }).display.display_seconds).toBe(3);
  });

  it('does not show a campaign before its start or after its end, by server time', () => {
    const now = Date.now();
    expect(isCampaignLive(campaignOf({ starts_at: new Date(now + HOUR).toISOString() }), now)).toBe(false);
    expect(isCampaignLive(campaignOf({ expires_at: new Date(now - 1).toISOString() }), now)).toBe(false);
    expect(isCampaignLive(campaignOf(), now)).toBe(true);
  });

  it('caches no longer than the TTL, the next change or either expiry', () => {
    const server = Date.parse('2026-11-05T06:30:00.000Z');
    const data = parseSplashResponse(realResponse({ server_time: new Date(server).toISOString(), cache_ttl_seconds: 90,
      next_change_at: new Date(server + 30_000).toISOString() }))!;
    expect(validUntil(data)).toBe(server + 30_000);
  });
});

describe('request', () => {
  it.each(['ios', 'android'])('asks for the %s launch slot through the signed-in client, without an audience', async (os) => {
    (Platform as { OS: string }).OS = os;
    get.mockResolvedValue({ data: realResponse({ platform: os }) });
    await getResolvedSplash({ pageKey: 'app_launch', slotKey: 'promo_splash', scope: 'u3' });
    expect(get).toHaveBeenCalledWith('/content/splashscreens/resolved', expect.objectContaining({
      params: { page_key: 'app_launch', slot_key: 'promo_splash', platform: os },
    }));
    expect(get.mock.calls[0][1].params).not.toHaveProperty('audience');
  });

  it('reuses the valid server-bounded snapshot without another launch request', async () => {
    get.mockResolvedValue({ data: realResponse() });
    await getResolvedSplash({ pageKey: 'app_launch', slotKey: 'promo_splash', scope: 'u3' });
    const cached = await getResolvedSplash({ pageKey: 'app_launch', slotKey: 'promo_splash', scope: 'u3' });
    expect(cached?.data.campaign?.content_id).toBe(21);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('uses a still-valid cached result when offline, and never an expired one', async () => {
    get.mockResolvedValueOnce({ data: realResponse() });
    await getResolvedSplash({ pageKey: 'app_launch', slotKey: 'promo_splash', scope: 'u3' });
    get.mockRejectedValueOnce(new Error('Network Error'));
    expect((await getResolvedSplash({ pageKey: 'app_launch', slotKey: 'promo_splash', scope: 'u3' }))?.data.campaign?.content_id).toBe(21);

    const later = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 301_000);
    get.mockRejectedValueOnce(new Error('Network Error'));
    expect(await getResolvedSplash({ pageKey: 'app_launch', slotKey: 'promo_splash', scope: 'u3' })).toBeNull();
    later.mockRestore();
  });

  it('keeps one account’s cache away from another', async () => {
    get.mockResolvedValueOnce({ data: realResponse() });
    await getResolvedSplash({ pageKey: 'app_launch', slotKey: 'promo_splash', scope: 'u3' });
    get.mockRejectedValueOnce(new Error('Network Error'));
    expect(await getResolvedSplash({ pageKey: 'app_launch', slotKey: 'promo_splash', scope: 'u9' })).toBeNull();
  });
});

describe('frequency', () => {
  const campaign = () => campaignOf();
  const key = (scope = 'u3') => splashSeenKey(scope, 'app_launch', 'promo_splash', campaign());

  it('uses India-time days', () => {
    expect(istDay(Date.parse('2026-11-04T18:29:00Z'))).toBe('2026-11-04');
    expect(istDay(Date.parse('2026-11-04T18:31:00Z'))).toBe('2026-11-05');
  });

  it('shows once per day, across app restarts, and again the next India day', async () => {
    const day1 = Date.parse('2026-11-04T10:00:00Z');
    expect(await isSplashDue(key(), 'once_per_day', day1)).toBe(true);
    await markSplashShown(key(), 'once_per_day', day1);
    resetSplashSessionForTests(); // a new launch
    expect(await isSplashDue(key(), 'once_per_day', day1 + 6 * HOUR)).toBe(false);
    expect(await isSplashDue(key(), 'once_per_day', Date.parse('2026-11-04T18:31:00Z'))).toBe(true);
  });

  it('does not let one employee’s history hide it from another', async () => {
    await markSplashShown(key('u3'), 'once_per_day', Date.now());
    expect(await isSplashDue(key('u9'), 'once_per_day', Date.now())).toBe(true);
  });

  it('shows once per session, and every visit when asked', async () => {
    await markSplashShown(key(), 'once_per_session', Date.now());
    expect(await isSplashDue(key(), 'once_per_session', Date.now())).toBe(false);
    resetSplashSessionForTests();
    expect(await isSplashDue(key(), 'once_per_session', Date.now())).toBe(true);
    await markSplashShown(key(), 'every_visit', Date.now());
    expect(await isSplashDue(key(), 'every_visit', Date.now())).toBe(true);
  });

  it('falls back to once per launch when storage fails', async () => {
    const failing = jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(new Error('corrupt'));
    expect(await isSplashDue(key(), 'once_per_day', Date.now())).toBe(true);
    await markSplashShown(key(), 'once_per_day', Date.now());
    expect(await isSplashDue(key(), 'once_per_day', Date.now())).toBe(false);
    failing.mockRestore();
  });
});

describe('tap destinations', () => {
  it.each([
    [{ destination: 'product_details', targetId: 1125 }, { path: ['App', 'ProductDetails'], params: { productId: 1125 } }],
    [{ destination: 'product_offer', targetIds: [1, 2], contentId: 21 }, { path: ['App', 'Home', 'ProductModule', 'CampaignProducts'], params: { contentId: 21, title: 'Diwali Usaav' } }],
    [{ destination: 'category', targetId: 3, contentId: 21 }, { path: ['App', 'Home', 'ProductModule', 'Category'], params: { categoryId: 3, title: 'Diwali Usaav' } }],
    [{ destination: 'service_details', targetId: 9 }, { path: ['App', 'Home', 'ServicesModule', 'ServiceDescription'], params: { serviceId: 9 } }],
  ])('maps %j to an existing app route', (navigation, route) => {
    expect(splashAction(campaignOf({ navigation }))).toEqual({ kind: 'route', route });
  });

  it.each([null, { destination: 'subcategory', targetId: 4 }, { destination: 'App/Admin', targetId: 1 }, { destination: 'product_details' }])(
    'does nothing for %j', (navigation) => {
      expect(splashAction(campaignOf({ navigation }))).toBeNull();
    });

  it('opens only approved https links', () => {
    expect(splashAction(campaignOf({ link: 'https://www.rewardplanners.com/diwali' }))).toEqual({ kind: 'external', url: 'https://www.rewardplanners.com/diwali' });
    expect(splashAction(campaignOf({ link: 'https://evil.example/x' }))).toBeNull();
  });
});

// Mirrors RootNavigator: the Splash route stays while startup runs or the
// launch layer holds it; otherwise the next screen (here "APP") renders.
type Gates = { scope: string | null; startupDone: boolean; eligible: boolean };
function Harness(gates: Gates) {
  const launch = useLaunchPresentation(gates);
  const showLaunch = !gates.startupDone || launch.holding;
  return (
    <LaunchPresentationProvider value={launch}>
      {showLaunch ? <LaunchScreen /> : <Text>APP</Text>}
    </LaunchPresentationProvider>
  );
}

describe('launch presentation', () => {
  let mounted: ReactTestRenderer | null = null;
  const flush = async () => {
    for (let i = 0; i < 5; i += 1) await act(async () => { await new Promise((resolve) => setImmediate(resolve)); });
  };
  const render = async (gates: Gates, settle = true) => {
    await act(async () => {
      if (mounted) mounted.update(<Harness {...gates} />);
      else mounted = create(<Harness {...gates} />);
    });
    if (settle) await flush();
    return mounted!;
  };
  const ready: Gates = { scope: 'u3', startupDone: true, eligible: true };
  const starting: Gates = { scope: 'u3', startupDone: false, eligible: true };
  const has = (type: any) => mounted!.root.findAllByType(type).length > 0;
  const appShown = () => mounted!.root.findAllByType(Text).some((node) => node.props.children === 'APP');
  const artwork = () => mounted!.root.findAllByType(PromotionalSplashScreen)[0];

  beforeEach(() => {
    jest.spyOn(Image, 'prefetch').mockResolvedValue(true);
  });
  afterEach(async () => {
    await act(async () => mounted?.unmount());
    mounted = null;
    jest.restoreAllMocks();
  });

  it('downloads during the logo splash, then replaces the logo with the campaign before the app', async () => {
    get.mockResolvedValue({ data: realResponse() });
    await render(starting);
    expect(get).toHaveBeenCalledTimes(1);
    expect(Image.prefetch).toHaveBeenCalledWith('https://cdn.rewardplanners.com/public/content-zone-entries/21/a.png');
    expect(has(SplashScreen)).toBe(true);
    expect(artwork()).toBeUndefined();

    // The very first render after startup still holds the launch screen.
    await render(ready, false);
    expect(appShown()).toBe(false);
    await flush();
    expect(artwork()).toBeDefined();
    expect(appShown()).toBe(false);
    expect(has(Modal)).toBe(false);
  });

  it('counts the display once the artwork is visible, and opens the app straight after Skip', async () => {
    get.mockResolvedValue({ data: realResponse() });
    await render(starting);
    await render(ready);
    expect(await AsyncStorage.getAllKeys()).not.toEqual(expect.arrayContaining([expect.stringContaining('splash_seen')]));
    await act(async () => artwork().props.onShown());
    expect((await AsyncStorage.getAllKeys()).some((key) => key.includes('splash_seen'))).toBe(true);
    await act(async () => artwork().props.onClose());
    expect(appShown()).toBe(true);
    expect(has(SplashScreen)).toBe(false);
    expect(has(PromotionalSplashScreen)).toBe(false);
  });

  it('opens the artwork from disk on later launches, without the network', async () => {
    get.mockResolvedValue({ data: realResponse() });
    (cachedArtwork as jest.Mock).mockResolvedValueOnce('file:///cache/rp-launch-artwork/a.png');
    await render(starting);
    await render(ready);
    expect(downloadArtwork).not.toHaveBeenCalled();
    expect(Image.prefetch).not.toHaveBeenCalled();
    expect(artwork().props.imageUri).toBe('file:///cache/rp-launch-artwork/a.png');
  });

  it('downloads to disk on the first launch and shows the local file', async () => {
    get.mockResolvedValue({ data: realResponse() });
    (downloadArtwork as jest.Mock).mockResolvedValueOnce('file:///cache/rp-launch-artwork/a.png');
    await render(starting);
    await render(ready);
    expect(downloadArtwork).toHaveBeenCalledWith('https://cdn.rewardplanners.com/public/content-zone-entries/21/a.png');
    expect(artwork().props.imageUri).toBe('file:///cache/rp-launch-artwork/a.png');
  });

  it('shows a CMS default on the same launch layer', async () => {
    get.mockResolvedValue({ data: realResponse({ source: 'default' }, { placement_id: null, title: 'Evergreen' }) });
    await render(starting);
    await render(ready);
    expect(artwork().props.campaign.title).toBe('Evergreen');
    expect(has(Modal)).toBe(false);
  });

  it.each([
    ['source none', () => get.mockResolvedValue({ data: realResponse({ source: 'none' }, null) })],
    ['a server error', () => get.mockRejectedValue({ response: { status: 500 } })],
    ['artwork that cannot be downloaded', () => {
      get.mockResolvedValue({ data: realResponse() });
      (Image.prefetch as jest.Mock).mockResolvedValue(false);
    }],
    ['an expired campaign', () => get.mockResolvedValue({ data: realResponse({}, { expires_at: new Date(Date.now() - 1000).toISOString() }) })],
  ])('goes straight to the app on %s, with no second screen', async (_label, setup) => {
    setup();
    await render(starting);
    await render(ready);
    expect(artwork()).toBeUndefined();
    expect(appShown()).toBe(true);
  });

  it('does not repeat a campaign already seen today, or swap in another', async () => {
    get.mockResolvedValue({ data: realResponse() });
    const campaign = parseSplashResponse(realResponse())!.campaign!;
    await markSplashShown(splashSeenKey('u3', 'app_launch', 'promo_splash', campaign), 'once_per_day', Date.now());
    await render(starting);
    await render(ready);
    expect(artwork()).toBeUndefined();
    expect(appShown()).toBe(true);
  });

  it('never holds back login, language or terms, and does not appear after them', async () => {
    get.mockResolvedValue({ data: realResponse() });
    await render({ scope: null, startupDone: true, eligible: false });
    expect(appShown()).toBe(true);
    expect(get).not.toHaveBeenCalled();

    await render({ scope: 'u3', startupDone: false, eligible: false });
    await render({ scope: 'u3', startupDone: true, eligible: false }); // terms or language next
    expect(appShown()).toBe(true);
    await render(ready); // terms accepted later
    expect(artwork()).toBeUndefined();
    expect(appShown()).toBe(true);
  });

  it('gives up after the startup budget, and a late answer never opens it', async () => {
    let answer!: (value: unknown) => void;
    get.mockImplementation(() => new Promise((resolve) => { answer = resolve; }));
    await render(starting);
    await render(ready);
    expect(appShown()).toBe(false);
    // Real timers: fake timers in this file stop later async tests settling.
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, LAUNCH_PROMO_BUDGET_MS + 100)); });
    expect(appShown()).toBe(true);
    await act(async () => answer({ data: realResponse() }));
    await flush();
    expect(artwork()).toBeUndefined();
  });

  it('runs once per launch: auth refreshes and language changes never bring it back', async () => {
    get.mockResolvedValue({ data: realResponse({}, { display: { frequency_rule: 'every_visit' } }) });
    await render(starting);
    await render(ready);
    await act(async () => artwork().props.onClose());
    await render(starting);
    await render(ready);
    expect(artwork()).toBeUndefined();
    expect(appShown()).toBe(true);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('cancels on logout during the request', async () => {
    let answer!: (value: unknown) => void;
    get.mockImplementation(() => new Promise((resolve) => { answer = resolve; }));
    await render(starting);
    await render({ scope: null, startupDone: true, eligible: false });
    await act(async () => answer({ data: realResponse() }));
    await flush();
    expect(artwork()).toBeUndefined();
    expect(appShown()).toBe(true);
  });

  it('releases the launch screen when an update prompt interrupts the wait', async () => {
    get.mockImplementation(() => new Promise(() => {}));
    await render(starting);
    await render(ready);
    expect(appShown()).toBe(false);
    await render({ ...ready, eligible: false });
    expect(appShown()).toBe(true);
  });

  it.each([
    ['ready', false],
    ['visible', true],
  ])('ends a campaign that is %s when eligibility is lost, and does not restart it', async (_state, visible) => {
    get.mockResolvedValue({ data: realResponse() });
    await render(starting);
    await render(ready);
    expect(artwork()).toBeDefined();
    if (visible) await act(async () => artwork().props.onShown());
    await render({ ...ready, eligible: false }); // e.g. an update prompt opened
    expect(appShown()).toBe(true);
    expect(artwork()).toBeUndefined();
    await render(ready);
    expect(appShown()).toBe(true);
    expect(artwork()).toBeUndefined();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('opens the configured product once the app has mounted', async () => {
    get.mockResolvedValue({ data: realResponse({}, { navigation: { destination: 'product_details', targetId: 1125, contentId: 21 } }) });
    await render(starting);
    await render(ready);
    await act(async () => {
      artwork().props.onAction();
      artwork()?.props.onAction();
    });
    expect(appShown()).toBe(true);
    expect(openNotificationRoute).toHaveBeenCalledTimes(1);
    expect(openNotificationRoute).toHaveBeenCalledWith({ path: ['App', 'ProductDetails'], params: { productId: 1125 } });
  });
});

describe('tap after launch', () => {
  it('does not navigate while only the Splash route exists, and opens the product once App mounts', () => {
    const routing = jest.requireActual('../src/modules/notifications/notificationRouting');
    (openNotificationRoute as jest.Mock).mockImplementation(routing.openNotificationRoute);
    const listeners: Array<() => void> = [];
    const unsubscribe = jest.fn();
    let routeNames = ['Splash'];
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true); // root container ready
    jest.spyOn(navigationRef, 'getRootState').mockImplementation(() => ({ routeNames } as any));
    const dispatch = jest.spyOn(navigationRef, 'dispatch').mockImplementation(() => undefined);
    jest.spyOn(navigationRef, 'addListener').mockImplementation(((_event: string, listener: () => void) => {
      listeners.push(listener);
      return unsubscribe;
    }) as any);

    runSplashActionWhenReady({ kind: 'route', route: { path: ['App', 'ProductDetails'], params: { productId: 1125 } } });
    listeners.forEach((listener) => listener()); // Splash still the only route
    expect(dispatch).not.toHaveBeenCalled();

    routeNames = ['App'];
    listeners.forEach((listener) => listener());
    listeners.forEach((listener) => listener());
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect((dispatch.mock.calls[0][0] as any).payload).toMatchObject({ name: 'App', params: { screen: 'ProductDetails', params: { productId: 1125 } } });
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    jest.restoreAllMocks();
    (openNotificationRoute as jest.Mock).mockImplementation(() => true);
  });

  it('gives up quietly, staying on the dashboard, when the destination never opens', () => {
    jest.useFakeTimers();
    const unsubscribe = jest.fn();
    jest.spyOn(navigationRef, 'addListener').mockImplementation((() => unsubscribe) as any);
    (openNotificationRoute as jest.Mock).mockReturnValue(false);
    runSplashActionWhenReady({ kind: 'route', route: { path: ['App', 'Removed'], params: {} } });
    act(() => { jest.advanceTimersByTime(5000); });
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
    jest.restoreAllMocks();
    (openNotificationRoute as jest.Mock).mockImplementation(() => true);
  });

  it('waits for the app navigator before opening the destination, exactly once', () => {
    const listeners: Array<() => void> = [];
    const unsubscribe = jest.fn();
    jest.spyOn(navigationRef, 'addListener').mockImplementation(((_event: string, listener: () => void) => {
      listeners.push(listener);
      return unsubscribe;
    }) as any);
    (openNotificationRoute as jest.Mock).mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValue(true);
    runSplashActionWhenReady({ kind: 'route', route: { path: ['App', 'ProductDetails'], params: { productId: 1125 } } });
    expect(openNotificationRoute).toHaveBeenCalledTimes(1);
    listeners.forEach((listener) => listener()); // still mounting
    listeners.forEach((listener) => listener()); // App mounted
    listeners.forEach((listener) => listener());
    expect(openNotificationRoute).toHaveBeenCalledTimes(3);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    jest.restoreAllMocks();
  });

  it('opens an approved link outside the app', () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    runSplashActionWhenReady({ kind: 'external', url: 'https://www.rewardplanners.com/diwali' });
    expect(open).toHaveBeenCalledWith('https://www.rewardplanners.com/diwali');
    open.mockRestore();
  });
});
