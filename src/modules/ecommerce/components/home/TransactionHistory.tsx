import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { fetchWalletTransactions } from "../../api/WalleteAPI";

type UITransaction = {
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

const FILTERS = ["All", "Additions", "Deductions", "Expired"];

export default function TransactionHistory() {
  const [active, setActive] = useState("All");
  const [data, setData] = useState<UITransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const getType = (filter: string) => {
    if (filter === "Additions") return "credit";
    if (filter === "Deductions") return "debit";
    if (filter === "Expired") return "expired";
    return "all";
  };

  const loadTransactions = async (filter: string) => {
    try {
      setLoading(true);

      const res = await fetchWalletTransactions(getType(filter));

      const mapped = res.data.map((txn: any) => ({
        id: String(txn.transaction_id),
        orderNo: txn.transaction_id,
        txnId: txn.transaction_id,
        title: txn.title,
        subtitle: txn.description,
        date: new Date(txn.created_at).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        coins:
          txn.transaction_type === "credit"
            ? txn.coins
            : -txn.coins,
        icon:
          txn.transaction_type === "credit"
            ? "arrow-down-circle"
            : "arrow-up-circle",
        iconBg:
          txn.transaction_type === "credit"
            ? "#10B981"
            : "#EF4444",
      }));

      setData(mapped);
    } catch (err) {
      console.log("Transaction error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions("All");
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Transaction History</Text>

      {/* FILTERS */}
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => {
              setActive(f);
              loadTransactions(f);
            }}
            style={[
              styles.filterChip,
              active === f && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                active === f && styles.filterTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LOADING */}
      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <TransactionCard item={item} />}
        />
      )}
    </View>
  );
}

function TransactionCard({ item }: { item: UITransaction }) {
  const isPositive = item.coins > 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
          <MaterialCommunityIcons name={item.icon} size={20} color="#fff" />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.orderText}>{item.title}</Text>

          {item.txnId && (
            <Text style={styles.subText}>Txn Id: {item.txnId}</Text>
          )}

          {item.subtitle && (
            <Text style={styles.subText}>{item.subtitle}</Text>
          )}

          <Text style={styles.category}>{item.title}</Text>
        </View>
      </View>

      <View style={styles.cardRight}>
        <Text
          style={[
            styles.coinText,
            isPositive ? styles.credit : styles.debit,
          ]}
        >
          {isPositive ? `+${item.coins}` : item.coins}
        </Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { marginTop: 20 },

  heading: { fontSize: 16, fontWeight: "700", marginBottom: 10 },

  filters: { flexDirection: "row", marginBottom: 12 },

  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginRight: 8,
  },

  filterChipActive: {
    backgroundColor: "#F3E8FF",
    borderColor: "#A855F7",
  },

  filterText: { fontSize: 12, color: "#374151" },
  filterTextActive: { color: "#A855F7", fontWeight: "600" },

  loading: { textAlign: "center", marginTop: 30 },

  listContent: { paddingBottom: 20 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 3,
  },

  cardLeft: { flexDirection: "row", flex: 1 },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  textBlock: { marginLeft: 10, flex: 1 },

  orderText: { fontSize: 13, fontWeight: "600" },
  subText: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  category: { fontSize: 11, marginTop: 2 },

  cardRight: { alignItems: "flex-end" },

  coinText: { fontSize: 14, fontWeight: "700" },
  credit: { color: "#10B981" },
  debit: { color: "#EF4444" },

  date: { fontSize: 11, color: "#6B7280", marginTop: 4 },
});