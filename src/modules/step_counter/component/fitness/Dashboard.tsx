import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import Svg, { Circle } from "react-native-svg";

import StatisticsGraph from "./StatisticsGraph";
import CoinHistoryAndPlan from "./CoinHistoryAndPlan";
import type { DailyData, StepStats } from "../../navigation/type";
import {
  BORDER_RADIUS,
  RESPONSIVE,
  SPACING,
} from "../../utils/theme";
import { fetchUserInfo } from "../../../common/auth/api/AuthAPI";
import {
  useDashboardQuery,
  useFitnessStreakQuery,
  useTodaySummaryQuery,
  useWeeklyProgressQuery,
} from "../../api/useFitnessQueries";
import { useStepTracker } from "../StepCode/useStepTracker";
import GoalCelebrationScreen from "./GoalCelebrationScreen";
import GoalReachedScreen from "./GoalReachedScreen";
import TodayGoalCompletedScreen from "./TodayGoalCompletedScreen";
import type { GoalSyncData } from "../../api/Stepsapi";
import WeeklyGraph from "./WeeklyGraph";

// ─── Constants ────────────────────────────────────────────────────────────────
const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Fresh active palette for the step dashboard.
const VD = {
  bg0: "#070A16",
  bg1: "#111735",
  bg2: "#201A3F",
  ink: "#F6F7FF",
  muted: "#A8AEC8",
  softText: "#8188A6",
  accent: "#8EA2FF",
  accentDark: "#EEF1FF",
  accentDim: "rgba(105,118,178,0.44)",
  accentFaint: "rgba(142,162,255,0.12)",
  white: "#FFFFFF",
  whiteMid: "#CDD2EA",
  whiteLow: "#979EBC",
  whiteGhost: "rgba(255,255,255,0.055)",
  cardBg: "rgba(255,255,255,0.075)",
  cardSoft: "rgba(255,255,255,0.10)",
  cardBorder: "rgba(174,188,255,0.16)",
  success: "#9AAEFF",
  warning: "#F5B86B",
  shadow: "#02030A",
};

// ─── Ring Progress ─────────────────────────────────────────────────────────────
interface RingProps {
  steps: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

const StepRing: React.FC<RingProps> = ({
  steps,
  goal,
  size = 200,
  strokeWidth = 16,
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const chargeBrightness = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(steps / goal, 1) : 0;
  const cx = size / 2;
  const cy = size / 2;

  const pct = Math.round(progress * 100);
  const animatedStrokeOffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  const highlightOpacity = chargeBrightness.interpolate({
    inputRange: [0, 1],
    outputRange: [0.38, 1],
  });

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 950,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, progress]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(chargeBrightness, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(chargeBrightness, {
          toValue: 0,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [chargeBrightness]);

  return (
    <View style={styles.ringWrap}>
      <View style={[styles.ringCanvas, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {/* Track */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={VD.whiteGhost}
            strokeWidth={strokeWidth}
          />
          {/* Dim full ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={VD.accentDim}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            rotation="-90"
            origin={`${cx},${cy}`}
          />
          {/* Progress */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={VD.accent}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={animatedStrokeOffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${cx},${cy}`}
          />
          {/* Breathing highlight over completed progress */}
          {progress > 0 && (
            <AnimatedCircle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={VD.accentDark}
              strokeWidth={strokeWidth + 6}
              strokeDasharray={`${circumference}`}
              strokeDashoffset={animatedStrokeOffset}
              strokeLinecap="round"
              opacity={highlightOpacity}
              rotation="-90"
              origin={`${cx},${cy}`}
            />
          )}
        </Svg>

        <View style={styles.ringPctOnRing}>
          <Text style={styles.ringPct}>{pct}%</Text>
        </View>

        {/* Center label */}
        <View style={styles.ringCenter}>
          <Text style={styles.ringSteps}>
            {steps.toLocaleString()}
          </Text>
          <Text style={styles.ringLabel}>steps</Text>
        </View>
      </View>

      <Text style={styles.ringGoalText}>
        Goal: {goal.toLocaleString()} steps
      </Text>
    </View>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: string; // MaterialCommunityIcons name
  color: string;
  value: string;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, color, value, label }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBubble, { backgroundColor: color + "28" }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Weekly Bar ───────────────────────────────────────────────────────────────
// ─── Streak Row ───────────────────────────────────────────────────────────────
interface StreakProps {
  streak: number;
}

const StreakRow: React.FC<StreakProps> = ({ streak }) => {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <View style={styles.streakCard}>
      <View>
        <Text style={styles.streakNum}>
          {streak}{" "}
          <Text style={styles.streakNumSub}>day streak</Text>
        </Text>
        <Text style={styles.streakSub}>Keep it going!</Text>
      </View>
      <View style={styles.streakDots}>
        {days.map((d, i) => {
          const done = i < streak;
          return (
            <View
              key={i}
              style={[styles.streakDot, done && styles.streakDotDone]}
            >
              <Text
                style={[
                  styles.streakDotText,
                  done && { color: VD.white },
                ]}
              >
                {done ? "✓" : d}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};


// Single tappable entry point into the achievements screen — kept as a plain
// promo card rather than a multi-shield preview (Streak/Trail/Sunrise groups
// were removed from the backend; with only "Walking" left, a 4-icon row
// would look sparse), opens AchievementCard directly on tap.
const AchievementsTeaser: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity style={styles.achTeaserCard} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.achTeaserIconWrap}>
      <MaterialCommunityIcons name="trophy-outline" size={26} color={VD.accentDark} />
    </View>
    <View style={styles.achTeaserCopy}>
      <Text style={styles.achTeaserTitle}>Achievements</Text>
      <Text style={styles.achTeaserSub}>See your unlocked milestones and rewards</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={22} color={VD.softText} />
  </TouchableOpacity>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();

  const contentMaxWidth = Math.min(
    width - RESPONSIVE.horizontalPadding * 2,
    560
  );

  const handleGoHome = useCallback(() => {
    navigation.getParent()?.navigate("Dashboard");
  }, [navigation]);

  // ── Queries ──────────────────────────────────────────────────────────────
  const userInfoQuery = useQuery({
    queryKey: ["user-info"],
    queryFn: fetchUserInfo,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
  });

  const {
    steps: liveSteps,
    loading: stepsLoading,
    celebrationData,
    dismissCelebration,
    refreshSteps,
  } = useStepTracker();
  // Goal completion shows two overlays in sequence: GoalReachedScreen (quick
  // "Target Reached!" recap) first, then Continue advances to the fuller
  // TodayGoalCompletedScreen (Plan Overview + full summary).
  const [goalReachedData, setGoalReachedData] = useState<GoalSyncData | null>(null);
  const [summaryData, setSummaryData] = useState<GoalSyncData | null>(null);

  const handleDismissCelebration = useCallback(() => {
    if (celebrationData?.planOverview && celebrationData?.overallSummary) {
      setGoalReachedData(celebrationData);
    }
    dismissCelebration();
  }, [celebrationData, dismissCelebration]);

  const handleContinueFromGoalReached = useCallback(() => {
    setSummaryData(goalReachedData);
    setGoalReachedData(null);
  }, [goalReachedData]);

  const handleDismissSummary = useCallback(() => setSummaryData(null), []);

  const dashboardQuery = useDashboardQuery();
  const summaryQuery = useTodaySummaryQuery();
  const weeklyQuery = useWeeklyProgressQuery();
  const streakQuery = useFitnessStreakQuery();

  // ── Derived data ──────────────────────────────────────────────────────────
  const firstName = useMemo(() => {
    const u = userInfoQuery.data;
    const name =
      u?.user?.first_name || u?.user?.name || u?.name || "Name";
    return String(name).split(/\s+/)[0] || "Name";
  }, [userInfoQuery.data]);

  const dashboardSteps = useMemo(
    () => ({
      todaySteps: dashboardQuery.data?.data?.today_steps || 0,
      goalSteps: dashboardQuery.data?.data?.goal_steps || 0,
    }),
    [dashboardQuery.data]
  );

  const summary = useMemo(() => {
    const d = summaryQuery.data?.data;
    const toNum = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
    return {
      steps: toNum(d?.steps),
      goal_steps: toNum(d?.goal_steps),
      distance_km: toNum(d?.distance_km),
      calories: toNum(d?.calories),
      active_minutes: toNum(d?.active_minutes),
    };
  }, [summaryQuery.data]);

  const weeklyData = useMemo<DailyData[]>(() => {
    const goalSteps = dashboardSteps.goalSteps || summary.goal_steps || 1;
    const items = weeklyQuery.data?.data || [];
    return items.map((item) => {
      const date = new Date(`${item.date}T00:00:00`);
      const progress = goalSteps > 0 ? item.steps / goalSteps : 0;
      return {
        day: dayFormatter.format(date),
        date: date.getDate(),
        progress,
        done: progress >= 1,
      };
    });
  }, [dashboardSteps.goalSteps, summary.goal_steps, weeklyQuery.data]);

  const stepStats: StepStats = useMemo(() => {
    const currentSteps = liveSteps || summary.steps || dashboardSteps.todaySteps;
    const goalSteps = summary.goal_steps || dashboardSteps.goalSteps || 1;
    const distanceKm = liveSteps ? Number((liveSteps * 0.0008).toFixed(2)) : summary.distance_km;
    const calories = liveSteps ? Math.round(liveSteps * 0.04) : summary.calories;
    const activeMinutes = liveSteps ? Math.max(1, Math.floor(liveSteps / 1000)) : summary.active_minutes;

    return {
      currentSteps,
      goalSteps,
      distance_km: distanceKm || 0,
      active_minutes: activeMinutes || 0,
      calories: calories || 0,
    };
  }, [dashboardSteps, liveSteps, summary]);

  const streakCount: number =
    (streakQuery.data?.data as any)?.current_streak ?? 0;

  const isLoading =
    (stepsLoading && !liveSteps && !summary.steps && !dashboardSteps.todaySteps) ||
    (dashboardQuery.isLoading && !dashboardSteps.todaySteps) ||
    (summaryQuery.isLoading && !summary.steps);

  const errorMsg =
    dashboardQuery.data?.message ||
    summaryQuery.data?.message ||
    weeklyQuery.data?.message ||
    streakQuery.data?.message ||
    (dashboardQuery.error ||
      summaryQuery.error ||
      weeklyQuery.error ||
      streakQuery.error
      ? "Failed to load dashboard"
      : "");

  const handleRetry = useCallback(() => {
    refreshSteps();
    dashboardQuery.refetch();
    summaryQuery.refetch();
    weeklyQuery.refetch();
    streakQuery.refetch();
  }, [dashboardQuery, refreshSteps, summaryQuery, weeklyQuery, streakQuery]);

  const dateLabel = useMemo(
    () =>
      today.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    [today]
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <LinearGradient
        colors={[VD.bg0, VD.bg1, VD.bg2]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: RESPONSIVE.horizontalPadding },
          ]}
        >
          <View style={[styles.content, { maxWidth: contentMaxWidth }]}>

            {/* ── Header ── */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Text style={styles.eyebrow}>Today's movement</Text>
                <Text style={styles.greetingTitle}>Hello {firstName}</Text>
                <Text style={styles.subText}>{dateLabel}</Text>
              </View>
              <TouchableOpacity
                style={styles.navHomeBtn}
                onPress={handleGoHome}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name="home-variant-outline"
                  size={22}
                  color="#070A16"
                />
              </TouchableOpacity>
            </View>

            {/* ── Loading / Error / Content ── */}
            {isLoading ? (
              <View style={styles.stateBox}>
                <ActivityIndicator color={VD.accent} size="large" />
                <Text style={styles.stateText}>
                  Loading your movement...
                </Text>
              </View>
            ) : errorMsg && !stepStats.currentSteps ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateText}>{errorMsg}</Text>
                <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Step Ring */}
                <StepRing
                  steps={stepStats.currentSteps}
                  goal={stepStats.goalSteps}
                  size={Math.min(contentMaxWidth * 0.6, 210)}
                  strokeWidth={18}
                />

                {/* Stat Grid */}
                <View style={styles.statGrid}>
                  <StatCard
                    icon="fire"
                    color="#F97316"
                    value={Math.round(Number(stepStats.calories) || 0).toString()}
                    label="kcal"
                  />
                  <StatCard
                    icon="map-marker-distance"
                    color={VD.accent}
                    value={(Number(stepStats.distance_km) || 0).toFixed(1)}
                    label="km"
                  />
                  <StatCard
                    icon="clock-fast"
                    color={VD.success}
                    value={Math.round(Number(stepStats.active_minutes) || 0).toString()}
                    label="min"
                  />
                </View>

                {/* Weekly Bars */}
                {weeklyData.length > 0 && (
                  <WeeklyGraph
                    weeklyData={weeklyData}
                    onViewMore={() => navigation.navigate("PlanProcess")}
                  />
                )}

                {/* Streak */}
                <StreakRow streak={streakCount} />

                {/* Achievements entry point */}
                <AchievementsTeaser onPress={() => navigation.navigate("AchievementCard")} />

                {/* Divider label */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerLabel}>Statistics</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Statistics Graph (your existing component) */}
                <View style={styles.glassCard}>
                  <StatisticsGraph />
                </View>

                {/* Divider label */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerLabel}>Coins & Plan</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Coin History (your existing component) */}
                <View style={styles.glassCard}>
                  <CoinHistoryAndPlan />
                </View>
              </>
            )}

            <View style={{ height: SPACING.xxl }} />
          </View>
        </ScrollView>
      </LinearGradient>

      {/* ── Celebration overlay ── */}
      {celebrationData && (
        <GoalCelebrationScreen
          response={celebrationData}
          onDismiss={handleDismissCelebration}
        />
      )}

      {goalReachedData?.overallSummary && (
        <View style={styles.summaryOverlay}>
          <GoalReachedScreen
            overallSummary={goalReachedData.overallSummary}
            currentStreak={goalReachedData.currentStreak ?? 0}
            reward={goalReachedData.reward}
            onContinue={handleContinueFromGoalReached}
            onBack={handleContinueFromGoalReached}
          />
        </View>
      )}

      {summaryData?.planOverview && summaryData?.overallSummary && (
        <View style={styles.summaryOverlay}>
          <TodayGoalCompletedScreen
            planOverview={summaryData.planOverview}
            overallSummary={summaryData.overallSummary}
            currentStreak={summaryData.currentStreak ?? 0}
            reward={summaryData.reward}
            onContinue={handleDismissSummary}
            onBack={handleDismissSummary}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default React.memo(Dashboard);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: VD.bg0,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? SPACING.xl + 8 : SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  content: {
    width: "100%",
  },

  // ── Header ──
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
    color: VD.accentDark,
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: VD.ink,
    lineHeight: 32,
  },
  subText: {
    fontSize: 13,
    color: VD.muted,
    marginTop: 2,
    fontWeight: "500",
  },
  navHomeBtn: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: VD.white,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: VD.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  // ── Ring ──
  ringWrap: {
    alignItems: "center",
    backgroundColor: VD.cardBg,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.lg,
    shadowColor: VD.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  ringCanvas: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringPctOnRing: {
    position: "absolute",
    top: 2,
    alignSelf: "center",
    backgroundColor: "#111735",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: VD.accentDark,
    paddingHorizontal: 13,
    paddingVertical: 5,
    shadowColor: VD.accent,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ringCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  ringSteps: {
    fontSize: 36,
    fontWeight: "900",
    color: VD.ink,
    letterSpacing: 0,
    lineHeight: 42,
  },
  ringLabel: {
    fontSize: 11,
    color: VD.softText,
    textTransform: "uppercase",
    letterSpacing: 0,
    fontWeight: "600",
    marginTop: 2,
  },
  ringPct: {
    fontSize: 14,
    color: VD.accentDark,
    fontWeight: "900",
  },
  ringGoalText: {
    fontSize: 13,
    color: VD.muted,
    marginTop: 10,
    fontWeight: "500",
  },

  // ── Stat Grid ──
  statGrid: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: VD.cardBg,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    paddingVertical: SPACING.md,
    alignItems: "center",
    shadowColor: VD.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  statIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: VD.ink,
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 11,
    color: VD.muted,
    fontWeight: "500",
    marginTop: 2,
  },

  // ── Weekly bars ──
  weekCard: {
    backgroundColor: VD.cardBg,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: VD.muted,
    textTransform: "uppercase",
    letterSpacing: 0,
    marginBottom: SPACING.sm,
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 64,
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    height: "100%",
  },
  barBg: {
    flex: 1,
    width: "100%",
    backgroundColor: VD.whiteGhost,
    borderRadius: 4,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 4,
  },
  barDay: {
    fontSize: 9,
    color: VD.muted,
    fontWeight: "500",
  },

  // ── Streak ──
  streakCard: {
    backgroundColor: VD.cardBg,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: VD.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  streakNum: {
    fontSize: 24,
    fontWeight: "900",
    color: VD.ink,
  },
  streakNumSub: {
    fontSize: 14,
    fontWeight: "500",
    color: VD.muted,
  },
  streakSub: {
    fontSize: 12,
    color: VD.muted,
    marginTop: 2,
    fontWeight: "500",
  },
  streakDots: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.md,
  },
  streakDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: VD.cardSoft,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  streakDotDone: {
    backgroundColor: VD.accent,
    borderColor: VD.accent,
  },
  streakDotText: {
    fontSize: 10,
    color: VD.muted,
    fontWeight: "700",
  },

  // ── Achievements teaser ──
  achTeaserCard: {
    backgroundColor: VD.cardBg,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    padding: SPACING.md,
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    shadowColor: VD.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  achTeaserIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: VD.accentFaint,
    alignItems: "center", justifyContent: "center",
  },
  achTeaserCopy: { flex: 1 },
  achTeaserTitle: { fontSize: 15, fontWeight: "700", color: VD.ink },
  achTeaserSub: { fontSize: 12, color: VD.muted, marginTop: 2 },

  // ── Divider ──
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: VD.cardBorder,
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: VD.muted,
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  // ── Glass card wrapper for existing components ──
  glassCard: {
    backgroundColor: VD.cardBg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    overflow: "hidden",
    marginBottom: SPACING.lg,
    shadowColor: VD.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  // ── State boxes ──
  stateBox: {
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: VD.cardBg,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  stateText: {
    fontSize: 14,
    color: VD.muted,
    textAlign: "center",
    marginTop: SPACING.sm,
    fontWeight: "500",
  },
  retryBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: VD.accentFaint,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "700",
    color: VD.accent,
  },

  // ── Summary overlay ──
  summaryOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});
