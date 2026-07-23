import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../../../theme/ThemeContext";

export type OrderStatusItem = {
  label: string;
  date?: string;
  completed?: boolean;
  current?: boolean;
};

type Props = {
  arrivingBy?: string;
  headerText?: string;
  statuses: OrderStatusItem[];
  onCancelPress?: () => void;
  tone?: "success" | "danger";
};

export default function OrderStatusJourney({
  arrivingBy,
  headerText,
  statuses,
  onCancelPress,
  tone = "success",
}: Props) {
  const { isDark, theme } = useAppTheme();
  const title = headerText || (arrivingBy ? `Status: ${arrivingBy}` : "Order status");
  const isDanger = tone === "danger";

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Header */}
      <Text style={[styles.arrivalText, isDanger && styles.dangerText]}>
        {title}
      </Text>

      {/* Timeline */}
      <View>
        {statuses.map((item, index) => {
          const isLast = index === statuses.length - 1;
          const isDone = item.completed;
          const isCurrent = item.current && !isDone;
          const isHighlighted = isDone || isCurrent;

          return (
            <View key={index} style={styles.row}>
              {/* Left side */}
              <View style={styles.left}>
                <View
                  style={[
                    styles.circle,
                    { backgroundColor: isDark ? "#4B5563" : "#CBD5E1" },
                    isHighlighted && styles.circleDone,
                    isHighlighted && isDanger && styles.circleDanger,
                  ]}
                >
                  {isDone && (
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color="#fff"
                    />
                  )}
                  {isCurrent && <View style={styles.currentDot} />}
                </View>
                {!isLast && (
                  <View style={[styles.line, { backgroundColor: isDark ? "#4B5563" : "#CBD5E1" }, isDanger && styles.lineDanger]} />
                )}
              </View>

              {/* Right content */}
              <View style={styles.content}>
                <Text
                  style={[
                    styles.label,
                    { color: theme.secondaryText },
                    isHighlighted && styles.labelDone,
                    isCurrent && styles.labelCurrent,
                    isHighlighted && isDanger && styles.dangerText,
                  ]}
                >
                  {item.label}
                </Text>

                {!!item.date && (
                  <Text style={[styles.date, { color: theme.secondaryText }]}>{item.date}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {onCancelPress ? (
        <>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onCancelPress}
          >
            <Text style={[styles.cancelText, { color: theme.text }]}>Cancel Order</Text>
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
    backgroundColor: "#16A34A",
  },

  circleDanger: {
    backgroundColor: "#DC2626",
  },

  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#CBD5E1",
    marginTop: 2,
  },

  lineDanger: {
    backgroundColor: "#DC2626",
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

  labelCurrent: {
    color: "#16A34A",
  },

  dangerText: {
    color: "#DC2626",
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
