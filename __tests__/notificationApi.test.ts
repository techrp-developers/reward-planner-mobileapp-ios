import { Platform } from 'react-native';

jest.mock('../src/modules/common/auth/api/axios', () => {
  const api = { post: jest.fn(), put: jest.fn(), get: jest.fn() };
  return { __esModule: true, api, default: api };
});
jest.mock('../src/modules/common/auth/api/AuthAPI', () => ({
  getAuthHeaders: jest.fn(async () => ({})),
  clearAuthToken: jest.fn(),
}));

import axios from 'axios';
import {
  getMyNotifications,
  recordNotificationOpened,
  registerFCMToken,
} from '../src/modules/dashboard/notification/NotificationAPI';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../src/modules/dashboard/notification/notificationPreferencesAPI';

const mockApi = jest.requireMock('../src/modules/common/auth/api/axios').api;

beforeEach(() => jest.clearAllMocks());

it('POSTs the token with platform and project, without a doubled /v1', async () => {
  mockApi.post.mockResolvedValue({ data: { success: true, firebase_project_id: 'reward-planners-2324d' } });
  const result = await registerFCMToken('token', 'reward-planners-2324d');
  expect(mockApi.post).toHaveBeenCalledWith('/v1/auth/update-fcm-token', {
    fcm_token: 'token',
    device_platform: Platform.OS,
    firebase_project_id: 'reward-planners-2324d',
  });
  expect(result.firebase_project_id).toBe('reward-planners-2324d');
});

it('fails registration when the backend does not confirm it', async () => {
  mockApi.post.mockResolvedValue({ data: { success: false } });
  await expect(registerFCMToken('token', 'p')).rejects.toThrow();
});

it('reports a null project instead of assuming attribution', async () => {
  mockApi.post.mockResolvedValue({ data: { success: true } });
  expect((await registerFCMToken('token', 'p')).firebase_project_id).toBeNull();
});

it('requests inbox pages with limit and before_id', async () => {
  const get = jest.spyOn(axios, 'get').mockResolvedValue({ data: { success: true, data: [] } });
  await getMyNotifications();
  await getMyNotifications(55);
  expect(get.mock.calls[0][1]?.params).toEqual({ limit: 20 });
  expect(get.mock.calls[1][1]?.params).toEqual({ limit: 20, before_id: 55 });
});

it('reports opens to the documented route', async () => {
  mockApi.post.mockResolvedValue({ data: { success: true, recorded: true } });
  await recordNotificationOpened(9, { app_state: 'inbox', outcome: 'opened_target' });
  expect(mockApi.post).toHaveBeenCalledWith('/v1/notification/9/opened', { app_state: 'inbox', outcome: 'opened_target' });
});

it('sends changed preference fields only and never infers consent', async () => {
  mockApi.get.mockResolvedValue({ data: { data: { marketing_enabled: false, stored: false } } });
  mockApi.put.mockResolvedValue({ data: { data: { language: 'mr' } } });
  expect((await getNotificationPreferences()).marketing_enabled).toBe(false);
  await updateNotificationPreferences({ language: 'mr' });
  expect(mockApi.put).toHaveBeenCalledWith('/v1/notification/preferences', { language: 'mr' });
});
