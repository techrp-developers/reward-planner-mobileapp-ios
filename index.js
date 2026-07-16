/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Catch every unhandled JS exception so the crash reason appears in Metro
// console even when the native bridge dies before React can show a red screen.
const prevHandler = global.ErrorUtils?.getGlobalHandler?.();
global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
  console.error(`[GlobalError] fatal=${isFatal}`, error?.message, error?.stack);
  prevHandler?.(error, isFatal);
});

// Catch unhandled promise rejections
const originalUnhandled = global.HermesInternal?.hasPromise
  ? undefined
  : undefined;
if (typeof global.onunhandledrejection === 'undefined') {
  // Hermes surfaces these via ErrorUtils, but add belt-and-suspenders logging
  const originalPromise = global.Promise;
  if (originalPromise && originalPromise.prototype) {
    const originalThen = originalPromise.prototype.then;
    // Do not monkey-patch — rely on ErrorUtils above.
  }
}

console.log('[Startup] index.js evaluated — JS engine is alive');

AppRegistry.registerComponent(appName, () => App);

console.log('[Startup] AppRegistry.registerComponent done');
