import React from "react";
import {
  ImageResizeMode,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import ProductImage from "./ProductImage";
import { getProductImageUrl } from "../../api/ProductApi";

type OptimizedImageProps = {
  path?: string | null;
  width: number;
  height: number;
  resizeMode?: ImageResizeMode;
  sizePreset?: "thumbnail" | "small" | "medium" | "large" | "full";
  quality?: number;
  priority?: "low" | "normal" | "high";
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  fallbackSource?: ImageSourcePropType;
  fallbackLabel?: string;
  fallbackBackgroundColor?: string;
  testID?: string;
  loadEnabled?: boolean;
};

export default function OptimizedImage({
  path,
  width,
  height,
  resizeMode = "contain",
  sizePreset = "small",
  quality = 60,
  style,
  containerStyle,
  fallbackSource,
  fallbackLabel,
  fallbackBackgroundColor = "#F4F4F5",
  testID,
  loadEnabled = true,
}: OptimizedImageProps) {
  const optimizedUri = getProductImageUrl(path ?? "", sizePreset, quality);

  return (
    <View
      style={[
        styles.container,
        { width, height, backgroundColor: fallbackBackgroundColor },
        containerStyle,
      ]}
    >
      <ProductImage
        uri={optimizedUri}
        style={[styles.image, { width, height }, style]}
        containerStyle={styles.imageContainer}
        resizeMode={resizeMode}
        fallbackSource={fallbackSource}
        testID={testID}
        loadEnabled={loadEnabled}
      />

      {!path && !!fallbackLabel ? (
        <Text style={styles.fallbackText} numberOfLines={2}>
          {fallbackLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  fallbackText: {
    position: "absolute",
    paddingHorizontal: 8,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 12,
  },
});