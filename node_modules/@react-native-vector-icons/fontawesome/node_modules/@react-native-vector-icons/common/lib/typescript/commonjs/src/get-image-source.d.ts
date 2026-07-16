import type { TextStyle } from 'react-native';
import type { createIconSourceCache } from './create-icon-source-cache';
export type GetImageSourceOptions = {
    size?: number;
    color?: TextStyle['color'];
    lineHeight?: number;
};
export declare const getImageSourceSync: (imageSourceCache: ReturnType<typeof createIconSourceCache>, fontReference: string, glyph: string, options?: GetImageSourceOptions) => import("./create-icon-source-cache").ImageResult;
export declare const getImageSource: (imageSourceCache: ReturnType<typeof createIconSourceCache>, fontReference: string, glyph: string, options?: GetImageSourceOptions) => Promise<import("./create-icon-source-cache").ImageResult>;
//# sourceMappingURL=get-image-source.d.ts.map