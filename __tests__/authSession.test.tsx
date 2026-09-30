import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import axios from 'axios';
import { AuthProvider, useAuth } from '../src/modules/common/auth/context/AuthContext';
import api, { setSessionHandlers } from '../src/modules/common/auth/api/axios';
import { persistAuthToken, clearAuthToken } from '../src/modules/common/auth/api/AuthAPI';
import { secureGetItem, secureSetItem, secureDeleteItem } from '../src/modules/common/auth/utils/secureSessionStorage';
import { fetchTermsStatus } from '../src/modules/ecommerce/api/TermsConditionAPI';

jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('react-native-device-info', () => ({ getBrand: () => 'Test', getModel: () => 'Device', getSystemName: () => 'Android', getSystemVersion: () => '16' }));
jest.mock('../src/modules/common/auth/api/axios', () => ({
  __esModule: true, default: { post: jest.fn(), get: jest.fn() },
  API_BASE_URL: 'https://rewardplanners.com/api/crm', setSessionHandlers: jest.fn(),
}));
jest.mock('../src/modules/common/auth/api/AuthAPI', () => ({ persistAuthToken: jest.fn(), clearAuthToken: jest.fn() }));
jest.mock('../src/modules/common/auth/utils/secureSessionStorage', () => ({ secureGetItem: jest.fn(), secureSetItem: jest.fn(), secureDeleteItem: jest.fn() }));
jest.mock('../src/modules/ecommerce/api/TermsConditionAPI', () => ({ fetchTermsStatus: jest.fn() }));
let auth: ReturnType<typeof useAuth>;
let renderer: ReactTestRenderer;
function Consumer() { auth = useAuth(); return null; }
async function renderAuth() {
  await act(async () => { renderer = create(<AuthProvider><Consumer /></AuthProvider>); });
}
beforeEach(() => {
  jest.resetAllMocks();
  (secureGetItem as jest.Mock).mockResolvedValue(null);
  (api.get as jest.Mock).mockResolvedValue({ data: { user: { user_id: 42, name: 'Employee' } } });
  (fetchTermsStatus as jest.Mock).mockResolvedValue({ terms_accepted: true });
});
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); });
it('uses the existing OTP APIs, persists tokens and fetches profile and terms', async () => {
  await renderAuth();
  (secureGetItem as jest.Mock).mockResolvedValue('existing-device-id');
  (api.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } }).mockResolvedValueOnce({ data: { accessToken: 'access', refreshToken: 'refresh' } });
  await act(async () => { await auth.requestLoginOtp('9876543210'); });
  expect(api.post).toHaveBeenCalledWith('/v1/auth/request-otp', { login: '9876543210' });
  await act(async () => { await auth.verifyLoginOtp('9876543210', '123456'); });
  expect(api.post).toHaveBeenLastCalledWith('/v1/auth/verify-otp', {
    login: '9876543210', otp: '123456', device_id: 'existing-device-id', device_name: expect.any(String),
  });
  expect(persistAuthToken).toHaveBeenCalledWith('access');
  expect(secureSetItem).toHaveBeenCalledWith('@rewardsplanners_refresh_token', 'refresh');
  expect(api.get).toHaveBeenCalledWith('/v1/auth/user-info');
  expect(auth.isAuthenticated).toBe(true);
  expect(auth.termsAccepted).toBe(true);
});
it('restores an existing session and persists both rotated tokens', async () => {
  (secureGetItem as jest.Mock).mockResolvedValue('old-refresh');
  (axios.post as jest.Mock).mockResolvedValue({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
  await renderAuth();
  expect(axios.post).toHaveBeenCalledWith('https://rewardplanners.com/api/crm/v1/auth/refresh', { refreshToken: 'old-refresh' });
  expect(secureSetItem).toHaveBeenCalledWith('@rewardsplanners_refresh_token', 'new-refresh');
  expect(persistAuthToken).toHaveBeenCalledWith('new-access');
  expect(auth.isAuthenticated).toBe(true);
  expect(auth.isInitializing).toBe(false);
});
it('retains the terms gate for an employee who has not accepted terms', async () => {
  (fetchTermsStatus as jest.Mock).mockResolvedValue({ terms_accepted: false });
  await renderAuth();
  (api.post as jest.Mock).mockResolvedValue({ data: { accessToken: 'access', refreshToken: 'refresh' } });
  await act(async () => { await auth.verifyLoginOtp('employee@example.com', '123456'); });
  expect(auth.isAuthenticated).toBe(true);
  expect(auth.termsAccepted).toBe(false);
});
it('clears the local session on logout even if the endpoint fails', async () => {
  await renderAuth();
  (secureGetItem as jest.Mock).mockResolvedValue('refresh');
  (api.post as jest.Mock).mockRejectedValue(new Error('Offline'));
  await act(async () => { await auth.logout(); });
  expect(api.post).toHaveBeenCalledWith('/v1/auth/logout', { refreshToken: 'refresh' });
  expect(clearAuthToken).toHaveBeenCalled();
  expect(secureDeleteItem).toHaveBeenCalledWith('@rewardsplanners_refresh_token');
  expect(auth.isAuthenticated).toBe(false);
});
it('persists token rotations supplied by the existing Axios interceptor', async () => {
  await renderAuth();
  const handlers = (setSessionHandlers as jest.Mock).mock.calls[0][0];
  await act(async () => handlers.onSessionRefresh('rotated-access', 'rotated-refresh'));
  expect(secureSetItem).toHaveBeenCalledWith('@rewardsplanners_refresh_token', 'rotated-refresh');
  expect(persistAuthToken).toHaveBeenCalledWith('rotated-access');
  expect(handlers.getAccessToken()).toBe('rotated-access');
});
