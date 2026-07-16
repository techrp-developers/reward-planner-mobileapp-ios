import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import { BORDER_RADIUS, RESPONSIVE, SPACING } from "../../utils/theme";
import RunningIcon from "../../assets/StepCount/running 1.svg";
import { fetchProfileStepStatus } from "../../api/ProfileAPI";

type Nav = NativeStackNavigationProp<FitnessStackParamList, "StepWelcome">;

// ─── Violet Dusk palette ──────────────────────────────────────────────────────

const VD = {
  accent:      "#8EA2FF",
  accentDark:  "#B9C4FF",
  accentFaint: "rgba(142,162,255,0.12)",
  cardBg:      "rgba(255,255,255,0.075)",
  cardBorder:  "rgba(174,188,255,0.16)",
  white:       "#FFFFFF",
  whiteMid:    "#CDD2EA",
  whiteLow:    "#979EBC",
  whiteGhost:  "rgba(255,255,255,0.10)",
};

const BG = ["#070A16", "#111735", "#201A3F"];

// ─── Feature row ─────────────────────────────────────────────────────────────

const Feature = ({ icon, text }: { icon: string; text: string }) => (
  <View style={ss.feature}>
    <View style={ss.featureIcon}>
      <MaterialCommunityIcons name={icon} size={18} color={VD.accentDark} />
    </View>
    <Text style={ss.featureText}>{text}</Text>
  </View>
);

// ─── Component ────────────────────────────────────────────────────────────────

const StepWelcome = () => {
  const navigation      = useNavigation<Nav>();
  const [checking, setChecking] = useState(true);
  const heroMotion = useRef(new Animated.Value(0)).current;

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleNext = useCallback(() => navigation.navigate("StepsTrackerScreen"), [navigation]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(heroMotion, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => loop.stop();
  }, [heroMotion]);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetchProfileStepStatus();
        if (!mounted) return;
        if (res.success && res.is_completed) navigation.replace("Dashboard");
      } catch {
        // status check failed — show the welcome screen anyway
      } finally {
        if (mounted) setChecking(false);
      }
    };
    check();
    return () => { mounted = false; };
  }, [navigation]);

  const runnerTranslateY = heroMotion.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -8, 0, -5, 0],
  });
  const runnerTranslateX = heroMotion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-3, 4, -3],
  });
  const runnerRotate = heroMotion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["-4deg", "5deg", "-4deg"],
  });
  const runnerScale = heroMotion.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 1.035, 0.99, 1.025, 1],
  });
  const glowScale = heroMotion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.94, 1.06, 0.94],
  });
  const glowOpacity = heroMotion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.55, 0.9, 0.55],
  });
  const shadowScaleX = heroMotion.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 0.72, 1, 0.82, 1],
  });
  const shadowOpacity = heroMotion.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.22, 0.1, 0.2, 0.13, 0.22],
  });

  return (
    <SafeAreaView style={ss.safe} edges={["top", "bottom"]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <LinearGradient colors={BG} style={ss.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <ScrollView
          contentContainerStyle={[ss.scroll, { paddingHorizontal: RESPONSIVE.horizontalPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity style={ss.backBtn} onPress={handleBack} activeOpacity={0.78}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={VD.accentDark} />
          </TouchableOpacity>

          {/* Hero illustration */}
          <View style={ss.heroBox}>
            <Animated.View
              style={[
                ss.heroGlow,
                { opacity: glowOpacity, transform: [{ scale: glowScale }] },
              ]}
            />
            <Animated.View
              style={[
                ss.runnerWrap,
                {
                  transform: [
                    { translateX: runnerTranslateX },
                    { translateY: runnerTranslateY },
                    { rotate: runnerRotate },
                    { scale: runnerScale },
                  ],
                },
              ]}
            >
              <RunningIcon width={130} height={130} />
            </Animated.View>
            <Animated.View
              style={[
                ss.heroShadow,
                { opacity: shadowOpacity, transform: [{ scaleX: shadowScaleX }] },
              ]}
            />
          </View>

          {/* Copy */}
          <Text style={ss.eyebrow}>RP Move</Text>
          <Text style={ss.title}>Welcome to{"\n"}RP Move</Text>
          <Text style={ss.subtitle}>
            Every step you take brings you closer to better health and more coins.
          </Text>

          {/* Features */}
          <View style={ss.featureList}>
            <Feature icon="shoe-print"        text="Tracks your daily steps automatically" />
            <Feature icon="coin-outline"       text="Earn coins for hitting your step goal" />
            <Feature icon="chart-line-variant" text="See your weekly progress at a glance" />
            <Feature icon="fire"               text="Maintain streaks for bonus rewards" />
          </View>

          <Text style={ss.tagline}>Walk. Earn. Redeem.</Text>

          {/* CTA */}
          <TouchableOpacity activeOpacity={0.9} onPress={handleNext} disabled={checking} style={ss.ctaWrap}>
            <LinearGradient
              colors={checking ? ["rgba(255,255,255,0.15)", "rgba(255,255,255,0.10)"] : ["#8EA2FF", "#B9C4FF"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={ss.cta}
            >
              {checking ? (
                <ActivityIndicator color={VD.accentDark} />
              ) : (
                <>
                  <Text style={ss.ctaText}>Let's Get Moving</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#070A16" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={ss.bottomPad} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default React.memo(StepWelcome);

// ─── Styles ───────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: "#070A16" },
  gradient: { flex: 1 },
  scroll:   { alignItems: "center", paddingTop: SPACING.xl },

  backBtn: {
    alignSelf: "flex-start",
    width: 40, height: 40,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: VD.whiteGhost,
    borderWidth: 1, borderColor: VD.cardBorder,
    alignItems: "center", justifyContent: "center",
    marginBottom: SPACING.lg,
  },

  heroBox: {
    alignItems: "center", justifyContent: "center",
    width: 190, height: 170,
    marginBottom: SPACING.xl, position: "relative",
  },
  heroGlow: {
    position: "absolute",
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(142,162,255,0.16)",
  },
  runnerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroShadow: {
    position: "absolute",
    bottom: 10,
    width: 86,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  eyebrow: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0,
    textTransform: "uppercase", color: VD.accentDark, marginBottom: 8,
  },
  title: {
    fontSize: 32, fontWeight: "900", color: VD.white,
    letterSpacing: 0, lineHeight: 38,
    textAlign: "center", marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 15, color: VD.whiteMid, lineHeight: 22,
    textAlign: "center", marginBottom: SPACING.xl,
  },

  featureList: {
    width: "100%",
    backgroundColor: VD.cardBg,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1, borderColor: VD.cardBorder,
    padding: SPACING.md, marginBottom: SPACING.xl, gap: SPACING.sm,
  },
  feature: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: VD.accentFaint,
    alignItems: "center", justifyContent: "center",
  },
  featureText: { flex: 1, fontSize: 13, color: VD.whiteMid, fontWeight: "500" },

  tagline: {
    fontSize: 16, fontWeight: "800", color: VD.accentDark,
    letterSpacing: 0, textAlign: "center", marginBottom: SPACING.xl,
  },

  ctaWrap: { width: "100%" },
  cta: {
    height: 54, borderRadius: BORDER_RADIUS.large,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  ctaText: { fontSize: 16, fontWeight: "800", color: "#070A16", letterSpacing: 0 },

  bottomPad: { height: SPACING.xxl },
});
