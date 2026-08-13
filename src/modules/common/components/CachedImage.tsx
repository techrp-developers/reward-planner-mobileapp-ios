import React, { useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import type { StyleProp, ImageStyle, ViewStyle } from 'react-native';

const FALLBACK_SOURCE = require('../../../assets/product/coming_soon.png');
const REMOTE_URL_RE = /^https?:\/\/.+/i;

export type CachedImageProps = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  priority?: 'low' | 'normal' | 'high';
  fallbackSource?: any;
};

function CachedImage({
  uri,
  style,
  containerStyle,
  resizeMode = 'contain',
  fallbackSource = FALLBACK_SOURCE,
}: CachedImageProps) {
  const [hasError, setHasError] = useState(false);

  const normalizedUri = typeof uri === 'string' ? uri.trim() : '';
  const isValid = REMOTE_URL_RE.test(normalizedUri) && !hasError;
  const source = isValid ? { uri: normalizedUri } : fallbackSource;

  if (containerStyle) {
    return (
      <View style={[styles.wrap, containerStyle]}>
        <Image
          source={source}
          style={[styles.fill, style]}
          resizeMode={resizeMode}
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
});

export default React.memo(CachedImage);
