import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const APP_SETTINGS_API =
  'https://rewardplanners.com/api/crm/v1/settings/app-settings';

const STORE_URLS = {
  android: 'https://play.google.com/store/apps/details?id=com.rewardsplanners',
  ios: 'https://apps.apple.com/app/idYOUR_APP_ID',
};

export type AppVersionResult = {
  success: boolean;
  maintenance: boolean;
  updateAvailable: boolean;
  forceUpdate: boolean;
  updateUrl: string;
};

const FAILED: AppVersionResult = {
  success: false,
  maintenance: false,
  updateAvailable: false,
  forceUpdate: false,
  updateUrl: '',
};

/**
 * Compare version strings. Returns true only if latest is STRICTLY newer.
 */
const isNewerVersion = (current: string, latest: string): boolean => {
  const c = current.trim().split('.').map(Number);
  const l = latest.trim().split('.').map(Number);
  const len = Math.max(c.length, l.length);
  for (let i = 0; i < len; i++) {
    const cv = c[i] ?? 0;
    const lv = l[i] ?? 0;
    if (isNaN(cv) || isNaN(lv)) return false; // guard bad data
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false; // equal → no update
};

export const checkAppVersion = async (): Promise<AppVersionResult> => {
  try {
    const response = await fetch(APP_SETTINGS_API, {
      cache: 'no-store', // prevent stale cached response
    });

    if (!response.ok) return FAILED;

    const result = await response.json();
    if (!result?.success || !result?.data) return FAILED;

    const data = result.data;

    // Maintenance check
    if (data.maintenance_mode === 1) {
      return {
        success: true,
        maintenance: true,
        updateAvailable: false,
        forceUpdate: false,
        updateUrl: '',
      };
    }

    const currentVersion = DeviceInfo.getVersion(); // e.g. "0.1"
    const currentBuildNumber = Number(DeviceInfo.getBuildNumber()); // e.g. 12

    const latestVersion: string = Platform.OS === 'android'
      ? String(data.android_version ?? '')
      : String(data.ios_version ?? '');

    const latestVersionCode: number = Platform.OS === 'android'
      ? Number(data.android_version_code ?? 0)
      : Number(data.ios_version_code ?? 0);

    const forceUpdate: boolean = Platform.OS === 'android'
      ? data.android_force_update === 1
      : data.ios_force_update === 1;

    const updateUrl = Platform.OS === 'android' ? STORE_URLS.android : STORE_URLS.ios;

    // Compare BOTH version name AND version code
    // Show update only if API version is strictly newer
    const versionNameNewer = isNewerVersion(currentVersion, latestVersion);
    const versionCodeNewer = latestVersionCode > currentBuildNumber;

    // Only flag update if API says a newer version exists
    // Do NOT show update if current >= latest
    const updateAvailable = versionNameNewer || versionCodeNewer;

    console.log('[VersionCheck]', {
      currentVersion,
      latestVersion,
      currentBuildNumber,
      latestVersionCode,
      versionNameNewer,
      versionCodeNewer,
      updateAvailable,
      forceUpdate,
    });

    return {
      success: true,
      maintenance: false,
      updateAvailable,
      forceUpdate: updateAvailable && forceUpdate,
      updateUrl,
    };
  } catch (e) {
    console.warn('[VersionCheck] failed:', e);
    return FAILED;
  }
};