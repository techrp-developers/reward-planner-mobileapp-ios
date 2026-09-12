import React, { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../../../theme/ThemeContext";

// No backend endpoint exists yet for portfolio value / active policy count —
// these two cards are presentational (matching the design mock) with
// placeholder figures until a real investments/insurance summary API is
// wired up. Replace PORTFOLIO_VALUE/PORTFOLIO_GROWTH_PERCENT/ACTIVE_POLICIES
// with live data once that API exists.
const PORTFOLIO_VALUE = "₹8,64,350";
const PORTFOLIO_GROWTH_PERCENT = "12.4%";
const ACTIVE_POLICIES = 6;

const GREEN = "#16A34A";
const GREEN_BG = "#DCFCE7";
const PURPLE = "#7C3AED";
const PURPLE_BG = "#EDE9FE";

const Sparkline = () => (
  <Svg width="100%" height={40} viewBox="0 0 120 40" preserveAspectRatio="none">
    <Path
      d="M0 32 L18 26 L36 30 L54 18 L72 22 L90 8 L120 4"
      stroke={GREEN}
      strokeWidth={2.5}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const InvestmentInsuranceOverview: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();

  const goToInvestments = useCallback(() => {
    navigation.navigate("Home", {
      screen: "ServicesModule",
      params: { screen: "MutualFundCalculators" },
    });
  }, [navigation]);

  const goToInsurance = useCallback(() => {
    navigation.navigate("Home", {
      screen: "ServicesModule",
      params: { moduleName: "Services" },
      moduleName: "Services",
    });
  }, [navigation]);

  return (
    <View style={styles.row}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={goToInvestments}
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: GREEN_BG }]}>
              <MaterialCommunityIcons name="trending-up" size={13} color={GREEN} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
              Investments
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={theme.secondaryText} />
          </View>

          <Text style={[styles.label, { color: theme.secondaryText }]}>Total Portfolio Value</Text>
          <Text style={[styles.value, { color: theme.text }]} numberOfLines={1}>
            {PORTFOLIO_VALUE}
          </Text>
          <View style={styles.growthRow}>
            <MaterialCommunityIcons name="arrow-up-bold" size={10} color={GREEN} />
            <Text style={styles.growthText}>{PORTFOLIO_GROWTH_PERCENT}</Text>
            <Text style={[styles.growthMuted, { color: theme.secondaryText }]}>(All time)</Text>
          </View>

          <View style={styles.sparklineWrap}>
            <Sparkline />
          </View>
        </View>

        <View style={[styles.ctaButton, { backgroundColor: GREEN_BG }]}>
          <MaterialCommunityIcons name="chart-pie" size={12} color={GREEN} />
          <Text style={[styles.ctaText, { color: GREEN }]}>View Portfolio</Text>
          <MaterialCommunityIcons name="chevron-right" size={13} color={GREEN} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={goToInsurance}
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: PURPLE_BG }]}>
              <MaterialCommunityIcons name="shield-check" size={13} color={PURPLE} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
              Insurance
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={theme.secondaryText} />
          </View>

          <Text style={[styles.label, { color: theme.secondaryText }]}>Active Policies</Text>
          <Text style={[styles.value, { color: theme.text }]} numberOfLines={1}>
            {ACTIVE_POLICIES}
          </Text>
          <View style={styles.growthRow}>
            <View style={styles.statusDot} />
            <Text style={[styles.growthMuted, { color: theme.secondaryText }]}>
              All policies are active
            </Text>
          </View>

          <View style={styles.shieldDecorationWrap} pointerEvents="none">
            <MaterialCommunityIcons name="shield-check" size={44} color={PURPLE_BG} />
          </View>
        </View>

        <View style={[styles.ctaButton, { backgroundColor: PURPLE_BG }]}>
          <MaterialCommunityIcons name="file-document-outline" size={12} color={PURPLE} />
          <Text style={[styles.ctaText, { color: PURPLE }]}>View Policies</Text>
          <MaterialCommunityIcons name="chevron-right" size={13} color={PURPLE} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(InvestmentInsuranceOverview);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  card: {
    flex: 1,
    minWidth: 0,
    // Two children: the content group (header/value/etc.) and the CTA
    // button. space-between pins the button to the card's bottom edge so
    // "View Portfolio"/"View Policies" line up with each other regardless
    // of how much content sits above them in each card.
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    padding: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
  },
  iconBubble: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "700",
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 1,
  },
  growthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  growthText: {
    fontSize: 11,
    fontWeight: "800",
    color: GREEN,
  },
  growthMuted: {
    fontSize: 10,
    fontWeight: "500",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  sparklineWrap: {
    marginTop: 6,
    height: 28,
  },
  shieldDecorationWrap: {
    position: "absolute",
    right: 8,
    bottom: 34,
    opacity: 0.9,
  },
  ctaButton: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
