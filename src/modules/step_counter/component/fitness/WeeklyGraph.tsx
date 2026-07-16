import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import type { DailyData } from "../../navigation/type";
import {
  BORDER_RADIUS,
  SPACING,
  TYPOGRAPHY,
} from "../../utils/theme";

interface WeeklyGraphProps {
  weeklyData: DailyData[];
  onViewMore: () => void;
}

const VD = {
  accent: "#8EA2FF",
  accentDark: "#B9C4FF",
  accentDim: "rgba(142,162,255,0.22)",
  accentFaint: "rgba(142,162,255,0.12)",
  ink: "#F6F7FF",
  muted: "#A8AEC8",
  white: "#FFFFFF",
  whiteLow: "#979EBC",
  cardBg: "rgba(255,255,255,0.075)",
  cardBorder: "rgba(174,188,255,0.16)",
  track: "rgba(255,255,255,0.09)",
  shadow: "#02030A",
};

const WeeklyGraph: React.FC<WeeklyGraphProps> = ({
  weeklyData,
  onViewMore,
}) => {
  const today = new Date().getDate();

  return (
    <View style={styles.weeklyCard}>
      {/* Header */}
      <View style={styles.weekHeader}>
        <Text style={styles.sectionLabel}>
          This Week
        </Text>

        <TouchableOpacity
          activeOpacity={0.86}
          style={styles.viewMoreButton}
          onPress={onViewMore}
        >
          <Text style={styles.viewMore}>
            View More
          </Text>

          <MaterialCommunityIcons
            name="arrow-right"
            size={16}
            color={VD.accentDark}
          />
        </TouchableOpacity>
      </View>

      {/* Weekly Bars */}
      <View style={styles.barsRow}>
        {weeklyData.map((item, index) => {
          const isToday =
            item.date === today;

          const fillHeight = Math.max(
            item.progress * 100,
            6
          );

          return (
            <View
              key={`${item.day}-${index}`}
              style={styles.barColumn}
            >
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    isToday && styles.todayBarFill,
                    {
                      height: `${fillHeight}%`,
                      backgroundColor: item.done
                        ? VD.accent
                        : isToday
                        ? "#B9C4FF"
                        : VD.accentDim,
                    },
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.dayLabel,
                  isToday &&
                    styles.todayText,
                ]}
              >
                {item.day}
              </Text>

              <Text
                style={[
                  styles.dateLabel,
                  isToday &&
                    styles.todayText,
                ]}
              >
                {item.date}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default React.memo(WeeklyGraph);

const styles = StyleSheet.create({
  weeklyCard: {
    backgroundColor: VD.cardBg,
    borderRadius:
      BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: VD.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  weekHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: VD.ink,
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  viewMoreButton: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal:
      SPACING.md,
    marginRight: SPACING.xs,
    borderRadius:
      BORDER_RADIUS.pill,
    backgroundColor:
      VD.accentFaint,
    borderWidth: 1,
    borderColor:
      VD.cardBorder,
  },

  viewMore: {
    ...TYPOGRAPHY.caption,
    color: VD.accentDark,
    marginRight: 4,
  },

  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent:
      "space-between",
    height: 130,
  },

  barColumn: {
    flex: 1,
    alignItems: "center",
  },

  barTrack: {
    width: 22,
    height: 90,
    backgroundColor:
      VD.track,
    borderRadius: 12,
    justifyContent: "flex-end",
    overflow: "hidden",
    marginBottom: 8,
  },

  barFill: {
    width: "100%",
    borderRadius: 12,
  },

  todayBarFill: {
    borderWidth: 1,
    borderColor: VD.accent,
  },

  dayLabel: {
    fontSize: 11,
    color: VD.whiteLow,
    fontWeight: "600",
  },

  dateLabel: {
    fontSize: 10,
    color: VD.whiteLow,
    marginTop: 2,
  },

  todayText: {
    color: VD.accentDark,
    fontWeight: "700",
  },
});
