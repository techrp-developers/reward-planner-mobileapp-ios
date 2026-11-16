import { goBackInFitness } from "../../utils/fitnessNavigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "./FitnessGradient";
import Svg, { Path } from "react-native-svg";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import { BORDER_RADIUS, SPACING, RESPONSIVE } from "../../utils/theme";

import { selectUserGoal, updateBodyProfile } from "../../api/ProfileAPI";
import { useInvalidateFitnessQueries, useTodaySummaryQuery } from "../../api/useFitnessQueries";
import { hasMeasurements, useProfilePlanCache, useProfilePlanQuery } from "../../api/useProfilePlan";
import { useStepTracker } from "../StepCode/useStepTracker";
import { useContinueSetup } from "../../utils/fitnessSetup";
import {
  DEFAULT_HEIGHT_CM,
  DEFAULT_WEIGHT_KG,
  HEIGHT_OPTIONS,
  WEIGHT_OPTIONS,
  bmiFrom,
  nearestOption,
  optionLabel,
  type MeasurementOption,
} from "../../utils/measurements";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";
import { translateSourceText } from "../../../../i18n/sourceText";
import { useStepStyles } from "../../utils/useStepTheme";
import { GoalHeroArt, goalHeroSize, useGoalHeroKind } from "./GoalHeroArt";
import StatusBarShield from "./StatusBarShield";
import { TILE_GAP, tileGrid } from "../../utils/layout";

type Nav = NativeStackNavigationProp<FitnessStackParamList, "BMICart" | "MyPlan">;

// ─── Hero colours ─────────────────────────────────────────────────────────────
// The hero artwork is a daylight scene, so the hero panel stays light in both
// themes (same as Dashboard / StepGoal); in dark mode it gets rounded corners.

const H = {
  sky: ["#C9DFFB", "#E2EEFD", "#F3EEFF"],
  ink: "#10152D",
  muted: "#5D6588",
  label: "#4A5275",
  white: "#FFFFFF",
  gold: "#F5A623",
  blue: "#426BFF",
  wave: "rgba(214,201,255,0.55)",
  chip: "rgba(255,255,255,0.86)",
};

// ─── Body palette ─────────────────────────────────────────────────────────────

const VD_DARK = {
  bg:          ["#070A16", "#111735", "#201A3F"],
  accent:      "#8EA2FF",
  accentDark:  "#B9C4FF",
  accentFaint: "rgba(142,162,255,0.12)",
  cardBg:      "#141A33",
  cardBorder:  "rgba(174,188,255,0.16)",
  white:       "#FFFFFF",
  whiteMid:    "#CDD2EA",
  whiteLow:    "#979EBC",
  error:       "#F38C9A",
  screen: "#070A16",
  sheet: "#111735",
  cta: ["#8EA2FF", "#B9C4FF"],
  ctaOff: ["rgba(255,255,255,0.15)", "rgba(255,255,255,0.10)"],
  ctaText: "#070A16",
  ctaBase: "#8EA2FF",
  glassFaint: "rgba(255,255,255,0.05)",
  tile: "rgba(255,255,255,0.05)",
  tileBorder: "rgba(174,188,255,0.14)",
  selectedBg: "rgba(142,162,255,0.14)",
  selectedBorder: "#9B7BFF",
  check: "#8E6BFF",
  iconBg: "rgba(142,162,255,0.16)",
  noteBg: "rgba(142,162,255,0.10)",
  done: "#34D399",
  doneBg: "rgba(52,211,153,0.12)",
  doneBorder: "rgba(52,211,153,0.28)",
  track: ["#E6B93E", "#4DBA73", "#E8826A", "#D9534F"],
  shadow: "#000000",
  elevation: 0,
};

type Palette = typeof VD_DARK;

const VD_LIGHT: Palette = {
  bg: ["#F3EEFF", "#F5F9FF", "#EFE9FF"],
  accent: "#3D5AFE",
  accentDark: "#5B3FD9",
  accentFaint: "rgba(66,107,255,0.10)",
  cardBg: "#FFFFFF",
  cardBorder: "#ECEFFA",
  white: "#10152D",
  whiteMid: "#4A5275",
  whiteLow: "#777FA5",
  error: "#E5484D",
  screen: "#F5F9FF",
  sheet: "#FFFFFF",
  cta: ["#11C5F9", "#426BFF", "#773CFF", "#A334F8"],
  ctaOff: ["#DCE3F5", "#E4E1F5"],
  ctaText: "#FFFFFF",
  ctaBase: "#426BFF",
  glassFaint: "#F3F6FD",
  tile: "#FFFFFF",
  tileBorder: "#E6E9F5",
  selectedBg: "#F5F1FF",
  selectedBorder: "#793FFF",
  check: "#5B2EFF",
  iconBg: "#EAF0FF",
  noteBg: "#F3F0FF",
  done: "#22B25F",
  doneBg: "#FFFFFF",
  doneBorder: "#E3F4EA",
  track: ["#F4C142", "#5CC77D", "#F08A6C", "#E4544F"],
  shadow: "#5B3FD9",
  elevation: 3,
};

// ─── BMI bar constants ────────────────────────────────────────────────────────

const BMI_MIN = 12;
const BMI_MAX = 40;
const KNOB = 22;

const BMI_SEGMENTS = [
  { label: "Under",  category: "Underweight", min: 12,   max: 18.5, guidance: "guidanceUnder" },
  { label: "Normal", category: "Normal",      min: 18.5, max: 25,   guidance: "guidanceNormal" },
  { label: "Over",   category: "Overweight",  min: 25,   max: 30,   guidance: "guidanceOver" },
  { label: "Obese",  category: "Obese",       min: 30,   max: 40,   guidance: "guidanceObese" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const fmt   = (v: number) => (Number.isFinite(v) ? v.toLocaleString(i18n.language) : "0");

const toTitle = (v: string) =>
  v.replace(/[_-]/g, " ")
   .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

const getBmiSegment = (bmi: number, category?: string) => {
  if (Number.isFinite(bmi) && bmi > 0) {
    if (bmi < 18.5) return BMI_SEGMENTS[0];
    if (bmi < 25)   return BMI_SEGMENTS[1];
    if (bmi < 30)   return BMI_SEGMENTS[2];
    return BMI_SEGMENTS[3];
  }
  const n = category?.toLowerCase() || "";
  return BMI_SEGMENTS.find(s => n.includes(s.label.toLowerCase())) || BMI_SEGMENTS[1];
};

type GoalOption = { key: string; steps: number };

// ─── Sub-components ───────────────────────────────────────────────────────────

const LoadingState = React.memo(() => {
  const { palette: VD, styles: ss } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  const { t: tx } = useTranslation();
  return (
  <View style={ss.stateBox}>
    <ActivityIndicator color={VD.accent} size="large" />
    <Text style={ss.stateTitle}>{tx("stepCounter:bMIScreen.buildingYourBmiPlan")}</Text>
    <Text style={ss.stateText}>{tx("stepCounter:bMIScreen.fetchingYourProfileRecommendations")}</Text>
  </View>
);
});

const ErrorState = React.memo(({ message, onRetry }: { message: string; onRetry: () => void }) => {
  const { palette: VD, styles: ss } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  useTranslation();
  return (
  <View style={ss.stateBox}>
    <View style={ss.errorIcon}>
      <MaterialCommunityIcons name="alert-circle-outline" size={28} color={VD.error} />
    </View>
    <Text style={ss.stateTitle}>{i18n.t("stepCounter:r2.planUnavailable")}</Text>
    <Text style={ss.stateText}>{message}</Text>
    <TouchableOpacity activeOpacity={0.9} onPress={onRetry} style={ss.retryBtn}>
      <Text style={ss.retryText}>{i18n.t("common:actions.retry")}</Text>
    </TouchableOpacity>
  </View>
  );
});

const CardHeader = React.memo(({ icon, title }: { icon: string; title: string }) => {
  const { palette: VD, styles: ss } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  return (
    <View style={ss.cardHeader}>
      <MaterialCommunityIcons name={icon} size={20} color={VD.accent} />
      <Text style={ss.cardTitle} maxFontSizeMultiplier={1.3}>{title}</Text>
    </View>
  );
});

/** Four-colour BMI scale with an animated marker. */
const BmiMeter = React.memo(({ value }: { value: number }) => {
  const { palette: VD, styles: ss } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  useTranslation();
  const anim = useRef(new Animated.Value(0)).current;
  const [barWidth, setBarWidth] = useState(0);

  const target = useMemo(() => {
    if (!barWidth || !(value > 0)) return 0;
    const progress = (clamp(value, BMI_MIN, BMI_MAX) - BMI_MIN) / (BMI_MAX - BMI_MIN);
    return Math.max(barWidth - KNOB, 0) * progress;
  }, [barWidth, value]);

  useEffect(() => {
    Animated.spring(anim, { toValue: target, friction: 8, tension: 80, useNativeDriver: true }).start();
  }, [anim, target]);

  return (
    <>
      <View style={ss.bmiBar} onLayout={e => setBarWidth(e.nativeEvent.layout.width)}>
        {BMI_SEGMENTS.map((seg, i) => (
          <View
            key={seg.label}
            style={[ss.segment, i > 0 && ss.segmentGap, { backgroundColor: VD.track[i], flex: seg.max - seg.min }]}
          />
        ))}
        {value > 0 && <Animated.View style={[ss.knob, { transform: [{ translateX: anim }] }]} />}
      </View>
      <View style={ss.bmiLabelRow}>
        {BMI_SEGMENTS.map(seg => (
          <Text key={seg.label} style={[ss.bmiLbl, { flex: seg.max - seg.min }]} numberOfLines={1}>
            {translateSourceText("stepCounter", seg.label)}
          </Text>
        ))}
      </View>
    </>
  );
});

/** Icon tile + label + "17.56 – Underweight" line used by the BMI cards. */
const BmiHeadline = React.memo(({ label, value }: { label: string; value: string }) => {
  const { palette: VD, styles: ss } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  return (
    <View style={ss.bmiHead}>
      <View style={ss.bmiIcon}>
        <MaterialCommunityIcons name="scale-bathroom" size={22} color={VD.accent} />
      </View>
      <View style={ss.flex}>
        <Text style={ss.bmiLabel} maxFontSizeMultiplier={1.3}>{label}</Text>
        <Text style={ss.bmiValue} maxFontSizeMultiplier={1.2}>{value}</Text>
      </View>
    </View>
  );
});

const MeasureField = React.memo(({ label, icon, value, onPress }: {
  label: string; icon: string; value: string; onPress: () => void;
}) => {
  const { palette: VD, styles: ss } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  return (
    <View style={ss.measureCol}>
      <Text style={ss.measureLabel} maxFontSizeMultiplier={1.3}>{label}</Text>
      <TouchableOpacity style={ss.measureBox} onPress={onPress} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}>
        <MaterialCommunityIcons name={icon} size={22} color={VD.accentDark} />
        <Text style={ss.measureValue} maxFontSizeMultiplier={1.2}>{value}</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={VD.whiteMid} />
      </TouchableOpacity>
    </View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

/**
 * BMICart: the plan + goal step of first-time setup (no tab bar).
 * MyPlan:  the My Plan tab — create a plan, edit measurements, change goal.
 */
const BMIScreen: React.FC = () => {
  const { palette: VD, styles: ss, isDark } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  const { t: tx } = useTranslation();
  const navigation    = useNavigation<Nav>();
  const manage        = useRoute().name === "MyPlan";
  const invalidateFitnessQueries = useInvalidateFitnessQueries();
  const planQuery     = useProfilePlanQuery();
  const { fetchFresh } = useProfilePlanCache();
  const { continueSetup, busy: continuing } = useContinueSetup();
  const { width, height, fontScale } = useWindowDimensions();
  const insets        = useSafeAreaInsets();
  const heroKind      = useGoalHeroKind();
  const scrollRef     = useRef<ScrollView>(null);

  const profilePlan = planQuery.data ?? null;
  const measured = hasMeasurements(profilePlan);

  // ── Goal selection ────────────────────────────────────────────────────────
  const [selectedSteps, setSelectedSteps] = useState<number | null>(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [goalSaved,     setGoalSaved]     = useState(false);
  const submittingRef = useRef(false);

  // ── Measurements (State B) ────────────────────────────────────────────────
  const [editing,     setEditing]     = useState(false);
  const [heightCm,    setHeightCm]    = useState(DEFAULT_HEIGHT_CM);
  const [weightKg,    setWeightKg]    = useState(DEFAULT_WEIGHT_KG);
  const [showPicker,  setShowPicker]  = useState(false);
  const [pickerField, setPickerField] = useState<"height" | "weight">("height");
  const [saving,      setSaving]      = useState(false);

  const pad = RESPONSIVE.horizontalPadding;

  // ── Today's activity for the "create a plan" hero ─────────────────────────
  const { steps: liveSteps } = useStepTracker();
  const summaryQuery = useTodaySummaryQuery();
  const activeMinutes = summaryQuery.data?.success ? summaryQuery.data.data?.active_minutes ?? 0 : 0;

  const openMeasurements = useCallback(() => {
    // Start from the saved values when the server returns them.
    setHeightCm(nearestOption(HEIGHT_OPTIONS, profilePlan?.height_cm)?.value ?? DEFAULT_HEIGHT_CM);
    setWeightKg(nearestOption(WEIGHT_OPTIONS, profilePlan?.weight_kg)?.value ?? DEFAULT_WEIGHT_KG);
    setEditing(true);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  }, [profilePlan?.height_cm, profilePlan?.weight_kg]);

  const closeMeasurements = useCallback(() => setEditing(false), []);

  // Back leaves the measurement form first when a plan exists to return to.
  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (editing && measured) { setEditing(false); return true; }
      return false;
    });
    return () => sub.remove();
  }, [editing, measured]));

  const handleGeneratePlan = useCallback(async () => {
    setSaving(true);
    try {
      const res = await updateBodyProfile({ height_cm: heightCm, weight_kg: weightKg });
      if (!res.success) {
        Alert.alert(tx("stepCounter:bMIScreen.updateMeasurements"), res.message);
        return;
      }
      // The saved goal stays as it is; only BMI and the recommendation change.
      await fetchFresh();
      invalidateFitnessQueries();
      setGoalSaved(false);
      setEditing(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
    } catch (e: any) {
      Alert.alert(tx("stepCounter:bMIScreen.updateMeasurements"), e?.message || i18n.t("stepCounter:r2.failedToFetchProfilePlan"));
    } finally {
      setSaving(false);
    }
  }, [fetchFresh, heightCm, invalidateFitnessQueries, tx, weightKg]);

  const bmi = useMemo(() => {
    const value  = Number(profilePlan?.bmi ?? 0);
    const seg    = getBmiSegment(value, profilePlan?.category);
    return {
      value,
      label:    Number.isFinite(value) && value > 0 ? value.toFixed(2) : "--",
      category: profilePlan?.category ? toTitle(profilePlan.category) : seg.category,
      guidance: seg.guidance,
      plan:     profilePlan?.weekly_plan ?? [],
      currentGoal: profilePlan?.current_goal ?? null,
    };
  }, [profilePlan]);

  // Live preview while choosing measurements; the plan itself comes from the server.
  const preview = useMemo(() => {
    const value = bmiFrom(heightCm, weightKg);
    return { value, label: value > 0 ? value.toFixed(2) : "--", category: getBmiSegment(value).category };
  }, [heightCm, weightKg]);

  // Goal options are the weekly plan targets (or the single recommendation).
  const goals = useMemo<GoalOption[]>(() => {
    if (bmi.plan.length > 0) return bmi.plan.map(item => ({ key: `${item.week}-${item.steps}`, steps: item.steps }));
    if (profilePlan?.recommended_steps) return [{ key: "recommended", steps: profilePlan.recommended_steps }];
    return [];
  }, [bmi.plan, profilePlan?.recommended_steps]);

  // Keep the user's pick across refetches; otherwise start on the saved goal, else the first option.
  useEffect(() => {
    setSelectedSteps(previous => {
      if (previous != null && goals.some(g => g.steps === previous)) return previous;
      const saved = bmi.currentGoal?.daily_steps;
      return goals.find(g => g.steps === saved)?.steps ?? goals[0]?.steps ?? null;
    });
  }, [goals, bmi.currentGoal]);

  const selectGoal = useCallback((steps: number) => {
    setSelectedSteps(steps);
    setGoalSaved(false);
  }, []);

  const handleSetGoal = useCallback(async () => {
    if (submittingRef.current) return;
    if (!selectedSteps) { Alert.alert(i18n.t("stepCounter:stepGoal.selectGoal"), i18n.t("stepCounter:stepGoal.pleaseSelectYourDailyStep")); return; }
    try {
      submittingRef.current = true;
      setSubmitting(true);
      const res = await selectUserGoal({ daily_steps: selectedSteps });
      if (!res.success) { Alert.alert(i18n.t("stepCounter:stepGoal.goalUpdateFailed"), res.message); return; }
      invalidateFitnessQueries();
      // Store the saved goal before showing success, so Start Tracking routes
      // on fresh data and does not bounce back into setup.
      await fetchFresh().catch(() => {});
      setGoalSaved(true);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [fetchFresh, invalidateFitnessQueries, selectedSteps]);

  const startTracking = useCallback(() => {
    // Setup is finished: Dashboard becomes the root so Back cannot reopen it.
    if (manage) navigation.navigate("Dashboard");
    else navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
  }, [manage, navigation]);

  const openPicker = useCallback((field: "height" | "weight") => {
    setPickerField(field);
    setShowPicker(true);
  }, []);

  const pickerOptions: MeasurementOption[] = pickerField === "height" ? HEIGHT_OPTIONS : WEIGHT_OPTIONS;
  const pickerValue = pickerField === "height" ? heightCm : weightKg;
  const handlePickerSelect = useCallback((option: MeasurementOption) => {
    if (pickerField === "height") setHeightCm(option.value);
    else setWeightKg(option.value);
    setShowPicker(false);
  }, [pickerField]);

  // ── Which state to show ───────────────────────────────────────────────────
  const view: "loading" | "error" | "create" | "measure" | "plan" =
    planQuery.isPending ? "loading"
      : planQuery.isError && !planQuery.isSuccess ? "error"
      : editing ? "measure"
      : !measured ? "create"
      : "plan";

  // Tile columns from the real space inside the card (border included).
  const tileInner = width - pad * 2 - TILE_CARD_PADDING * 2 - 2;
  const goalGrid = tileGrid(tileInner, goals.length, fontScale);

  const unchangedGoal = manage && !!bmi.currentGoal && selectedSteps === bmi.currentGoal.daily_steps;
  const disabled = submitting || !selectedSteps || unchangedGoal;
  const returning = manage && !!bmi.currentGoal;

  // Hero copy per state.
  const hero =
    view === "measure" ? { eyebrow: tx("stepCounter:bMIScreen.yourDetails"), title: tx("stepCounter:bMIScreen.addMeasurements"), sub: tx("stepCounter:bMIScreen.addMeasurementsSub") }
      : view === "create" ? { eyebrow: tx("stepCounter:dashboard.rpMove"), title: tx("stepCounter:bMIScreen.myPlanTitle"), sub: tx("stepCounter:bMIScreen.createPlanHeroSub") }
      : returning ? { eyebrow: tx("stepCounter:dashboard.rpMove"), title: tx("stepCounter:bMIScreen.myPlanTitle"), sub: tx("stepCounter:bMIScreen.myPlanSub") }
      : { eyebrow: null, title: tx("stepCounter:bMIScreen.planReady"), sub: tx("stepCounter:bMIScreen.planReadySub") };

  // The measurement form uses a compact header (no artwork), as in the design.
  const showArt = view !== "measure";
  // Art is decorative and capped so it never sets a tall, empty hero.
  const art = showArt && heroKind ? goalHeroSize(heroKind, width, Math.min(200, Math.max(150, height * 0.22))) : null;
  const showBack = !manage || (view === "measure" && measured);
  const onBack = view === "measure" && measured ? closeMeasurements : () => goBackInFitness(navigation, manage ? "Dashboard" : "StepForm");

  return (
    <View style={ss.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <LinearGradient colors={VD.bg} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ─────────────────────────────────────────────── */}
        <LinearGradient
          colors={H.sky}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={[
            hs.hero,
            { paddingTop: insets.top + 8, paddingHorizontal: pad },
            // Tall enough for the art below the status bar; text adds to it.
            showArt && { minHeight: insets.top + 8 + (art?.height ?? 150) + HERO_OVERLAP },
            isDark && hs.heroDark,
          ]}
        >
          <View pointerEvents="none" style={hs.heroWave}>
            <Svg width={width} height={70}>
              <Path d={`M0 46 C ${width * 0.3} 6, ${width * 0.62} 70, ${width} 20 L ${width} 70 L 0 70 Z`} fill={H.wave} />
            </Svg>
          </View>
          {heroKind && art && <GoalHeroArt kind={heroKind} width={art.width} />}

          {showBack ? (
            <TouchableOpacity
              style={hs.backBtn}
              onPress={onBack}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={tx("common:actions.back")}
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color={H.ink} />
            </TouchableOpacity>
          ) : (
            <View style={hs.backSpacer} />
          )}

          <View style={[hs.copy, showArt && { width: width - pad - (art?.width ?? width * 0.45) * 0.62 }]}>
            {!!hero.eyebrow && <Text style={[hs.eyebrow, !showArt && hs.textCenter]} maxFontSizeMultiplier={1.3}>{hero.eyebrow}</Text>}
            {/* The celebration icon sits beside the title, not inside it: an
                icon glyph inside the heading mixes font metrics on iOS. */}
            <View style={hs.titleRow}>
              <Text style={[hs.title, width < 360 && hs.titleSmall, !showArt && hs.textCenter]} maxFontSizeMultiplier={1.2}>
                {hero.title}
              </Text>
              {view === "plan" && !returning && (
                <MaterialCommunityIcons name="party-popper" size={width < 360 ? 22 : 26} color={H.gold} style={hs.titleIcon} />
              )}
            </View>
            <Text style={[hs.subtitle, !showArt && hs.textCenter]} maxFontSizeMultiplier={1.3}>{hero.sub}</Text>

            {view === "create" && (
              <View style={hs.chips}>
                <View style={hs.chip}>
                  <MaterialCommunityIcons name="shoe-print" size={14} color={H.blue} />
                  <Text style={hs.chipText} maxFontSizeMultiplier={1.2}>{tx("stepCounter:units.stepsCapN", { value: fmt(liveSteps) })}</Text>
                </View>
                <View style={hs.chip}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={H.blue} />
                  <Text style={hs.chipText} maxFontSizeMultiplier={1.2}>{tx("stepCounter:bMIScreen.activeMinutesN", { n: fmt(activeMinutes) })}</Text>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* ── Content ──────────────────────────────────────────── */}
        <View style={[ss.body, !showArt && ss.bodyFlat, { paddingHorizontal: pad }]}>
          {view === "loading" ? (
            <View style={ss.card}><LoadingState /></View>
          ) : view === "error" ? (
            <View style={ss.card}>
              <ErrorState
                message={(planQuery.error as Error)?.message || i18n.t("stepCounter:r2.failedToFetchProfilePlan")}
                onRetry={() => { planQuery.refetch(); }}
              />
            </View>
          ) : view === "create" ? (
            /* ── State A: no plan yet ── */
            <View style={[ss.card, ss.createCard]}>
              <View style={ss.createIcon}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={34} color={VD.accent} />
                <View style={ss.createBadge}>
                  <MaterialCommunityIcons name="run-fast" size={14} color="#FFFFFF" />
                </View>
              </View>
              <Text style={ss.createTitle} maxFontSizeMultiplier={1.3}>{tx("stepCounter:bMIScreen.createPlanTitle")}</Text>
              <Text style={ss.createBody} maxFontSizeMultiplier={1.3}>{tx("stepCounter:bMIScreen.createPlanBody")}</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                // Only the missing part is asked for: basic details go through
                // StepForm; saved details open the measurement form here.
                onPress={profilePlan ? openMeasurements : () => { void continueSetup(); }}
                disabled={continuing}
                style={[ss.ctaWrap, ss.ctaShadow, ss.fullWidth]}
                accessibilityRole="button"
              >
                <LinearGradient colors={VD.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ss.cta}>
                  {continuing
                    ? <ActivityIndicator color={VD.ctaText} />
                    : (
                      <>
                        <Text style={ss.ctaText} maxFontSizeMultiplier={1.2}>{tx("stepCounter:bMIScreen.createPlanCta")}</Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color={VD.ctaText} />
                      </>
                    )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : view === "measure" ? (
            /* ── State B: measurements + live preview ── */
            <>
              <View style={[ss.card, ss.measureRow, (width < 360 || fontScale > 1.2) && { flexDirection: "column" }]}>
                <MeasureField
                  label={tx("stepCounter:bMIScreen.height")}
                  icon="human-male-height"
                  value={optionLabel(HEIGHT_OPTIONS, heightCm)}
                  onPress={() => openPicker("height")}
                />
                <MeasureField
                  label={tx("stepCounter:bMIScreen.weight")}
                  icon="weight-kilogram"
                  value={optionLabel(WEIGHT_OPTIONS, weightKg)}
                  onPress={() => openPicker("weight")}
                />
              </View>

              <View style={ss.card}>
                <CardHeader icon="chart-bar" title={tx("stepCounter:bMIScreen.planPreview")} />
                <BmiHeadline
                  label={tx("stepCounter:bMIScreen.bmiPreview")}
                  value={`${preview.label} – ${translateSourceText("stepCounter", preview.category)}`}
                />
                <BmiMeter value={preview.value} />
                <View style={ss.note}>
                  <View style={ss.noteIcon}>
                    <MaterialCommunityIcons name="bullseye-arrow" size={22} color={VD.accent} />
                  </View>
                  <Text style={ss.noteText} maxFontSizeMultiplier={1.3}>{tx("stepCounter:bMIScreen.previewNote")}</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleGeneratePlan}
                disabled={saving}
                style={[ss.ctaWrap, !saving && ss.ctaShadow]}
                accessibilityRole="button"
                accessibilityState={{ busy: saving }}
              >
                <LinearGradient colors={saving ? VD.ctaOff : VD.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ss.cta}>
                  {saving
                    ? <ActivityIndicator color={VD.ctaText} />
                    : (
                      <>
                        <Text style={ss.ctaText} maxFontSizeMultiplier={1.2}>{tx("stepCounter:bMIScreen.generatePlan")}</Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color={VD.ctaText} />
                      </>
                    )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            /* ── State C: the plan ── */
            <>
              <View style={ss.card}>
                <BmiHeadline
                  label={tx("stepCounter:bMIScreen.yourBmi")}
                  value={`${translateSourceText("stepCounter", bmi.label)} – ${translateSourceText("stepCounter", bmi.category)}`}
                />
                <BmiMeter value={bmi.value} />
                <Text style={ss.guidance} maxFontSizeMultiplier={1.3}>{tx(`stepCounter:bMIScreen.${bmi.guidance}`)}</Text>
              </View>

              <View style={[ss.card, ss.tileCard]}>
                <CardHeader icon="shoe-sneaker" title={tx("stepCounter:bMIScreen.chooseYourActivityGoal")} />
                {goals.length > 0 ? (
                  <View style={ss.tileRow}>
                    {goals.map(goal => {
                      const active = goal.steps === selectedSteps;
                      return (
                        <TouchableOpacity
                          key={goal.key}
                          activeOpacity={0.85}
                          onPress={() => selectGoal(goal.steps)}
                          style={[ss.tile, ss.chip, { width: goalGrid.tileWidth }, active && ss.tileActive]}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: active }}
                        >
                          <Text style={[ss.tileSteps, active && ss.tileStepsActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} maxFontSizeMultiplier={1.2}>
                            {fmt(goal.steps)}
                          </Text>
                          <Text style={[ss.tileUnit, active && ss.tileWeekActive]} maxFontSizeMultiplier={1.2}>
                            {tx("stepCounter:bMIScreen.stepsDay")}
                          </Text>
                          {active && (
                            <View style={ss.checkBadge}>
                              <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={ss.emptyText}>{tx("stepCounter:stepGoal.noStepGoalsAvailableRight")}</Text>
                )}
                {bmi.currentGoal && (
                  <Text style={ss.currentGoal} maxFontSizeMultiplier={1.3}>
                    {tx("stepCounter:bMIScreen.currentGoalN", { steps: fmt(bmi.currentGoal.daily_steps) })}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSetGoal}
                disabled={disabled}
                style={[ss.ctaWrap, !disabled && ss.ctaShadow]}
                accessibilityRole="button"
                accessibilityState={{ disabled, busy: submitting }}
              >
                <LinearGradient colors={disabled ? VD.ctaOff : VD.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ss.cta}>
                  {submitting
                    ? <ActivityIndicator color={VD.ctaText} />
                    : <Text style={[ss.ctaText, disabled && ss.ctaTextDim]} maxFontSizeMultiplier={1.2}>{tx("stepCounter:stepGoal.setGoal")}</Text>}
                </LinearGradient>
              </TouchableOpacity>

              {goalSaved && (
                <View style={ss.doneCard}>
                  <View style={ss.doneIcon}>
                    <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                  </View>
                  <View style={ss.flex}>
                    <Text style={ss.doneTitle} maxFontSizeMultiplier={1.3}>{tx("stepCounter:bMIScreen.goalSetSuccess")}</Text>
                    <Text style={ss.doneSub} maxFontSizeMultiplier={1.3}>{tx("stepCounter:bMIScreen.goalSetSuccessSub")}</Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.9} onPress={startTracking} accessibilityRole="button">
                    <LinearGradient colors={["#426BFF", "#5B2EFF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ss.trackBtn}>
                      <Text style={ss.trackText} maxFontSizeMultiplier={1.2}>{tx("stepCounter:bMIScreen.startTracking")}</Text>
                      <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* Explicit changes only — nothing here runs on its own. */}
              <View style={ss.actionRow}>
                <TouchableOpacity activeOpacity={0.78} onPress={openMeasurements} style={ss.actionBtn} accessibilityRole="button">
                  <MaterialCommunityIcons name="pencil-ruler" size={16} color={VD.accentDark} />
                  <Text style={ss.actionText} maxFontSizeMultiplier={1.2}>{tx("stepCounter:bMIScreen.editMeasurements")}</Text>
                </TouchableOpacity>
                {manage && !!bmi.currentGoal && (
                  <TouchableOpacity activeOpacity={0.78} onPress={() => navigation.navigate("StepGoal")} style={ss.actionBtn} accessibilityRole="button">
                    <MaterialCommunityIcons name="swap-horizontal" size={16} color={VD.accentDark} />
                    <Text style={ss.actionText} maxFontSizeMultiplier={1.2}>{tx("stepCounter:bMIScreen.changeGoal")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <StatusBarShield color={H.sky[0]} />

      {/* ── Height / weight picker ───────────────────────────────── */}
      <Modal
        isVisible={showPicker}
        onBackdropPress={() => setShowPicker(false)}
        onBackButtonPress={() => setShowPicker(false)}
        useNativeDriver
        hideModalContentWhileAnimating
        style={ss.modalWrap}
      >
        <View style={ss.pickerSheet}>
          <View style={ss.sheetHandle} />
          <Text style={ss.sheetTitle}>
            {pickerField === "height" ? tx("stepCounter:bMIScreen.height") : tx("stepCounter:bMIScreen.weight")}
          </Text>
          <FlatList
            data={pickerOptions}
            keyExtractor={item => item.label}
            initialNumToRender={18}
            maxToRenderPerBatch={18}
            windowSize={7}
            initialScrollIndex={Math.max(0, pickerOptions.findIndex(o => o.value === pickerValue) - 2)}
            getItemLayout={(_, index) => ({ length: PICKER_ROW, offset: PICKER_ROW * index, index })}
            renderItem={({ item }) => {
              const active = item.value === pickerValue;
              return (
                <TouchableOpacity style={ss.pickerItem} activeOpacity={0.8} onPress={() => handlePickerSelect(item)}>
                  <Text style={[ss.pickerItemText, active && ss.pickerItemActive]}>{item.label}</Text>
                  {active && <MaterialCommunityIcons name="check" size={18} color={VD.accent} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

export default React.memo(BMIScreen);

// ─── Styles ───────────────────────────────────────────────────────────────────

const PICKER_ROW = 52;
// How far the first card rises over the hero.
const HERO_OVERLAP = 18;
// Tile cards use a little less side padding so four tiles fit on 390pt phones.
const TILE_CARD_PADDING = 14;

// Hero styles use the fixed light colours above.
const hs = StyleSheet.create({
  // No overflow clipping in light mode: the hero grows with its text, and
  // only the artwork box clips itself. Bottom padding clears the cards that
  // rise over the hero (HERO_OVERLAP) plus a gap.
  hero: { paddingBottom: HERO_OVERLAP + 20 },
  heroDark: { overflow: "hidden", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroWave: { position: "absolute", left: 0, right: 0, bottom: 0 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: H.white,
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#2B2F6B", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  backSpacer: { height: 20 },
  copy: { alignSelf: "stretch" },
  textCenter: { textAlign: "center", alignSelf: "stretch" },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 4 },
  titleIcon: { marginTop: 4 },
  eyebrow: {
    fontSize: 12, fontWeight: "700", letterSpacing: 2,
    textTransform: "uppercase", color: H.label, marginBottom: 6, lineHeight: 16,
  },
  title: { flexShrink: 1, fontSize: 28, lineHeight: 35, fontWeight: "900", color: H.ink, paddingVertical: 2 },
  titleSmall: { fontSize: 24, lineHeight: 31 },
  subtitle: { flexShrink: 1, fontSize: 14, lineHeight: 21, color: H.muted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: H.chip,
    borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  chipText: { fontSize: 12, lineHeight: 16, fontWeight: "700", color: H.ink },
});

const createStyles = (VD: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: VD.screen },
  flex: { flex: 1 },
  fullWidth: { alignSelf: "stretch" },
  // Cards rise over the bottom of the hero, as in the design.
  body: { marginTop: -HERO_OVERLAP },
  bodyFlat: { marginTop: -HERO_OVERLAP },

  card: {
    backgroundColor: VD.cardBg,
    borderRadius: 22,
    borderWidth: 1, borderColor: VD.cardBorder,
    padding: 20,
    marginBottom: 14,
    shadowColor: VD.shadow, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: VD.elevation,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  cardTitle: { flexShrink: 1, fontSize: 17, lineHeight: 23, fontWeight: "800", color: VD.white, paddingVertical: 2 },

  // BMI
  bmiHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  bmiIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: VD.iconBg,
    alignItems: "center", justifyContent: "center",
  },
  bmiLabel: { fontSize: 14, lineHeight: 20, fontWeight: "600", color: VD.whiteMid },
  bmiValue: { flexShrink: 1, fontSize: 21, lineHeight: 28, fontWeight: "900", color: VD.accent, marginTop: 2 },
  bmiBar: { height: 12, flexDirection: "row", alignItems: "center", marginBottom: 8 },
  segment: { height: 12, borderRadius: BORDER_RADIUS.pill },
  segmentGap: { marginLeft: 3 },
  knob: {
    position: "absolute", left: 0,
    width: KNOB, height: KNOB, borderRadius: KNOB / 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 1, borderColor: "rgba(16,21,45,0.08)",
    shadowColor: "#10152D", shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  bmiLabelRow: { flexDirection: "row", marginBottom: 10 },
  bmiLbl: { fontSize: 12, fontWeight: "600", color: VD.whiteMid, textAlign: "center" },
  guidance: { fontSize: 13, lineHeight: 20, color: VD.whiteMid },

  // Create plan (State A)
  createCard: { alignItems: "center", paddingVertical: 24 },
  createIcon: {
    width: 76, height: 76, borderRadius: 24,
    backgroundColor: VD.iconBg,
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  createBadge: {
    position: "absolute", right: -6, bottom: -6,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: VD.check,
    borderWidth: 2, borderColor: VD.cardBg,
    alignItems: "center", justifyContent: "center",
  },
  createTitle: { fontSize: 21, fontWeight: "900", color: VD.white, textAlign: "center" },
  createBody: { fontSize: 14, lineHeight: 20, color: VD.whiteMid, textAlign: "center", marginTop: 6, marginBottom: 6 },

  // Measurements (State B)
  measureRow: { flexDirection: "row", gap: 12, padding: 16 },
  measureCol: { flex: 1 },
  measureLabel: { fontSize: 15, fontWeight: "700", color: VD.white, marginBottom: 8 },
  measureBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5, borderColor: VD.selectedBorder,
    backgroundColor: VD.selectedBg,
  },
  measureValue: { flex: 1, minWidth: 0, fontSize: 18, lineHeight: 24, fontWeight: "800", color: VD.white, paddingVertical: 2 },
  note: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: VD.noteBg,
  },
  noteIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: VD.cardBg,
    alignItems: "center", justifyContent: "center",
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18, color: VD.whiteMid },

  // Week tiles and goal chips
  tileCard: { paddingHorizontal: TILE_CARD_PADDING },
  tileRow: { flexDirection: "row", flexWrap: "wrap", gap: TILE_GAP },
  tile: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 108, paddingVertical: 14, paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: VD.tile,
    borderWidth: 1.5, borderColor: VD.tileBorder,
  },
  chip: { paddingVertical: 18 },
  tileActive: { backgroundColor: VD.selectedBg, borderColor: VD.selectedBorder },
  tileWeekActive: { color: VD.accent },
  tileSteps: { fontSize: 18, lineHeight: 24, fontWeight: "900", color: VD.white, marginVertical: 2 },
  tileStepsActive: { color: VD.accent },
  tileUnit: { fontSize: 11, lineHeight: 15, color: VD.whiteLow, textAlign: "center" },
  checkBadge: {
    position: "absolute", top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: VD.check,
    borderWidth: 2, borderColor: VD.cardBg,
    alignItems: "center", justifyContent: "center",
  },
  currentGoal: { fontSize: 12, lineHeight: 17, color: VD.whiteLow, marginTop: 12 },
  emptyText: { fontSize: 13, color: VD.whiteLow, textAlign: "center", paddingVertical: SPACING.md },

  // CTA
  ctaWrap: { borderRadius: 28, marginTop: 4 },
  ctaShadow: {
    backgroundColor: VD.ctaBase,
    shadowColor: VD.ctaBase, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cta: { minHeight: 56, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 28, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  ctaText: { flexShrink: 1, fontSize: 18, lineHeight: 24, fontWeight: "800", color: VD.ctaText, textAlign: "center" },
  ctaTextDim: { color: VD.whiteLow },

  // Success
  doneCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginTop: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: VD.doneBg,
    borderWidth: 1, borderColor: VD.doneBorder,
    shadowColor: VD.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: VD.elevation,
  },
  doneIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: VD.done,
    alignItems: "center", justifyContent: "center",
  },
  doneTitle: { fontSize: 14, lineHeight: 20, fontWeight: "800", color: VD.white, paddingVertical: 2 },
  doneSub: { fontSize: 12, lineHeight: 17, color: VD.whiteMid, marginTop: 1 },
  trackBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 14, minHeight: 40, paddingVertical: 8, borderRadius: 20,
  },
  trackText: { fontSize: 13, lineHeight: 18, fontWeight: "800", color: "#FFFFFF" },

  // Edit measurements / change goal
  actionRow: { flexDirection: "row", alignItems: "stretch", gap: 10, marginTop: 16 },
  actionBtn: {
    flex: 1,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    minHeight: 48,
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1, borderColor: VD.cardBorder,
    backgroundColor: VD.glassFaint,
  },
  actionText: { flexShrink: 1, fontSize: 13, lineHeight: 18, fontWeight: "700", color: VD.accentDark, textAlign: "center" },

  // States
  stateBox: {
    minHeight: 260,
    alignItems: "center", justifyContent: "center",
    paddingVertical: SPACING.xl, gap: SPACING.sm,
  },
  stateTitle: { fontSize: 18, fontWeight: "800", color: VD.white, textAlign: "center" },
  stateText:  { fontSize: 13, color: VD.whiteLow, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    marginTop: SPACING.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: VD.accentFaint,
    borderWidth: 1, borderColor: VD.cardBorder,
  },
  retryText: { fontSize: 14, fontWeight: "700", color: VD.accentDark },
  errorIcon: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: "rgba(248,113,113,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  // Picker sheet
  modalWrap: { justifyContent: "flex-end", margin: 0 },
  sheetHandle: {
    width: 44, height: 4, borderRadius: BORDER_RADIUS.pill,
    backgroundColor: VD.cardBorder, alignSelf: "center", marginBottom: SPACING.md,
  },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: VD.white, marginBottom: SPACING.sm, paddingHorizontal: SPACING.md },
  pickerSheet: {
    backgroundColor: VD.sheet,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: VD.cardBorder,
    maxHeight: "60%", padding: SPACING.md, paddingBottom: SPACING.xl,
  },
  pickerItem: {
    height: PICKER_ROW,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: VD.cardBorder,
  },
  pickerItemText: { fontSize: 15, fontWeight: "600", color: VD.white },
  pickerItemActive: { color: VD.accent, fontWeight: "800" },
});
