import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Reward from "../../../../assets/product/rewards.svg";

import {
  fetchWalletBalance,
  fetchWalletTransactions,
  type WalletBalanceResponse,
} from "../../api/WalleteAPI";
import ProductHeadColor from "../../constants/heading/Poduct_Head_Color";
import { useAppTheme } from "../../../../theme/ThemeContext";

type Transaction = {
  id: string;
  orderNo: string;
  txnId?: string;
  title: string;
  subtitle?: string;
  date: string;
  expiryLabel?: string;
  coins: number;
  icon: string;
  iconBg: string;
};

const FILTERS = ["All Transactions", "Additions", "Deductions", "Expired"];

export default function WalletHistoryScreen({ navigation }: any) {
  const { isDark, theme } = useAppTheme();
  const [activeFilter, setActiveFilter] = useState("All Transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalEarnedPoints, setTotalEarnedPoints] = useState(0);
  const [expiringCoins, setExpiringCoins] = useState(0);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [txnLoading, setTxnLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasEarnedTotalFromBalance = useRef(false);
  const themed = useMemo(
    () =>
      StyleSheet.create({
        screen: { backgroundColor: isDark ? "#09090B" : "#F9FAFB" },
        surface: {
          backgroundColor: isDark ? "#18181B" : "#FFFFFF",
          borderColor: isDark ? "#27272A" : "#E5E7EB",
        },
        text: { color: theme.text },
        mutedText: { color: theme.secondaryText },
        expiryStrip: {
          backgroundColor: isDark ? "#211A14" : "#FFF8F0",
          borderTopColor: isDark ? "#3F2D1D" : "#FDE9D0",
        },
        expiryText: { color: isDark ? "#FDBA74" : "#7C4A12" },
        expiryDate: { color: isDark ? "#D6A66F" : "#9A6B33" },
        creditIcon: { backgroundColor: isDark ? "rgba(16,185,129,0.14)" : "#ECFDF5" },
        debitIcon: { backgroundColor: isDark ? "rgba(244,63,94,0.14)" : "#FEF2F2" },
      }),
    [isDark, theme.secondaryText, theme.text],
  );

  const getType = (filter: string) => {
    if (filter === "Additions") return "credit";
    if (filter === "Deductions") return "debit";
    if (filter === "Expired") return "expired";
    return "all";
  };

  const formatExpiryLabel = useCallback((txn: any) => {
    if (!txn?.expiry_date) return undefined;

    const formattedDate = new Date(txn.expiry_date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return Number(txn.is_expired) === 1
      ? `Expired on ${formattedDate}`
      : `Expires on ${formattedDate}`;
  }, []);

  const mapTransactions = useCallback((rows: any[]) =>
    rows.map((txn: any) => ({
      id: String(txn.transaction_id),
      orderNo: txn.transaction_id,
      txnId: txn.transaction_id,
      title: txn.title,
      subtitle: txn.description,
      date: new Date(txn.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      expiryLabel: formatExpiryLabel(txn),
      coins: txn.transaction_type === "credit" ? txn.coins : -txn.coins,
      icon:
        txn.transaction_type === "credit"
          ? "file-document-outline"
          : "package-variant-closed",
      iconBg: txn.transaction_type === "credit" ? "#4F75FF" : "#A67B5B",
    })), [formatExpiryLabel]);

  const getTotalEarnedFromBalance = (data: any) => {
    const value =
      data?.total_earned_points ??
      data?.total_earned ??
      data?.total_earned_coins ??
      data?.earned_points ??
      data?.earned_coins;

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  };

  const loadBalance = useCallback(async () => {
    const balanceRes = await fetchWalletBalance();
    const balanceData: WalletBalanceResponse["data"] =
      balanceRes?.data || {
        balance: 0,
        expiring_coins: 0,
        expiry_date: null,
      };
    setBalance(balanceData.balance || 0);
    setExpiringCoins(balanceData.expiring_coins || 0);
    setExpiryDate(balanceData.expiry_date || null);

    const earnedFromBalance = getTotalEarnedFromBalance(balanceData);
    if (earnedFromBalance !== null) {
      hasEarnedTotalFromBalance.current = true;
      setTotalEarnedPoints(earnedFromBalance);
    }
  }, []);

  const loadTransactions = useCallback(async (type: any = "all") => {
    const txnRes = await fetchWalletTransactions(type);
    if (type === "all" && !hasEarnedTotalFromBalance.current) {
      const totalCredits = (txnRes.data || []).reduce((sum: number, txn: any) => {
        if (txn?.transaction_type !== "credit") return sum;
        return sum + (Number(txn?.coins) || 0);
      }, 0);
      setTotalEarnedPoints(totalCredits);
    }
    setTransactions(mapTransactions(txnRes.data));
  }, [mapTransactions]);

  // Initial load: fetch balance + transactions together, full-screen loader.
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadBalance(), loadTransactions("all")]);
      } catch (err) {
        __DEV__ && console.log("Wallet error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadBalance, loadTransactions]);

  // Filter switch: only refetch transactions, keep card/list mounted (no flicker).
  const onFilterChange = async (filter: string) => {
    setActiveFilter(filter);
    try {
      setTxnLoading(true);
      await loadTransactions(getType(filter));
    } catch (err) {
      __DEV__ && console.log("Wallet error:", err);
    } finally {
      setTxnLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadBalance(), loadTransactions(getType(activeFilter))]);
    } catch (err) {
      __DEV__ && console.log("Wallet error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* WALLET CARD */}
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={["#2A1B5E", "#5B3FD9", "#8B6BF0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.walletTop}
        >
          <View style={styles.cardGlowTop} />
          <View style={styles.cardGlowBottom} />

          <View style={styles.walletTopRow}>
            <Text style={styles.cardKicker}>REWARD WALLET</Text>
            <View style={styles.topRightMeta}>
              {/* <View style={styles.chipBadge}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={12}
                  color="#FFE9A8"
                />
                <Text style={styles.chipBadgeText}>Premium</Text>
              </View> */}

              <View style={styles.rateBox}>
                <Reward width={13} height={13} />
                <Text style={styles.rateText}> 1 Coin = ₹1</Text>
              </View>
            </View>
          </View>

          <View style={styles.walletStatsRow}>
            <View style={styles.leftSection}>
              <View style={styles.coinIconWrap}>
                <Reward width={30} height={30} />
              </View>
              <View style={styles.balanceBlock}>
                <Text style={styles.label}>My Balance</Text>
                <Text style={styles.balance}>{balance.toLocaleString("en-IN")}</Text>
              </View>
            </View>

          </View>

          <View style={styles.cardBottomRow}>
            <View style={styles.earnedSummary}>
              <View style={styles.earnedLine}>
                <Text style={styles.earnedLineText}>Total earned -</Text>
                <Reward width={13} height={13} />
                <Text style={styles.earnedLineText}>
                  {totalEarnedPoints.toLocaleString("en-IN")} coins
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* EXPIRY STRIP */}
        <View style={[styles.expiryStrip, themed.expiryStrip]}>
          <View style={styles.expiryLeft}>
            <View style={styles.expiryIconWrap}>
              <MaterialCommunityIcons
                name="clock-alert-outline"
                size={15}
                color="#F97316"
              />
            </View>
            <Text style={[styles.expiryText, themed.expiryText]}>
              {expiringCoins} Coins Expiring
            </Text>
          </View>

          <Text style={[styles.expiryDate, themed.expiryDate]}>
            {expiryDate
              ? new Date(expiryDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "N/A"}
          </Text>
        </View>
      </View>

      {/* TITLE */}
      <Text style={[styles.sectionHeading, themed.text]}>Transaction History</Text>

      {/* FILTERS */}
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onFilterChange(item)}
            style={[
              styles.filterChip,
              themed.surface,
              activeFilter === item && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                themed.mutedText,
                activeFilter === item && styles.filterTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {txnLoading && (
        <View style={styles.inlineLoadingRow}>
          <ActivityIndicator size="small" color="#5B3FD9" />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, themed.screen]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#111113" : "#FFFFFF"}
      />

      {/* ✅ HEADER */}
      <ProductHeadColor
        title="Wallet"
        onBackPress={() => navigation.goBack()}
        showSearch={false}
        isDark={isDark}
      />

      <View style={[styles.screen, themed.screen]}>
        {loading ? (
          <Text style={[styles.loading, themed.mutedText]}>Loading...</Text>
        ) : (
          <FlatList
            data={transactions}
            ListHeaderComponent={renderHeader}
            keyExtractor={(item) => item.id}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TransactionCard item={item} themed={themed} />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/* TRANSACTION CARD */
function TransactionCard({
  item,
  themed,
}: {
  item: Transaction;
  themed: any;
}) {
  const isPositive = item.coins > 0;

  return (
    <View style={[styles.card, themed.surface]}>
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.iconBox,
            isPositive ? themed.creditIcon : themed.debitIcon,
          ]}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={20}
            color={isPositive ? "#10B981" : "#F43F5E"}
          />
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.orderText, themed.text]}>Order No. {item.orderNo}</Text>
          {item.txnId && (
            <Text style={[styles.subText, themed.mutedText]}>Txn Id: {item.txnId}</Text>
          )}
          <Text style={[styles.categoryText, themed.mutedText]}>{item.title}</Text>
          {item.expiryLabel && (
            <Text style={[styles.transactionExpiryText, themed.expiryDate]}>
              {item.expiryLabel}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.cardRight}>
        <View style={styles.coinRow}>
          <Reward width={14} height={14} />
          <Text
            style={[
              styles.coinAmount,
              isPositive ? styles.credit : styles.debit,
            ]}
          >
            {isPositive ? `+${item.coins}` : item.coins}
          </Text>
        </View>
        <Text style={[styles.dateText, themed.mutedText]}>{item.date}</Text>
      </View>
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  screen: { flex: 1, paddingHorizontal: 16, backgroundColor: "#F9FAFB" },

  loading: { textAlign: "center", marginTop: 40, color: "#9CA3AF" },

  headerContainer: { paddingTop: 10 },

  cardWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 12,
    marginBottom: 22,
    elevation: 8,
    shadowColor: "#4D34A6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },

  walletTop: {
    padding: 20,
    overflow: "hidden",
  },

  cardGlowTop: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  cardGlowBottom: {
    position: "absolute",
    bottom: -50,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  walletTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  cardKicker: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  chipBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },

  chipBadgeText: {
    color: "#FFE9A8",
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 3,
    letterSpacing: 0.3,
  },

  topRightMeta: {
    alignItems: "flex-end",
    gap: 7,
  },

  walletStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  leftSection: { flexDirection: "row", alignItems: "center", flex: 1 },

  coinIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  balanceBlock: { marginLeft: 12 },

  label: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "500" },
  balance: { color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: 0.3 },

  earnedSummary: { alignItems: "flex-start" },

  earnedLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  earnedLineText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },

  cardBottomRow: {
    flexDirection: "row",
    marginTop: 18,
  },

  rateBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rateText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  expiryStrip: {
    backgroundColor: "#FFF8F0",
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#FDE9D0",
  },

  expiryLeft: { flexDirection: "row", alignItems: "center" },

  expiryIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFE9D2",
    justifyContent: "center",
    alignItems: "center",
  },

  expiryText: {
    fontSize: 13,
    color: "#7C4A12",
    marginLeft: 8,
    fontWeight: "600",
  },

  expiryDate: {
    fontSize: 12,
    color: "#9A6B33",
    fontWeight: "500",
  },

  sectionHeading: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 14,
    color: "#1F2937",
  },

  filterList: { marginBottom: 20 },

  inlineLoadingRow: {
    alignItems: "center",
    marginTop: -8,
    marginBottom: 12,
  },

  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
    marginRight: 10,
  },

  filterChipActive: {
    backgroundColor: "#5B3FD9",
    borderColor: "#5B3FD9",
  },

  filterText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },

  filterTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  listContent: { paddingBottom: 40 },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },

  cardLeft: { flexDirection: "row", flex: 1 },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  textBlock: { marginLeft: 12, flex: 1 },

  orderText: { fontSize: 14, fontWeight: "600", color: "#1F2937" },

  subText: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },

  categoryText: { fontSize: 12, color: "#6B7280", marginTop: 4 },

  transactionExpiryText: {
    fontSize: 11,
    color: "#9A6B33",
    marginTop: 4,
    fontWeight: "600",
  },

  cardRight: { alignItems: "flex-end" },

  coinRow: { flexDirection: "row", alignItems: "center" },

  coinAmount: { fontSize: 15, fontWeight: "700", marginLeft: 4 },

  credit: { color: "#10B981" },

  debit: { color: "#F43F5E" },

  dateText: { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
});
