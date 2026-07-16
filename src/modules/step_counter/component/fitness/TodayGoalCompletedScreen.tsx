import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
  ViewStyle,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import type { PlanOverview, OverallSummary } from "../../api/Stepsapi";

// ─── Types ────────────────────────────────────────────────────────────────────

// Navigation-stack mode: data comes from route.params
type NavProps = NativeStackScreenProps<FitnessStackParamList, "TodayGoalCompletedScreen">;

// Overlay mode: Dashboard renders this directly as an absolute overlay
type OverlayProps = {
  planOverview:   PlanOverview;
  overallSummary: OverallSummary;
  currentStreak:  number;
  reward:         number;
  onContinue:     () => void;
  onBack:         () => void;
};

type Props = NavProps | OverlayProps;

function isOverlay(p: Props): p is OverlayProps {
  return !("route" in p);
}

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: W } = Dimensions.get("window");
const CONFETTI_COLORS = [
  "#FF6B9D", "#C44DFF", "#4D9FFF", "#FFD93D",
  "#6BCB77", "#FF6B6B", "#4ECDC4", "#FFA07A",
  "#A78BFA", "#34D399", "#F472B6", "#60A5FA",
];
const CONFETTI_COUNT = 42;
const ANIM_SECTION_COUNT = 5;

// ─── Confetti Piece ───────────────────────────────────────────────────────────
const ConfettiPiece: React.FC<{ index: number }> = ({ index }) => {
  const piece = useRef({
    color:    CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    startX:   (index / CONFETTI_COUNT) * (W * 0.9) - 6,
    duration: 1600 + (index % 7) * 200,
    isRect:   index % 3 !== 0,
    size:     5 + (index % 5) * 2,
    drift:    ((index % 5) - 2) * 22,
    spin:     `${360 * (index % 2 === 0 ? 3 : -2)}deg`,
  }).current;

  const yRef       = useRef(new Animated.Value(-8));
  const xRef       = useRef(new Animated.Value(0));
  const rotateRef  = useRef(new Animated.Value(0));
  const opacityRef = useRef(new Animated.Value(1));

  const y       = yRef.current;
  const x       = xRef.current;
  const rotate  = rotateRef.current;
  const opacity = opacityRef.current;

  const staticStyle = useRef<ViewStyle>({
    position:        "absolute",
    top:             0,
    left:            piece.startX,
    width:           piece.isRect ? piece.size * 0.5 : piece.size,
    height:          piece.isRect ? piece.size * 2   : piece.size,
    borderRadius:    piece.isRect ? 2 : piece.size / 2,
    backgroundColor: piece.color,
  }).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y,      { toValue: 280,         duration: piece.duration, useNativeDriver: true }),
      Animated.timing(x,      { toValue: piece.drift, duration: piece.duration, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 1,           duration: piece.duration, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(piece.duration * 0.55),
        Animated.timing(opacity, {
          toValue:  0,
          duration: piece.duration * 0.45,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [y, x, rotate, opacity, piece.duration, piece.drift]);

  const spin = rotate.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0deg", piece.spin],
  });

  return (
    <Animated.View
      style={[staticStyle, { opacity, transform: [{ translateY: y }, { translateX: x }, { rotate: spin }] }]}
    />
  );
};

// ─── Goal Illustration ────────────────────────────────────────────────────────
const GoalIllustration: React.FC<{
  scale: Animated.Value;
  planType: string;
}> = ({ scale, planType }) => (
  <Animated.View style={[styles.illustrationBox, { transform: [{ scale }] }]}>
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </View>

    <View style={styles.goalScene}>
      <View style={styles.signBoard}>
        <Text style={styles.signBoardText}>GOAL</Text>
      </View>
      <View style={styles.postsRow}>
        <View style={styles.signPost} />
        <View style={styles.signPostGap} />
        <View style={styles.signPost} />
      </View>
      <View style={styles.figure}>
        <View style={styles.figureArmsRow}>
          <View style={[styles.figureArmUp, styles.figureArmLeft]} />
          <View style={styles.figureHead} />
          <View style={[styles.figureArmUp, styles.figureArmRight]} />
        </View>
        <View style={styles.figureBody} />
        <View style={styles.figureLegsRow}>
          <View style={[styles.figureLeg, styles.figureLegLeft]} />
          <View style={[styles.figureLeg, styles.figureLegRight]} />
        </View>
      </View>
    </View>

    <Text style={styles.illustrationCaption}>
      {"Great job! You've hit today's target for your\n"}
      <Text style={styles.illustrationBold}>{planType} plan.</Text>
    </Text>
  </Animated.View>
);

// ─── Animated Section Card ────────────────────────────────────────────────────
const SectionCard: React.FC<{
  children: React.ReactNode;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  highlighted?: boolean;
}> = ({ children, fadeAnim, slideAnim, highlighted }) => (
  <Animated.View
    style={[
      styles.sectionCard,
      highlighted && styles.sectionCardHighlighted,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}
  >
    {children}
  </Animated.View>
);

// ─── Gradient Progress Bar ────────────────────────────────────────────────────
const GradientBar: React.FC<{ progress: number }> = ({ progress }) => {
  const widthAnimRef = useRef(new Animated.Value(0));
  const widthAnim    = widthAnimRef.current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue:  progress,
      duration: 1000,
      delay:    600,
      useNativeDriver: false,
    }).start();
  }, [widthAnim, progress]);

  return (
    <View style={styles.gradBarTrack}>
      <Animated.View
        style={[
          styles.gradBarFill,
          {
            width: widthAnim.interpolate({
              inputRange:  [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const TodayGoalCompletedScreen: React.FC<Props> = (props) => {
  const overlay = isOverlay(props);

  const planOverview   = overlay ? props.planOverview   : props.route.params.planOverview;
  const overallSummary = overlay ? props.overallSummary : props.route.params.overallSummary;
  const currentStreak  = overlay ? props.currentStreak  : props.route.params.currentStreak;
  const reward         = overlay ? props.reward         : props.route.params.reward;

  const handleBack     = overlay ? props.onBack     : () => props.navigation.goBack();
  const handleContinue = overlay ? props.onContinue : () => props.navigation.replace("Dashboard");

  const heroScaleRef = useRef(new Animated.Value(0.8));
  const heroScale    = heroScaleRef.current;

  const animsRef = useRef(
    Array.from({ length: ANIM_SECTION_COUNT }, () => ({
      fade:  new Animated.Value(0),
      slide: new Animated.Value(30),
    })),
  );
  const anims = animsRef.current;

  useEffect(() => {
    Animated.spring(heroScale, {
      toValue:  1,
      friction: 7,
      tension:  50,
      useNativeDriver: true,
    }).start();

    anims.forEach(({ fade, slide }, i) => {
      Animated.parallel([
        Animated.timing(fade,  { toValue: 1, duration: 380, delay: 200 + i * 110, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 380, delay: 200 + i * 110, useNativeDriver: true }),
      ]).start();
    });
  }, [heroScale, anims]);

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} hr ${m} min` : `${m} min`;
  };

  const stepsProgress = Math.min(overallSummary.steps / (planOverview.daily_target * 1.2), 1);

  const planRows = [
    { label: "Plan Type",           value: planOverview.plan_type,                          color: "#5B5FBD" },
    { label: "Total Plan Duration", value: `${planOverview.total_duration_days} days`,      color: "#1A1D3A" },
    { label: "Today",               value: `Day ${planOverview.current_day}`,                color: "#5B5FBD" },
    { label: "Daily Target",        value: `${planOverview.daily_target.toLocaleString()} steps`, color: "#1A1D3A" },
  ];

  const summaryRows = [
    { icon: "🥾", label: "Steps",          value: `${overallSummary.steps.toLocaleString()} steps` },
    { icon: "🔥", label: "Calories Burned", value: `${overallSummary.calories} kcal` },
    { icon: "📍", label: "Distance",        value: `${overallSummary.distance_km} km` },
    { icon: "⏱️", label: "Active Hours",    value: formatMinutes(overallSummary.active_minutes) },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDEEF8" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Today's Goal Completed</Text>
          <Text style={styles.headerSub}>• {planOverview.plan_type} Plan</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* ── Scroll Body ── */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} bounces>
        <GoalIllustration scale={heroScale} planType={planOverview.plan_type} />

        <SectionCard fadeAnim={anims[0].fade} slideAnim={anims[0].slide} highlighted>
          <Text style={styles.sectionTitle}>Plan Overview</Text>
          {planRows.map((row, i) => (
            <View key={i} style={[styles.infoRow, i < planRows.length - 1 && styles.rowDivider]}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={[styles.infoValue, { color: row.color }]}>{row.value}</Text>
            </View>
          ))}
        </SectionCard>

        <SectionCard fadeAnim={anims[1].fade} slideAnim={anims[1].slide} highlighted>
          <Text style={styles.sectionTitle}>Overall Summary</Text>
          {summaryRows.map((row, i) => (
            <View key={i} style={[styles.summaryRow, i < summaryRows.length - 1 && styles.rowDivider]}>
              <Text style={styles.summaryIcon}>{row.icon}</Text>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue}>{row.value}</Text>
            </View>
          ))}
          <View style={styles.gradBarContainer}>
            <GradientBar progress={stepsProgress} />
          </View>
        </SectionCard>

        <SectionCard fadeAnim={anims[2].fade} slideAnim={anims[2].slide}>
          <View style={styles.streakRow}>
            <View>
              <Text style={styles.sectionTitle}>
                Current Streak {"  "}
                <Text style={styles.streakLightning}>⚡</Text>
              </Text>
              <Text style={styles.streakSub}>You're building strong habits.</Text>
            </View>
            <Text style={styles.streakDays}>{currentStreak} Days</Text>
          </View>
        </SectionCard>

        {reward > 0 && (
          <SectionCard fadeAnim={anims[3].fade} slideAnim={anims[3].slide}>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardLabel}>🪙 Coins Earned Today</Text>
              <Text style={styles.rewardValue}>+{reward}</Text>
            </View>
          </SectionCard>
        )}

        <View style={styles.scrollBottomPad} />
      </ScrollView>

      {/* ── Footer CTA ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.87}
        >
          <Text style={styles.continueTxt}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TodayGoalCompletedScreen;

// ─── Violet Dusk palette (mirrors Dashboard.tsx) ─────────────────────────────
const VD = {
  bg0:         "#1A1040",
  bg1:         "#3D2080",
  accent:      "#C4A8FF",
  accentFaint: "rgba(196,168,255,0.12)",
  accentDim:   "rgba(196,168,255,0.25)",
  cardBg:      "rgba(255,255,255,0.09)",
  cardBorder:  "rgba(196,168,255,0.18)",
  white:       "#FFFFFF",
  whiteMid:    "rgba(255,255,255,0.70)",
  whiteLow:    "rgba(255,255,255,0.45)",
  success:     "#4ADE80",
  warning:     "#FBBF24",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: VD.bg0 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 58 : 28,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: VD.cardBorder,
  },
  backBtn:      { width: 36, alignItems: "flex-start", justifyContent: "center" },
  backArrow:    { fontSize: 34, color: VD.accent, lineHeight: 38, fontWeight: "300" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle:  { fontSize: 16, fontWeight: "800", color: VD.white, letterSpacing: -0.2 },
  headerSub:    { fontSize: 11.5, fontWeight: "700", color: VD.accent, marginTop: 2, letterSpacing: 0.2 },
  headerSpacer: { width: 36 },

  scroll:         { paddingHorizontal: 14, paddingTop: 10 },
  scrollBottomPad:{ height: 16 },

  illustrationBox: {
    backgroundColor: VD.cardBg,
    borderRadius: 22,
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 18,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  goalScene:    { alignItems: "center", marginBottom: 12 },
  signBoard:    { backgroundColor: VD.accent, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 6 },
  signBoardText:{ color: VD.bg0, fontSize: 13, fontWeight: "900", letterSpacing: 3 },
  postsRow:     { flexDirection: "row", justifyContent: "center", alignItems: "flex-start", marginBottom: 4 },
  signPost:     { width: 4, height: 22, backgroundColor: VD.accentDim, borderRadius: 2 },
  signPostGap:  { width: 40 },

  figure:        { alignItems: "center" },
  figureArmsRow: { flexDirection: "row", alignItems: "flex-end", gap: 5, marginBottom: 1 },
  figureArmUp:   { width: 3, height: 15, backgroundColor: VD.whiteMid, borderRadius: 2, marginBottom: 3 },
  figureArmLeft: { transform: [{ rotate: "-38deg" }] },
  figureArmRight:{ transform: [{ rotate: "38deg" }] },
  figureHead:    { width: 14, height: 14, borderRadius: 7, backgroundColor: VD.white },
  figureBody:    { width: 3, height: 20, backgroundColor: VD.whiteMid, borderRadius: 2 },
  figureLegsRow: { flexDirection: "row", gap: 5, marginTop: 1 },
  figureLeg:     { width: 3, height: 18, backgroundColor: VD.whiteMid, borderRadius: 2 },
  figureLegLeft: { transform: [{ rotate: "-12deg" }] },
  figureLegRight:{ transform: [{ rotate: "12deg" }] },

  illustrationCaption: { fontSize: 13, color: VD.whiteLow, textAlign: "center", lineHeight: 20 },
  illustrationBold:    { fontWeight: "700", color: VD.accent },

  sectionCard: {
    backgroundColor: VD.cardBg,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  sectionCardHighlighted: { borderColor: VD.accent, borderWidth: 1.5 },
  sectionTitle: { fontSize: 14.5, fontWeight: "800", color: VD.white, marginBottom: 8 },

  infoRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9 },
  rowDivider:{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: VD.cardBorder },
  infoLabel: { fontSize: 13.5, color: VD.whiteLow, fontWeight: "500" },
  infoValue: { fontSize: 13.5, fontWeight: "700", color: VD.white },

  summaryRow:      { flexDirection: "row", alignItems: "center", paddingVertical: 9 },
  summaryIcon:     { fontSize: 17, width: 26, textAlign: "center", marginRight: 8 },
  summaryLabel:    { flex: 1, fontSize: 13.5, color: VD.whiteLow, fontWeight: "500" },
  summaryValue:    { fontSize: 13.5, fontWeight: "700", color: VD.accent },
  gradBarContainer:{ marginTop: 12 },

  gradBarTrack: { height: 8, backgroundColor: "rgba(255,255,255,0.10)", borderRadius: 6, overflow: "hidden" },
  gradBarFill:  { height: "100%", borderRadius: 6, backgroundColor: VD.accent },

  streakRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  streakLightning:{ fontSize: 15 },
  streakSub:      { fontSize: 12, color: VD.whiteLow, fontWeight: "500", marginTop: 2 },
  streakDays:     { fontSize: 14.5, fontWeight: "800", color: VD.success },

  rewardRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rewardLabel: { fontSize: 13.5, color: VD.whiteLow, fontWeight: "600" },
  rewardValue: { fontSize: 15, fontWeight: "900", color: VD.warning },

  footer: {
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === "ios" ? 38 : 22,
    paddingTop: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: VD.cardBorder,
  },
  continueBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: VD.accent,
  },
  continueTxt: { fontSize: 16, fontWeight: "800", color: VD.bg0, letterSpacing: 0.2 },
});
