import React, { memo, useEffect } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Animated, {
  cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from "react-native-reanimated";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { useAuthReducedMotion } from "./AuthMotion";

// Presentation categories only; replace this list with CMS categories when available.
const BENEFITS = [
  { label: "Health", icon: "heart-pulse" },
  { label: "Wellness", icon: "meditation" },
  { label: "Insurance", icon: "shield-check" },
  { label: "Learning", icon: "school-outline" },
  { label: "Travel", icon: "airplane" },
  { label: "Dining", icon: "silverware-fork-knife" },
  { label: "Shopping", icon: "shopping-outline" },
  { label: "Finance", icon: "finance" },
];
const ROWS = [BENEFITS.slice(0, 4), BENEFITS.slice(4)];
const CARD_WIDTH = 142;
const GAP = 10;
const LOOP_WIDTH = (CARD_WIDTH + GAP) * 4;

const BenefitCard = memo(function BenefitCard({ benefit, staticCard = false }: {
  benefit: typeof BENEFITS[number];
  staticCard?: boolean;
}) {
  const { theme, isDark } = useAppTheme();
  return (
    <View style={[styles.card, staticCard ? styles.staticCard : styles.movingCard, {
      backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: isDark ? 0.03 : 0.05,
    }]}>
      <LinearGradient colors={isDark ? ["#382343", "#392231"] : ["#F0E4F8", "#FCE5ED"]} style={styles.badge}>
        <MaterialCommunityIcons name={benefit.icon} size={21} color={isDark ? "#DBB5EF" : "#852BAF"} />
      </LinearGradient>
      <Text maxFontSizeMultiplier={1.4} style={[styles.label, { color: theme.text }]}>{benefit.label}</Text>
    </View>
  );
});

const DriftingRow = memo(function DriftingRow({ benefits, reverse }: {
  benefits: typeof BENEFITS;
  reverse: boolean;
}) {
  const offset = useSharedValue(reverse ? -LOOP_WIDTH : 0);
  useEffect(() => {
    offset.value = reverse ? -LOOP_WIDTH : 0;
    offset.value = withRepeat(withTiming(reverse ? 0 : -LOOP_WIDTH, {
      duration: 56000, easing: Easing.linear, reduceMotion: ReduceMotion.System,
    }), -1, false, undefined, ReduceMotion.System);
    return () => cancelAnimation(offset);
  }, [offset, reverse]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  return (
    <Animated.View style={[styles.track, animatedStyle]}>
      {[0, 1].map(copy => <View key={copy} style={styles.sequence}>
        {benefits.map(benefit => <BenefitCard key={benefit.label} benefit={benefit} />)}
      </View>)}
    </Animated.View>
  );
});

export default memo(function BenefitsShowcase() {
  const reducedMotion = useAuthReducedMotion();
  const { fontScale } = useWindowDimensions();
  // Large accessibility text should remain stationary and fully available too.
  const staticContent = reducedMotion || fontScale > 1.3;
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants" style={styles.showcase}>
      {staticContent ? <View style={styles.grid}>
        {BENEFITS.map(benefit => <BenefitCard key={benefit.label} benefit={benefit} staticCard />)}
      </View> : ROWS.map((benefits, row) => <DriftingRow key={row} benefits={benefits} reverse={row === 1} />)}
    </View>
  );
});

const styles = StyleSheet.create({
  showcase: { overflow: "hidden", gap: GAP, paddingVertical: 8 },
  track: { flexDirection: "row", width: LOOP_WIDTH * 2 },
  sequence: { flexDirection: "row", width: LOOP_WIDTH, gap: GAP, paddingRight: GAP },
  card: { flexDirection: "row", alignItems: "center", gap: 9, minHeight: 58, padding: 10, borderWidth: 1, borderRadius: 19, shadowColor: "#852BAF", shadowOffset: { width: 0, height: 3 }, shadowRadius: 8 },
  movingCard: { width: CARD_WIDTH },
  staticCard: { flexBasis: "47%", flexGrow: 1 },
  badge: { width: 33, height: 33, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  label: { flexShrink: 1, fontSize: 13, fontWeight: "600", lineHeight: 19 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
});
