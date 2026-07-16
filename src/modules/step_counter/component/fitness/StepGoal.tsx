import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import { BORDER_RADIUS, RESPONSIVE, SPACING } from "../../utils/theme";
import StepIcon from "../../assets/StepCount/step_icon.svg";
import CoinIcon from "../../../../assets/product/rewards.svg";
import { fetchProfilePlan, selectUserGoal, type ProfilePlanResponse } from "../../api/ProfileAPI";
import { useInvalidateFitnessQueries } from "../../api/useFitnessQueries";

type Nav = NativeStackNavigationProp<FitnessStackParamList, "StepGoal">;

// ─── Violet Dusk palette ──────────────────────────────────────────────────────

const VD = {
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
};

const BG = ["#070A16", "#111735", "#201A3F"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

type GoalOption = { id: number; dailySteps: number; label: string; coins: number };

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString("en-IN") : "0");

// ─── Component ────────────────────────────────────────────────────────────────

const StepGoal: React.FC = () => {
  const navigation              = useNavigation<Nav>();
  const invalidateFitnessQueries = useInvalidateFitnessQueries();
  const [profilePlan, setProfilePlan] = useState<ProfilePlanResponse | null>(null);
  const [selected,    setSelected]    = useState<number | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  const goals = useMemo<GoalOption[]>(() => {
    // Daily reward is flat regardless of the chosen target (matches the
    // actual syncSteps payout), so every option shows the same real coins
    // instead of an invented number that scales with step count.
    const coins = profilePlan?.daily_reward_coins ?? 0;
    const plan = profilePlan?.weekly_plan || [];
    if (plan.length > 0)
      return plan.map((item) => ({ id: item.week, dailySteps: item.steps, label: `${fmt(item.steps)} Steps`, coins }));
    if (profilePlan?.recommended_steps)
      return [{ id: 1, dailySteps: profilePlan.recommended_steps, label: `${fmt(profilePlan.recommended_steps)} Steps`, coins }];
    return [];
  }, [profilePlan]);

  const selectedGoal = useMemo(() => goals.find(g => g.id === selected), [goals, selected]);

  const loadPlan = useCallback(async () => {
    setLoading(true); setError("");
    const res = await fetchProfilePlan();
    if (res.success && res.data) {
      setProfilePlan(res.data);
      const first = res.data.weekly_plan?.[0];
      setSelected(first?.week ?? (res.data.recommended_steps ? 1 : null));
    } else {
      setError(res.message || "Failed to load goals");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  const handleSetGoal = useCallback(async () => {
    if (!selectedGoal) { Alert.alert("Select goal", "Please select your daily step goal."); return; }
    try {
      setSubmitting(true);
      const res = await selectUserGoal({ daily_steps: selectedGoal.dailySteps });
      if (!res.success) { Alert.alert("Goal update failed", res.message); return; }
      invalidateFitnessQueries();
      navigation.navigate("Dashboard");
    } finally {
      setSubmitting(false);
    }
  }, [invalidateFitnessQueries, navigation, selectedGoal]);

  const disabled = submitting || loading || !selectedGoal;

  return (
    <SafeAreaView style={ss.safe} edges={["top", "bottom"]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <LinearGradient colors={BG} style={ss.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <ScrollView
          contentContainerStyle={[ss.scroll, { paddingHorizontal: RESPONSIVE.horizontalPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity style={ss.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={VD.accentDark} />
          </TouchableOpacity>

          <Text style={ss.eyebrow}>Activity target</Text>
          <Text style={ss.title}>Choose your{"\n"}activity goal</Text>
          <Text style={ss.subtitle}>Pick the pace that feels realistic. You can adjust it later.</Text>

          {/* Goal options */}
          {loading ? (
            <View style={ss.stateBox}>
              <ActivityIndicator color={VD.accent} size="large" />
              <Text style={ss.stateText}>Loading your recommended goals…</Text>
            </View>
          ) : error ? (
            <View style={ss.stateBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color={VD.warning} />
              <Text style={ss.stateText}>{error}</Text>
              <TouchableOpacity style={ss.retryBtn} onPress={loadPlan} activeOpacity={0.85}>
                <Text style={ss.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : goals.length === 0 ? (
            <View style={ss.stateBox}>
              <MaterialCommunityIcons name="walk" size={28} color={VD.whiteLow} />
              <Text style={ss.stateText}>No step goals available right now.</Text>
            </View>
          ) : (
            goals.map((item) => {
              const active = selected === item.id;
              return (
                <TouchableOpacity
                  key={`${item.id}-${item.dailySteps}`}
                  activeOpacity={0.85}
                  style={[ss.goalCard, active && ss.goalCardSelected]}
                  onPress={() => setSelected(item.id)}
                >
                  <View style={[ss.goalIconWrap, active && ss.goalIconWrapSelected]}>
                    <StepIcon width={22} height={22} />
                  </View>
                  <View style={ss.goalCopy}>
                    <Text style={ss.goalLabel}>{item.label}</Text>
                    <Text style={ss.goalMeta}>Daily step target</Text>
                  </View>
                  <View style={ss.goalRight}>
                    <View style={ss.coinBadge}>
                      <CoinIcon width={14} height={14} />
                      <Text style={ss.coinText}>{item.coins}</Text>
                    </View>
                    {active && <MaterialCommunityIcons name="check-circle" size={18} color={VD.accentDark} />}
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <Text style={ss.footerText}>The longer you walk, the bigger the reward.</Text>

          {/* CTA */}
          <TouchableOpacity activeOpacity={0.9} onPress={handleSetGoal} disabled={disabled} style={ss.ctaWrap}>
            <LinearGradient
              colors={disabled ? ["rgba(255,255,255,0.15)", "rgba(255,255,255,0.10)"] : ["#8EA2FF", "#B9C4FF"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={ss.cta}
            >
              {submitting
                ? <ActivityIndicator color={VD.accentDark} />
                : <Text style={[ss.ctaText, disabled && ss.ctaTextDim]}>Set Goal</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={ss.bottomPad} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default React.memo(StepGoal);

// ─── Styles ───────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: "#070A16" },
  gradient: { flex: 1 },
  scroll:   { alignItems: "center", paddingTop: SPACING.xl },

  backBtn: {
    alignSelf: "flex-start",
    width: 40, height: 40,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: VD.whiteGhost,
    borderWidth: 1, borderColor: VD.cardBorder,
    alignItems: "center", justifyContent: "center",
    marginBottom: SPACING.lg,
  },

  eyebrow: {
    width: "100%",
    fontSize: 11, fontWeight: "700", letterSpacing: 0,
    textTransform: "uppercase", color: VD.accentDark, marginBottom: 6,
  },
  title: {
    width: "100%",
    fontSize: 28, fontWeight: "900", color: VD.white,
    letterSpacing: 0, lineHeight: 34, marginBottom: SPACING.sm,
  },
  subtitle: {
    width: "100%",
    fontSize: 14, color: VD.whiteMid, lineHeight: 20, marginBottom: SPACING.xl,
  },

  goalCard: {
    width: "100%",
    flexDirection: "row", alignItems: "center",
    backgroundColor: VD.cardBg,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1, borderColor: VD.cardBorder,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  goalCardSelected: { borderColor: VD.accent, backgroundColor: VD.accentFaint },
  goalIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: VD.accentFaint,
    alignItems: "center", justifyContent: "center",
    marginRight: SPACING.md,
  },
  goalIconWrapSelected: { backgroundColor: VD.accentFaint },
  goalCopy:  { flex: 1 },
  goalLabel: { fontSize: 15, fontWeight: "700", color: VD.white },
  goalMeta:  { fontSize: 11, color: VD.whiteLow, marginTop: 2 },
  goalRight: { alignItems: "center", gap: 6 },
  coinBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(251,191,36,0.15)",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: "rgba(251,191,36,0.25)",
  },
  coinText: { fontSize: 12, fontWeight: "700", color: VD.warning },

  stateBox: {
    width: "100%", minHeight: 150,
    alignItems: "center", justifyContent: "center",
    backgroundColor: VD.cardBg,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1, borderColor: VD.cardBorder,
    padding: SPACING.lg, marginBottom: SPACING.lg, gap: SPACING.sm,
  },
  stateText: { fontSize: 13, color: VD.whiteLow, textAlign: "center" },
  retryBtn: {
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.large,
    backgroundColor: VD.accentFaint,
    borderWidth: 1, borderColor: VD.cardBorder,
  },
  retryText: { fontSize: 13, fontWeight: "700", color: VD.accentDark },

  footerText: {
    fontSize: 13, color: VD.whiteLow, textAlign: "center",
    marginTop: SPACING.sm, marginBottom: SPACING.xl, fontStyle: "italic",
  },

  ctaWrap: { width: "100%" },
  cta: {
    height: 54, borderRadius: BORDER_RADIUS.large,
    alignItems: "center", justifyContent: "center",
  },
  ctaText:    { fontSize: 16, fontWeight: "800", color: "#070A16", letterSpacing: 0 },
  ctaTextDim: { color: VD.whiteLow },

  bottomPad: { height: SPACING.xxl },
});
