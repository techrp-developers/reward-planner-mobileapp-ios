// Stock React Native 0.82 configuration (@react-native/eslint-config, already a
// devDependency). It extends eslint-config-prettier, so it reports code
// problems only and never formatting.
module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // Jest setup files run inside Jest, like the test files the base config covers.
      files: ['jest.*.setup.js'],
      env: { jest: true },
    },
  ],
};
