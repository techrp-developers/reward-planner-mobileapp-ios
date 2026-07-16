"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assertExpoModulesPresent = assertExpoModulesPresent;
exports.getErrorCallback = void 0;
exports.getIsRenderToImageSupported = getIsRenderToImageSupported;
exports.setDynamicLoadingErrorCallback = exports.setDynamicLoadingEnabled = exports.isDynamicLoadingSupported = exports.isDynamicLoadingEnabled = void 0;
var _reactNative = require("react-native");
// requiring `expo-font` on web calls registerWebModule, thanks to which `getIsDynamicLoadingSupported` can return true on web
if (_reactNative.Platform.OS === 'web' && globalThis.expo) {
  try {
    require('expo-font');
  } catch (_err) {}
}
// biome-ignore lint/suspicious/noExplicitAny: this is used internally with globalThis
function getIsDynamicLoadingSupported(globalObj) {
  const expoModules = globalObj?.expo?.modules;
  return !!expoModules && (_reactNative.Platform.OS === 'web' || typeof expoModules.ExpoAsset?.downloadAsync === 'function') && typeof expoModules.ExpoFontLoader?.getLoadedFonts === 'function' && typeof expoModules.ExpoFontLoader?.loadAsync === 'function';
}

// biome-ignore lint/suspicious/noExplicitAny: this is used internally with globalThis
function getIsRenderToImageSupported(globalObj) {
  return typeof globalObj?.expo?.modules?.ExpoFontUtils?.renderToImageAsync === 'function';
}
function assertExpoModulesPresent(globalObj) {
  if (!getIsDynamicLoadingSupported(globalObj)) {
    throw new Error('Dynamic font loading not supported. Upgrade to latest expo and expo-font.');
  }
}

// Detection of Expo modules is deferred to first use so that import order
// doesn't matter. By the time a component renders, all imports (including Expo)
// have been evaluated and globalThis.expo is available.

let dynamicFontLoadingOverride = null;
const isDynamicLoadingSupported = () => getIsDynamicLoadingSupported(globalThis);

/**
 * Set whether dynamic loading of fonts is enabled.
 * Currently, the presence of Expo Asset and Font Loader modules is a prerequisite for enabling.
 * In the future, React Native core apis will be used for dynamic font loading.
 *
 * @param value - whether dynamic loading of fonts is enabled
 * @returns `true` if dynamic loading of fonts was successfully set. `false` otherwise.
 * */
exports.isDynamicLoadingSupported = isDynamicLoadingSupported;
const setDynamicLoadingEnabled = value => {
  if (!getIsDynamicLoadingSupported(globalThis)) {
    if (process.env.NODE_ENV !== 'production' && !!value) {
      const expoModules = globalThis.expo?.modules;
      const hasNecessaryExpoModules = (_reactNative.Platform.OS === 'web' || !!expoModules?.ExpoAsset) && !!expoModules?.ExpoFontLoader;
      const message = hasNecessaryExpoModules ? 'Expo is installed, but does not support dynamic font loading. Make sure to use Expo SDK 54 or newer.' : 'Necessary Expo modules not found. Dynamic font loading is not available when necessary Expo modules are not present.';
      console.error(message);
    }
    return false;
  }
  dynamicFontLoadingOverride = !!value;
  return true;
};

/**
 * Whether dynamic loading of fonts is enabled.
 * */
exports.setDynamicLoadingEnabled = setDynamicLoadingEnabled;
const isDynamicLoadingEnabled = () => dynamicFontLoadingOverride ?? getIsDynamicLoadingSupported(globalThis);
exports.isDynamicLoadingEnabled = isDynamicLoadingEnabled;
let dynamicLoadingErrorCallback;

/**
 * Set a callback to be called when an error occurs during dynamic font loading.
 * */
const setDynamicLoadingErrorCallback = callback => {
  dynamicLoadingErrorCallback = callback;
};
exports.setDynamicLoadingErrorCallback = setDynamicLoadingErrorCallback;
const getErrorCallback = () => dynamicLoadingErrorCallback;
exports.getErrorCallback = getErrorCallback;
//# sourceMappingURL=dynamic-loading-setting.js.map