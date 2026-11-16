import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Screens with a translucent status bar scroll their hero under the clock.
 * Render this last: it paints the top safe area so scrolled cards and text
 * pass beneath it instead of behind the status-bar icons. It reads the real
 * top inset once; the screen content applies it only as its own paddingTop.
 */
export default function StatusBarShield({ color }: { color: string }) {
  const { top } = useSafeAreaInsets();
  if (top <= 0) return null;
  return <View pointerEvents="none" style={[styles.shield, { height: top, backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  shield: { position: "absolute", top: 0, left: 0, right: 0 },
});
