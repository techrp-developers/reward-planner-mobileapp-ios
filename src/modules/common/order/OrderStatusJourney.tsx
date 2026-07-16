import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export type OrderStatusItem = {
  label: string;
  date?: string;
  completed?: boolean;
};

type Props = {
  arrivingBy?: string;
  headerText?: string;
  statuses: OrderStatusItem[];
  onCancelPress?: () => void;
};

export default function OrderStatusJourney({
  arrivingBy,
  headerText,
  statuses,
  onCancelPress,
}: Props) {
  const title = headerText || (arrivingBy ? `Status: ${arrivingBy}` : "Order status");

  return (
    <View style={styles.card}>
      {/* Header */}
      <Text style={styles.arrivalText}>
        {title}
      </Text>

      {/* Timeline */}
      <View>
        {statuses.map((item, index) => {
          const isLast = index === statuses.length - 1;
          const isDone = item.completed;

          return (
            <View key={index} style={styles.row}>
              {/* Left side */}
              <View style={styles.left}>
                <View
                  style={[
                    styles.circle,
                    isDone && styles.circleDone,
                  ]}
                >
                  {isDone && (
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color="#fff"
                    />
                  )}
                </View>
                {!isLast && <View style={styles.line} />}
              </View>

              {/* Right content */}
              <View style={styles.content}>
                <Text
                  style={[
                    styles.label,
                    isDone && styles.labelDone,
                  ]}
                >
                  {item.label}
                </Text>

                {!!item.date && (
                  <Text style={styles.date}>{item.date}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {onCancelPress ? (
        <>
          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onCancelPress}
          >
            <Text style={styles.cancelText}>Cancel Order</Text>
          </TouchableOpacity>
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
    padding: 16,
    marginBottom: 16,
  },

  arrivalText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16A34A",
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  left: {
    width: 24,
    alignItems: "center",
  },

  circle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },

  circleDone: {
    backgroundColor: "#16A34A", // ✅ FIXED (no gradient string bug)
  },

  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#CBD5E1",
    marginTop: 2,
  },

  content: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },

  /* 👇 KEY FIX */
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },

  labelDone: {
    fontWeight: "600",
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

  cancelText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
});
