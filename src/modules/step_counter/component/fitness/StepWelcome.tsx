import React, { useCallback, useEffect, useState } from "react";
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
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";

import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import { fetchProfileStepStatus } from "../../api/ProfileAPI";
import { fetchUserInfo } from "../../../common/auth/api/AuthAPI";
import MaleBanner from "../../assets/StepCount/step_counter_banner.svg";
import FemaleBanner from "../../assets/StepCount/step_counter_banner_woman.svg";

type Nav = NativeStackNavigationProp<FitnessStackParamList, "StepWelcome">;

const C = {
  ink: "#0D1733",
  body: "#405273",
  label: "#526FFE",
  white: "#FFFFFF",
  screen: "#F3F6FF",
  hero: "#DCE8FF",
  divider: "#EDF0F6",
  blue: "#487DFF",
  purple: "#956FF7",
} as const;

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
  ({ icon, color, iconBg, label, last, rowHeight }: FeatureRowProps) => (
    <View style={[styles.featureRow, { minHeight: rowHeight }]}>
      <View style={[styles.featureIconBox, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={25} color={color} />
      </View>
      <View style={styles.iconSeparator} />
      <Text style={styles.featureLabel}>{label}</Text>
      {!last && <View pointerEvents="none" style={styles.rowDivider} />}
    </View>
  ),
);

// ─── Component ────────────────────────────────────────────────────────────────

const StepWelcome = () => {
  const { t: tx } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [checking, setChecking] = useState(true);
  const { data: bannerGender, isPending: genderPending } = useBannerGender();

  const compact = height < 740;
  const heroHeight = compact
    ? Math.max(225, Math.min(252, height * 0.34))
    : Math.max(270, Math.min(320, height * 0.35));
  const heroTotalHeight = heroHeight + insets.top;
  const rowHeight = compact ? 62 : 68;

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleNext = useCallback(
    () => navigation.navigate("StepsTrackerScreen"),
    [navigation],
  );

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetchProfileStepStatus();
        if (!mounted) return;
        // Route through StepsTrackerScreen, not directly to Dashboard.
        // StepsTrackerScreen auto-redirects to Dashboard when HC is ready,
        // or shows the permission/install UI if HC was reinstalled and
        // permissions were revoked — the right thing to do in either case.
        if (res.success && res.is_completed) navigation.replace("StepsTrackerScreen");
      } catch {
        // status check failed — show the welcome screen anyway
      } finally {
        if (mounted) setChecking(false);
      }
    };
    check();
    return () => { mounted = false; };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero — fixed size, so the banner never shifts the layout */}
        <View style={[styles.hero, { height: heroTotalHeight }]}>
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
              <MaterialCommunityIcons name="chevron-left" size={24} color={C.ink} />
            </TouchableOpacity>

            <View style={[styles.copy, { width: width * 0.55 }]}>
              <Text style={styles.eyebrow}>RP Move</Text>
              <Text style={[styles.title, compact && styles.titleCompact]}>
                Welcome to{"\n"}RP Move
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
              color="#6C5CE7"
              iconBg="#EFEDFF"
              label={i18n.t("stepCounter:r2.tracksYourDailyStepsAutomatically")}
              rowHeight={rowHeight}
            />
            <FeatureRow
              icon="star-circle"
              color="#F2A516"
              iconBg="#FFF6E2"
              label={i18n.t("stepCounter:r2.earnCoinsForHittingYourStep")}
              rowHeight={rowHeight}
            />
            <FeatureRow
              icon="trending-up"
              color="#1FA463"
              iconBg="#E7F7EE"
              label={i18n.t("stepCounter:r2.seeYourWeeklyProgressAtA")}
              rowHeight={rowHeight}
            />
            <FeatureRow
              icon="fire"
              color="#EF4E5B"
              iconBg="#FFECEE"
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
                <ActivityIndicator color={C.white} />
              ) : (
                <>
                  <Text style={styles.ctaText}>{tx("stepCounter:stepWelcome.letSGetMoving")}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color={C.white} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default React.memo(StepWelcome);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.screen },
  scroll: { flexGrow: 1, paddingBottom: 20 },

  hero: { width: "100%", overflow: "hidden", backgroundColor: C.hero },
  heroContent: { flex: 1, paddingHorizontal: 20 },
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
    color: C.label,
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: C.ink,
    lineHeight: 40,
    marginBottom: 10,
  },
  titleCompact: { fontSize: 29, lineHeight: 34 },
  subtitle: { fontSize: 15, lineHeight: 21, color: C.body },
  subtitleCompact: { fontSize: 14, lineHeight: 19 },

  body: { paddingHorizontal: 16, marginTop: -28 },

  featureCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    shadowColor: "#2B3A7A",
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
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { fontSize: 17, fontWeight: "800", color: C.white },
});
