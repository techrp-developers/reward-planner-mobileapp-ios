import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Platform,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { rs, fs } from "../../../utils/responsive";
import { useStepTracker, StepDataState } from "../../step_counter/component/StepCode/useStepTracker";
import { useAppTheme } from "../../../theme/ThemeContext";
import stepcounter from "../../../assets/homepage/step_Counter.jpeg";
// ── Constants ──────────────────────────────────────────────────────────────
const DEFAULT_GOAL_STEPS = 5000;

type HomeChartProps = {
  goalSteps?: number;
};

// ── StepStatusBanner ───────────────────────────────────────────────────────
type BannerProps = {
  state: StepDataState;
  onConnectSource: () => void;
  onRefresh: () => void;
  onGrantPermission: () => void;
};

function StepStatusBanner({ state }: BannerProps) {
  if (state === 'ok' || state === 'loading') return null;

  // if (state === 'no_permission') {
  //   return (
  //     <TouchableOpacity style={[bannerStyles.banner, bannerStyles.red]} onPress={onGrantPermission} activeOpacity={0.8}>
  //       <Text style={bannerStyles.icon}>🔒</Text>
  //       <Text style={[bannerStyles.text, bannerStyles.textRed]}>
  //         Steps permission not granted — tap to fix
  //       </Text>
  //     </TouchableOpacity>
  //   );
  // }

  // if (state === 'no_source') {
  //   return (
  //     <TouchableOpacity style={[bannerStyles.banner, bannerStyles.amber]} onPress={onConnectSource} activeOpacity={0.8}>
  //       <Text style={bannerStyles.icon}>🔗</Text>
  //       <Text style={[bannerStyles.text, bannerStyles.textAmber]}>
  //         No fitness app connected — tap to open Health Connect
  //       </Text>
  //     </TouchableOpacity>
  //   );
  // }

  // no_steps_today
  // return (
  //   <TouchableOpacity style={[bannerStyles.banner, bannerStyles.grey]} onPress={onRefresh} activeOpacity={0.8}>
  //     <Text style={bannerStyles.icon}>🔄</Text>
  //     <Text style={[bannerStyles.text, bannerStyles.textGrey]}>
  //       No steps recorded today — make sure your fitness app is syncing
  //     </Text>
  //   </TouchableOpacity>
  // );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function Home_Chart({ goalSteps }: HomeChartProps) {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const { isDark } = useAppTheme();

  const {
    totalSteps,
    stepDataState,
    openHealthConnect,
    refreshSteps,
    requestStepsPermission,
  } = useStepTracker();

  const targetSteps = useMemo(() => {
    const value = Number(goalSteps);
    return Number.isFinite(value) && value > 0 ? Math.round(value) : DEFAULT_GOAL_STEPS;
  }, [goalSteps]);

  const layout = useMemo(() => {
    const horizontalPadding = rs(width >= 768 ? 24 : 16);
    const maxContentWidth = rs(560);
    const contentWidth = Math.min(width - horizontalPadding * 2, maxContentWidth);
    return { containerPadding: horizontalPadding, contentWidth };
  }, [width]);

  const progressPercent = useMemo(
    () => Math.min((totalSteps / targetSteps) * 100, 100),
    [totalSteps, targetSteps],
  );

  const goToRewards = useCallback(() => {
    const parent = navigation.getParent?.();
    parent?.navigate("RewardStack", { moduleName: "Step Counter" });
  }, [navigation]);

  const goalPercent = Math.round(progressPercent);
  const calories = Math.max(0, Math.round(totalSteps * 0.049));
  const distanceKm = Math.max(0, totalSteps * 0.00074);
  const activeMinutes = Math.max(0, Math.round(totalSteps / 115));
  const progressBarWidth = `${progressPercent}%` as `${number}%`;
  const titleColor = isDark ? "#F8FAFC" : "#0F172A";
  const mutedColor = isDark ? "#CBD5E1" : "#64748B";
  const statBg = isDark ? "rgba(15,23,42,0.74)" : "rgba(255,255,255,0.82)";

  return (
    <View style={[styles.container, { paddingHorizontal: layout.containerPadding }]}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={goToRewards}
        style={[styles.heroShadow, { maxWidth: layout.contentWidth }]}
      >
        <ImageBackground
          source={stepcounter}
          resizeMode="cover"
          style={styles.heroCard}
          imageStyle={styles.heroImage}
        >
          <LinearGradient
            colors={isDark ? ["rgba(15,23,42,0.82)", "rgba(15,23,42,0.12)", "rgba(15,23,42,0.55)"] : ["rgba(255,255,255,0.92)", "rgba(255,255,255,0.10)", "rgba(255,255,255,0.35)"]}
            locations={[0, 0.56, 1]}
            start={{ x: 0, y: 0.45 }}
            end={{ x: 1, y: 0.45 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* <View style={styles.heroTopRow}>
            <View style={styles.titleRow}>
              <View style={styles.walkIcon}>
                <MaterialCommunityIcons name="walk" size={rs(16)} color="#FFFFFF" />
              </View>
              <Text style={[styles.heroLabel, { color: titleColor }]}>Today's Steps</Text>
            </View>
            <View style={styles.keepPill}>
              <Text style={styles.keepText}>Keep it up!</Text>
              <MaterialCommunityIcons name="fire" size={rs(11)} color="#F97316" />
            </View>
          </View> */}

          <View style={styles.heroBody}>
            <View style={styles.stepsColumn}>
              <View style={styles.stepsLine}>
                <Text style={[styles.stepsValue, { color: titleColor }]}>
                  {totalSteps.toLocaleString("en-IN")}
                </Text>
                <Text style={[styles.stepsWord, { color: mutedColor }]}>steps</Text>
              </View>
              <Text style={[styles.goalText, { color: mutedColor }]}>
                of <Text style={styles.goalNumber}>{targetSteps.toLocaleString("en-IN")}</Text> steps goal
              </Text>
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: progressBarWidth }]} />
                </View>
                <Text style={styles.progressText}>{goalPercent}%</Text>
              </View>
            </View>

            <View style={styles.runnerPanel} pointerEvents="none" />
          </View>

          <View style={[styles.statsBar, { backgroundColor: statBg }]}>
            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: "#DCFCE7" }]}>
                <MaterialCommunityIcons name="fire" size={rs(14)} color="#22C55E" />
              </View>
              <View>
                <Text style={[styles.metricValue, { color: titleColor }]}>{calories}</Text>
                <Text style={[styles.metricLabel, { color: mutedColor }]}>kcal</Text>
              </View>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: "#F3E8FF" }]}>
                <MaterialCommunityIcons name="map-marker" size={rs(15)} color="#8B5CF6" />
              </View>
              <View>
                <Text style={[styles.metricValue, { color: titleColor }]}>{distanceKm.toFixed(1)}</Text>
                <Text style={[styles.metricLabel, { color: mutedColor }]}>km</Text>
              </View>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: "#FEF3C7" }]}>
                <MaterialCommunityIcons name="star-circle" size={rs(15)} color="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.metricValue, { color: titleColor }]}>{activeMinutes}</Text>
                <Text style={[styles.metricLabel, { color: mutedColor }]}>Active mins</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
      <StepStatusBanner
        state={stepDataState}
        onConnectSource={openHealthConnect}
        onRefresh={refreshSteps}
        onGrantPermission={requestStepsPermission}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: rs(10),
    paddingBottom: rs(8),
    backgroundColor: "transparent",
  },
  heroShadow: {
    alignSelf: "center",
    width: "100%",
    borderRadius: rs(20),
    shadowColor: "#4F6BFF",
    shadowOffset: { width: 0, height: rs(8) },
    shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.1,
    shadowRadius: rs(14),
    elevation: 4,
  },
  heroCard: {
    borderRadius: rs(20),
    padding: rs(12),
    // overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
  },
  heroImage: {
    borderRadius: rs(20),
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: rs(8),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    flex: 1,
  },
  walkIcon: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(10),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F6BFF",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: rs(4) },
    shadowOpacity: 0.22,
    shadowRadius: rs(8),
    elevation: 3,
  },
  heroLabel: {
    fontSize: fs(13),
    fontWeight: "800",
  },
  keepPill: {
    minHeight: rs(26),
    borderRadius: rs(13),
    paddingHorizontal: rs(10),
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
    backgroundColor: "#1E3A8A",
  },
  keepText: {
    color: "#FFFFFF",
    fontSize: fs(10),
    fontWeight: "800",
  },
  heroBody: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: rs(10),
    gap: rs(8),
  },
  stepsColumn: {
    flex: 1,
    minWidth: 0,
  },
  stepsLine: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: rs(5),
  },
  stepsValue: {
    fontSize: fs(30),
    lineHeight: rs(36),
    fontWeight: "900",
    letterSpacing: 0,
  },
  stepsWord: {
    fontSize: fs(12),
    fontWeight: "700",
    paddingBottom: rs(5),
  },
  goalText: {
    marginTop: rs(3),
    fontSize: fs(12),
    fontWeight: "600",
  },
  goalNumber: {
    color: "#2563EB",
    fontWeight: "900",
  },
  progressRow: {
    marginTop: rs(9),
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
  },
  progressTrack: {
    flex: 1,
    height: rs(8),
    borderRadius: rs(8),
    backgroundColor: "rgba(148,163,184,0.22)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: rs(8),
    backgroundColor: "#4F6BFF",
  },
  progressText: {
    minWidth: rs(32),
    color: "#4F6BFF",
    fontSize: fs(12),
    fontWeight: "900",
  },
  runnerPanel: {
    width: rs(104),
    height: rs(88),
    borderRadius: rs(20),
    alignItems: "center",
    justifyContent: "center",
  },
  statsBar: {
    marginTop: rs(10),
    borderRadius: rs(18),
    paddingVertical: rs(9),
    paddingHorizontal: rs(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  metricItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(6),
    minWidth: 0,
  },
  metricIcon: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    fontSize: fs(15),
    lineHeight: rs(18),
    fontWeight: "900",
  },
  metricLabel: {
    fontSize: fs(10),
    fontWeight: "600",
  },
  metricDivider: {
    width: 1,
    height: rs(30),
    backgroundColor: "rgba(148,163,184,0.32)",
  },
});

// const bannerStyles = StyleSheet.create({
//   banner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: rs(10),
//     paddingHorizontal: rs(12),
//     paddingVertical: rs(8),
//     marginTop: rs(8),
//     gap: rs(8),
//   },
//   red:       { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
//   amber:     { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
//   grey:      { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
//   icon:      { fontSize: fs(14) },
//   text:      { flex: 1, fontSize: fs(11), fontWeight: '500', lineHeight: rs(16) },
//   textRed:   { color: '#991B1B' },
//   textAmber: { color: '#92400E' },
//   textGrey:  { color: '#374151' },
// });
