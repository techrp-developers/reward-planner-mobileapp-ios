import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";

import StatisticsGraph from "./StatisticsGraph";
import CoinHistoryAndPlan from "./CoinHistoryAndPlan";
import type { DailyData } from "../../navigation/type";
import { fetchUserInfo } from "../../../common/auth/api/AuthAPI";
import {
  useDashboardQuery,
  useFitnessStreakQuery,
  useTodaySummaryQuery,
  useWeeklyProgressQuery,
} from "../../api/useFitnessQueries";
import { useStepTracker } from "../StepCode/useStepTracker";
import GoalCelebrationScreen from "./GoalCelebrationScreen";
import { useHideFitnessTabBar } from "./FitnessTabBar";
import GoalReachedScreen from "./GoalReachedScreen";
import TodayGoalCompletedScreen from "./TodayGoalCompletedScreen";
import type { GoalSyncData } from "../../api/Stepsapi";
import WeeklyGraph from "./WeeklyGraph";
import { genderFromUserInfo, type UserGender } from "../../utils/userGender";
import { useStepStyles } from "../../utils/useStepTheme";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";

// ─── Theme ────────────────────────────────────────────────────────────────────
// The hero is a daylight illustration panel, so it keeps its sky colours in
// both modes; everything below it follows the app light/dark setting.
const H = {
  ink: "#10152D",
  muted: "#777FA5",
  blue: "#426BFF",
  purple: "#773CFF",
  cyan: "#36CFFF",
  track: "#E3EBFA",
  white: "#FFFFFF",
  sky: ["#CFE5FF", "#E4F1FF", "#F5F9FF"],
  shadow: "#4664A5",
};
const GRADIENT = [H.cyan, H.blue, H.purple];

const C_LIGHT = {
  bg: "#F5F9FF",
  card: "#FFFFFF",
  ink: "#10152D",
  muted: "#777FA5",
  blue: "#426BFF",
  purple: "#773CFF",
  border: "#E9EEFA",
  shadow: "#4664A5",
  chip: "#EEF3FF",
  calorieFg: "#FF743A",
  calorieBg: "#FFEDE3",
  distanceFg: "#773CFF",
  distanceBg: "#EEE9FF",
  timeFg: "#F5A524",
  timeBg: "#FFF3D6",
  streakFg: "#FF3775",
  streakBg: "#FFE6EE",
  dot: "#F1F4FB",
  dotToday: "#EEE9FF",
  achBg: "#F1ECFF",
  onAccent: "#FFFFFF",
};

type Palette = typeof C_LIGHT;

const C_DARK: Palette = {
  bg: "#0B1020",
  card: "#161C33",
  ink: "#F2F4FF",
  muted: "#9AA3C7",
  blue: "#7B93FF",
  purple: "#A585FF",
  border: "rgba(174,188,255,0.14)",
  shadow: "#02030A",
  chip: "rgba(123,147,255,0.16)",
  calorieFg: "#FF8A57",
  calorieBg: "rgba(255,116,58,0.16)",
  distanceFg: "#A585FF",
  distanceBg: "rgba(165,133,255,0.16)",
  timeFg: "#FFC24D",
  timeBg: "rgba(245,165,36,0.16)",
  streakFg: "#FF5C8E",
  streakBg: "rgba(255,55,117,0.16)",
  dot: "#1F2744",
  dotToday: "rgba(165,133,255,0.20)",
  achBg: "rgba(165,133,255,0.16)",
  onAccent: "#FFFFFF",
};

const shadow = (color: string) => ({
  shadowColor: color,
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 5 },
  elevation: 3,
} as const);

const useDashStyles = () => useStepStyles(C_LIGHT, C_DARK, createStyles);

// Static artwork. "default" (other / unknown gender) uses the male runner,
// matching the welcome banner; there is no neutral illustration yet.
const HERO_ART: Record<UserGender, { source: number; aspect: number }> = {
  male: { source: require("../../assets/StepCount/dashboard_runner_male.png"), aspect: 369 / 508 },
  female: { source: require("../../assets/StepCount/dashboard_runner_female.png"), aspect: 510 / 649 },
  default: { source: require("../../assets/StepCount/dashboard_runner_male.png"), aspect: 369 / 508 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const localDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parseLocalDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

// Same estimates the app sends in the sync payload (StepTrackerContext
// buildPayload), so they match what the server stores after the next sync.
const estimateFromSteps = (steps: number) => ({
  distance_km: Number((steps * 0.0008).toFixed(2)),
  calories: Math.round(steps * 0.04),
  active_minutes: steps > 0 ? Math.max(1, Math.floor(steps / 1000)) : 0,
});

// ─── Step ring ────────────────────────────────────────────────────────────────
interface RingProps {
  steps: number;
  goal: number;
  size: number;
  numberFmt: Intl.NumberFormat;
}

const StepRing = React.memo(({ steps, goal, size, numberFmt }: RingProps) => {
  const { t: tx } = useTranslation();
  const { styles } = useDashStyles();
  const stroke = Math.round(size * 0.085);
  const outer = size + 28;
  const c = outer / 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const hasGoal = goal > 0;
  const percent = hasGoal ? Math.round((steps / goal) * 100) : 0;
  // Visible fill is clamped; the step count itself is never capped.
  const fill = hasGoal ? Math.min(steps / goal, 1) : 0;
  const decoR = size / 2 + 11;
  const decoDots = [200, 160, 20, -20].map(deg => {
    const rad = (deg * Math.PI) / 180;
    return { x: c + decoR * Math.cos(rad), y: c - decoR * Math.sin(rad) };
  });

  return (
    <View
      style={{ width: outer, height: outer }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${numberFmt.format(steps)} ${tx("stepCounter:dashboard.steps")}`}
      accessibilityValue={hasGoal ? { text: tx("stepCounter:dashboard.goalProgress", { percent }) } : undefined}
    >
      <Svg width={outer} height={outer}>
        <Defs>
          <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={H.cyan} />
            <Stop offset="0.45" stopColor={H.blue} />
            <Stop offset="1" stopColor={H.purple} />
          </SvgGradient>
        </Defs>
        {/* Decorative outer orbit */}
        <Circle cx={c} cy={c} r={decoR} fill="none" stroke="rgba(66,107,255,0.22)" strokeWidth={1} />
        {decoDots.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={i % 2 ? H.purple : H.blue} />
        ))}
        <Circle cx={c} cy={c} r={r} fill="none" stroke={H.track} strokeWidth={stroke} />
        {fill > 0 && (
          <Circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - fill)}
            transform={`rotate(-90 ${c} ${c})`}
          />
        )}
      </Svg>

      <View style={[styles.ringInner, { width: size - stroke * 2 - 8, height: size - stroke * 2 - 8, top: 14 + stroke + 4, left: 14 + stroke + 4 }]}>
        <MaterialCommunityIcons name="shoe-print" size={Math.round(size * 0.13)} color={H.blue} />
        <Text
          style={[styles.ringSteps, { fontSize: Math.round(size * 0.21) }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.2}
        >
          {numberFmt.format(steps)}
        </Text>
        <Text style={styles.ringLabel} maxFontSizeMultiplier={1.3}>
          {tx("stepCounter:dashboard.steps")}
        </Text>
        <Text style={styles.ringGoal} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.3}>
          {hasGoal ? (
            <>
              <Text style={styles.ringGoalStrong}>{numberFmt.format(steps)}</Text>
              {" "}
              {tx("stepCounter:dashboard.goalSuffix", { goal: numberFmt.format(goal) })}
            </>
          ) : (
            tx("stepCounter:dashboard.noGoal")
          )}
        </Text>
      </View>

      {hasGoal && (
        <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ringPill}>
          <Text style={styles.ringPillText} maxFontSizeMultiplier={1.2}>{percent}%</Text>
        </LinearGradient>
      )}
    </View>
  );
});

// ─── Hero art ─────────────────────────────────────────────────────────────────
const HeroArt = React.memo(({ gender, width }: { gender: UserGender; width: number }) => {
  const art = HERO_ART[gender];
  const { styles } = useDashStyles();
  return (
    <Image
      source={art.source}
      style={[styles.heroArt, { width, height: width / art.aspect }]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
});

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = React.memo(
  ({ icon, color, bg, value, unit, label }: {
    icon: string; color: string; bg: string; value: string; unit: string; label: string;
  }) => {
    const { styles } = useDashStyles();
    return (
    <View style={styles.statCard} accessible accessibilityLabel={`${label}: ${value} ${unit}`}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.statText}>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.3}>
          {value}
        </Text>
        <Text style={styles.statUnit} numberOfLines={1} maxFontSizeMultiplier={1.3}>{unit}</Text>
      </View>
    </View>
    );
  },
);

// ─── Streak card ──────────────────────────────────────────────────────────────
// Weekday circles come from the dated weekly-progress data (steps ≥ goal for
// that date — the same rule the backend calendar uses), never from the
// streak count. Without a goal they stay neutral.
const StreakCard = React.memo(
  ({ streak, days, stacked }: { streak: number; days: DailyData[]; stacked: boolean }) => {
    const { t: tx, i18n: i18nInstance } = useTranslation();
    const { palette: C, styles } = useDashStyles();
    const lang = i18nInstance.language;
    const narrow = useMemo(() => new Intl.DateTimeFormat(lang, { weekday: "narrow" }), [lang]);
    return (
      <View style={[styles.card, styles.streakCard, stacked && styles.streakStacked]}>
        <View style={styles.streakLeft}>
          <View style={styles.streakIcon}>
            <MaterialCommunityIcons name="fire" size={28} color={C.streakFg} />
          </View>
          <View style={styles.flexShrink}>
            <Text style={styles.streakValue} maxFontSizeMultiplier={1.3}>
              {streak}{" "}
              <Text style={styles.streakUnit}>{tx("stepCounter:dashboard.dayStreak")}</Text>
            </Text>
            <Text style={styles.streakMsg}>
              {streak > 0 ? tx("stepCounter:dashboard.keepItGoing") : tx("stepCounter:dashboard.startStreak")}
            </Text>
          </View>
        </View>
        {days.length > 0 && (
          <View style={styles.streakDots}>
            {days.map(d => {
              const label = narrow.format(parseLocalDate(d.key ?? ""));
              return (
                <View
                  key={d.key}
                  style={[styles.streakDot, d.done && styles.streakDotDone, !d.done && d.isToday && styles.streakDotToday]}
                  accessible
                  accessibilityLabel={`${d.day} ${d.date}, ${tx(d.done ? "stepCounter:dashboard.goalMet" : "stepCounter:dashboard.goalNotMet")}`}
                >
                  {d.done ? (
                    <MaterialCommunityIcons name="check" size={14} color={C.onAccent} />
                  ) : (
                    <Text style={[styles.streakDotText, d.isToday && styles.streakDotTextToday]}>{label}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  },
);

const AchievementsTeaser: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { palette: C, styles } = useDashStyles();
  return (
  <TouchableOpacity style={[styles.card, styles.achCard]} onPress={onPress} activeOpacity={0.85} accessibilityRole="button">
    <View style={styles.achIcon}>
      <MaterialCommunityIcons name="trophy-outline" size={26} color={C.purple} />
    </View>
    <View style={styles.flex}>
      <Text style={styles.achTitle}>{i18n.t("stepCounter:dashboard.achievements")}</Text>
      <Text style={styles.achSub}>{i18n.t("stepCounter:dashboard.seeYourUnlockedMilestonesAnd")}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={22} color={C.muted} />
  </TouchableOpacity>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { t: tx } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const lang = i18n.language;
  const { palette: C, styles, isDark } = useDashStyles();

  // Kept in state and refreshed on focus so the header/week roll over at midnight.
  const [today, setToday] = useState(() => new Date());

  const pad = width < 360 ? 16 : 20;
  const contentWidth = Math.min(width - pad * 2, 560);
  const ringSize = Math.round(Math.max(160, Math.min(contentWidth * 0.5, 220)));
  const heroArtWidth = Math.min(width * 0.56, 300);

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
    stepDataState,
    celebrationData,
    dismissCelebration,
    refreshSteps,
  } = useStepTracker();

  useFocusEffect(useCallback(() => {
    setToday(prev => (localDateKey(prev) === localDateKey(new Date()) ? prev : new Date()));
    void refreshSteps();
    const interval = setInterval(() => { void refreshSteps(); }, 60_000);
    return () => clearInterval(interval);
  }, [refreshSteps]));


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

  // The celebrations are full-screen; keep the RP Move tab bar out of the way.
  useHideFitnessTabBar(!!celebrationData || !!goalReachedData || !!summaryData);

  const dashboardQuery = useDashboardQuery();
  const summaryQuery = useTodaySummaryQuery();
  const weeklyQuery = useWeeklyProgressQuery();
  const streakQuery = useFitnessStreakQuery();

  // ── Derived data ──────────────────────────────────────────────────────────
  const numberFmt = useMemo(() => new Intl.NumberFormat(lang), [lang]);
  const decimalFmt = useMemo(
    () => new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    [lang],
  );
  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat(lang, { weekday: "long", month: "short", day: "numeric" }).format(today),
    [lang, today],
  );

  const firstName = useMemo(() => {
    const u = userInfoQuery.data;
    const name = u?.user?.first_name || u?.user?.name || u?.name;
    return name ? String(name).trim().split(/\s+/)[0] : null;
  }, [userInfoQuery.data]);

  // Render the hero only once user-info has settled so the wrong runner never flashes.
  const heroGender = userInfoQuery.isPending ? null : genderFromUserInfo(userInfoQuery.data);

  const server = summaryQuery.data?.data ?? null;
  const dashboardData = dashboardQuery.data?.data ?? null;
  // A successful health read is authoritative even at 0 steps — never let a
  // valid 0 fall back to a stale server value.
  const liveReadOk = stepDataState === "ok" || stepDataState === "no_steps_today";

  const currentSteps = liveReadOk ? liveSteps : (server?.steps ?? dashboardData?.today_steps ?? 0);
  const goalSteps = server?.goal_steps || dashboardData?.goal_steps || 0;

  const metrics = useMemo(() => {
    // Prefer the server's stored metrics; only when live steps are ahead of
    // the last sync use the same estimate the next sync will store.
    if (server && server.steps >= currentSteps) {
      return { calories: server.calories, distance_km: server.distance_km, active_minutes: server.active_minutes };
    }
    return estimateFromSteps(currentSteps);
  }, [server, currentSteps]);

  const weekDays = useMemo<DailyData[]>(() => {
    const items = weeklyQuery.data?.data ?? [];
    const todayKey = localDateKey(today);
    const fmt = new Intl.DateTimeFormat(lang, { weekday: "short" });
    return items
      .filter(item => /^\d{4}-\d{2}-\d{2}$/.test(item.date))
      .map(item => {
        const date = parseLocalDate(item.date);
        const isToday = item.date === todayKey;
        // Today's bar uses the same live count as the ring.
        const steps = isToday ? currentSteps : item.steps;
        const ratio = goalSteps > 0 ? steps / goalSteps : 0;
        return {
          key: item.date,
          day: fmt.format(date),
          date: date.getDate(),
          progress: ratio,
          percent: Math.round(ratio * 100),
          done: goalSteps > 0 && steps >= goalSteps,
          isToday,
        };
      });
  }, [weeklyQuery.data, today, lang, currentSteps, goalSteps]);

  const streakCount = Number(streakQuery.data?.data?.current_streak) || 0;

  const hasAnyData = liveReadOk || Boolean(server) || Boolean(dashboardData);
  const isLoading = !hasAnyData && (summaryQuery.isPending || dashboardQuery.isPending);

  const errorMsg =
    dashboardQuery.data?.message ||
    summaryQuery.data?.message ||
    (dashboardQuery.error || summaryQuery.error ? i18n.t("stepCounter:r2.failedToLoadDashboard") : "");

  const handleRetry = useCallback(() => {
    refreshSteps();
    dashboardQuery.refetch();
    summaryQuery.refetch();
    weeklyQuery.refetch();
    streakQuery.refetch();
  }, [dashboardQuery, refreshSteps, summaryQuery, weeklyQuery, streakQuery]);

  const handleViewMore = useCallback(() => navigation.navigate("PlanProcess"), [navigation]);
  const handleAchievements = useCallback(() => navigation.navigate("AchievementCard"), [navigation]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* The hero is always a light sky panel, so status-bar icons stay dark over it. */}
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* ── Hero ── */}
        <View style={[styles.hero, isDark && styles.heroDark, { paddingTop: insets.top + 12, paddingHorizontal: pad, minHeight: insets.top + 12 + heroArtWidth / HERO_ART.male.aspect }]}>
          <LinearGradient colors={H.sky} style={StyleSheet.absoluteFill} />
          {heroGender && <HeroArt gender={heroGender} width={heroArtWidth} />}

          <View style={styles.heroHeader}>
            <View style={styles.flexShrink}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tx("stepCounter:dashboard.rpMove")}</Text>
              </View>
              <Text style={styles.hello} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.25}>
                {firstName ? tx("stepCounter:dashboard.hello", { name: firstName }) : tx("stepCounter:dashboard.helloNoName")}
              </Text>
              <Text style={styles.date} maxFontSizeMultiplier={1.3}>{dateLabel}</Text>
            </View>
            <TouchableOpacity
              style={styles.homeBtn}
              onPress={handleGoHome}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={tx("stepCounter:dashboard.home")}
            >
              <MaterialCommunityIcons name="home-variant-outline" size={22} color={H.ink} />
            </TouchableOpacity>
          </View>

          {!isLoading && !(errorMsg && !hasAnyData) && (
            <View style={styles.ringWrap}>
              <StepRing steps={currentSteps} goal={goalSteps} size={ringSize} numberFmt={numberFmt} />
            </View>
          )}
        </View>

        <View style={[styles.body, { paddingHorizontal: pad }]}>
          <View style={[styles.content, { maxWidth: contentWidth }]}>
            {isLoading ? (
              <View style={[styles.card, styles.stateBox]}>
                <ActivityIndicator color={C.blue} size="large" />
                <Text style={styles.stateText}>{tx("stepCounter:dashboard.loadingYourMovement")}</Text>
              </View>
            ) : errorMsg && !hasAnyData ? (
              <View style={[styles.card, styles.stateBox]}>
                <Text style={styles.stateText}>{errorMsg}</Text>
                <TouchableOpacity onPress={handleRetry} style={styles.retryBtn} accessibilityRole="button">
                  <Text style={styles.retryText}>{tx("stepCounter:dashboard.retry")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.statRow}>
                  <StatCard
                    icon="fire"
                    color={C.calorieFg}
                    bg={C.calorieBg}
                    value={numberFmt.format(Math.round(metrics.calories))}
                    unit={tx("stepCounter:dashboard.kcal")}
                    label={tx("stepCounter:dashboard.calories")}
                  />
                  <StatCard
                    icon="map-marker"
                    color={C.distanceFg}
                    bg={C.distanceBg}
                    value={decimalFmt.format(metrics.distance_km)}
                    unit={tx("stepCounter:dashboard.km")}
                    label={tx("stepCounter:dashboard.distance")}
                  />
                  <StatCard
                    icon="clock-outline"
                    color={C.timeFg}
                    bg={C.timeBg}
                    value={numberFmt.format(Math.round(metrics.active_minutes))}
                    unit={tx("stepCounter:dashboard.min")}
                    label={tx("stepCounter:dashboard.activeTime")}
                  />
                </View>

                {weekDays.length > 0 && <WeeklyGraph weeklyData={weekDays} onViewMore={handleViewMore} />}

                <StreakCard streak={streakCount} days={weekDays} stacked={contentWidth < 400} />

                <AchievementsTeaser onPress={handleAchievements} />

                <View style={styles.card}>
                  <StatisticsGraph />
                </View>

                <View style={styles.card}>
                  <CoinHistoryAndPlan />
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

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
    </View>
  );
};

export default React.memo(Dashboard);

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (C: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },

  // ── Hero ──
  hero: { overflow: "hidden", paddingBottom: 40 },
  // Dark mode: the light hero reads as a rounded panel on the dark page.
  heroDark: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 48, marginBottom: 8 },
  heroArt: { position: "absolute", right: 0, bottom: 0 },
  heroHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  badgeText: { fontSize: 12, fontWeight: "800", color: H.blue, letterSpacing: 0.6, textTransform: "uppercase" },
  hello: { fontSize: 30, lineHeight: 36, fontWeight: "800", color: H.ink },
  date: { fontSize: 15, fontWeight: "600", color: H.muted, marginTop: 2 },
  homeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    ...shadow(H.shadow),
  },

  // ── Ring ──
  ringWrap: { marginTop: 14, marginLeft: -14, alignSelf: "flex-start" },
  ringInner: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: H.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    ...shadow(H.shadow),
  },
  ringSteps: { fontWeight: "900", color: H.ink, marginTop: 2 },
  ringLabel: { fontSize: 13, fontWeight: "800", color: H.blue, letterSpacing: 0.8, textTransform: "uppercase" },
  ringGoal: { fontSize: 12, color: H.muted, marginTop: 4 },
  ringGoalStrong: { color: H.purple, fontWeight: "800" },
  ringPill: {
    position: "absolute",
    top: 2,
    alignSelf: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 5,
    minWidth: 64,
    alignItems: "center",
  },
  ringPillText: { fontSize: 16, fontWeight: "800", color: H.white },

  // ── Body ──
  body: { marginTop: -22, alignItems: "center" },
  content: { width: "100%" },
  card: {
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
    overflow: "hidden",
    ...shadow(C.shadow),
  },

  statRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
    paddingHorizontal: 10,
    ...shadow(C.shadow),
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statText: { flex: 1, minWidth: 0 },
  statValue: { fontSize: 20, fontWeight: "800", color: C.ink },
  statUnit: { fontSize: 13, color: C.muted, fontWeight: "600" },

  // ── Streak ──
  streakCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, gap: 12 },
  streakStacked: { flexDirection: "column", alignItems: "stretch" },
  streakLeft: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  streakIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.streakBg, alignItems: "center", justifyContent: "center" },
  streakValue: { fontSize: 30, fontWeight: "900", color: C.ink },
  streakUnit: { fontSize: 17, fontWeight: "600", color: C.muted },
  streakMsg: { fontSize: 13, color: C.muted, marginTop: 2 },
  streakDots: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  streakDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.dot,
    alignItems: "center",
    justifyContent: "center",
  },
  streakDotDone: { backgroundColor: C.purple },
  streakDotToday: { backgroundColor: C.dotToday, borderWidth: 1.5, borderColor: C.purple },
  streakDotText: { fontSize: 12, fontWeight: "700", color: C.muted },
  streakDotTextToday: { color: C.purple },

  // ── Achievements ──
  achCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  achIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.achBg, alignItems: "center", justifyContent: "center" },
  achTitle: { fontSize: 16, fontWeight: "800", color: C.ink },
  achSub: { fontSize: 13, color: C.muted, marginTop: 2 },

  // ── States ──
  stateBox: { minHeight: 200, alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { fontSize: 14, color: C.muted, textAlign: "center", marginTop: 10, fontWeight: "500" },
  retryBtn: { marginTop: 14, minHeight: 44, justifyContent: "center", paddingHorizontal: 20, borderRadius: 14, backgroundColor: C.chip },
  retryText: { fontSize: 14, fontWeight: "700", color: C.blue },

  summaryOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
});
