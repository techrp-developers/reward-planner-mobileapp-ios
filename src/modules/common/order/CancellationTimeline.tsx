import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import RewardCoin from "../../../../assets/product/rewards.svg";

type TimelineItem = {
  label: string;
  date: string;
};

type Props = {
  timeline: TimelineItem[];
};

export default function CancellationAndRefundCard({ timeline }: Props) {
  return (
    <View style={styles.card}>
      {/* Title */}
      <Text style={styles.title}>Order Cancelled</Text>

      {/* Timeline */}
      {timeline.map((item, index) => (
        <View key={index} style={styles.timelineRow}>
          <MaterialCommunityIcons
            name="check-circle"
            size={18}
            color="#16A34A"
          />

          <View style={styles.timelineText}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
        </View>
      ))}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Total Refund */}
      <Text style={styles.refundTitle}>Total Refund - ₹950</Text>

      {/* Refund to Card */}
      <View style={styles.refundRow}>
        <View style={styles.refundLeft}>
          <MaterialCommunityIcons
            name="bank-outline"
            size={20}
            color="#374151"
          />
          <View style={styles.refundText}>
            <Text style={styles.amount}>₹950</Text>
            <Text style={styles.subText}>Refund to Card</Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Completed</Text>
        </View>
      </View>

      {/* Reward Coins */}
      <View style={styles.refundRow}>
        <View style={styles.refundLeft}>
          <RewardCoin  />
          <View style={styles.refundText}>
            <Text style={styles.amount}>₹500</Text>
            <Text style={styles.subText}>Reward Coins Reversed</Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Completed</Text>
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          Refund will be processed within 3–5 business days.
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    
    overflow: "hidden",
    marginBottom: 16,
    marginTop:16,
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
    padding: 16,
    paddingBottom: 8,
  },

  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  timelineText: {
    marginLeft: 10,
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },

  date: {
    fontSize: 12,
    color: "#6B7280",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },

  refundTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  refundRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  refundLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  refundText: {
    marginLeft: 10,
  },

  amount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  subText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  badge: {
    backgroundColor: "#E7F8EE",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A",
  },

  infoBanner: {
    backgroundColor: "#FFF4E6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },

  infoText: {
    fontSize: 12,
    color: "#92400E",
    textAlign: "center",
  },
});
