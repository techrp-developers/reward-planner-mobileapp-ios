module.exports = {
  preset: 'react-native',
  // Same single i18next instance the app initialises in index.js.
  setupFiles: ['./jest.native-mocks.setup.js', './jest.i18n.setup.js'],
  // Reanimated 4 / Worklets publish their Jest mock as TypeScript source.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native(-[^/]+)?|@react-native(-community)?(/[^/]+)?|@react-navigation|@notifee|@react-native-firebase)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    // `src/modules/*/v1/` holds copies of the Express backend (controllers,
    // models, routes). Its tests use Node's built-in `node:test` runner and
    // require backend-only modules (config/database, services/Razorpay/...)
    // that do not exist in the app, so they run in the backend repository,
    // not in the React Native Jest suite. See docs/MULTILINGUAL_AUDIT.md.
    '<rootDir>/src/modules/[^/]+/v1/',
  ],
};
