import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import RewardIcon from "../../../assets/product/rewards.svg";
import { useAppTheme } from "../../../theme/ThemeContext";
import {
  fetchWalletBalance,
  fetchWalletTransactions,
  WalletTransaction,
} from "../../ecommerce/api/WalleteAPI";

interface RewardsState {
  balance: number;
  expiringCoins: number;
  expiryDate: string | null;
  totalSpent: number;
  totalRedeemed: number;
  transactions: WalletTransaction[];
  loading: boolean;
  error: string | null;
}

const PURPLE = "#8665FF";
const PURPLE_DARK = "#5B47A3";

const formatPts = (pts: number): string =>
  `${pts.toLocaleString("en-IN")} pts`;

const StatColumn: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { theme } = useAppTheme();
  const t = useMemo(() => ({
    statLabel: { color: theme.secondaryText } as TextStyle,
    statValue: { color: theme.text } as TextStyle,
  }), [theme]);

  return (
    <View style={styles.statColumn}>
      <Text style={[styles.statLabel, t.statLabel]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.statValue, t.statValue]} numberOfLines={1}>{value}</Text>
    </View>
  );
};

const RewardsOverview: React.FC = () => {
  const { isDark, theme } = useAppTheme();
  const navigation = useNavigation();
  const [state, setState] = useState<RewardsState>({
    balance: 0,
    expiringCoins: 0,
    expiryDate: null,
    totalSpent: 0,
    totalRedeemed: 0,
    transactions: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));

        const [balanceRes, creditRes, debitRes] = await Promise.all([
          fetchWalletBalance(),
          fetchWalletTransactions("credit"),
          fetchWalletTransactions("debit"),
        ]);

        const credits = creditRes.success ? creditRes.data : [];
        const debits = debitRes.success ? debitRes.data : [];
        const totalSpent = credits.reduce((sum, tx) => sum + tx.coins, 0);
        const totalRedeemed = debits.reduce((sum, tx) => sum + tx.coins, 0);
        const allTx = [...credits, ...debits].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        setState({
          balance: balanceRes.data.balance,
          expiringCoins: Number(balanceRes.data.expiring_coins ?? 0),
          expiryDate: balanceRes.data.expiry_date ?? null,
          totalSpent,
          totalRedeemed,
          transactions: allTx,
          loading: false,
          error: null,
        });
      } catch (e) {
        setState((s) => ({
          ...s,
          loading: false,
          error: e instanceof Error ? e.message : "Something went wrong",
        }));
      }
    };

    load();
  }, []);

  const t = useMemo(() => ({
    centered: { backgroundColor: theme.background } as ViewStyle,
    loadingText: { color: theme.secondaryText } as TextStyle,
    card: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      shadowColor: isDark ? "#000000" : PURPLE,
    } as ViewStyle,
    title: { color: theme.text } as TextStyle,
    subtitle: { color: theme.secondaryText } as TextStyle,
    statCard: {
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F8FAFC",
      borderColor: theme.border,
    } as ViewStyle,
  }), [isDark, theme]);

  if (state.loading) {
    return (
      <View style={[styles.centered, t.centered]}>
        <ActivityIndicator size="small" color={PURPLE} />
        <Text style={[styles.loadingText, t.loadingText]}>Loading rewards...</Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>{state.error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={[styles.card, t.card]}>
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.eyebrow}>REWARDS</Text>
            <Text style={[styles.title, t.title]}>Overview</Text>
            <Text style={[styles.subtitle, t.subtitle]} numberOfLines={1}>
              Track your reward points
            </Text>
          </View>

          <View style={styles.iconBubble}>
            <RewardIcon width={40} height={40} />
          </View>
        </View>

        <View style={styles.balanceRow}>
          <StatColumn label="Available" value={formatPts(state.balance)} />

          <LinearGradient
            colors={[PURPLE, PURPLE_DARK]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.primaryBtn}
          >
            <TouchableOpacity
              style={styles.primaryBtnInner}
              activeOpacity={0.85}
              onPress={() => { navigation.navigate("WalletHistory" as never); }}
            >
              <Text style={styles.primaryBtnText}>View Rewards</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, t.statCard]}>
            <StatColumn label="Earned" value={formatPts(state.totalSpent)} />
          </View>
          <View style={[styles.statCard, t.statCard]}>
            <StatColumn label="Redeemed" value={formatPts(state.totalRedeemed)} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default RewardsOverview;

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 13,
  },
  errorBox: {
    margin: 16,
    padding: 14,
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorText: {
    fontSize: 13,
    color: "#C0392B",
    fontWeight: "600",
  },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  titleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: PURPLE,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 24,
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 3,
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(134,101,255,0.12)",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  statColumn: {
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  primaryBtn: {
    width: 132,
    height: 42,
    borderRadius: 13,
    overflow: "hidden",
    justifyContent: "center",
  },
  primaryBtnInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
