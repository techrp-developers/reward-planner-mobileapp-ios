import type { ImageOptions } from '@react-native-vector-icons/get-image';
import type { ImageResult } from './create-icon-source-cache';
type GetImageAPI = {
    getImageForFont(glyph: string, options: ImageOptions): Promise<ImageResult>;
    getImageForFontSync(glyph: string, options: ImageOptions): ImageResult;
};
export declare const ensureGetImageAvailable: () => GetImageAPI;
export {};
//# sourceMappingURL=get-image-library.d.ts.map