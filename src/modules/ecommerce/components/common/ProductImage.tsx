import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageErrorEventData,
  ImageResizeMode,
  ImageSourcePropType,
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  ImageStyle,
} from "react-native";

const FALLBACK_IMAGE = require("../../../../assets/product/coming_soon.png");
const REMOTE_URL_PATTERN = /^https?:\/\/.+/i;
const DEFAULT_IMAGE_WIDTH = 100;
const DEFAULT_IMAGE_QUALITY = 40;
const MAX_IMAGE_WIDTH = 120;
const MAX_IMAGE_QUALITY = 45;

const readNumericQuery = (url: string, name: string) => {
  const match = url.match(new RegExp(`(?:\\?|&)${name}=(\\d+)`, "i"));
  return match ? Number(match[1]) : null;
};

const upsertNumericQuery = (url: string, name: string, value: number) => {
  if (new RegExp(`(?:\\?|&)${name}=\\d+`, "i").test(url)) {
    return url.replace(new RegExp(`((?:\\?|&)${name}=)\\d+`, "i"), `$1${value}`);
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${name}=${value}`;
};

const withDefaultImageOptimization = (url: string) => {
  const width = Math.min(readNumericQuery(url, "width") ?? DEFAULT_IMAGE_WIDTH, MAX_IMAGE_WIDTH);
  const quality = Math.min(
    readNumericQuery(url, "quality") ?? DEFAULT_IMAGE_QUALITY,
    MAX_IMAGE_QUALITY
  );

  const withWidth = upsertNumericQuery(url, "width", width);
  return upsertNumericQuery(withWidth, "quality", quality);
};

type ProductImageProps = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  fallbackSource?: ImageSourcePropType;
  onError?: (event: NativeSyntheticEvent<ImageErrorEventData>) => void;
  onLoadEnd?: () => void;
  testID?: string;
  loadEnabled?: boolean;
};

export default function ProductImage({
  uri,
  style,
  containerStyle,
  resizeMode = "contain",
  fallbackSource = FALLBACK_IMAGE,
  onError,
  onLoadEnd,
  testID,
  loadEnabled = true,
}: ProductImageProps) {
  const [hasLoadError, setHasLoadError] = useState(false);

  const normalizedUri = useMemo(() => {
    if (typeof uri !== "string") return "";
    return uri.trim();
  }, [uri]);

  const hasValidRemoteUrl = useMemo(() => {
    return REMOTE_URL_PATTERN.test(normalizedUri);
  }, [normalizedUri]);

  useEffect(() => {
    setHasLoadError(false);
  }, [normalizedUri]);

  useEffect(() => {
    if (normalizedUri && !hasValidRemoteUrl) {
      console.warn("ProductImage received invalid URL", { uri: normalizedUri });
    }
  }, [hasValidRemoteUrl, normalizedUri]);

  const optimizedUri = hasValidRemoteUrl ? withDefaultImageOptimization(normalizedUri) : "";

  const source: ImageSourcePropType =
    loadEnabled && hasValidRemoteUrl && !hasLoadError ? { uri: optimizedUri } : fallbackSource;

  const handleError = (event: NativeSyntheticEvent<ImageErrorEventData>) => {
    console.warn("ProductImage failed to load", {
      uri: normalizedUri || null,
      error: event.nativeEvent.error,
    });
    setHasLoadError(true);
    onError?.(event);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        testID={testID}
        source={source}
        style={style}
        resizeMode={resizeMode}
        resizeMethod="resize"
        fadeDuration={0}
        progressiveRenderingEnabled={true}
        onError={handleError}
        onLoadEnd={onLoadEnd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});