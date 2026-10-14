import React from "react";
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, useWindowDimensions, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Logo from "../../../../assets/menu/logo.png";
import logoword from "../../../../assets/homepage/Reward Planners word Logo.png";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { AuthEntrance, AuthPressable, useAuthReducedMotion } from "./AuthMotion";

function AmbientOrbs() {
  const { isDark } = useAppTheme();
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      {[styles.orbTop, styles.orbRight, styles.orbBottom].map((position, index) => (
        <View key={index} style={[styles.orb, position, { opacity: isDark ? 0.4 : 0.65 }]}>
          {[0, 1, 2].map(layer => <LinearGradient key={layer}
            colors={["rgba(166,84,205,0.018)", "rgba(252,63,120,0.04)", "rgba(166,84,205,0.012)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { margin: layer * 22, borderRadius: 220 }]} />)}
        </View>
      ))}
    </View>
  );
}

export function AuthLayout({ children, onBack, welcome = false }: {
  children: React.ReactNode;
  onBack?: () => void;
  welcome?: boolean;
}) {
  const { isDark, theme } = useAppTheme();
  const { width, height, fontScale } = useWindowDimensions();
  const reducedMotion = useAuthReducedMotion();
  const animateWelcome = welcome && fontScale <= 1.3;
  const logoSize = welcome ? (height < 740 ? 76 : 96) : Math.min(width * 0.32, 156);
  const wordmarkWidth = Math.min(width - 80, 180);
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: isDark ? "#100E18" : "#F6F1FC" }]}>
      {welcome && <AmbientOrbs />}
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView key={welcome ? `welcome-${fontScale}` : "auth"}
          contentContainerStyle={[styles.content, welcome && styles.welcomeContent]}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          {!welcome && <View style={styles.backRow}>
            {onBack && <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
              <Text style={{ color: theme.text, fontSize: 16 }}>‹ Back</Text>
            </TouchableOpacity>}
          </View>}
          <View style={[styles.brand, welcome && styles.welcomeBrand]}>
            <AuthEntrance enabled={animateWelcome} reducedMotion={reducedMotion} delay={0}>
              <View style={[styles.logoGlow, { shadowOpacity: welcome ? (isDark ? 0.1 : 0.14) : 0 }]}>
                <Image source={Logo} style={{ width: logoSize, height: logoSize }} resizeMode="contain" accessible={false} />
              </View>
            </AuthEntrance>
            <AuthEntrance enabled={animateWelcome} reducedMotion={reducedMotion} delay={70}>
              <Image source={logoword} style={[styles.wordmark, { width: wordmarkWidth, height: wordmarkWidth * 618 / 2191 }]}
                resizeMode="contain" accessibilityLabel="Reward Planners" />
            </AuthEntrance>
            <AuthEntrance enabled={animateWelcome} reducedMotion={reducedMotion} delay={140}>
              <Text style={[styles.tagline, { color: theme.secondaryText }]}>{welcome ? "Because You Matter" : "Employee Benefits Platform"}</Text>
            </AuthEntrance>
          </View>
          <AuthEntrance enabled={animateWelcome} reducedMotion={reducedMotion} delay={210}>
            <View style={[styles.card, welcome && styles.welcomeCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
              {children}
            </View>
          </AuthEntrance>
          {!welcome && <Text style={[styles.footer, { color: theme.secondaryText }]}>Your benefits. One simple sign-in.</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthButton({ title, onPress, busy = false, disabled = false, animatePress = false }: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  animatePress?: boolean;
}) {
  const isDisabled = disabled || busy;
  const Button = animatePress ? AuthPressable : TouchableOpacity;
  return (
    <Button onPress={onPress} disabled={isDisabled} activeOpacity={0.85}
      accessibilityRole="button" accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy }} style={{ opacity: disabled ? 0.5 : 1 }}>
      {/* LinearGradient 2.8.x is a legacy (interop) view on Fabric; giving it
          children crashes on unmount ("Attempt to recycle a mounted view"). */}
      <View style={styles.button}>
        <LinearGradient colors={animatePress ? ["#852BAF", "#B73169"] : ["#A654CD", "#DA609E"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        {busy && <ActivityIndicator color="#FFFFFF" />}
        <Text style={styles.buttonText}>{title}</Text>
      </View>
    </Button>
  );
}

export const authStyles = StyleSheet.create({
  title: { fontSize: 25, fontWeight: "700", lineHeight: 33, marginBottom: 10 },
  description: { fontSize: 15, lineHeight: 23, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  error: { color: "#C62842", fontSize: 14, lineHeight: 21, marginBottom: 16 },
  link: { fontSize: 15, fontWeight: "600", textAlign: "center", paddingVertical: 14 },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24, width: "100%", maxWidth: 520, alignSelf: "center" },
  welcomeContent: { paddingTop: 12, paddingBottom: 16, justifyContent: "center" },
  backRow: { height: 48, justifyContent: "center" },
  back: { alignSelf: "flex-start", minHeight: 48, minWidth: 48, justifyContent: "center", paddingHorizontal: 4 },
  brand: { alignItems: "center", marginBottom: 32 },
  welcomeBrand: { marginBottom: 14 },
  logoGlow: { shadowColor: "#A654CD", shadowOffset: { width: 0, height: 0 }, shadowRadius: 22 },
  wordmark: { alignSelf: "center" },
  tagline: { fontSize: 13, lineHeight: 20, letterSpacing: 1.1, marginTop: 7, textAlign: "center" },
  card: { borderRadius: 28, borderWidth: 1, padding: 24 },
  welcomeCard: { padding: 20, borderRadius: 26 },
  footer: { fontSize: 12, textAlign: "center", marginTop: 28 },
  button: { minHeight: 54, borderRadius: 15, overflow: "hidden", flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },
  buttonText: { flexShrink: 1, color: "#FFFFFF", fontSize: 16, fontWeight: "700", textAlign: "center", paddingHorizontal: 16, paddingVertical: 14 },
  orb: { position: "absolute", width: 360, height: 360 },
  orbTop: { top: -130, left: -120 },
  orbRight: { top: "20%", right: -190 },
  orbBottom: { bottom: -170, left: -100 },
});
