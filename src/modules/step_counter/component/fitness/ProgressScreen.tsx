import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import {
  type CalendarDayData,
  type CalendarDayStatus,
} from "../../api/DashboardAPI";
import { useCalendarProgressQuery } from "../../api/useFitnessQueries";
import {
  BORDER_RADIUS,
  RESPONSIVE,
  SPACING,
  TYPOGRAPHY,
} from "../../utils/theme";

import TrophyIcon from "../../assets/StepCount/trophy.svg";
import StepIcon from "../../assets/StepCount/step_icon.svg";
import FireIcon from "../../assets/StepCount/lightning.svg";
import LocationIcon from "../../assets/StepCount/location.svg";
import ClockIcon from "../../assets/StepCount/clock_icon.svg";


type ProgressNav = NativeStackNavigationProp<FitnessStackParamList, "PlanProcess">;
type SvgIcon = React.FC<{ width?: number; height?: number; style?: object }>;

type CalendarCell = {
  key: string;
  dayNumber?: number;
  isoDate?: string;
  status?: CalendarDayStatus;
  isToday?: boolean;
  isSelected?: boolean;
};

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const monthTitleFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });
const fullMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const selectedDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
});

const VD = {
  bg: ["#070A16", "#111735", "#201A3F"],
  ink: "#F6F7FF",
  muted: "#A8AEC8",
  softText: "#979EBC",
  accent: "#8EA2FF",
  accentDark: "#B9C4FF",
  accentFaint: "rgba(142,162,255,0.12)",
  cardBg: "rgba(255,255,255,0.075)",
  cardSoft: "rgba(255,255,255,0.10)",
  cardBorder: "rgba(174,188,255,0.16)",
  success: "#9AAEFF",
  warning: "#F8B84E",
  danger: "#F38C9A",
  shadow: "#02030A",
};

const pad2 =(value: number) => String(value).padStart(2, "0");
const toMonthKey = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
const toIsoDate = (year: number, monthIndex: number, day: number) =>
  `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;

const formatNumber = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString("en-IN") : "0";

const safeNumber = (value?: number | null) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

const buildMonthOptions = (baseDate: Date) => {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - 2 + index, 1);
    return {
      key: toMonthKey(date),
      label: monthTitleFormatter.format(date),
      date,
    };
  });
};

const buildCalendarCells = (
  monthKey: string,
  calendarData: Record<string, CalendarDayData>,
  selectedIsoDate: string | null
): CalendarCell[] => {
  const [yearValue, monthValue] = monthKey.split("-").map(Number);
  const year = yearValue || new Date().getFullYear();
  const monthIndex = Math.max(0, (monthValue || 1) - 1);
  const firstDate = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const mondayStartOffset = (firstDate.getDay() + 6) % 7;
  const todayIso = toIsoDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const emptyCells: CalendarCell[] = Array.from({ length: mondayStartOffset }, (_, index) => ({
    key: `empty-${monthKey}-${index}`,
  }));

  const dayCells: CalendarCell[] = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const isoDate = toIsoDate(year, monthIndex, dayNumber);

    return {
      key: isoDate,
      dayNumber,
      isoDate,
      status: calendarData[isoDate]?.status,
      isToday: isoDate === todayIso,
      isSelected: isoDate === selectedIsoDate,
    };
  });

  const trailingCount = (7 - ((emptyCells.length + dayCells.length) % 7)) % 7;
  const trailingCells: CalendarCell[] = Array.from({ length: trailingCount }, (_, index) => ({
    key: `trail-${monthKey}-${index}`,
  }));

  return [...emptyCells, ...dayCells, ...trailingCells];
};

const ProgressScreen: React.FC = () => {
  const navigation = useNavigation<ProgressNav>();
  const { width } = useWindowDimensions();
  const today = useMemo(() => new Date(), []);
  const contentMaxWidth = Math.min(width - RESPONSIVE.horizontalPadding * 2, 560);
  const [selectedMonth, setSelectedMonth] = useState(toMonthKey(today));
  const [selectedDate, setSelectedDate] = useState<string | null>(
    toIsoDate(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const monthOptions = useMemo(() => buildMonthOptions(today), [today]);
  const calendarQuery = useCalendarProgressQuery(selectedMonth);
  const calendarData = useMemo(
    () => calendarQuery.data?.data?.calendar || {},
    [calendarQuery.data]
  );
  const monthlySummary = calendarQuery.data?.data?.summary || null;
  const loadingCalendar = calendarQuery.isLoading;
  const errorMessage =
    calendarQuery.data?.message ||
    (calendarQuery.error ? "Failed to fetch calendar" : "");

  const calendarCells = useMemo(
    () => buildCalendarCells(selectedMonth, calendarData, selectedDate),
    [calendarData, selectedDate, selectedMonth]
  );

  const monthStats = useMemo(() => {
    return {
      completed: monthlySummary?.completed_days || 0,
      missed: monthlySummary?.missed_days || 0,
    };
  }, [monthlySummary]);

  const selectedDayData = useMemo(
    () => (selectedDate ? calendarData[selectedDate] : null),
    [calendarData, selectedDate]
  );

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return fullMonthFormatter.format(new Date(`${selectedMonth}-01T00:00:00`));
    return selectedDateFormatter.format(new Date(`${selectedDate}T00:00:00`));
  }, [selectedDate, selectedMonth]);

  const highestStepDay = useMemo(() => {
    const entries = Object.entries(calendarData);
    if (entries.length === 0) return null;

    return entries.reduce(
      (best, [date, data]) =>
        safeNumber(data.steps) > safeNumber(best.data.steps) ? { date, data } : best,
      { date: entries[0][0], data: entries[0][1] }
    );
  }, [calendarData]);

  const handleMonthPress = useCallback((monthKey: string) => {
    setSelectedMonth(monthKey);
    setSelectedDate(null);
  }, []);

  const handleRetry = useCallback(() => {
    calendarQuery.refetch();
  }, [calendarQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={VD.bg} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: RESPONSIVE.horizontalPadding },
          ]}
        >
          <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} activeOpacity={0.82}>
                <MaterialCommunityIcons name="chevron-left" size={25} color={VD.accentDark} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Your Progress</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monthList}
            >
              {monthOptions.map((item) => {
                const active = selectedMonth === item.key;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.monthTab, active && styles.monthTabActive]}
                    activeOpacity={0.84}
                    onPress={() => handleMonthPress(item.key)}
                  >
                    <Text style={[styles.monthText, active && styles.monthTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.subText}>
              <Text style={styles.subTextStrong}>{selectedDateLabel}:</Text>{" "}
              {monthStats.completed} days Completed • {monthStats.missed} days Missed
            </Text>

            <View style={styles.card}>
              {loadingCalendar ? (
                <View style={styles.stateBox}>
                  <ActivityIndicator color={VD.accent} />
                  <Text style={styles.stateText}>Loading calendar...</Text>
                </View>
              ) : errorMessage ? (
                <View style={styles.stateBox}>
                  <Text style={styles.stateText}>{errorMessage}</Text>
                  <TouchableOpacity style={styles.retryButton} activeOpacity={0.86} onPress={handleRetry}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <CalendarGrid
                  cells={calendarCells}
                  onSelectDate={setSelectedDate}
                />
              )}

              <View style={styles.statsRow}>
                <Stat
                  value={formatNumber(safeNumber(selectedDayData?.steps))}
                  label="Steps"
                  Icon={StepIcon}
                />
                <Stat
                  value={formatNumber(safeNumber(selectedDayData?.calories))}
                  label="Kcal"
                  Icon={FireIcon}
                  color={VD.warning}
                />
                <Stat
                  value={safeNumber(selectedDayData?.distance_km).toFixed(1)}
                  label="Km"
                  Icon={LocationIcon}
                />
                <Stat
                  value={formatNumber(safeNumber(selectedDayData?.active_minutes))}
                  label="Move Min"
                  Icon={ClockIcon}
                />
              </View>
            </View>

            {highestStepDay ? (
              <View style={styles.highestCard}>
                <View style={styles.trophyWrap}>
                  <TrophyIcon width={32} height={32} />
                </View>
                <View style={styles.highestCopy}>
                  <Text style={styles.highestTitle}>
                    Your <Text style={styles.highestAccent}>Highest</Text>{"\n"}Step Day
                  </Text>
                </View>
                <View style={styles.highestRight}>
                  <Text style={styles.highestValue}>
                    {formatNumber(safeNumber(highestStepDay.data.steps))} Steps
                  </Text>
                  <Text style={styles.highestDate}>
                    {selectedDateFormatter.format(new Date(`${highestStepDay.date}T00:00:00`))}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default React.memo(ProgressScreen);

type CalendarGridProps = {
  cells: CalendarCell[];
  onSelectDate: (date: string) => void;
};

const CalendarGrid = React.memo(({ cells, onSelectDate }: CalendarGridProps) => (
  <View>
    <View style={styles.weekRow}>
      {WEEK_DAYS.map((day) => (
        <Text key={day} style={styles.weekText}>{day}</Text>
      ))}
    </View>
    <View style={styles.grid}>
      {cells.map((cell) => (
        <DayItem key={cell.key} cell={cell} onSelectDate={onSelectDate} />
      ))}
    </View>
  </View>
));

type DayItemProps = {
  cell: CalendarCell;
  onSelectDate: (date: string) => void;
};

const DayItem = React.memo(({ cell, onSelectDate }: DayItemProps) => {
  if (!cell.dayNumber || !cell.isoDate) {
    return <View style={styles.dayOuter} />;
  }

  const completed = cell.status === "completed";
  const missed = cell.status === "missed";
  const partial = cell.status === "partial";

  return (
    <TouchableOpacity
      activeOpacity={0.84}
      style={styles.dayOuter}
      onPress={() => onSelectDate(cell.isoDate!)}
    >
      <View
        style={[
          styles.dayBox,
          completed && styles.completedDay,
          missed && styles.missedDay,
          partial && styles.partialDay,
          cell.isToday && styles.todayDay,
          cell.isSelected && styles.selectedDay,
        ]}
      >
        {completed ? (
          <MaterialCommunityIcons name="check" size={16} color={VD.ink} />
        ) : (
          <Text
            style={[
              styles.dayText,
              completed && styles.completedText,
              partial && styles.partialText,
              cell.isSelected && styles.selectedText,
            ]}
          >
            {cell.dayNumber}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

type StatProps = {
  value: string;
  label: string;
  Icon: SvgIcon;
  color?: string;
};

const Stat = React.memo(({ value, label, Icon, color = VD.accentDark }: StatProps) => (
  <View style={styles.statItem}>
    <Icon width={24} height={24} />
    <View style={styles.statTextRow}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
));

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: VD.bg[0],
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: SPACING.xl + SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  content: {
    width: "100%",
  },
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: VD.cardSoft,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  headerTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: VD.ink,
    textAlign: "center",
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  monthList: {
    paddingVertical: SPACING.xs,
  },
  monthTab: {
    minHeight: 40,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: VD.cardBg,
    borderRadius: BORDER_RADIUS.medium,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  monthTabActive: {
    backgroundColor: VD.accentFaint,
    borderColor: VD.accent,
  },
  monthText: {
    ...TYPOGRAPHY.caption,
    color: VD.muted,
  },
  monthTextActive: {
    color: VD.accentDark,
  },
  subText: {
    ...TYPOGRAPHY.caption,
    color: VD.muted,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  subTextStrong: {
    color: VD.ink,
    fontWeight: "800",
  },
  card: {
    width: "100%",
    backgroundColor: VD.cardBg,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    shadowColor: VD.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: SPACING.sm,
  },
  weekText: {
    ...TYPOGRAPHY.caption,
    width: `${100 / 7}%`,
    color: VD.muted,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayOuter: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
  },
  dayBox: {
    flex: 1,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: VD.cardSoft,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  completedDay: {
    backgroundColor: VD.accent,
    borderColor: VD.accent,
  },
  missedDay: {
    backgroundColor: "rgba(243,140,154,0.12)",
    borderColor: "rgba(243,140,154,0.28)",
  },
  partialDay: {
    backgroundColor: "rgba(248,184,78,0.14)",
    borderColor: VD.warning,
  },
  todayDay: {
    borderColor: VD.accentDark,
    borderWidth: 2,
  },
  selectedDay: {
    backgroundColor: "rgba(142,162,255,0.18)",
    borderColor: VD.accentDark,
    borderWidth: 2,
  },
  dayText: {
    ...TYPOGRAPHY.caption,
    color: VD.ink,
  },
  completedText: {
    color: VD.ink,
  },
  partialText: {
    color: VD.warning,
  },
  selectedText: {
    color: VD.accentDark,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statTextRow: {
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  statValue: {
    ...TYPOGRAPHY.bodyMedium,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: VD.softText,
  },
  highestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: VD.cardBg,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    shadowColor: VD.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  trophyWrap: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: "rgba(248,184,78,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  highestCopy: {
    flex: 1,
  },
  highestTitle: {
    ...TYPOGRAPHY.caption,
    color: VD.ink,
  },
  highestAccent: {
    color: VD.accentDark,
    fontWeight: "800",
  },
  highestRight: {
    alignItems: "flex-end",
  },
  highestValue: {
    ...TYPOGRAPHY.bodyMedium,
    color: VD.accentDark,
  },
  highestDate: {
    ...TYPOGRAPHY.caption,
    color: VD.muted,
    marginTop: 2,
  },
  stateBox: {
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    ...TYPOGRAPHY.body,
    color: VD.muted,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  retryButton: {
    marginTop: SPACING.md,
    minHeight: 42,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: VD.accentFaint,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  retryText: {
    ...TYPOGRAPHY.bodyMedium,
    color: VD.accentDark,
  },
});
