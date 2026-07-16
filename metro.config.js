const path = require("path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// Normalise whatever shape Metro gives us for blockList (RegExp or Array<RegExp>)
// into a flat array so we can safely spread onto it.
const defaultBlockList = Array.isArray(defaultConfig.resolver.blockList)
  ? defaultConfig.resolver.blockList
  : defaultConfig.resolver.blockList
  ? [defaultConfig.resolver.blockList]
  : [];

module.exports = mergeConfig(defaultConfig, {
  transformer: {
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },

  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...new Set([...defaultConfig.resolver.sourceExts, "svg"])],

    blockList: [
      ...defaultBlockList,
      /android\/\.gradle\/.*/,
      /android\/\.cxx\/.*/,
      /android\/(?:app\/)?build\/.*/,
      /ios\/build\/.*/,
      /ios\/Pods\/.*/,
    ],

    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
