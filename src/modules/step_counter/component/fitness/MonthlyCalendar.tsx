import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import i18n from '../../../../i18n';
import { useStepStyles } from '../../utils/useStepTheme';

interface MonthlyCalendarProps {
  currentDate: Date;
}

const C_LIGHT = {
  card: '#FFFFFF',
  border: '#E9EEFA',
  ink: '#10152D',
  muted: '#777FA5',
  outside: '#ACB4CB',
  day: '#F7F9FF',
  active: '#773CFF',
  onActive: '#FFFFFF',
};

type Palette = typeof C_LIGHT;

const C_DARK: Palette = {
  card: '#161C33',
  border: 'rgba(174,188,255,0.14)',
  ink: '#F2F4FF',
  muted: '#9AA3C7',
  outside: '#5C6488',
  day: '#1C2340',
  active: '#A585FF',
  onActive: '#FFFFFF',
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Monday-to-Sunday week containing `date`, built with real Date arithmetic so
// weeks that cross a month or year boundary get the correct dates.
const getWeek = (date: Date): Date[] => {
  const mondayOffset = (date.getDay() + 6) % 7;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset);
  return Array.from(
    { length: 7 },
    (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i),
  );
};

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ currentDate }) => {
  const { styles } = useStepStyles(C_LIGHT, C_DARK, createStyles);
  const lang = i18n.language;
  const week = useMemo(() => getWeek(currentDate), [currentDate]);
  const title = useMemo(
    () => new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(currentDate),
    [lang, currentDate],
  );
  const weekdayFmt = useMemo(() => new Intl.DateTimeFormat(lang, { weekday: 'short' }), [lang]);
  const fullFmt = useMemo(() => new Intl.DateTimeFormat(lang, { dateStyle: 'full' }), [lang]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.row}>
        {week.map(date => {
          const active = sameDay(date, currentDate);
          const outside = date.getMonth() !== currentDate.getMonth();
          return (
            <View
              key={date.toDateString()}
              style={[styles.day, active && styles.dayActive]}
              accessible
              accessibilityLabel={fullFmt.format(date)}
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.weekday, active && styles.activeText]} numberOfLines={1}>
                {weekdayFmt.format(date)}
              </Text>
              <Text style={[styles.date, outside && styles.outside, active && styles.activeText]}>
                {date.getDate()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (C: Palette) => StyleSheet.create({
  container: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  title: { fontSize: 17, fontWeight: '800', color: C.ink, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 4 },
  day: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: C.day,
  },
  dayActive: { backgroundColor: C.active },
  weekday: { fontSize: 11, fontWeight: '700', color: C.muted },
  date: { fontSize: 15, fontWeight: '800', color: C.ink, marginTop: 4 },
  outside: { color: C.outside },
  activeText: { color: C.onActive },
});

export default React.memo(MonthlyCalendar);
