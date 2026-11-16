import React, { useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "./FitnessGradient";
import StatusBarShield from "./StatusBarShield";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";

import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import { useContinueSetup } from "../../utils/fitnessSetup";
import { useStepStyles } from "../../utils/useStepTheme";
import { RESPONSIVE } from "../../utils/theme";
import { fetchUserInfo } from "../../../common/auth/api/AuthAPI";
import MaleBanner from "../../assets/StepCount/step_counter_banner.svg";
import FemaleBanner from "../../assets/StepCount/step_counter_banner_woman.svg";

type Nav = NativeStackNavigationProp<FitnessStackParamList, "StepWelcome">;

// The hero banner is a daylight illustration, so its copy keeps these colours
// in both modes; the rest of the screen follows the app light/dark setting.
const H = {
  ink: "#0D1733",
  body: "#405273",
  label: "#526FFE",
  hero: "#DCE8FF",
} as const;

const C_LIGHT = {
  screen: "#F3F6FF",
  card: "#FFFFFF",
  body: "#405273",
  label: "#526FFE",
  divider: "#EDF0F6",
  blue: "#487DFF",
  purple: "#956FF7",
  onAccent: "#FFFFFF",
  shadow: "#2B3A7A",
  steps: ["#6C5CE7", "#EFEDFF"],
  coins: ["#F2A516", "#FFF6E2"],
  progress: ["#1FA463", "#E7F7EE"],
  streak: ["#EF4E5B", "#FFECEE"],
};

type Palette = typeof C_LIGHT;

const C_DARK: Palette = {
  screen: "#0B1020",
  card: "#161C33",
  body: "#C3C9E4",
  label: "#8EA2FF",
  divider: "rgba(174,188,255,0.12)",
  blue: "#5E86FF",
  purple: "#A585FF",
  onAccent: "#FFFFFF",
  shadow: "#02030A",
  steps: ["#9D90FF", "rgba(108,92,231,0.20)"],
  coins: ["#FFC24D", "rgba(242,165,22,0.16)"],
  progress: ["#3DD68C", "rgba(31,164,99,0.18)"],
  streak: ["#FF6B76", "rgba(239,78,91,0.18)"],
};

const useWelcomeStyles = () => useStepStyles(C_LIGHT, C_DARK, createStyles);

// ─── Gender-based banner ─────────────────────────────────────────────────────

type BannerGender = "male" | "female" | "default";

// Accepts the spellings used across the backend: fitness_profiles stores
// "male" / "female" / "other", bus booking uses "M" / "F" / "O".
const normalizeGender = (value: unknown): BannerGender => {
  const g = String(value ?? "").trim().toLowerCase();
  if (g === "male" || g === "m") return "male";
  if (g === "female" || g === "f") return "female";
  return "default";
};

// There is no neutral illustration yet, so "other" and unknown fall back to
// the approved original banner.
const BANNERS = {
  male: MaleBanner,
  female: FemaleBanner,
  default: MaleBanner,
} as const;

// Shares the ["user-info"] cache (and options) with the fitness Dashboard, so
// this screen normally renders from cache without a network call. `select`
// keeps re-renders limited to an actual gender change.
// NOTE: /v1/auth/user-info does not return `gender` yet; until the backend
// adds it every user resolves to the default banner.
const useBannerGender = () =>
  useQuery({
    queryKey: ["user-info"],
    queryFn: fetchUserInfo,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    select: (data: any): BannerGender => normalizeGender(data?.user?.gender),
  });

const HeroBanner = React.memo(
  ({ gender, width, height }: { gender: BannerGender; width: number; height: number }) => {
    const Banner = BANNERS[gender];
    // Right-anchored "slice" keeps the character fully visible on every width;
    // only the empty sky on the left is cropped.
    return <Banner width={width} height={height} preserveAspectRatio="xMaxYMid slice" />;
  },
);

// ─── Feature row ─────────────────────────────────────────────────────────────

type FeatureRowProps = {
  icon: string;
  color: string;
  iconBg: string;
  label: string;
  last?: boolean;
  rowHeight: number;
};

const FeatureRow = React.memo(
  ({ icon, color, iconBg, label, last, rowHeight }: FeatureRowProps) => {
    const { styles } = useWelcomeStyles();
    return (
    <View style={[styles.featureRow, { minHeight: rowHeight }]}>
      <View style={[styles.featureIconBox, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={25} color={color} />
      </View>
      <View style={styles.iconSeparator} />
      <Text style={styles.featureLabel}>{label}</Text>
      {!last && <View pointerEvents="none" style={styles.rowDivider} />}
    </View>
    );
  },
);

// ─── Component ────────────────────────────────────────────────────────────────

const StepWelcome = () => {
  const { t: tx } = useTranslation();
  const { palette: C, styles, isDark } = useWelcomeStyles();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { data: bannerGender, isPending: genderPending } = useBannerGender();

  const compact = height < 740;
  const heroHeight = compact
    ? Math.max(225, Math.min(252, height * 0.34))
    : Math.max(270, Math.min(320, height * 0.35));
  const heroTotalHeight = heroHeight + insets.top;
  const rowHeight = compact ? 62 : 68;

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  // Continue at the first incomplete stage (health → details → plan), or the
  // Dashboard when everything is ready, instead of always restarting setup.
  const { continueSetup, busy: checking } = useContinueSetup();
  const handleNext = useCallback(() => { void continueSetup(); }, [continueSetup]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero — fixed size, so the banner never shifts the layout */}
        <View style={[styles.hero, isDark && styles.heroDark, { minHeight: heroTotalHeight }]}>
          {/* While user-info is still loading, keep the plain sky so the
              wrong gender is never shown. */}
          {!genderPending && (
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <HeroBanner
                gender={bannerGender ?? "default"}
                width={width}
                height={heroTotalHeight}
              />
            </View>
          )}

          <View style={[styles.heroContent, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.78}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={H.ink} />
            </TouchableOpacity>

            <View style={[styles.copy, { width: width * 0.55 }]}>
              <Text style={styles.eyebrow}>{tx("stepCounter:dashboard.rpMove")}</Text>
              <Text style={[styles.title, compact && styles.titleCompact]}>
                {tx("stepCounter:ui.welcomeTitle")}
              </Text>
              <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
                {tx("stepCounter:stepWelcome.everyStepYouTakeBrings")}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Features */}
          <View style={styles.featureCard}>
            <FeatureRow
              icon="shoe-print"
              color={C.steps[0]}
              iconBg={C.steps[1]}
              label={i18n.t("stepCounter:r2.tracksYourDailyStepsAutomatically")}
              rowHeight={rowHeight}
            />
            <FeatureRow
              icon="star-circle"
              color={C.coins[0]}
              iconBg={C.coins[1]}
              label={i18n.t("stepCounter:r2.earnCoinsForHittingYourStep")}
              rowHeight={rowHeight}
            />
            <FeatureRow
              icon="trending-up"
              color={C.progress[0]}
              iconBg={C.progress[1]}
              label={i18n.t("stepCounter:r2.seeYourWeeklyProgressAtA")}
              rowHeight={rowHeight}
            />
            <FeatureRow
              icon="fire"
              color={C.streak[0]}
              iconBg={C.streak[1]}
              label={i18n.t("stepCounter:r2.maintainStreaksForBonusRewards")}
              rowHeight={rowHeight}
              last
            />
          </View>

          <Text style={styles.tagline}>{tx("stepCounter:stepWelcome.walkEarnRedeem")}</Text>

          {/* CTA */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleNext}
            disabled={checking}
            style={styles.ctaWrap}
          >
            <LinearGradient
              colors={[C.blue, C.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cta, checking && styles.ctaDisabled]}
            >
              {checking ? (
                <ActivityIndicator color={C.onAccent} />
              ) : (
                <>
                  <Text style={styles.ctaText}>{tx("stepCounter:stepWelcome.letSGetMoving")}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color={C.onAccent} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <StatusBarShield color={H.hero} />
    </SafeAreaView>
  );
};

export default React.memo(StepWelcome);

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (C: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.screen },
  scroll: { flexGrow: 1, paddingBottom: 20 },

  hero: { width: "100%", overflow: "hidden", backgroundColor: H.hero },
  // Dark mode: the light banner reads as a rounded panel on the dark page.
  heroDark: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroContent: { paddingBottom: 48, paddingHorizontal: RESPONSIVE.horizontalPadding },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  copy: {},
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: H.label,
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: H.ink,
    lineHeight: 40,
    marginBottom: 10,
  },
  titleCompact: { fontSize: 29, lineHeight: 35 },
  subtitle: { fontSize: 15, lineHeight: 21, color: H.body },
  subtitleCompact: { fontSize: 14, lineHeight: 19 },

  body: { paddingHorizontal: RESPONSIVE.horizontalPadding, marginTop: -28 },

  featureCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    shadowColor: C.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  featureRow: { flexDirection: "row", alignItems: "center" },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSeparator: {
    width: 1,
    height: 26,
    backgroundColor: C.divider,
    marginHorizontal: 16,
  },
  featureLabel: { flex: 1, fontSize: 15, lineHeight: 20, color: C.body, fontWeight: "500" },
  rowDivider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.divider,
  },

  tagline: {
    fontSize: 22,
    fontWeight: "900",
    color: C.label,
    textAlign: "center",
    marginTop: 22,
    marginBottom: 20,
  },

  ctaWrap: { width: "100%" },
  cta: {
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { flexShrink: 1, textAlign: "center", lineHeight: 24, paddingVertical: 2, fontSize: 17, fontWeight: "800", color: C.onAccent },
});
