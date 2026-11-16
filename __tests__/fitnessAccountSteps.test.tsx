import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let mockAccountId = 1;
const mockSync = jest.fn();
const mockQueryClient = { invalidateQueries: jest.fn() };
jest.mock('../src/modules/common/auth/context/AuthContext', () => ({
  useAuth: () => ({ user: { userId: mockAccountId } }),
}));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => mockQueryClient }));
jest.mock('react-native-health-connect', () => ({ SdkAvailabilityStatus: { SDK_AVAILABLE: 3 } }));
jest.mock('../src/modules/step_counter/api/Stepsapi', () => ({ syncStepsToServer: (...args: unknown[]) => mockSync(...args) }));
jest.mock('../src/modules/step_counter/api/ProfileAPI', () => ({ fetchProfileStepStatus: jest.fn() }));
jest.mock('../src/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

const originalOS = Platform.OS;
Platform.OS = 'ios';
const mockHealth = {
  isAvailable: jest.fn().mockResolvedValue(true),
  hasHandledAuthorization: jest.fn().mockResolvedValue(true),
  getStepCount: jest.fn(),
};
NativeModules.HealthKitManager = mockHealth;
const { StepTrackerProvider } = require('../src/modules/step_counter/context/StepTrackerContext');
let tree: ReactTestRenderer;

beforeEach(() => {
  jest.clearAllMocks();
  mockAccountId = 1;
  mockHealth.getStepCount.mockResolvedValue(77);
  mockSync.mockResolvedValue({ success: true });
  (AsyncStorage.multiGet as jest.Mock).mockImplementation(async (keys: string[]) => keys.map(key => [key, key.includes('setup') ? 'true' : null]));
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  jest.restoreAllMocks();
});
afterAll(() => { Platform.OS = originalOS; delete NativeModules.HealthKitManager; });

it('syncs the first reading for each account even when both counts match', async () => {
  await act(async () => { tree = create(<StepTrackerProvider><></></StepTrackerProvider>); });
  expect(mockSync).toHaveBeenCalledTimes(1);
  mockAccountId = 2;
  await act(async () => tree.update(<StepTrackerProvider><></></StepTrackerProvider>));
  expect(mockSync).toHaveBeenCalledTimes(2);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('@step_tracker/last_synced_steps:1', expect.any(String));
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('@step_tracker/last_synced_steps:2', expect.any(String));
});

it('does not sync an old account health read after the account has switched', async () => {
  let resolveOld!: (steps: number) => void;
  mockHealth.getStepCount.mockImplementationOnce(() => new Promise<number>(resolve => { resolveOld = resolve; }));
  await act(async () => { tree = create(<StepTrackerProvider><></></StepTrackerProvider>); });
  mockAccountId = 2;
  await act(async () => tree.update(<StepTrackerProvider><></></StepTrackerProvider>));
  expect(mockSync).toHaveBeenCalledTimes(1);
  await act(async () => resolveOld(9000));
  expect(mockSync).toHaveBeenCalledTimes(1);
});
