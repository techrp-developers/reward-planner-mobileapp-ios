require('./src/i18n');

// The renderer has no native view tree. Exercise animations with the JS driver.
jest.mock('react-native/src/private/animated/NativeAnimatedHelper', () => {
  const actual = jest.requireActual('react-native/src/private/animated/NativeAnimatedHelper');
  return { __esModule: true, ...actual, default: { ...actual.default, shouldUseNativeDriver: () => false } };
});
