import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import ReactNativeBlobUtil from 'react-native-blob-util';
import hotUpdate from 'react-native-ota-hot-update';
import api from '../auth/api/axios';

const OTA_CHECK_API = '/v1/settings/app-updates/ota';
const SHA256 = /^[a-f0-9]{64}$/i;

export type OtaCheckResult = {
  updateAvailable: boolean;
  mandatory: boolean;
  otaVersion?: number;
  releaseNotes?: string;
};

const NO_UPDATE: OtaCheckResult = { updateAvailable: false, mandatory: false };

/** Download and install only a zip whose SHA-256 matches the release record. */
export async function checkForOtaUpdate(): Promise<OtaCheckResult> {
  // Debug builds use Metro and must never replace their JS bundle.
  if (__DEV__ || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return NO_UPDATE;

  let downloadPath: string | undefined;
  try {
    const buildNumber = Number(DeviceInfo.getBuildNumber());
    if (!Number.isSafeInteger(buildNumber) || buildNumber < 1) return NO_UPDATE;
    const installedVersion = await hotUpdate.getCurrentVersion();

    const response = await api.get(OTA_CHECK_API, {
      params: { platform: Platform.OS, build_number: buildNumber, current_ota_version: installedVersion },
    });
    const result = response.data;
    if (result?.success !== true || result?.updateAvailable !== true) return NO_UPDATE;

    const release = result.data;
    const otaVersion = Number(release?.otaVersion);
    const bundleUrl = release?.bundleUrl;
    const bundleHash = release?.bundleHash;
    if (!Number.isSafeInteger(otaVersion) || otaVersion < 1 ||
        typeof bundleUrl !== 'string' || !bundleUrl.startsWith('https://') ||
        typeof bundleHash !== 'string' || !SHA256.test(bundleHash)) {
      throw new Error('Invalid OTA release metadata');
    }

    // A disabled release can be rolled back to an older enabled version.
    if (otaVersion === installedVersion) return NO_UPDATE;

    downloadPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/rewards-ota-${Date.now()}.zip`;
    const download = await ReactNativeBlobUtil.config({ path: downloadPath }).fetch('GET', bundleUrl);
    if (download.info().status !== 200) throw new Error(`OTA download failed: HTTP ${download.info().status}`);

    const actualHash = await ReactNativeBlobUtil.fs.hash(downloadPath, 'sha256');
    if (actualHash.toLowerCase() !== bundleHash.toLowerCase()) {
      throw new Error('OTA bundle SHA-256 mismatch');
    }

    const extension = Platform.OS === 'ios' ? '.jsbundle' : '.bundle';
    const installed = await hotUpdate.setupBundlePath(downloadPath, extension, otaVersion);
    if (!installed) throw new Error('OTA bundle installation failed');
    downloadPath = undefined; // The native installer consumes the zip.

    const mandatory = release.mandatory === true || release.mandatory === 1;
    if (mandatory) await hotUpdate.resetApp();
    return {
      updateAvailable: true,
      mandatory,
      otaVersion,
      releaseNotes: typeof release.releaseNotes === 'string' ? release.releaseNotes : undefined,
    };
  } catch (error) {
    console.warn('[OTA] update check failed:', error);
    return NO_UPDATE;
  } finally {
    if (downloadPath) await ReactNativeBlobUtil.fs.unlink(downloadPath).catch(() => {});
  }
}

export function applyPendingOtaUpdate(): Promise<void> {
  return hotUpdate.resetApp();
}
