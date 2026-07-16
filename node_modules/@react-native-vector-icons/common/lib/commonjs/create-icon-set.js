"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createIconSet = createIconSet;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _createIconSourceCache = require("./create-icon-source-cache.js");
var _defaults = require("./defaults.js");
var _dynamicFontLoading = require("./dynamicLoading/dynamic-font-loading.js");
var _dynamicLoadingSetting = require("./dynamicLoading/dynamic-loading-setting.js");
var _getImageSource = require("./get-image-source.js");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function createIconSet(glyphMap, postScriptNameOrOptions, fontFileNameParam, fontStyleParam) {
  const {
    postScriptName,
    fontFileName,
    fontStyle
  } = typeof postScriptNameOrOptions === 'string' ? {
    postScriptName: postScriptNameOrOptions,
    fontFileName: fontFileNameParam,
    fontStyle: fontStyleParam
  } : postScriptNameOrOptions;
  const fontBasename = fontFileName ? fontFileName.replace(/\.(otf|ttf)$/, '') : postScriptName;
  const fontReference = _reactNative.Platform.select({
    windows: `/Assets/${fontFileName}#${postScriptName}`,
    android: fontBasename,
    default: postScriptName
  });
  const styleOverrides = {
    fontFamily: fontReference,
    fontWeight: 'normal',
    fontStyle: 'normal'
  };
  const fontSource = typeof postScriptNameOrOptions === 'object' && postScriptNameOrOptions?.fontSource;
  const resolveGlyph = name => {
    const glyph = glyphMap[name] || '?';
    if (typeof glyph === 'number') {
      return String.fromCodePoint(glyph);
    }
    return glyph;
  };
  const Icon = ({
    name,
    size = _defaults.DEFAULT_ICON_SIZE,
    color = _defaults.DEFAULT_ICON_COLOR,
    style,
    children,
    allowFontScaling = false,
    innerRef,
    ...props
  }) => {
    const canUseDynamicLoading = !!fontSource && (0, _dynamicLoadingSetting.isDynamicLoadingEnabled)();
    const [isFontLoaded, setIsFontLoaded] = _react.default.useState(canUseDynamicLoading ? _dynamicFontLoading.dynamicLoader.isLoaded(fontReference) : true);
    const glyph = isFontLoaded && name ? resolveGlyph(name) : '';
    const shouldLoadFontDynamically = !isFontLoaded && canUseDynamicLoading;
    // biome-ignore lint/correctness/useExhaustiveDependencies: the dependencies never change
    (0, _react.useEffect)(() => {
      let isMounted = true;
      if (shouldLoadFontDynamically) {
        _dynamicFontLoading.dynamicLoader.loadFontAsync(fontReference, fontSource).finally(() => {
          if (isMounted) {
            setIsFontLoaded(true);
          }
        });
      }
      return () => {
        isMounted = false;
      };
    }, []);
    const styleDefaults = {
      fontSize: size,
      color
    };
    const newProps = {
      ...props,
      style: [styleDefaults, style, styleOverrides, fontStyle],
      allowFontScaling
    };
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.Text, {
      ref: innerRef,
      selectable: false,
      ...newProps,
      children: [glyph, children]
    });
  };
  const WrappedIcon = /*#__PURE__*/(0, _react.forwardRef)((props, ref) => /*#__PURE__*/(0, _jsxRuntime.jsx)(Icon, {
    innerRef: ref,
    ...props
  }));
  WrappedIcon.displayName = `Icon(${postScriptName})`;
  const imageSourceCache = (0, _createIconSourceCache.createIconSourceCache)();
  const getImageSource = async (name, sizeOrOptions, color) => {
    const canUseDynamicLoading = !!fontSource && (0, _dynamicLoadingSetting.isDynamicLoadingEnabled)();
    if (canUseDynamicLoading && !_dynamicFontLoading.dynamicLoader.isLoaded(fontReference)) {
      await _dynamicFontLoading.dynamicLoader.loadFontAsync(fontReference, fontSource);
    }
    const options = typeof sizeOrOptions === 'object' ? sizeOrOptions : {
      size: sizeOrOptions,
      color
    };
    return (0, _getImageSource.getImageSource)(imageSourceCache, fontReference, resolveGlyph(name), options);
  };
  const getImageSourceSync = (name, sizeOrOptions, color) => {
    const options = typeof sizeOrOptions === 'object' ? sizeOrOptions : {
      size: sizeOrOptions,
      color
    };
    return (0, _getImageSource.getImageSourceSync)(imageSourceCache, fontReference, resolveGlyph(name), options);
  };
  const IconNamespace = Object.assign(WrappedIcon, {
    getImageSource,
    getImageSourceSync
  });
  return IconNamespace;
}
//# sourceMappingURL=create-icon-set.js.map