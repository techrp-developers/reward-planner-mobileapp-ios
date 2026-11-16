import { goBackInFitness } from "../../utils/fitnessNavigation";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import LinearGradient from "./FitnessGradient";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";

import { useStepStyles } from "../../utils/useStepTheme";


type ProgressNav = NativeStackNavigationProp<FitnessStackParamList, "PlanProcess">;

type CalendarCell = {
  key: string;
  dayNumber?: number;
  isoDate?: string;
  status?: CalendarDayStatus;
  isToday?: boolean;
  isSelected?: boolean;
  isFuture?: boolean;
};


const VD_DARK = {
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

type Palette = typeof VD_DARK;

const VD_LIGHT: Palette = {
  bg: ["#F5F9FF", "#EEF4FF", "#F3EEFF"],
  ink: "#10152D",
  muted: "#777FA5",
  softText: "#8A92B2",
  accent: "#426BFF",
  accentDark: "#5B3FD9",
  accentFaint: "rgba(66,107,255,0.10)",
  cardBg: "#FFFFFF",
  cardSoft: "#F3F6FD",
  cardBorder: "#E9EEFA",
  success: "#16A34A",
  warning: "#C27C00",
  danger: "#E5484D",
  shadow: "#4664A5",
};

const pad2 =(value: number) => String(value).padStart(2, "0");
const toMonthKey = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
const toIsoDate = (year: number, monthIndex: number, day: number) =>
  `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;

const formatNumber = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString(i18n.language) : "0";

const safeNumber = (value?: number | null) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

const buildMonthOptions = (baseDate: Date, language: string) => {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - 2 + index, 1);
    return {
      key: toMonthKey(date),
      label: new Intl.DateTimeFormat(language, { month: "long" }).format(date),
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
      status: isoDate > todayIso ? undefined : calendarData[isoDate]?.status,
      isFuture: isoDate > todayIso,
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
  const { palette: VD, styles, isDark } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  const { t: tx, i18n: locale } = useTranslation();
  const language = locale.language;
  const fullMonthFormatter = useMemo(() => new Intl.DateTimeFormat(language, { month: "long", year: "numeric" }), [language]);
  const selectedDateFormatter = useMemo(() => new Intl.DateTimeFormat(language, { month: "long", day: "numeric" }), [language]);
  const navigation = useNavigation<ProgressNav>();
  const { width } = useWindowDimensions();
  const today = useMemo(() => new Date(), []);
  const contentMaxWidth = Math.min(width - RESPONSIVE.horizontalPadding * 2, 560);
  const [selectedMonth, setSelectedMonth] = useState(toMonthKey(today));
  const [selectedDate, setSelectedDate] = useState<string | null>(
    toIsoDate(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const monthOptions = useMemo(() => buildMonthOptions(today, language), [today, language]);
  const calendarQuery = useCalendarProgressQuery(selectedMonth);
  const calendarData = useMemo(
    () => calendarQuery.data?.data?.calendar || {},
    [calendarQuery.data]
  );
  const monthlySummary = calendarQuery.data?.data?.summary || null;
  const loadingCalendar = calendarQuery.isLoading;
  const errorMessage =
    calendarQuery.data?.message ||
    (calendarQuery.error ? i18n.t("stepCounter:r2.failedToFetchCalendar") : "");

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
  }, [selectedDate, selectedMonth, fullMonthFormatter, selectedDateFormatter]);

  const highestStepDay = useMemo(() => {
    const todayKey = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());
    const entries = Object.entries(calendarData).filter(([date, data]) => date <= todayKey && safeNumber(data.steps) > 0);
    if (entries.length === 0) return null;

    return entries.reduce(
      (best, [date, data]) =>
        safeNumber(data.steps) > safeNumber(best.data.steps) ? { date, data } : best,
      { date: entries[0][0], data: entries[0][1] }
    );
  }, [calendarData, today]);

  const handleMonthPress = useCallback((monthKey: string) => {
    setSelectedMonth(monthKey);
    setSelectedDate(monthKey === toMonthKey(today)
      ? toIsoDate(today.getFullYear(), today.getMonth(), today.getDate())
      : `${monthKey}-01`);
  }, [today]);

  const handleRetry = useCallback(() => {
    calendarQuery.refetch();
  }, [calendarQuery]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={VD.bg[0]} />
      <LinearGradient colors={VD.bg} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={tx("common:actions.back")} style={styles.iconButton} onPress={() => goBackInFitness(navigation)} activeOpacity={0.82}>
            <MaterialCommunityIcons name="chevron-left" size={25} color={VD.accentDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{tx("stepCounter:progressScreen.yourProgress")}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: RESPONSIVE.horizontalPadding },
          ]}
        >
          <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
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
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
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
              <Text style={styles.subTextStrong}>{fullMonthFormatter.format(new Date(`${selectedMonth}-01T00:00:00`))}</Text>{"\n"}
              {tx("stepCounter:ui.monthSummary", monthStats)}
            </Text>

            <View style={styles.card}>
              {loadingCalendar ? (
                <View style={styles.stateBox}>
                  <ActivityIndicator color={VD.accent} />
                  <Text style={styles.stateText}>{tx("stepCounter:progressScreen.loadingCalendar")}</Text>
                </View>
              ) : errorMessage ? (
                <View style={styles.stateBox}>
                  <Text style={styles.stateText}>{errorMessage}</Text>
                  <TouchableOpacity style={styles.retryButton} activeOpacity={0.86} onPress={handleRetry}>
                    <Text style={styles.retryText}>{tx("stepCounter:progressScreen.retry")}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <CalendarGrid
                  cells={calendarCells}
                  onSelectDate={setSelectedDate}
                />
              )}

              <Text style={styles.detailTitle}>{selectedDateLabel}</Text>
              <View style={styles.statsRow}>
                <Stat
                  value={formatNumber(safeNumber(selectedDayData?.steps))}
                  label={tx("stepCounter:progressScreen.steps")}
                  icon="shoe-print"
                />
                <Stat
                  value={formatNumber(safeNumber(selectedDayData?.calories))}
                  label={tx("stepCounter:progressScreen.kcal")}
                  icon="fire"
                  color={VD.warning}
                />
                <Stat
                  value={safeNumber(selectedDayData?.distance_km).toFixed(1)}
                  label={tx("stepCounter:progressScreen.km")}
                  icon="map-marker-outline"
                />
                <Stat
                  value={formatNumber(safeNumber(selectedDayData?.active_minutes))}
                  label={tx("stepCounter:progressScreen.moveMin")}
                  icon="clock-outline"
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
                    {tx("stepCounter:ui.highestDay")}
                  </Text>
                </View>
                <View style={styles.highestRight}>
                  <Text style={styles.highestValue}>
                    {tx("stepCounter:ui.stepsValue", { count: safeNumber(highestStepDay.data.steps) })}
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

const CalendarGrid = React.memo(({ cells, onSelectDate }: CalendarGridProps) => {
  const { styles } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  const { i18n: locale } = useTranslation();
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale.language, { weekday: "short" }).format(new Date(2024, 0, 1 + index)),
  );
  return (
  <View>
    <View style={styles.weekRow}>
      {weekDays.map((day) => (
        <Text key={day} style={styles.weekText}>{day}</Text>
      ))}
    </View>
    <View style={styles.grid}>
      {cells.map((cell) => (
        <DayItem key={cell.key} cell={cell} onSelectDate={onSelectDate} />
      ))}
    </View>
  </View>
  );
});

type DayItemProps = {
  cell: CalendarCell;
  onSelectDate: (date: string) => void;
};

const DayItem = React.memo(({ cell, onSelectDate }: DayItemProps) => {
  const { palette: VD, styles } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
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
      accessibilityRole="button"
      accessibilityLabel={`${cell.isoDate}${cell.status ? `, ${cell.status}` : ""}`}
      accessibilityState={{ selected: cell.isSelected, disabled: cell.isFuture }}
      disabled={cell.isFuture}
      onPress={() => onSelectDate(cell.isoDate!)}
    >
      <View
        style={[
          styles.dayBox,
          completed && styles.completedDay,
          missed && styles.missedDay,
          partial && styles.partialDay,
          cell.isFuture && styles.futureDay,
          cell.isToday && styles.todayDay,
          cell.isSelected && styles.selectedDay,
        ]}
      >
        {completed ? (
          <MaterialCommunityIcons name="check" size={16} color={cell.isSelected ? VD.accentDark : "#FFFFFF"} />
        ) : (
          <Text
            style={[
              styles.dayText,
              cell.isFuture && styles.futureText,
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
  icon: string;
  color?: string;
};

const Stat = React.memo(({ value, label, icon, color }: StatProps) => {
  const { palette: VD, styles } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  return (
  <View style={styles.statItem}>
    <View style={styles.statIcon}>
      <MaterialCommunityIcons name={icon} size={22} color={color ?? VD.accent} />
    </View>
    <View style={styles.statTextRow}>
      <Text style={[styles.statValue, { color: color ?? VD.accentDark }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
  );
});

const createStyles = (VD: Palette) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: VD.bg[0],
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: 8,
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
    marginBottom: 12,
    paddingHorizontal: RESPONSIVE.horizontalPadding,
    paddingVertical: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: VD.cardSoft,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  headerTitle: {
    fontSize: 20, lineHeight: 28, fontWeight: "800",
    flex: 1, minWidth: 0, paddingHorizontal: 12, paddingVertical: 2,
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
    minHeight: 44,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: VD.cardBg,
    borderRadius: 22,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  monthTabActive: {
    backgroundColor: VD.accent,
    borderColor: VD.accent,
  },
  monthText: {
    ...TYPOGRAPHY.caption,
    color: VD.muted,
  },
  monthTextActive: {
    color: "#FFFFFF",
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
    borderRadius: 24,
    padding: 16,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    shadowColor: VD.shadow,
    shadowOpacity: 0.06,
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
    minHeight: 44,
    aspectRatio: 0.95,
    padding: 3,
  },
  dayBox: {
    flex: 1,
    borderRadius: 12,
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
    backgroundColor: VD.cardSoft,
    borderColor: VD.cardBorder,
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
  futureDay: { backgroundColor: "transparent", borderColor: "transparent" },
  futureText: { color: VD.softText, opacity: 0.55 },
  partialText: {
    color: VD.warning,
  },
  selectedText: {
    color: VD.accentDark,
  },
  detailTitle: { fontSize: 15, lineHeight: 22, fontWeight: "700", color: VD.ink, paddingTop: 20, paddingBottom: 12 },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: VD.accentFaint, alignItems: "center", justifyContent: "center" },
  statItem: {
    flexGrow: 1, flexBasis: "45%", minWidth: 0,
    backgroundColor: VD.cardSoft, borderRadius: 16, padding: 12,
    alignItems: "flex-start",
  },
  statTextRow: {
    alignSelf: "stretch",
    marginTop: SPACING.xs,
  },
  statValue: {
    fontSize: 22, lineHeight: 30, fontWeight: "800", paddingVertical: 2,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: VD.softText,
  },
  highestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: VD.cardBg,
    borderRadius: 24,
    padding: 16,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    shadowColor: VD.shadow,
    shadowOpacity: 0.06,
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
    flex: 1, minWidth: 0,
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
    flex: 1, minWidth: 0, alignItems: "flex-end",
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
