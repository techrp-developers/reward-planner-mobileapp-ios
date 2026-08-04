import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Logo from "../../../assets/homepage/login_logo.svg";
import { useAppTheme } from "../../../theme/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = {
  visible: boolean;
  forceUpdate: boolean;
  maintenance: boolean;
  updateUrl: string;
  onLater: () => void;
};

// ─── Floating orb decoration ────────────────────────────────────────────────
function GlowOrb({
  size,
  colors,
  style,
  pulseDelay = 0,
}: {
  size: number;
  colors: string[];
  style?: object;
  pulseDelay?: number;
}) {
  const pulse = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(pulseDelay),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: 0.22,
          transform: [{ scale: pulse }],
          position: "absolute",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <LinearGradient
        colors={colors}
        style={{ flex: 1, borderRadius: size / 2 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
}

// ─── Animated floating ring ──────────────────────────────────────────────────
function FloatingRing({
  size,
  color,
  style,
  floatDelay = 0,
}: {
  size: number;
  color: string;
  style?: object;
  floatDelay?: number;
}) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(floatDelay),
        Animated.timing(translateY, {
          toValue: -12,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
          opacity: 0.18,
          position: "absolute",
          transform: [{ translateY }],
        },
        style,
      ]}
    />
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function AppUpdateModal({
  visible,
  forceUpdate,
  maintenance,
  updateUrl,
  onLater,
}: Props) {
  const { isDark, theme } = useAppTheme();

  // Entry animations
  const contentY = useRef(new Animated.Value(40)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.7)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0.94)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        // Logo entrance
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 520,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            tension: 60,
            friction: 9,
            useNativeDriver: true,
          }),
        ]),
        // Content slide up
        Animated.delay(80),
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 440,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(contentY, {
            toValue: 0,
            duration: 440,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(badgeScale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(badgeOpacity, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
        ]),
        // Button pop
        Animated.delay(60),
        Animated.parallel([
          Animated.spring(btnScale, {
            toValue: 1,
            tension: 80,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(btnOpacity, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Reset
      contentY.setValue(40);
      contentOpacity.setValue(0);
      logoScale.setValue(0.82);
      logoOpacity.setValue(0);
      badgeScale.setValue(0.7);
      badgeOpacity.setValue(0);
      btnScale.setValue(0.94);
      btnOpacity.setValue(0);
    }
  }, [visible]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.965,
      tension: 200,
      friction: 12,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      tension: 200,
      friction: 12,
      useNativeDriver: true,
    }).start();
  };

  const handleUpdate = () => Linking.openURL(updateUrl);

  // ── Content getters ─────────────────────────────────────────────────────
  type State = "maintenance" | "force" | "optional";
  const state: State = maintenance ? "maintenance" : forceUpdate ? "force" : "optional";

  const badge: Record<State, { label: string; icon: string }> = {
    maintenance: { label: "Scheduled Maintenance", icon: "wrench-outline" },
    force: { label: "Required Update", icon: "shield-alert-outline" },
    optional: { label: "New Version Available", icon: "star-outline" },
  };

  const title: Record<State, string> = {
    maintenance: "We'll Be\nRight Back",
    force: "Time to\nUpgrade",
    optional: "Something\nBetter Awaits",
  };

  const body: Record<State, string> = {
    maintenance:
      "We're polishing things behind the scenes.\nCheck back in a few minutes.",
    force:
      "This version has been retired. Update now to keep your rewards safe and your experience seamless.",
    optional: `Fresh features and a smoother experience are ready for you on ${Platform.OS === "android" ? "Android" : "iOS"
      }. Takes just a second.`,
  };

  const primaryCTA: Record<State, string> = {
    maintenance: "Got It",
    force: "Update Now",
    optional: "Update Now",
  };

  const primaryAction = maintenance ? onLater : handleUpdate;

  // Badge gradient per state
  const badgeGradients: Record<State, string[]> = {
    maintenance: ["#FFB347", "#FF6B6B"],
    force: ["#FC8BAD", "#A654CD"],
    optional: ["#A654CD", "#6C63FF"],
  };

  const surfaceColor = isDark ? "#141418" : "rgba(255,255,255,0.72)";
  const surfaceBorderColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(166,84,205,0.16)";
  const headlineColor = isDark ? "#FFFFFF" : "#1C1033";
  const bodyColor = isDark ? "#D4D4D8" : "#62527E";
  const mutedColor = isDark ? "#A1A1AA" : "#9B7FC0";
  const rootGradient = isDark
    ? ["#050507", "#101014", "#18111F"]
    : ["#FFF9FD", "#F1E8FF", "#F8F4FF"];
  const accentWash = isDark
    ? ["rgba(166,84,205,0.20)", "rgba(252,139,173,0.08)"]
    : ["rgba(166,84,205,0.16)", "rgba(252,139,173,0.08)"];
  const logoPanelGradient = isDark
    ? ["rgba(255,255,255,0.10)", "rgba(255,255,255,0.04)"]
    : ["rgba(255,255,255,0.92)", "rgba(248,244,255,0.70)"];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={maintenance ? onLater : undefined}
    >
      {/* ── Layered background ─────────────────────────────────────────── */}
      <View style={styles.root}>
        {/* Base gradient wash */}
        <LinearGradient
          colors={rootGradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Decorative ambient orbs */}
        <GlowOrb
          size={320}
          colors={isDark ? ["#6D28D9", "#EC4899"] : ["#C084FC", "#A654CD"]}
          style={{ top: -60, right: -80 }}
          pulseDelay={0}
        />
        <GlowOrb
          size={260}
          colors={isDark ? ["#BE185D", "#7C3AED"] : ["#FC8BAD", "#F472B6"]}
          style={{ bottom: 40, left: -80 }}
          pulseDelay={1200}
        />
        <GlowOrb
          size={180}
          colors={isDark ? ["#4338CA", "#A21CAF"] : ["#818CF8", "#6366F1"]}
          style={{ top: SCREEN_HEIGHT * 0.38, right: -40 }}
          pulseDelay={600}
        />

        {/* Subtle floating rings */}
        <FloatingRing
          size={200}
          color={isDark ? "#A78BFA" : "#A654CD"}
          style={{ top: SCREEN_HEIGHT * 0.12, left: -60 }}
          floatDelay={0}
        />
        <FloatingRing
          size={140}
          color={isDark ? "#F472B6" : "#FC8BAD"}
          style={{ bottom: SCREEN_HEIGHT * 0.22, right: -30 }}
          floatDelay={700}
        />

        {/* Fine grain texture overlay */}
        <View style={styles.grainOverlay} />

        {/* ── Main card ──────────────────────────────────────────────── */}
        <View style={styles.content}>

          {/* 1 ─ Illustration zone */}
          <Animated.View
            style={[
              styles.illustrationZone,
              { opacity: logoOpacity, transform: [{ scale: logoScale }] },
            ]}
          >
            {/* Halo ring behind logo */}
            <View style={styles.haloOuter}>
              <LinearGradient
                colors={accentWash}
                style={styles.haloGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </View>
            <View style={styles.haloInner}>
              <LinearGradient
                colors={accentWash}
                style={styles.haloGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </View>

            {/* Logo container with glass card */}
            <View style={[styles.logoCard, { borderColor: surfaceBorderColor, shadowColor: isDark ? "#000000" : "#A654CD" }]}>
              <LinearGradient
                colors={logoPanelGradient}
                style={styles.logoCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Logo width={110} height={110} />
              </LinearGradient>
            </View>

            {/* State icon badge on logo */}
            <View style={styles.stateIconBadge}>
              <LinearGradient
                colors={badgeGradients[state]}
                style={styles.stateIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons
                  name={badge[state].icon}
                  size={14}
                  color="#fff"
                />
              </LinearGradient>
            </View>
          </Animated.View>

          {/* 2 ─ Text content */}
          <Animated.View
            style={[
              styles.textZone,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentY }],
              },
            ]}
          >
            {/* Floating badge pill */}
            <Animated.View style={{ transform: [{ scale: badgeScale }], opacity: badgeOpacity }}>
              <View style={[styles.pill, { borderColor: surfaceBorderColor }]}>
                <LinearGradient
                  colors={[`${badgeGradients[state][0]}22`, `${badgeGradients[state][1]}14`]}
                  style={styles.pillGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View
                    style={[
                      styles.pillDot,
                      { backgroundColor: badgeGradients[state][0] },
                    ]}
                  />
                  <Text
                    style={[
                      styles.pillText,
                      { color: badgeGradients[state][1] },
                    ]}
                  >
                    {badge[state].label.toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>
            </Animated.View>

            {/* Headline */}
            <Text style={[styles.headline, { color: headlineColor }]}>{title[state]}</Text>

            {/* Body */}
            <View style={[styles.messageCard, { backgroundColor: surfaceColor, borderColor: surfaceBorderColor }]}>
              <Text style={[styles.bodyText, { color: bodyColor }]}>{body[state]}</Text>
              {!maintenance && (
                <View style={[styles.promiseRow, { borderTopColor: surfaceBorderColor }]}>
                  <MaterialCommunityIcons name="shield-check-outline" size={17} color={badgeGradients[state][0]} />
                  <Text style={[styles.promiseText, { color: theme.text }]}>Secure rewards, faster checkout, smoother experience</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* 3 ─ Actions */}
          <Animated.View
            style={[
              styles.actionsZone,
              { opacity: btnOpacity, transform: [{ scale: btnScale }] },
            ]}
          >
            {/* Primary CTA */}
            <Animated.View style={{ transform: [{ scale: pressScale }], width: "100%" }}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={primaryAction}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.primaryBtn}
              >
                <LinearGradient
                  colors={["#FC8BAD", "#C26EDB", "#A654CD"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtnGradient}
                >
                  {/* Subtle inner glow strip */}
                  <View style={styles.btnShimmer} />

                  {!maintenance && (
                    <MaterialCommunityIcons
                      name={forceUpdate ? "shield-check-outline" : "arrow-up-circle-outline"}
                      size={22}
                      color="rgba(255,255,255,0.92)"
                      style={styles.btnIcon}
                    />
                  )}
                  {maintenance && (
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={22}
                      color="rgba(255,255,255,0.92)"
                      style={styles.btnIcon}
                    />
                  )}
                  <Text style={styles.primaryBtnText}>{primaryCTA[state]}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer legal note */}
            <Text style={[styles.footerNote, { color: mutedColor }]}>
              {maintenance
                ? "All your rewards & data are safe"
                : "Your rewards and data are always safe"}
            </Text>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F0FF",
  },
  grainOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.028,
    backgroundColor: "transparent",
    // In production you'd use a noise texture image here
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 72 : 52,
    paddingBottom: Platform.OS === "ios" ? 52 : 40,
  },

  // ── Illustration ───────────────────────────────────────────────────────
  illustrationZone: {
    alignItems: "center",
    justifyContent: "center",
    width: SCREEN_WIDTH * 0.62,
    aspectRatio: 1,
  },
  haloOuter: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 999,
    overflow: "hidden",
  },
  haloInner: {
    position: "absolute",
    width: "72%",
    height: "72%",
    borderRadius: 999,
    overflow: "hidden",
  },
  haloGradient: {
    flex: 1,
  },
  logoCard: {
    width: 138,
    height: 138,
    borderRadius: 34,
    overflow: "hidden",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 14,
  },
  logoCardGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stateIconBadge: {
    position: "absolute",
    bottom: 14,
    right: 14,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  stateIconGradient: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Text zone ──────────────────────────────────────────────────────────
  textZone: {
    alignItems: "center",
    width: "100%",
    gap: 0,
  },
  pill: {
    borderRadius: 100,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(166,84,205,0.14)",
  },
  pillGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1.4,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  headline: {
    fontSize: 38,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 46,
    letterSpacing: 0,
    marginBottom: 16,
    // Subtle text shadow for depth
    textShadowColor: "rgba(166,84,205,0.08)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  bodyText: {
    fontSize: 15.5,
    textAlign: "center",
    lineHeight: 24,
    letterSpacing: 0.1,
    fontWeight: "400",
  },
  messageCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 26,
    elevation: 8,
  },
  promiseRow: {
    marginTop: 16,
    paddingTop: 13,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  promiseText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    textAlign: "left",
  },

  // ── Actions zone ───────────────────────────────────────────────────────
  actionsZone: {
    width: "100%",
    alignItems: "center",
    gap: 0,
  },
  primaryBtn: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#B254CD",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 24,
    elevation: 10,
  },
  primaryBtnGradient: {
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  btnShimmer: {
    position: "absolute",
    top: 0,
    left: "10%",
    right: "10%",
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 1,
  },
  btnIcon: {
    marginRight: 10,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
    paddingVertical: 19,

  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "70%",
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(166,84,205,0.12)",
  },
  dividerText: {
    fontSize: 12,
    color: "#C4B2D8",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 3,
    marginBottom: 24,
  },
  secondaryBtnText: {
    fontSize: 15,
    color: "#9B7FC0",
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  footerNote: {
    fontSize: 12,
    color: "#C4B2D8",
    letterSpacing: 0.2,
    textAlign: "center",
    fontWeight: "400",
  },
});
