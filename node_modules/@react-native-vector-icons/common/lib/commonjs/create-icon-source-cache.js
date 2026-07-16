"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createIconSourceCache = createIconSourceCache;
function createIconSourceCache() {
  const cache = new Map();
  const setValue = (key, value) => cache.set(key, value);
  const get = key => cache.get(key);
  return {
    setValue,
    get
  };
}
//# sourceMappingURL=create-icon-source-cache.js.map