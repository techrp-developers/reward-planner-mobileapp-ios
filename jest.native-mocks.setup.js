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
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock'),
);
jest.mock('react-native-permissions', () =>
  require('react-native-permissions/mock'),
);
