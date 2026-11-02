// Official Jest mocks for native modules that have no JS implementation in the
// test environment. Individual tests can still override these with jest.mock.
// Reanimated 4 runs on react-native-worklets; both publish official mocks.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// The official mock leaves useReducedMotion unimplemented ("ADD ME IF NEEDED").
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));
jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);
jest.mock('react-native-blob-util', () => ({
  fs: { dirs: { CacheDir: '/tmp', DocumentDir: '/tmp' }, hash: jest.fn(), unlink: jest.fn() },
  config: jest.fn(),
}));
jest.mock('react-native-ota-hot-update', () => ({
  getCurrentVersion: jest.fn(async () => 0),
  setupBundlePath: jest.fn(async () => true),
  resetApp: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock'),
);
jest.mock('react-native-permissions', () =>
  require('react-native-permissions/mock'),
);
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn(),
    getInitialNotification: jest.fn(async () => null),
    getNotificationSettings: jest.fn(async () => ({ ios: { badge: 1 } })),
    getBadgeCount: jest.fn(async () => 0),
    setBadgeCount: jest.fn(async () => undefined),
    cancelDisplayedNotifications: jest.fn(async () => undefined),
  },
  EventType: { PRESS: 1, DELIVERED: 3 },
  IOSNotificationSetting: { NOT_SUPPORTED: -1, DISABLED: 0, ENABLED: 1 },
}));
jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({ options: { projectId: 'reward-planners-2324d' } })),
}));
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(async () => 'fcm-token-value-1234'),
  deleteToken: jest.fn(async () => undefined),
  getAPNSToken: jest.fn(async () => 'apns'),
  onTokenRefresh: jest.fn(() => jest.fn()),
  onMessage: jest.fn(() => jest.fn()),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(async () => null),
  setBackgroundMessageHandler: jest.fn(),
}));
