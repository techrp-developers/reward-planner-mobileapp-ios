import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { secureGetItem, secureSetItem, secureDeleteItem } from '../src/modules/common/auth/utils/secureSessionStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), removeItem: jest.fn(),
}));
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'device-only' },
  getGenericPassword: jest.fn(), setGenericPassword: jest.fn(), resetGenericPassword: jest.fn(),
}));
const key = '@rewardsplanners_refresh_token';
beforeEach(() => {
  jest.resetAllMocks();
  (Keychain.setGenericPassword as jest.Mock).mockResolvedValue({ service: 'session' });
  (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);
});
it('stores a rotated token securely before removing the old plaintext value', async () => {
  await secureSetItem(key, 'rotated-token');
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith(key, 'rotated-token', {
    service: `com.rewardsplanners.session.${key}`, accessible: 'device-only',
  });
  expect(AsyncStorage.removeItem).toHaveBeenCalledWith(key);
  expect((Keychain.setGenericPassword as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan((AsyncStorage.removeItem as jest.Mock).mock.invocationCallOrder[0]);
});
it('restores secure credentials without using legacy storage', async () => {
  (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({ password: 'current-token' });
  expect(await secureGetItem(key)).toBe('current-token');
  expect(AsyncStorage.getItem).not.toHaveBeenCalled();
});
it('migrates legacy sessions and device identity without logging the user out', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue('legacy-value');
  expect(await secureGetItem(key)).toBe('legacy-value');
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith(key, 'legacy-value', expect.any(Object));
  expect(AsyncStorage.removeItem).toHaveBeenCalledWith(key);
});
it('retains the legacy session if secure migration fails', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue('legacy-token');
  (Keychain.setGenericPassword as jest.Mock).mockRejectedValue(new Error('Keystore unavailable'));
  await expect(secureGetItem(key)).rejects.toThrow('Keystore unavailable');
  expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
});
it('fails closed when native storage reports an unsuccessful write', async () => {
  (Keychain.setGenericPassword as jest.Mock).mockResolvedValue(false);
  await expect(secureSetItem(key, 'token')).rejects.toThrow('securely save');
  expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
});
it('deletes both secure and legacy copies on logout', async () => {
  await secureDeleteItem(key);
  expect(Keychain.resetGenericPassword).toHaveBeenCalledWith(expect.objectContaining({ service: `com.rewardsplanners.session.${key}` }));
  expect(AsyncStorage.removeItem).toHaveBeenCalledWith(key);
});
it('returns null for a fresh installation', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  expect(await secureGetItem(key)).toBeNull();
  expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
});
