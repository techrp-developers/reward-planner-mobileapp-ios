import React, { useEffect, useState } from "react";
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
  const [expiringCoins, setExpiringCoins] = useState(0);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [txnLoading, setTxnLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getType = (filter: string) => {
    if (filter === "Additions") return "credit";
    if (filter === "Deductions") return "debit";
    if (filter === "Expired") return "expired";
    return "all";
  };

  const mapTransactions = (rows: any[]) =>
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
      coins: txn.transaction_type === "credit" ? txn.coins : -txn.coins,
      icon:
        txn.transaction_type === "credit"
          ? "file-document-outline"
          : "package-variant-closed",
      iconBg: txn.transaction_type === "credit" ? "#4F75FF" : "#A67B5B",
    }));

  const loadBalance = async () => {
    const balanceRes = await fetchWalletBalance();
    setBalance(balanceRes?.data?.balance || 0);
    setExpiringCoins(balanceRes?.data?.expiring_coins || 0);
    setExpiryDate(balanceRes?.data?.expiry_date || null);
  };

  const loadTransactions = async (type: any = "all") => {
    const txnRes = await fetchWalletTransactions(type);
    setTransactions(mapTransactions(txnRes.data));
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadBalance(), loadTransactions("all")]);
      } catch (err) {
        console.log("Wallet error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onFilterChange = async (filter: string) => {
    setActiveFilter(filter);
    try {
      setTxnLoading(true);
      await loadTransactions(getType(filter));
    } catch (err) {
      console.log("Wallet error:", err);
    } finally {
      setTxnLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadBalance(), loadTransactions(getType(activeFilter))]);
    } catch (err) {
      console.log("Wallet error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* WALLET CARD */}
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={isDark ? ["#1A0E3E", "#3B2899", "#6B50D4"] : ["#2A1B5E", "#5B3FD9", "#8B6BF0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.walletTop}
        >
          <View style={styles.cardGlowTop} />
          <View style={styles.cardGlowBottom} />

          <View style={styles.walletTopRow}>
            <Text style={styles.cardKicker}>REWARD WALLET</Text>
            <View style={styles.chipBadge}>
              <MaterialCommunityIcons name="shield-check" size={12} color="#FFE9A8" />
              <Text style={styles.chipBadgeText}>Premium</Text>
            </View>
          </View>

          <View style={styles.leftSection}>
            <View style={styles.coinIconWrap}>
              <Reward width={30} height={30} />
            </View>
            <View style={styles.balanceBlock}>
              <Text style={styles.balanceLabel}>My Balance</Text>
              <Text style={styles.balance}>{balance.toLocaleString("en-IN")}</Text>
            </View>
          </View>

          <View style={styles.cardBottomRow}>
            <View style={styles.rateBox}>
              <Reward width={13} height={13} />
              <Text style={styles.rateText}> 1 Coin = ₹1</Text>
            </View>
          </View>
        </LinearGradient>

        {/* EXPIRY STRIP */}
        <View style={[
          styles.expiryStrip,
          {
            backgroundColor: isDark ? "#1C1208" : "#FFF8F0",
            borderTopColor: isDark ? "#3D2810" : "#FDE9D0",
          },
        ]}>
          <View style={styles.expiryLeft}>
            <View style={[styles.expiryIconWrap, { backgroundColor: isDark ? "#3D2810" : "#FFE9D2" }]}>
              <MaterialCommunityIcons name="clock-alert-outline" size={15} color="#F97316" />
            </View>
            <Text style={[styles.expiryText, { color: isDark ? "#FB923C" : "#7C4A12" }]}>
              {expiringCoins} Coins Expiring
            </Text>
          </View>
          <Text style={[styles.expiryDate, { color: isDark ? "#D97706" : "#9A6B33" }]}>
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
      <Text style={[styles.sectionHeading, { color: theme.text }]}>Transaction History</Text>

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
              { borderColor: theme.border, backgroundColor: theme.card },
              activeFilter === item && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: theme.secondaryText },
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
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ProductHeadColor
        title="Wallet"
        onBackPress={() => navigation.goBack()}
        showSearch={false}
      />

      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        {loading ? (
          <Text style={[styles.loading, { color: theme.secondaryText }]}>Loading...</Text>
        ) : (
          <FlatList
            data={transactions}
            ListHeaderComponent={renderHeader}
            keyExtractor={(item) => item.id}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <TransactionCard item={item} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/* TRANSACTION CARD */
function TransactionCard({ item }: { item: Transaction }) {
  const { isDark, theme } = useAppTheme();
  const isPositive = item.coins > 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, shadowColor: isDark ? "#000" : "#000" }]}>
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isPositive
                ? (isDark ? "#052E1A" : "#ECFDF5")
                : (isDark ? "#2D0A10" : "#FEF2F2"),
            },
          ]}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={20}
            color={isPositive ? "#10B981" : "#F43F5E"}
          />
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.orderText, { color: theme.text }]}>Order No. {item.orderNo}</Text>
          {item.txnId && (
            <Text style={[styles.subText, { color: theme.secondaryText }]}>Txn Id: {item.txnId}</Text>
          )}
          <Text style={[styles.categoryText, { color: theme.secondaryText }]}>{item.title}</Text>
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
        <Text style={[styles.dateText, { color: theme.secondaryText }]}>{item.date}</Text>
      </View>
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: { flex: 1, paddingHorizontal: 16 },

  loading: { textAlign: "center", marginTop: 40 },

  headerContainer: { paddingTop: 10 },

  cardWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#4D34A6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },

  walletTop: {
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  chipBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
  },

  chipBadgeText: {
    color: "#FFE9A8",
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 3,
    letterSpacing: 0.3,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  leftSection: { flexDirection: "row", alignItems: "center" },

  coinIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },

  balanceBlock: { marginLeft: 12 },

  balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "500" },
  balance: { color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: 0.3 },

  cardBottomRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  rateBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 8,
  },
  rateText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  expiryStrip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
  },

  expiryLeft: { flexDirection: "row", alignItems: "center" },

  expiryIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  expiryText: {
    fontSize: 13,
    marginLeft: 8,
    fontWeight: "600",
  },

  expiryDate: {
    fontSize: 12,
    fontWeight: "500",
  },

  sectionHeading: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 14,
    marginTop: 20,
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
    marginRight: 10,
  },

  filterChipActive: {
    backgroundColor: "#5B3FD9",
    borderColor: "#5B3FD9",
  },

  filterText: { fontSize: 13, fontWeight: "500" },

  filterTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  listContent: { paddingBottom: 40 },

  card: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    elevation: 2,
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

  orderText: { fontSize: 14, fontWeight: "600" },

  subText: { fontSize: 12, marginTop: 2 },

  categoryText: { fontSize: 12, marginTop: 4 },

  cardRight: { alignItems: "flex-end" },

  coinRow: { flexDirection: "row", alignItems: "center" },

  coinAmount: { fontSize: 15, fontWeight: "700", marginLeft: 4 },

  credit: { color: "#10B981" },

  debit: { color: "#F43F5E" },

  dateText: { fontSize: 11, marginTop: 4 },
});
