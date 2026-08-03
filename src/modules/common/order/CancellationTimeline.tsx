import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import RewardCoin from "../../../assets/product/rewards.svg";

type TimelineItem = {
  label: string;
  date: string;
};
type RefundLine = {
  amount: number;
  label: string;
  status: string;
};

type Props = {
  title?: string;
  reasonText?: string | null;
  timeline: TimelineItem[];
  refunds: RefundLine[];
};

const REFUND_STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  processing: "Processing",
  pending: "Pending",
  failed: "Failed",
};

export default function CancellationAndRefundCard({
  title = "Order Cancelled",
  reasonText,
  timeline,
  refunds,
}: Props) {
  const totalRefund = refunds.reduce((sum, refund) => sum + Number(refund.amount || 0), 0);

  return (
    <View style={styles.card}>
      {/* Title */}
      <Text style={styles.title}>{title}</Text>
      {reasonText ? <Text style={styles.reasonText}>Reason: {reasonText}</Text> : null}

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

      {refunds.length > 0 ? (
        <>
          {/* Divider */}
          <View style={styles.divider} />

          {/* Total Refund */}
          <Text style={styles.refundTitle}>Total Refund - ₹{totalRefund}</Text>

          {refunds.map((refund, index) => (
            <View key={index} style={styles.refundRow}>
              <View style={styles.refundLeft}>
                {refund.label.toLowerCase().includes("coin") ? (
                  <RewardCoin width={20} height={20} />
                ) : (
                  <MaterialCommunityIcons
                    name="bank-outline"
                    size={20}
                    color="#374151"
                  />
                )}
                <View style={styles.refundText}>
                  <Text style={styles.amount}>₹{Number(refund.amount || 0)}</Text>
                  <Text style={styles.subText}>{refund.label}</Text>
                </View>
              </View>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {REFUND_STATUS_LABELS[refund.status] || refund.status}
                </Text>
              </View>
            </View>
          ))}

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              Refund will be processed within 3–5 business days.
            </Text>
          </View>
        </>
      ) : null}
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
    marginTop: 16,
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
    padding: 16,
    paddingBottom: 8,
  },

  reasonText: {
    fontSize: 12,
    color: "#6B7280",
    paddingHorizontal: 16,
    marginBottom: 8,
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
