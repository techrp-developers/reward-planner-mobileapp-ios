import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LinearGradient from "./FitnessGradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

import type { DailyData } from "../../navigation/type";
import { useStepStyles } from "../../utils/useStepTheme";

interface WeeklyGraphProps {
  weeklyData: DailyData[];
  onViewMore: () => void;
}

const C_LIGHT = {
  ink: "#10152D",
  muted: "#777FA5",
  blue: "#426BFF",
  purple: "#773CFF",
  cyan: "#36CFFF",
  card: "#FFFFFF",
  border: "#E9EEFA",
  track: "#E3EBFA",
  column: "#F7F9FF",
  todayColumn: "#F1ECFF",
  fill: "#B4CBFF",
  chip: "#EEF3FF",
  shadow: "#4664A5",
};

type Palette = typeof C_LIGHT;

const C_DARK: Palette = {
  ink: "#F2F4FF",
  muted: "#9AA3C7",
  blue: "#7B93FF",
  purple: "#A585FF",
  cyan: "#36CFFF",
  card: "#161C33",
  border: "rgba(174,188,255,0.14)",
  track: "#252D4A",
  column: "#1C2340",
  todayColumn: "#2A2152",
  fill: "#4C66C9",
  chip: "rgba(123,147,255,0.16)",
  shadow: "#02030A",
};

const BAR_HEIGHT = 92;
const BAR_WIDTH = 24;

const WeeklyGraph: React.FC<WeeklyGraphProps> = ({ weeklyData, onViewMore }) => {
  const { t: tx } = useTranslation();
  const { palette: C, styles } = useStepStyles(C_LIGHT, C_DARK, createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{tx("stepCounter:weeklyGraph.thisWeek")}</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.viewMore}
          onPress={onViewMore}
          accessibilityRole="button"
          hitSlop={6}
        >
          <Text style={styles.viewMoreText}>{tx("stepCounter:weeklyGraph.viewMore")}</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={C.blue} />
        </TouchableOpacity>
      </View>

      <View style={styles.columns}>
        {weeklyData.map((item, index) => {
          const ratio = Math.max(0, Math.min(item.progress, 1));
          // Any recorded steps show at least a round cap so small days stay visible.
          const fillHeight = ratio > 0 ? Math.max(BAR_WIDTH, ratio * BAR_HEIGHT) : 0;
          const percent = item.percent ?? Math.round(item.progress * 100);
          return (
            <View
              key={item.key ?? index}
              style={[styles.column, item.isToday && styles.columnToday]}
              accessible
              accessibilityLabel={`${item.day} ${item.date}, ${percent}%`}
            >
              <Text
                style={[styles.percent, item.isToday && styles.todayText]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {percent}%
              </Text>
              <View style={styles.track}>
                {fillHeight > 0 &&
                  (item.isToday ? (
                    <LinearGradient
                      colors={[C.cyan, C.blue, C.purple]}
                      style={[styles.fill, { height: fillHeight }]}
                    />
                  ) : (
                    <View style={[styles.fill, styles.fillPast, { height: fillHeight }]} />
                  ))}
              </View>
              <Text
                style={[styles.day, item.isToday && styles.todayText]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {item.day}
              </Text>
              <Text style={[styles.date, item.isToday && styles.todayText]}>{item.date}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default React.memo(WeeklyGraph);

const createStyles = (C: Palette) => StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 16,
    shadowColor: C.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: { fontSize: 16, fontWeight: "800", color: C.ink, textTransform: "uppercase" },
  viewMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: C.chip,
  },
  viewMoreText: { fontSize: 14, fontWeight: "700", color: C.blue },
  columns: { flexDirection: "row", gap: 6 },
  column: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: C.column,
  },
  columnToday: { backgroundColor: C.todayColumn },
  percent: { fontSize: 12, fontWeight: "600", color: C.muted, marginBottom: 8 },
  track: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: BAR_WIDTH / 2,
    backgroundColor: C.track,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  fill: { width: "100%", borderRadius: BAR_WIDTH / 2 },
  fillPast: { backgroundColor: C.fill },
  day: { fontSize: 13, fontWeight: "700", color: C.muted, marginTop: 8 },
  date: { fontSize: 12, color: C.muted, marginTop: 2 },
  todayText: { color: C.purple, fontWeight: "800" },
});
