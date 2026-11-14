import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import { RESPONSIVE } from "../../utils/theme";
import CoinIcon from "../../../../assets/product/rewards.svg";
import Shoe3500 from "../../assets/StepCount/goal_shoe_3500.svg";
import Shoe4000 from "../../assets/StepCount/goal_shoe_4000.svg";
import Shoe4500 from "../../assets/StepCount/goal_shoe_4500.svg";
import { selectUserGoal } from "../../api/ProfileAPI";
import { useProfilePlanCache, useProfilePlanQuery } from "../../api/useProfilePlan";
import { useInvalidateFitnessQueries } from "../../api/useFitnessQueries";
import { GoalHeroArt, goalHeroSize, useGoalHeroKind } from "./GoalHeroArt";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";

import { useStepStyles } from "../../utils/useStepTheme";

type Nav = NativeStackNavigationProp<FitnessStackParamList, "StepGoal">;

// ─── Hero colours ─────────────────────────────────────────────────────────────
// The hero artwork is a daylight scene, so the hero panel stays light in both
// themes (same as Dashboard / StepWelcome); in dark mode it gets rounded corners.

const H = {
  sky: ["#C9DFFB", "#E2EEFD", "#F3EEFF"],
  ink: "#10152D",
  muted: "#777FA5",
  label: "#4A5275",
  accent: "#6236FF",
  blue: "#426BFF",
  pill: "rgba(233,226,255,0.92)",
  pillText: "#5B2EFF",
  dotDone: "#B9A6FF",
  dotNow: "#6236FF",
  white: "#FFFFFF",
  wave: "rgba(214,201,255,0.55)",
};

// ─── Body palette ─────────────────────────────────────────────────────────────

const VD_DARK = {
  accent:      "#8EA2FF",
  accentDark:  "#B9C4FF",
  accentFaint: "rgba(142,162,255,0.12)",
  cardBg:      "rgba(255,255,255,0.075)",
  cardBorder:  "rgba(174,188,255,0.16)",
  white:       "#FFFFFF",
  whiteMid:    "#CDD2EA",
  whiteLow:    "#979EBC",
  whiteGhost:  "rgba(255,255,255,0.10)",
  warning:     "#F8B84E",
  bg: ["#070A16", "#111735", "#201A3F"],
  screen: "#070A16",
  cta: ["#8EA2FF", "#B9C4FF"],
  ctaOff: ["rgba(255,255,255,0.15)", "rgba(255,255,255,0.10)"],
  ctaText: "#070A16",
  ctaBase: "#8EA2FF",
  selectedBg: "rgba(142,162,255,0.14)",
  selectedBorder: "#9B7BFF",
  shoeBg: "rgba(255,255,255,0.08)",
  radioOff: "rgba(205,210,234,0.35)",
  radioOn: "#8E6BFF",
  coinBg: "rgba(251,191,36,0.15)",
  coinBorder: "rgba(251,191,36,0.25)",
  shadow: "#000000",
  elevation: 0,
  motto: "#A9AFD0",
  mottoBg: "rgba(255,255,255,0.06)",
  waves: ["rgba(142,162,255,0.07)", "rgba(185,164,255,0.06)"],
  footer: ["rgba(7,10,22,0)", "rgba(7,10,22,0.96)"],
};

type Palette = typeof VD_DARK;

const VD_LIGHT: Palette = {
  accent: "#426BFF",
  accentDark: "#5B3FD9",
  accentFaint: "rgba(66,107,255,0.10)",
  cardBg: "#FFFFFF",
  cardBorder: "#ECEFFA",
  white: "#10152D",
  whiteMid: "#4A5275",
  whiteLow: "#777FA5",
  whiteGhost: "#E3EBFA",
  warning: "#B86E00",
  bg: ["#F3EEFF", "#F5F9FF", "#EFE9FF"],
  screen: "#F5F9FF",
  cta: ["#11C5F9", "#426BFF", "#773CFF", "#A334F8"],
  ctaOff: ["#DCE3F5", "#E4E1F5"],
  ctaText: "#FFFFFF",
  ctaBase: "#426BFF",
  selectedBg: "#F7F3FF",
  selectedBorder: "#793FFF",
  shoeBg: "#F1EDFF",
  radioOff: "#C9C2EE",
  radioOn: "#6A35FF",
  coinBg: "#FFF3D6",
  coinBorder: "#FFE3A3",
  shadow: "#5B3FD9",
  elevation: 3,
  motto: "#6F64A8",
  mottoBg: "rgba(255,255,255,0.72)",
  waves: ["rgba(167,139,250,0.16)", "rgba(96,165,250,0.12)"],
  footer: ["rgba(245,249,255,0)", "rgba(245,249,255,0.96)"],
};

// ─── Artwork ──────────────────────────────────────────────────────────────────

const SHOES: Record<number, React.FC<SvgProps>> = {
  3500: Shoe3500,
  4000: Shoe4000,
  4500: Shoe4500,
};
const SHOE_CYCLE = [Shoe3500, Shoe4000, Shoe4500];
// 5,000 steps (and any other target) has no dedicated shoe yet, so it borrows one by position.
const shoeFor = (steps: number, index: number) => SHOES[steps] ?? SHOE_CYCLE[index % SHOE_CYCLE.length];

// Setup phases: About you (StepForm) → BMI → Goal. StepForm numbers its own
// sub-steps "Step x of 3", so this screen says "Final step" instead.
const SETUP_PHASES = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

type GoalOption = { id: number; dailySteps: number; label: string; coins: number };

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString("en-IN") : "0");

// ─── Pieces ───────────────────────────────────────────────────────────────────

const Waves = React.memo(({ width, colors }: { width: number; colors: string[] }) => (
  <View pointerEvents="none" style={hs.waves}>
    <Svg width={width} height={170}>
      <Path d={`M0 62 C ${width * 0.28} 12, ${width * 0.58} 112, ${width} 42 L ${width} 170 L 0 170 Z`} fill={colors[0]} />
      <Path d={`M0 112 C ${width * 0.32} 72, ${width * 0.7} 152, ${width} 96 L ${width} 170 L 0 170 Z`} fill={colors[1]} />
    </Svg>
  </View>
));

const SetupProgress = React.memo(({ label }: { label: string }) => (
  <View style={hs.progress}>
    <View style={hs.progressPill}>
      <Text style={hs.progressText} maxFontSizeMultiplier={1.3}>{label}</Text>
    </View>
    <View style={hs.dots}>
      {Array.from({ length: SETUP_PHASES }, (_, i) => (
        <View key={i} style={[hs.dot, i === SETUP_PHASES - 1 ? hs.dotNow : hs.dotDone]} />
      ))}
    </View>
  </View>
));

// ─── Component ────────────────────────────────────────────────────────────────

const StepGoal: React.FC = () => {
  const { palette: VD, styles: ss, isDark } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  const { t: tx } = useTranslation();
  const navigation              = useNavigation<Nav>();
  const { width }               = useWindowDimensions();
  const insets                  = useSafeAreaInsets();
  const invalidateFitnessQueries = useInvalidateFitnessQueries();
  const [selected,    setSelected]    = useState<number | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const submittingRef = useRef(false);
  const {
    data: profilePlan = null,
    isLoading: loading,
    error,
    refetch: loadPlan,
  } = useProfilePlanQuery();
  const { fetchFresh } = useProfilePlanCache();

  const heroKind = useGoalHeroKind();

  const goals = useMemo<GoalOption[]>(() => {
    // Daily reward is flat regardless of the chosen target (matches the
    // actual syncSteps payout), so every option shows the same real coins
    // instead of an invented number that scales with step count.
    const coins = profilePlan?.daily_reward_coins ?? 0;
    const plan = profilePlan?.weekly_plan || [];
    if (plan.length > 0)
      return plan.map((item) => ({ id: item.week, dailySteps: item.steps, label: i18n.t('stepCounter:units.stepsCapN', { value: fmt(item.steps) }), coins }));
    if (profilePlan?.recommended_steps)
      return [{ id: 1, dailySteps: profilePlan.recommended_steps, label: i18n.t('stepCounter:units.stepsCapN', { value: fmt(profilePlan.recommended_steps) }), coins }];
    return [];
  }, [profilePlan]);

  const selectedGoal = useMemo(() => goals.find(g => g.id === selected), [goals, selected]);

  // Keep the user's pick across refetches; otherwise start on the saved goal, else the first option.
  useEffect(() => {
    if (!profilePlan) return;
    setSelected((previous) => {
      if (previous != null && goals.some(g => g.id === previous)) return previous;
      const saved = profilePlan.current_goal?.daily_steps;
      return goals.find(g => g.dailySteps === saved)?.id ?? goals[0]?.id ?? null;
    });
  }, [goals, profilePlan]);

  const handleRetry = useCallback(() => {
    loadPlan();
  }, [loadPlan]);

  const handleSetGoal = useCallback(async () => {
    if (submittingRef.current) return;
    if (!selectedGoal) { Alert.alert(i18n.t("stepCounter:stepGoal.selectGoal"), i18n.t("stepCounter:stepGoal.pleaseSelectYourDailyStep")); return; }
    try {
      submittingRef.current = true;
      setSubmitting(true);
      const res = await selectUserGoal({ daily_steps: selectedGoal.dailySteps });
      if (!res.success) { Alert.alert(i18n.t("stepCounter:stepGoal.goalUpdateFailed"), res.message); return; }
      invalidateFitnessQueries();
      // Store the saved goal before leaving so My Plan / setup routing see it.
      await fetchFresh().catch(() => {});
      // Back to where the change was started (My Plan), else the Dashboard.
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate("Dashboard");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [fetchFresh, invalidateFitnessQueries, navigation, selectedGoal]);

  const disabled = submitting || loading || !selectedGoal;

  // Users changing an existing goal are not in setup, so they get no progress indicator.
  const inSetup = !!profilePlan && !profilePlan.current_goal;

  const pad = RESPONSIVE.horizontalPadding;
  const { width: artWidth, height: artHeight } = heroKind ? goalHeroSize(heroKind, width) : { width: 0, height: 0 };
  const textWidth = width - pad - Math.max(artWidth, width * 0.42) * 0.78;
  const titleSize = width < 360 ? 27 : 31;
  const footerHeight = 56 + 24 + insets.bottom;

  return (
    <View style={ss.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <LinearGradient colors={VD.bg} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <Waves width={width} colors={VD.waves} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: footerHeight + 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero: header, copy on the left, artwork bottom-right */}
        <LinearGradient
          colors={H.sky}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={[
            hs.hero,
            { paddingTop: insets.top + 8, paddingHorizontal: pad, minHeight: insets.top + 30 + artHeight },
            isDark && hs.heroDark,
          ]}
        >
          <View pointerEvents="none" style={hs.heroWave}>
            <Svg width={width} height={70}>
              <Path d={`M0 46 C ${width * 0.3} 6, ${width * 0.62} 70, ${width} 20 L ${width} 70 L 0 70 Z`} fill={H.wave} />
            </Svg>
          </View>
          {heroKind && <GoalHeroArt kind={heroKind} width={artWidth} />}

          <View style={hs.header}>
            <TouchableOpacity
              style={hs.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={tx("common:actions.back")}
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color={H.ink} />
            </TouchableOpacity>
            {inSetup ? <SetupProgress label={tx("stepCounter:stepGoal.finalStep")} /> : <View style={hs.flex} />}
            <View style={hs.headerSpacer} />
          </View>

          <View style={[hs.copy, { width: textWidth }]}>
            <View style={hs.badge}>
              <MaterialCommunityIcons name="run-fast" size={14} color={H.blue} />
              <Text style={hs.badgeText} maxFontSizeMultiplier={1.2}>{tx("stepCounter:dashboard.rpMove")}</Text>
            </View>
            <Text style={hs.eyebrow} maxFontSizeMultiplier={1.3}>{tx("stepCounter:stepGoal.activityTarget")}</Text>
            <Text style={[hs.title, { fontSize: titleSize, lineHeight: titleSize + 6 }]} maxFontSizeMultiplier={1.2}>
              {tx("stepCounter:stepGoal.titleLead")}{"\n"}
              <Text style={hs.titleAccent}>{tx("stepCounter:stepGoal.titleAccent")}</Text>
            </Text>
            <Text style={hs.subtitle} maxFontSizeMultiplier={1.3}>{tx("stepCounter:stepGoal.pickTheGoalThatFeels")}</Text>
          </View>
        </LinearGradient>

        <View style={[ss.body, { paddingHorizontal: pad }]}>
          {/* Goal options */}
          {loading ? (
            <View style={ss.stateBox}>
              <ActivityIndicator color={VD.accent} size="large" />
              <Text style={ss.stateText}>{tx("stepCounter:stepGoal.loadingYourRecommendedGoals")}</Text>
            </View>
          ) : error ? (
            <View style={ss.stateBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color={VD.warning} />
              <Text style={ss.stateText}>{(error as Error)?.message || i18n.t("stepCounter:r2.failedToLoadGoals")}</Text>
              <TouchableOpacity style={ss.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
                <Text style={ss.retryText}>{tx("stepCounter:stepGoal.retry")}</Text>
              </TouchableOpacity>
            </View>
          ) : goals.length === 0 ? (
            <View style={ss.stateBox}>
              <MaterialCommunityIcons name="walk" size={28} color={VD.whiteLow} />
              <Text style={ss.stateText}>{tx("stepCounter:stepGoal.noStepGoalsAvailableRight")}</Text>
            </View>
          ) : (
            goals.map((item, index) => {
              const active = selected === item.id;
              const Shoe = shoeFor(item.dailySteps, index);
              return (
                <TouchableOpacity
                  key={`${item.id}-${item.dailySteps}`}
                  activeOpacity={0.85}
                  style={[ss.goalCard, active && ss.goalCardSelected]}
                  onPress={() => setSelected(item.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <View style={ss.shoeWrap}>
                    <Shoe width={62} height={46} />
                  </View>
                  <View style={ss.goalCopy}>
                    <Text style={ss.goalLabel} numberOfLines={1} maxFontSizeMultiplier={1.3}>{item.label}</Text>
                    <Text style={ss.goalMeta} numberOfLines={1} maxFontSizeMultiplier={1.3}>{tx("stepCounter:stepGoal.dailyStepTarget")}</Text>
                  </View>
                  {item.coins > 0 && (
                    <View style={ss.coinBadge}>
                      <CoinIcon width={16} height={16} />
                      <Text style={ss.coinText} maxFontSizeMultiplier={1.2}>{item.coins}</Text>
                    </View>
                  )}
                  <View style={[ss.radio, active && ss.radioOn]}>
                    {active && <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <View style={ss.motto}>
            <MaterialCommunityIcons name="bullseye-arrow" size={18} color={VD.motto} />
            <Text style={ss.mottoText} maxFontSizeMultiplier={1.3}>{tx("stepCounter:stepGoal.theLongerYouWalkThe")}</Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA stays reachable on small screens while the cards scroll underneath */}
      <LinearGradient
        colors={VD.footer}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.35 }}
        style={[ss.footer, { paddingHorizontal: pad, paddingBottom: insets.bottom + 12 }]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSetGoal}
          disabled={disabled}
          style={[ss.ctaWrap, !disabled && ss.ctaShadow]}
          accessibilityRole="button"
          accessibilityState={{ disabled, busy: submitting }}
        >
          <LinearGradient
            colors={disabled ? VD.ctaOff : VD.cta}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={ss.cta}
          >
            {submitting
              ? <ActivityIndicator color={VD.ctaText} />
              : (
                <>
                  <Text style={[ss.ctaText, disabled && ss.ctaTextDim]} maxFontSizeMultiplier={1.2}>{tx("stepCounter:stepGoal.setGoal")}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={22} color={disabled ? VD.whiteLow : VD.ctaText} />
                </>
              )
            }
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

export default React.memo(StepGoal);

// ─── Styles ───────────────────────────────────────────────────────────────────

// Hero styles use the fixed light colours above.
const hs = StyleSheet.create({
  hero: { overflow: "hidden", paddingBottom: 18 },
  heroDark: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroWave: { position: "absolute", left: 0, right: 0, bottom: 0 },
  flex: { flex: 1 },

  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: H.white,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#2B2F6B", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerSpacer: { width: 44 },
  progress: { flex: 1, alignItems: "center", paddingTop: 4 },
  progressPill: {
    backgroundColor: H.pill,
    borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  progressText: { fontSize: 14, fontWeight: "700", color: H.pillText },
  dots: { flexDirection: "row", gap: 6, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotDone: { backgroundColor: H.dotDone },
  dotNow: { width: 18, backgroundColor: H.dotNow },

  copy: { paddingBottom: 4 },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1, borderColor: "rgba(98,54,255,0.18)",
    borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: { fontSize: 12, fontWeight: "900", fontStyle: "italic", color: H.blue, letterSpacing: 0.6, textTransform: "uppercase" },
  eyebrow: {
    fontSize: 12, fontWeight: "700", letterSpacing: 2,
    textTransform: "uppercase", color: H.label, marginBottom: 6,
  },
  title: { fontWeight: "900", color: H.ink, marginBottom: 10 },
  titleAccent: { color: H.accent },
  subtitle: { fontSize: 14, lineHeight: 20, color: H.muted },

  waves: { position: "absolute", left: 0, right: 0, bottom: 0 },
});

const createStyles = (VD: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: VD.screen },
  body: { paddingTop: 12 },

  goalCard: {
    flexDirection: "row", alignItems: "center",
    minHeight: 92,
    backgroundColor: VD.cardBg,
    borderRadius: 22,
    borderWidth: 2, borderColor: VD.cardBorder,
    paddingVertical: 12, paddingLeft: 12, paddingRight: 14,
    marginBottom: 12,
    shadowColor: VD.shadow, shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: VD.elevation,
  },
  goalCardSelected: { borderColor: VD.selectedBorder, backgroundColor: VD.selectedBg },
  shoeWrap: {
    width: 74, height: 64, borderRadius: 18,
    backgroundColor: VD.shoeBg,
    alignItems: "center", justifyContent: "center",
    marginRight: 14,
  },
  goalCopy:  { flex: 1, marginRight: 8 },
  goalLabel: { fontSize: 19, fontWeight: "800", color: VD.white },
  goalMeta:  { fontSize: 13, color: VD.whiteMid, marginTop: 3 },
  coinBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: VD.coinBg,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: VD.coinBorder,
    marginRight: 12,
  },
  coinText: { fontSize: 14, fontWeight: "800", color: VD.warning },
  radio: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: VD.radioOff,
    alignItems: "center", justifyContent: "center",
  },
  radioOn: { backgroundColor: VD.radioOn, borderColor: VD.radioOn },

  stateBox: {
    minHeight: 150,
    alignItems: "center", justifyContent: "center",
    backgroundColor: VD.cardBg,
    borderRadius: 22,
    borderWidth: 1, borderColor: VD.cardBorder,
    padding: 20, marginBottom: 16, gap: 10,
  },
  stateText: { fontSize: 13, color: VD.whiteLow, textAlign: "center" },
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 28, paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: VD.accentFaint,
    borderWidth: 1, borderColor: VD.cardBorder,
  },
  retryText: { fontSize: 13, fontWeight: "700", color: VD.accentDark },

  motto: {
    alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: VD.mottoBg,
    borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 9,
    marginTop: 6,
  },
  mottoText: { flexShrink: 1, fontSize: 14, color: VD.motto, textAlign: "center" },

  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 24 },
  ctaWrap: { borderRadius: 28 },
  ctaShadow: {
    backgroundColor: VD.ctaBase,
    shadowColor: VD.ctaBase, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cta: {
    height: 56, borderRadius: 28,
    flexDirection: "row", gap: 10,
    alignItems: "center", justifyContent: "center",
  },
  ctaText:    { fontSize: 18, fontWeight: "800", color: VD.ctaText },
  ctaTextDim: { color: VD.whiteLow },
});
