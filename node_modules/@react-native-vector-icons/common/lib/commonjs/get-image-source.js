"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getImageSourceSync = exports.getImageSource = void 0;
var _defaults = require("./defaults.js");
var _getImageLibrary = require("./get-image-library.js");
const resolveOptions = (imageSourceCache, fontReference, glyph, {
  size = _defaults.DEFAULT_ICON_SIZE,
  color = _defaults.DEFAULT_ICON_COLOR,
  lineHeight
} = {}) => {
  const cacheKey = `${glyph}:${size}:${String(color)}:${lineHeight ?? ''}`;
  const cached = imageSourceCache.get(cacheKey);
  const nativeOptions = {
    fontFamily: fontReference,
    size,
    color: color,
    lineHeight
  };
  return {
    cacheKey,
    cached,
    nativeOptions
  };
};
const getImageSourceSync = (imageSourceCache, fontReference, glyph, options) => {
  const {
    cacheKey,
    cached,
    nativeOptions
  } = resolveOptions(imageSourceCache, fontReference, glyph, options);
  if (cached !== undefined) return cached;
  const value = (0, _getImageLibrary.ensureGetImageAvailable)().getImageForFontSync(glyph, nativeOptions);
  imageSourceCache.setValue(cacheKey, value);
  return value;
};
exports.getImageSourceSync = getImageSourceSync;
const getImageSource = async (imageSourceCache, fontReference, glyph, options) => {
  const {
    cacheKey,
    cached,
    nativeOptions
  } = resolveOptions(imageSourceCache, fontReference, glyph, options);
  if (cached !== undefined) return cached;
  const value = await (0, _getImageLibrary.ensureGetImageAvailable)().getImageForFont(glyph, nativeOptions);
  imageSourceCache.setValue(cacheKey, value);
  return value;
};
exports.getImageSource = getImageSource;
//# sourceMappingURL=get-image-source.js.map