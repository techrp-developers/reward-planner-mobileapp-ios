import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../../theme/ThemeContext';

// Only promotional artwork is toned down; icons and product photos retain
// their original colors. This layer never intercepts banner taps or swipes.
export default function CmsArtworkOverlay() {
  const { isDark } = useAppTheme();
  return isDark ? <View testID="cms-artwork-dark-overlay" pointerEvents="none"
    style={[StyleSheet.absoluteFill, styles.overlay]} /> : null;
}
const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(9,9,11,0.16)' },
});
