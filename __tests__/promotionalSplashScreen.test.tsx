import React from 'react';
import { AppState, Image, Modal, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

jest.mock('../src/theme/ThemeContext', () => ({ useAppTheme: () => ({ isDark: false }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 0, left: 0 }) }));

import PromotionalSplashScreen, { ARTWORK_FADE_MS } from '../src/modules/common/cms/splash/PromotionalSplashScreen';
import { parseSplashResponse } from '../src/modules/common/cms/splash/splashApi';
import type { SplashCampaign } from '../src/modules/common/cms/splash/splashTypes';

// Kept apart from launchPromoSplash.test.tsx: these use fake timers, which
// stop that file's async host tests from settling when they share a file.
const HOUR = 3600_000;
const campaignOf = (campaign: Record<string, any> = {}): SplashCampaign => parseSplashResponse({
  success: true,
  data: {
    source: 'scheduled_campaign', page_key: 'app_launch', slot_key: 'promo_splash', platform: 'ios', audience: 'authenticated',
    server_time: new Date().toISOString(), expires_at: null, next_change_at: null, cache_ttl_seconds: 300,
    campaign: {
      content_id: 21, placement_id: 1, title: 'Diwali Usaav', cta_text: 'Shop Now',
      image_url: 'https://cdn.rewardplanners.com/public/content-zone-entries/21/a.png',
      navigation: null, link: null, priority: 0,
      starts_at: new Date(Date.now() - HOUR).toISOString(),
      expires_at: new Date(Date.now() + 9 * 24 * HOUR).toISOString(),
      display: { frequency_rule: 'once_per_day', display_seconds: 3, auto_dismiss: true, dismissible: true },
      ...campaign,
    },
  },
})!.campaign!;

describe('promotional splash screen', () => {
  const trees: ReactTestRenderer[] = [];
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => trees.splice(0).forEach((tree) => tree.unmount()));
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const renderScreen = (campaign: SplashCampaign, handlers: Partial<Record<'onShown' | 'onClose' | 'onAction', jest.Mock>> = {}) => {
    const props = { onShown: jest.fn(), onClose: jest.fn(), ...handlers };
    let tree!: ReactTestRenderer;
    act(() => { tree = create(<PromotionalSplashScreen campaign={campaign} offsetMs={0} {...props} />); });
    trees.push(tree);
    const byId = (id: string) => tree.root.findAll((node) => node.props.testID === id && typeof node.type !== 'string')[0];
    const imageLoaded = () => act(() => byId('promo-splash-image').props.onLoad());
    // Image decoded, then the fade-in completes: the artwork is on screen.
    const load = () => {
      imageLoaded();
      act(() => { jest.advanceTimersByTime(ARTWORK_FADE_MS + 50); });
    };
    return { tree, props, byId, imageLoaded, load };
  };

  it('renders on the launch layer, not as a modal, with the whole artwork over a blurred fill', () => {
    const { tree } = renderScreen(campaignOf());
    expect(tree.root.findAllByType(Modal)).toHaveLength(0);
    const [fill, art] = tree.root.findAllByType(Image);
    expect(fill.props.blurRadius).toBeGreaterThan(0);
    expect(fill.props.resizeMode).toBe('cover');
    expect(art.props.resizeMode).toBe('contain');
    expect(art.props.source).toEqual(fill.props.source);
  });

  it('counts the artwork as shown only once the fade has finished, and only once', () => {
    const { props, byId, imageLoaded } = renderScreen(campaignOf());
    imageLoaded();
    expect(props.onShown).not.toHaveBeenCalled();
    expect(byId('promo-splash-skip')).toBeUndefined();
    act(() => byId('promo-splash-image').props.onLoad()); // a repeated load event
    act(() => { jest.advanceTimersByTime(ARTWORK_FADE_MS + 50); });
    expect(props.onShown).toHaveBeenCalledTimes(1);
    expect(byId('promo-splash-skip')).toBeDefined();
    act(() => byId('promo-splash-image').props.onLoad());
    act(() => { jest.advanceTimersByTime(ARTWORK_FADE_MS + 50); });
    expect(props.onShown).toHaveBeenCalledTimes(1);
  });

  it('does not count an interrupted fade', () => {
    const { tree, props, imageLoaded } = renderScreen(campaignOf());
    imageLoaded();
    act(() => tree.unmount());
    act(() => { jest.advanceTimersByTime(ARTWORK_FADE_MS + 50); });
    expect(props.onShown).not.toHaveBeenCalled();
  });

  it('starts the configured duration only once the artwork is visible, then closes', () => {
    const { props, load } = renderScreen(campaignOf({ display: { display_seconds: 5 } }));
    act(() => { jest.advanceTimersByTime(2000); });
    expect(props.onShown).not.toHaveBeenCalled();
    load();
    expect(props.onShown).toHaveBeenCalledTimes(1);
    act(() => { jest.advanceTimersByTime(4900); });
    expect(props.onClose).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(200); });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('skips immediately, and only once', () => {
    const { props, byId, load, tree } = renderScreen(campaignOf());
    load();
    expect(tree.root.findAllByType(Text).map((node) => node.props.children)).toContain('Skip');
    act(() => byId('promo-splash-skip').props.onPress());
    act(() => { jest.advanceTimersByTime(10_000); });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('navigates once when the tap and the timeout land together', () => {
    const onAction = jest.fn();
    const { props, byId, load } = renderScreen(campaignOf(), { onAction });
    load();
    act(() => {
      byId('promo-splash-artwork').props.onPress();
      jest.advanceTimersByTime(3000);
    });
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('does not navigate from artwork without a destination', () => {
    const { byId } = renderScreen(campaignOf());
    expect(byId('promo-splash-artwork').props.disabled).toBe(true);
  });

  it.each([
    ['the image fails', (h: ReturnType<typeof renderScreen>) => act(() => h.byId('promo-splash-image').props.onError())],
    ['the image never loads', () => act(() => { jest.advanceTimersByTime(3000); })],
  ])('closes safely when %s', (_label, trigger) => {
    const handle = renderScreen(campaignOf());
    trigger(handle);
    expect(handle.props.onClose).toHaveBeenCalledTimes(1);
    expect(handle.props.onShown).not.toHaveBeenCalled();
  });

  it('closes when the campaign expires while open, or the app goes to the background', () => {
    const expiring = renderScreen(campaignOf({ expires_at: new Date(Date.now() + 1000).toISOString(), display: { auto_dismiss: false } }));
    expiring.load();
    act(() => { jest.advanceTimersByTime(1100); });
    expect(expiring.props.onClose).toHaveBeenCalledTimes(1);

    const listeners: Array<(state: string) => void> = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener: any) => {
      listeners.push(listener);
      return { remove: jest.fn() } as any;
    });
    const backgrounded = renderScreen(campaignOf({ display: { auto_dismiss: false } }));
    backgrounded.load();
    act(() => listeners.forEach((listener) => listener('background')));
    expect(backgrounded.props.onClose).toHaveBeenCalledTimes(1);
  });

  it('never traps the employee when the artwork cannot be skipped', () => {
    const { props, byId, load } = renderScreen(campaignOf({ display: { dismissible: false, auto_dismiss: false, display_seconds: 4 } }));
    load();
    expect(byId('promo-splash-skip')).toBeUndefined();
    act(() => { jest.advanceTimersByTime(4000); });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
