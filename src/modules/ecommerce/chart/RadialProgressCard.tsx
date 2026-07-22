import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

type Props = {
  percentage: number;
  mainLabel: string;
  subLabel?: string;
  color: string;
  Icon?: React.ComponentType<{ width?: number; height?: number }>;
  onPress?: () => void;
  cardWidth?: number;
  loading?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
};

const SIZE = 74;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RadialProgressCard({
  percentage,
  mainLabel,
  subLabel,
  color,
  Icon,
  onPress,
  cardWidth,
  loading = false,
  errorMessage = "",
  onRetry,
}: Props) {
  const clampedPercent = Math.max(0, Math.min(Number(percentage) || 0, 100));
  const strokeDashoffset = useMemo(
    () => CIRCUMFERENCE - (clampedPercent / 100) * CIRCUMFERENCE,
    [clampedPercent],
  );

  const content = (
    <View style={[styles.card, cardWidth ? { width: cardWidth } : null]}>
      <View style={styles.progressWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="#EEF2F7"
            strokeWidth={STROKE}
            fill="transparent"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={color}
            strokeWidth={STROKE}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>
        <View style={styles.iconWrap}>
          {loading ? (
            <ActivityIndicator size="small" color={color} />
          ) : Icon ? (
            <Icon width={28} height={28} />
          ) : (
            <Text style={[styles.percentText, { color }]}>{Math.round(clampedPercent)}%</Text>
          )}
        </View>
      </View>

      <Text style={styles.mainLabel} numberOfLines={1}>
        {mainLabel}
      </Text>
      {errorMessage ? (
        <TouchableOpacity activeOpacity={0.8} onPress={onRetry}>
          <Text style={styles.errorText} numberOfLines={1}>
            Retry
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.subLabel} numberOfLines={1}>
          {subLabel}
        </Text>
      )}
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 156,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  progressWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  iconWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  percentText: {
    fontSize: 12,
    fontWeight: "800",
  },
  mainLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  subLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
});
