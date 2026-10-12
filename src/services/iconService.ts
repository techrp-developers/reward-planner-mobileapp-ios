import { NativeModules, Platform } from 'react-native';

// These exact alternate asset names must be bundled using XCODE_SETUP.md.
export const ICON_MAP = {
  ios: {
    default: null,
    diwali: 'DiwaliIcon',
    eid: 'EidIcon',
    christmas: 'ChristmasIcon',
    holi: 'HoliIcon',
    independence_day: 'IndependenceDayIcon',
    navratri: 'NavratriIcon',
    // Dasera intentionally falls back to default until artwork is bundled.
  },
} as const;
const ICON_NAMES = ICON_MAP.ios;

export type FestivalIconName = (typeof ICON_NAMES)[keyof typeof ICON_NAMES];

interface AppIconSwitcherModule {
  setAppIcon(name: string | null): Promise<boolean>;
  getCurrentIcon(): Promise<string>;
  isSupported(): Promise<boolean>;
}

function nativeModule(): AppIconSwitcherModule {
  const module = NativeModules.AppIconSwitcher as AppIconSwitcherModule | undefined;
  if (!module) {
    throw new Error('AppIconSwitcher is missing; add its native files to the iOS target and rebuild.');
  }
  return module;
}

export function resolveIconName(serverKey: string): FestivalIconName {
  return Object.prototype.hasOwnProperty.call(ICON_NAMES, serverKey)
    ? ICON_NAMES[serverKey as keyof typeof ICON_NAMES]
    : null;
}

export const IconService = {
  async isSupported(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    try {
      return await nativeModule().isSupported();
    } catch (error) {
      console.warn('[IconService] Could not check support:', error);
      return false;
    }
  },

  async setIcon(name: FestivalIconName): Promise<boolean> {
    // TODO: Implement Android activity-alias switching in a future native build.
    if (Platform.OS !== 'ios') return false;
    try {
      return await nativeModule().setAppIcon(name);
    } catch (error) {
      console.warn('[IconService] Could not change icon:', error);
      return false;
    }
  },

  async getCurrentIcon(): Promise<string> {
    // TODO: Read the enabled Android activity-alias when Android is implemented.
    if (Platform.OS !== 'ios') return 'Default';
    try {
      return await nativeModule().getCurrentIcon();
    } catch (error) {
      console.warn('[IconService] Could not read icon:', error);
      return 'Default';
    }
  },
};
