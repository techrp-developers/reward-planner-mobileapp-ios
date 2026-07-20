export type LoadAsyncAsset = string | {
    uri: string;
    display: string;
};
export type ExpoAssetModule = {
    downloadAsync: (uri: string, hash: string | undefined, type: string) => Promise<string>;
};
export type ExpoFontLoaderModule = {
    getLoadedFonts: () => string[];
    loadAsync: (fontFamilyAlias: string, asset: LoadAsyncAsset) => Promise<void>;
};
type RenderToImageResult = {
    /**
     * The file uri to the image.
     */
    uri: string;
    /**
     * Image width in dp.
     */
    width: number;
    /**
     * Image height in dp.
     */
    height: number;
    /**
     * Scale factor of the image. Multiply the dp dimensions by this value to get the dimensions in pixels.
     * */
    scale: number;
};
export type ExpoFontUtilsModule = {
    renderToImageAsync: (glyph: string, options: {
        fontFamily: string;
        size?: number;
        lineHeight?: number;
        color?: number;
    }) => Promise<RenderToImageResult>;
};
declare global {
    interface ExpoGlobal {
        modules: {
            ExpoAsset?: ExpoAssetModule;
            ExpoFontLoader?: ExpoFontLoaderModule;
            ExpoFontUtils?: ExpoFontUtilsModule;
        };
    }
    var expo: ExpoGlobal | undefined;
}
export {};
//# sourceMappingURL=expo-global.d.ts.map