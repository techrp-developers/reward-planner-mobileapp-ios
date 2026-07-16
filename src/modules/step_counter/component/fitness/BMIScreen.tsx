import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import { BORDER_RADIUS, RESPONSIVE, SPACING } from "../../utils/theme";

import BMIBanner from "../../assets/StepCount/BMIpage.svg";
import StepIcon   from "../../assets/StepCount/step_icon.svg";
import ClockIcon  from "../../assets/StepCount/clock_icon.svg";
import RewardIcon from "../../../../assets/product/rewards.svg";
import {
  fetchProfilePlan,
  type ProfilePlanResponse,
  type WeeklyPlanItem,
} from "../../api/ProfileAPI";

type Nav = NativeStackNavigationProp<FitnessStackParamList, "BMICart">;

// ─── Violet Dusk palette ──────────────────────────────────────────────────────

const VD = {
  bg:          ["#070A16", "#111735", "#201A3F"],
  accent:      "#8EA2FF",
  accentDark:  "#B9C4FF",
  accentFaint: "rgba(142,162,255,0.12)",
  accentDim:   "rgba(142,162,255,0.26)",
  cardBg:      "rgba(255,255,255,0.075)",
  cardBorder:  "rgba(174,188,255,0.16)",
  white:       "#FFFFFF",
  whiteMid:    "#CDD2EA",
  whiteLow:    "#979EBC",
  whiteGhost:  "rgba(255,255,255,0.10)",
  success:     "#9AAEFF",
  warning:     "#F8B84E",
  error:       "#F38C9A",
};

// ─── BMI bar constants ────────────────────────────────────────────────────────

const BMI_MIN = 12;
const BMI_MAX = 40;
const INDICATOR_WIDTH = 5;

const BMI_SEGMENTS = [
  { label: "Under",  min: 12,   max: 18.5, color: "#FCD34D" },
  { label: "Normal", min: 18.5, max: 25,   color: "#22C55E" },
  { label: "Over",   min: 25,   max: 30,   color: "#F97316" },
  { label: "Obese",  min: 30,   max: 40,   color: "#EF4444" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const fmt   = (v: number) => (Number.isFinite(v) ? v.toLocaleString("en-IN") : "0");

const fmtMinutes = (m: number) => {
  if (m === 60) return "1 hour";
  if (m > 60 && m % 60 === 0) return `${m / 60} hours`;
  return `${m} min`;
};

const toTitle = (v: string) =>
  v.replace(/[_-]/g, " ")
   .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

const getBmiSegment = (bmi: number, category?: string) => {
  if (Number.isFinite(bmi)) {
    if (bmi < 18.5) return BMI_SEGMENTS[0];
    if (bmi < 25)   return BMI_SEGMENTS[1];
    if (bmi < 30)   return BMI_SEGMENTS[2];
    return BMI_SEGMENTS[3];
  }
  const n = category?.toLowerCase() || "";
  return BMI_SEGMENTS.find(s => n.includes(s.label.toLowerCase())) || BMI_SEGMENTS[1];
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const MetricTag = React.memo(({ Icon, label }: { Icon: any; label: string }) => (
  <View style={ss.tag}>
    <Icon width={16} height={16} />
    <Text style={ss.tagText}>{label}</Text>
  </View>
));

const WeeklyPlanCard = React.memo(({ item }: { item: WeeklyPlanItem }) => (
  <View style={ss.weekBox}>
    <Text style={ss.weekBoxTitle}>Week {item.week}</Text>
    <Text style={ss.weekBoxSteps}>{fmt(item.steps)}</Text>
    <Text style={ss.weekBoxLabel}>steps / day</Text>
  </View>
));

const LoadingState = React.memo(() => (
  <View style={ss.stateBox}>
    <ActivityIndicator color={VD.accent} size="large" />
    <Text style={ss.stateTitle}>Building your BMI plan</Text>
    <Text style={ss.stateText}>Fetching your profile recommendations…</Text>
  </View>
));

const ErrorState = React.memo(({
  message, onRetry, onSetupProfile,
}: { message: string; onRetry: () => void; onSetupProfile?: () => void }) => (
  <View style={ss.stateBox}>
    <View style={ss.errorIcon}>
      <MaterialCommunityIcons name="alert-circle-outline" size={28} color={VD.error} />
    </View>
    <Text style={ss.stateTitle}>{onSetupProfile ? "Let's set up your plan" : "Plan unavailable"}</Text>
    <Text style={ss.stateText}>
      {onSetupProfile ? "Add your body details so we can build your personalized step plan." : message}
    </Text>
    <TouchableOpacity activeOpacity={0.9} onPress={onSetupProfile || onRetry} style={ss.retryBtn}>
      <Text style={ss.retryText}>{onSetupProfile ? "Set Up My Profile" : "Retry"}</Text>
    </TouchableOpacity>
  </View>
));

// ─── Main screen ──────────────────────────────────────────────────────────────

const BMIScreen: React.FC = () => {
  const navigation    = useNavigation<Nav>();
  const { width, height } = useWindowDimensions();
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const [profilePlan,   setProfilePlan]   = useState<ProfilePlanResponse | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [errorMessage,  setErrorMessage]  = useState("");
  const [barWidth,      setBarWidth]      = useState(0);

  const bannerHeight   = Math.min(Math.max(height * 0.32, 220), 320);
  const contentPadding = width >= 768 ? 34 : 20;

  const load = useCallback(async () => {
    setLoading(true); setErrorMessage("");
    const res = await fetchProfilePlan();
    if (res.success && res.data) setProfilePlan(res.data);
    else setErrorMessage(res.message || "Failed to fetch profile plan");
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const bmi = useMemo(() => {
    const value  = Number(profilePlan?.bmi ?? 0);
    const seg    = getBmiSegment(value, profilePlan?.category);
    return {
      value,
      label:    Number.isFinite(value) && value > 0 ? value.toFixed(2) : "--",
      category: profilePlan?.category ? toTitle(profilePlan.category) : seg.label,
      color:    seg.color,
      goal:     profilePlan?.goal || "Your Goal",
      steps:    profilePlan?.recommended_steps ?? 0,
      minutes:  profilePlan?.recommended_minutes ?? 0,
      plan:     profilePlan?.weekly_plan ?? [],
      currentGoal: profilePlan?.current_goal ?? null,
    };
  }, [profilePlan]);

  const isProfileMissing = errorMessage === "Profile not found";

  const goalSetDateLabel = useMemo(() => {
    if (!bmi.currentGoal) return "";
    const date = new Date(`${bmi.currentGoal.start_date}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);
  }, [bmi.currentGoal]);

  const indicatorTarget = useMemo(() => {
    if (!barWidth || !Number.isFinite(bmi.value)) return 0;
    const usable   = Math.max(barWidth - INDICATOR_WIDTH, 0);
    const progress = (clamp(bmi.value, BMI_MIN, BMI_MAX) - BMI_MIN) / (BMI_MAX - BMI_MIN);
    return usable * progress;
  }, [barWidth, bmi.value]);

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: indicatorTarget, friction: 8, tension: 80, useNativeDriver: true,
    }).start();
  }, [indicatorAnim, indicatorTarget]);

  return (
    <SafeAreaView style={ss.safe} edges={["top", "bottom"]}>
      <LinearGradient colors={VD.bg} style={ss.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ss.scroll}>

          {/* ── Hero banner ───────────────────────────────────────── */}
          <View style={[ss.hero, { width, height: bannerHeight }]}>
            <BMIBanner width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />

            {/* Subtle dark overlay so text remains legible */}
            <View style={ss.heroOverlay} />

            {/* Back button */}
            <TouchableOpacity style={ss.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={VD.white} />
            </TouchableOpacity>

            {/* Step & time tags */}
            <View style={ss.tagsRow}>
              <MetricTag Icon={StepIcon}  label={`${fmt(bmi.steps)} Steps`} />
              <MetricTag Icon={ClockIcon} label={fmtMinutes(bmi.minutes)} />
            </View>
          </View>

          {/* ── Content card ──────────────────────────────────────── */}
          <View style={[ss.card, { padding: contentPadding }]}>

            {loading ? <LoadingState /> : errorMessage ? (
              <ErrorState
                message={errorMessage}
                onRetry={load}
                onSetupProfile={isProfileMissing ? () => navigation.navigate("StepForm") : undefined}
              />
            ) : (
              <>
                {/* Current goal, if one is already set */}
                {bmi.currentGoal && (
                  <View style={ss.currentGoalCard}>
                    <View style={ss.currentGoalIconWrap}>
                      <StepIcon width={20} height={20} />
                    </View>
                    <View style={ss.currentGoalCopy}>
                      <Text style={ss.currentGoalLabel}>Your current plan</Text>
                      <Text style={ss.currentGoalValue}>{fmt(bmi.currentGoal.daily_steps)} steps / day</Text>
                      {!!goalSetDateLabel && <Text style={ss.currentGoalMeta}>Set on {goalSetDateLabel}</Text>}
                    </View>
                  </View>
                )}

                {/* BMI value */}
                <Text style={ss.bmiTitle}>
                  Your BMI is{" "}
                  <Text style={[ss.bmiValue, { color: bmi.color }]}>{bmi.label}</Text>
                </Text>

                {/* BMI bar */}
                <View
                  style={ss.bmiBar}
                  onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
                >
                  {BMI_SEGMENTS.map((seg, i) => (
                    <View
                      key={seg.label}
                      style={[
                        ss.segment,
                        i > 0 && ss.segmentWithGap,
                        { backgroundColor: seg.color, flex: seg.max - seg.min },
                      ]}
                    />
                  ))}
                  <Animated.View style={[ss.indicator, { transform: [{ translateX: indicatorAnim }] }]} />
                </View>

                {/* BMI labels */}
                <View style={ss.bmiLabelRow}>
                  {BMI_SEGMENTS.map(seg => (
                    <Text key={seg.label} style={[ss.bmiLbl, { flex: seg.max - seg.min }]}>{seg.label}</Text>
                  ))}
                </View>

                {/* Category */}
                <Text style={[ss.bmiCategory, { color: bmi.color }]}>{bmi.category}</Text>
                <Text style={ss.guidance}>
                  We have put together a plan that gently guides you toward your goal at a pace that feels doable.
                </Text>

                <View style={ss.divider} />

                <Text style={ss.goalLabel}>
                  Goal: <Text style={ss.goalValue}>{bmi.goal}</Text>
                </Text>

                {/* Weekly plan card */}
                <View style={ss.weekCard}>
                  <LinearGradient colors={["#27305F", "#1B2148", "#2A1E50"]} style={ss.weekHeader}>
                    <Text style={ss.weekHeading}>Weekly Breakdown</Text>
                  </LinearGradient>

                  <View style={ss.weekGrid}>
                    {bmi.plan.length > 0 ? (
                      bmi.plan.map(item => (
                        <WeeklyPlanCard key={`${item.week}-${item.steps}`} item={item} />
                      ))
                    ) : (
                      <Text style={ss.weekEmpty}>Your weekly plan will appear here soon.</Text>
                    )}
                  </View>

                  <View style={ss.lossBox}>
                    <MaterialCommunityIcons name="trending-up" size={16} color={VD.success} />
                    <Text style={ss.lossTxt}>
                      Build toward{" "}
                      <Text style={ss.lossBold}>{fmt(bmi.steps)} daily steps</Text>{" "}
                      with a weekly plan tailored to your BMI.
                    </Text>
                  </View>
                </View>

                {/* Reward card */}
                <View style={ss.rewardCard}>
                  <View style={ss.rewardIconWrap}>
                    <RewardIcon width={36} height={36} />
                  </View>
                  <View style={ss.rewardText}>
                    <Text style={ss.rewardTitle}>Coins for consistency</Text>
                    <Text style={ss.rewardSub}>Stay consistent and earn coins every week</Text>
                  </View>
                </View>

                {/* CTA */}
                <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("StepGoal")} style={ss.ctaWrap}>
                  <LinearGradient colors={["#8EA2FF", "#B9C4FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ss.cta}>
                    <Text style={ss.ctaText}>{bmi.currentGoal ? "Choose a New Plan" : "Make This My Goal"}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#070A16" />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default React.memo(BMIScreen);

// ─── Styles ───────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: "#070A16" },
  gradient: { flex: 1 },
  scroll:   { alignItems: "center", paddingBottom: 32 },

  // Hero
  hero: {
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,10,22,0.52)",
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: {
    position: "absolute", left: 18, top: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.30)",
    alignItems: "center", justifyContent: "center",
  },
  tagsRow: {
    position: "absolute", left: 16, bottom: 14,
    flexDirection: "row", gap: 8,
  },
  tag: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.30)",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 6,
  },
  tagText: { fontSize: 12, fontWeight: "600", color: VD.white },

  // Content card
  card: {
    width: "100%",
    backgroundColor: VD.cardBg,
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
  },

  // BMI display
  bmiTitle: {
    fontSize: 16, fontWeight: "600", color: VD.whiteMid,
    marginTop: SPACING.sm,
  },
  bmiValue:   { fontWeight: "900", fontSize: 18 },
  bmiBar: {
    flexDirection: "row", width: "100%", height: 6,
    borderRadius: BORDER_RADIUS.pill, overflow: "visible",
    marginTop: 16, marginBottom: 6,
  },
  segment:  { borderRadius: BORDER_RADIUS.pill },
  segmentWithGap: { marginLeft: 3 },
  indicator: {
    position: "absolute", left: 0, top: -7,
    width: 5, height: 20, borderRadius: BORDER_RADIUS.pill,
    backgroundColor: VD.white,
  },
  bmiLabelRow: { flexDirection: "row" },
  bmiLbl: {
    fontSize: 10, fontWeight: "500", color: VD.whiteLow,
    textAlign: "center",
  },
  bmiCategory: {
    fontSize: 20, fontWeight: "800", marginTop: 16, letterSpacing: 0,
  },
  guidance: {
    fontSize: 13, color: VD.whiteLow, lineHeight: 18, marginTop: 6,
  },
  divider:   { height: StyleSheet.hairlineWidth, backgroundColor: VD.cardBorder, marginVertical: 20 },
  goalLabel: { fontSize: 15, fontWeight: "700", color: VD.whiteMid },
  goalValue: { color: VD.accent },

  // Current goal summary
  currentGoalCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: VD.accentFaint,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1, borderColor: VD.cardBorder,
    padding: SPACING.md, marginBottom: SPACING.lg, gap: SPACING.sm,
  },
  currentGoalIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: VD.accentFaint,
    alignItems: "center", justifyContent: "center",
  },
  currentGoalCopy:  { flex: 1 },
  currentGoalLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: VD.whiteLow },
  currentGoalValue: { fontSize: 16, fontWeight: "800", color: VD.white, marginTop: 2 },
  currentGoalMeta:  { fontSize: 11, color: VD.whiteLow, marginTop: 2 },

  // Weekly plan card
  weekCard: {
    marginTop: SPACING.lg,
    backgroundColor: VD.cardBg,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1, borderColor: VD.cardBorder,
    overflow: "hidden",
  },
  weekHeader:  { paddingVertical: 12, paddingHorizontal: 16 },
  weekHeading: { fontSize: 14, fontWeight: "700", color: VD.white },
  weekGrid: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: SPACING.sm, padding: 14,
  },
  weekBox: {
    width: "48%", minHeight: 78,
    alignItems: "center", justifyContent: "center",
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: VD.accentFaint,
    borderWidth: 1, borderColor: VD.cardBorder,
    padding: SPACING.sm,
  },
  weekBoxTitle: { fontSize: 11, fontWeight: "700", color: VD.accentDark, letterSpacing: 0.5 },
  weekBoxSteps: { fontSize: 20, fontWeight: "900", color: VD.white, letterSpacing: 0, marginTop: 4 },
  weekBoxLabel: { fontSize: 10, color: VD.whiteLow, fontWeight: "500" },
  weekEmpty: {
    fontSize: 13, color: VD.whiteLow, textAlign: "center",
    paddingVertical: SPACING.lg, width: "100%",
  },
  lossBox: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 8, margin: 14, padding: SPACING.md,
    backgroundColor: VD.accentFaint,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1, borderColor: VD.cardBorder,
  },
  lossTxt:  { flex: 1, fontSize: 12, color: VD.whiteLow, lineHeight: 18 },
  lossBold: { color: VD.success, fontWeight: "800" },

  // Reward card
  rewardCard: {
    marginTop: SPACING.lg,
    flexDirection: "row", alignItems: "center",
    backgroundColor: VD.accentFaint,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1, borderColor: VD.cardBorder,
    padding: SPACING.md, gap: SPACING.md,
  },
  rewardIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: "rgba(251,191,36,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  rewardText:  { flex: 1 },
  rewardTitle: { fontSize: 14, fontWeight: "700", color: VD.white },
  rewardSub:   { fontSize: 12, color: VD.whiteLow, marginTop: 2 },

  // CTA
  ctaWrap: { marginTop: SPACING.lg },
  cta: {
    height: RESPONSIVE.buttonHeight,
    borderRadius: BORDER_RADIUS.large,
    flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  ctaText: { fontSize: 16, fontWeight: "800", color: "#070A16", letterSpacing: 0.2 },

  // States
  stateBox: {
    minHeight: 300,
    alignItems: "center", justifyContent: "center",
    paddingVertical: SPACING.xxl, gap: SPACING.sm,
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
});
