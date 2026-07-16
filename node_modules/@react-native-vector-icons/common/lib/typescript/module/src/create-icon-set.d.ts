import React, { type Ref } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { type ImageResult } from './create-icon-source-cache';
import type { FontSource } from './dynamicLoading/types';
import { type GetImageSourceOptions } from './get-image-source';
type GetImageSourceSyncIconFunc<GM> = {
    (name: GM, options: GetImageSourceOptions): ImageResult;
    (name: GM, size?: number, color?: TextStyle['color']): ImageResult;
};
type GetImageSourceIconFunc<GM> = {
    (name: GM, options: GetImageSourceOptions): Promise<ImageResult>;
    (name: GM, size?: number, color?: TextStyle['color']): Promise<ImageResult>;
};
export type IconProps<T> = TextProps & {
    name: T;
    size?: number;
    color?: TextStyle['color'];
    innerRef?: Ref<Text>;
};
type GlyphMap = Record<string, number | string>;
export type IconComponent<GM extends GlyphMap> = React.FC<TextProps & {
    name: keyof GM;
    size?: number;
    color?: TextStyle['color'];
    innerRef?: Ref<Text>;
} & React.RefAttributes<Text>> & {
    getImageSource: GetImageSourceIconFunc<keyof GM>;
    getImageSourceSync: GetImageSourceSyncIconFunc<keyof GM>;
};
export type CreateIconSetOptions = {
    postScriptName: string;
    fontFileName: string;
    fontSource?: FontSource;
    fontStyle?: TextProps['style'];
};
export declare function createIconSet<GM extends GlyphMap>(glyphMap: GM, postScriptName: string, fontFileName: string, fontStyle?: TextProps['style']): IconComponent<GM>;
export declare function createIconSet<GM extends GlyphMap>(glyphMap: GM, options: CreateIconSetOptions): IconComponent<GM>;
export {};
//# sourceMappingURL=create-icon-set.d.ts.map