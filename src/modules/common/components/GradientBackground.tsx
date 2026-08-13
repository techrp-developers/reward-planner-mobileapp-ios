import React from "react";
import { KeyboardAvoidingView, Platform, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import { useAppTheme } from "../../../theme/ThemeContext";

type GradientBackgroundProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
};

function GradientBackground({ children, style, edges = ["left", "right", "top", "bottom"] }: GradientBackgroundProps) {
  const { isDark } = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: isDark ? "#09090B" : "#F5F0FF" }, style]}
      edges={edges}
    >
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default React.memo(GradientBackground);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
