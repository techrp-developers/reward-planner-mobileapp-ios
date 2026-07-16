import React from 'react';
import { Animated } from 'react-native';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';

type SkeletonBoxProps = {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  pulse: Animated.Value;
  baseColor?: string;
  highlightColor?: string;
};

/**
 * Reusable pulsing skeleton block.
 * Pass the shared `pulse` animated value from parent skeleton components.
 */
export default function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
  pulse,
  baseColor = '#ECECEC',
  highlightColor = '#D5D5D5',
}: SkeletonBoxProps) {
  const bg = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [baseColor, highlightColor],
  });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: bg },
        style,
      ]}
    />
  );
}
