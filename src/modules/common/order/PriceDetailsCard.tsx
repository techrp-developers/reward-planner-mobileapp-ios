import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

type Props = {
  itemTotal: number;
  deliveryFee: number;
  bagDiscount: number;
  rewardDiscount: number;
  orderTotal: number;
  rewardEarned: number;
  rewardRedeemed: number;
  paymentMethod: string;
};

export default function PriceDetailsCard({
  itemTotal,
  deliveryFee,
  bagDiscount,
  rewardDiscount,
  orderTotal,
  rewardEarned,
  rewardRedeemed,
  paymentMethod,
}: Props) {
  return (
    <View style={styles.card}>
      {/* Title */}
      <Text style={styles.title}>Price Details</Text>

      {/* Green reward earned banner */}
      <View style={styles.earnedBanner}>
        <Text style={styles.earnedText}>
          {rewardEarned} Reward Coins Earned
        </Text>
      </View>

      {/* Price rows */}
      <Row label="Item Total" value={`₹${itemTotal}`} />
      <Row label="Delivery Fee" value={`₹${deliveryFee}`} />
      <Row
        label="Bag Discount"
        value={`-₹${bagDiscount}`}
        valueStyle={styles.negative}
      />
      <Row
        label="Reward Discount"
        value={`-₹${rewardDiscount}`}
        valueStyle={styles.negative}
      />

      <View style={styles.divider} />

      {/* Order total */}
      <View style={styles.rowBetween}>
        <Text style={styles.totalLabel}>Order Total</Text>
        <Text style={styles.totalValue}>₹{orderTotal}</Text>
      </View>

      {/* Payment method */}
      <View style={styles.rowBetween}>
        <Text style={styles.paymentLabel}>Payment Method</Text>
        <Text style={styles.paymentValue}>{paymentMethod}</Text>
      </View>

      {/* Purple redeemed banner */}
      <View style={styles.redeemedBanner}>
        <MaterialIcons name="auto-awesome" size={18} color="#7C3AED" />
        <Text style={styles.redeemedText}>
          {rewardRedeemed} Reward Coins Redeemed
        </Text>
        <MaterialIcons name="auto-awesome" size={18} color="#7C3AED" />
      </View>
    </View>
  );
}

/* Row component */
function Row({ label, value, valueStyle }: any) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueStyle]}>{value}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginVertical: 12,
  },

  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },

  earnedBanner: {
    backgroundColor: "#E7FBEF",
    borderRadius: 8,
    paddingVertical: 6,
    marginBottom: 12,
    alignItems: "center",
  },

  earnedText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#16A34A",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },

  label: {
    fontSize: 13,
    color: "#374151",
  },

  value: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
  },

  negative: {
    color: "#16A34A",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  totalValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  paymentLabel: {
    fontSize: 13,
    color: "#6B7280",
  },

  paymentValue: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },

  redeemedBanner: {
    marginTop: 12,
    backgroundColor: "#F3E8FF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  redeemedText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6D28D9",
  },
});