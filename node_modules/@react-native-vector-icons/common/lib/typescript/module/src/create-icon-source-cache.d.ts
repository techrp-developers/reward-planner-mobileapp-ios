export type ImageResult = {
    /**
     * The file URI to the rendered image.
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
     */
    scale: number;
};
export declare function createIconSourceCache(): {
    setValue: (key: string, value: ImageResult) => Map<string, ImageResult>;
    get: (key: string) => ImageResult | undefined;
};
//# sourceMappingURL=create-icon-source-cache.d.ts.map