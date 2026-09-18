import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import hotUpdate from 'react-native-ota-hot-update';
import api from '../src/modules/common/auth/api/axios';
import { checkForOtaUpdate } from '../src/modules/common/versionupdate/checkOtaUpdate';

jest.mock('react-native-device-info', () => ({ getBuildNumber: () => '12' }));
jest.mock('react-native-blob-util', () => ({
  fs: { dirs: { CacheDir: '/tmp' }, hash: jest.fn(), unlink: jest.fn().mockResolvedValue(undefined) },
  config: jest.fn(),
}));
jest.mock('react-native-ota-hot-update', () => ({
  getCurrentVersion: jest.fn().mockResolvedValue(0),
  setupBundlePath: jest.fn().mockResolvedValue(true),
  resetApp: jest.fn(),
}));
jest.mock('../src/modules/common/auth/api/axios', () => ({ get: jest.fn() }));

const checksum = 'a'.repeat(64);
const release = {
  success: true,
  updateAvailable: true,
  data: {
    otaVersion: 1,
    bundleUrl: 'https://example.com/update.zip',
    bundleHash: checksum,
    mandatory: false,
  },
};

beforeEach(() => {
  (global as any).__DEV__ = false;
  Platform.OS = 'ios';
  jest.clearAllMocks();
  (api.get as jest.Mock).mockResolvedValue({ data: release });
  (hotUpdate.getCurrentVersion as jest.Mock).mockResolvedValue(0);
  (hotUpdate.setupBundlePath as jest.Mock).mockResolvedValue(true);
  (ReactNativeBlobUtil.config as jest.Mock).mockReturnValue({
    fetch: jest.fn().mockResolvedValue({ info: () => ({ status: 200 }) }),
  });
});

test('rejects a zip whose SHA-256 does not match before native installation', async () => {
  (ReactNativeBlobUtil.fs.hash as jest.Mock).mockResolvedValue('b'.repeat(64));

  expect(await checkForOtaUpdate()).toEqual({ updateAvailable: false, mandatory: false });
  expect(hotUpdate.setupBundlePath).not.toHaveBeenCalled();
  expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalled();
});

test('installs a verified optional zip with the iOS bundle extension', async () => {
  (ReactNativeBlobUtil.fs.hash as jest.Mock).mockResolvedValue(checksum);

  expect(await checkForOtaUpdate()).toMatchObject({ updateAvailable: true, otaVersion: 1 });
  expect(hotUpdate.setupBundlePath).toHaveBeenCalledWith(expect.stringMatching(/\.zip$/), '.jsbundle', 1);
  expect(hotUpdate.resetApp).not.toHaveBeenCalled();
});

test('allows rollback to an older enabled release after hash verification', async () => {
  (api.get as jest.Mock).mockResolvedValue({ data: {
    ...release,
    data: { ...release.data, otaVersion: 4 },
  } });
  (hotUpdate.getCurrentVersion as jest.Mock).mockResolvedValue(5);
  (ReactNativeBlobUtil.fs.hash as jest.Mock).mockResolvedValue(checksum);

  expect(await checkForOtaUpdate()).toMatchObject({ updateAvailable: true, otaVersion: 4 });
  expect(hotUpdate.setupBundlePath).toHaveBeenCalledWith(expect.any(String), '.jsbundle', 4);
});

test('restarts only after a mandatory zip is verified and installed', async () => {
  (api.get as jest.Mock).mockResolvedValue({ data: {
    ...release,
    data: { ...release.data, mandatory: true },
  } });
  (ReactNativeBlobUtil.fs.hash as jest.Mock).mockResolvedValue(checksum);

  expect(await checkForOtaUpdate()).toMatchObject({ updateAvailable: true, mandatory: true });
  expect(hotUpdate.setupBundlePath).toHaveBeenCalled();
  expect(hotUpdate.resetApp).toHaveBeenCalledTimes(1);
});
