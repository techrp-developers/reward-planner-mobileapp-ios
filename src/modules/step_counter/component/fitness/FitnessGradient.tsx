import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

/** Keep Yoga layout on a standard View; the native gradient only paints. */
export default function FitnessGradient({
  children,
  style,
  onLayout,
  ...props
}: React.ComponentProps<typeof LinearGradient>) {
  const flattened = StyleSheet.flatten(style);
  return (
    <View style={style} onLayout={onLayout}>
      <LinearGradient
        {...props}
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: flattened?.borderRadius }]}
      />
      {children}
    </View>
  );
}
