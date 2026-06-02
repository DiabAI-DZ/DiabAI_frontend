import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export interface DateRange {
  dateFrom: Date;
  dateTo: Date;
}

interface CalendarRangePickerProps {
  /** Pre-selected start of range (optional). */
  initialFrom?: Date | null;
  /** Pre-selected end of range (optional). */
  initialTo?: Date | null;
  /** Fired once BOTH ends are chosen; the parent re-fetches insights for this range. */
  onRangeSelected: (range: DateRange) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const startOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const sameDay = (a: Date | null, b: Date | null): boolean =>
  !!a && !!b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isBetween = (d: Date, a: Date, b: Date): boolean => {
  const t = startOfDay(d).getTime();
  return t > startOfDay(a).getTime() && t < startOfDay(b).getTime();
};

/**
 * Full-month calendar with a two-tap range selection:
 *   tap 1 → date_from   tap 2 → date_to   tap 3 → reset and start a new range.
 * Taps are ordered automatically so date_from is always the earlier day.
 */
const CalendarRangePicker: React.FC<CalendarRangePickerProps> = ({
  initialFrom,
  initialTo,
  onRangeSelected,
}) => {
  const { C } = useTheme();
  const today = useMemo(() => startOfDay(new Date()), []);

  const [viewMonth, setViewMonth] = useState<Date>(() =>
    startOfDay(initialTo || initialFrom || new Date())
  );
  const [dateFrom, setDateFrom] = useState<Date | null>(initialFrom ? startOfDay(initialFrom) : null);
  const [dateTo, setDateTo] = useState<Date | null>(initialTo ? startOfDay(initialTo) : null);
  // 0 = nothing selected, 1 = from selected, 2 = both selected (next tap resets).
  const [selectionStep, setSelectionStep] = useState<0 | 1 | 2>(
    initialFrom && initialTo ? 2 : initialFrom ? 1 : 0
  );

  const goPrevMonth = useCallback(
    () => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)),
    []
  );
  const goNextMonth = useCallback(
    () => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)),
    []
  );

  const handlePress = useCallback(
    (day: Date) => {
      const d = startOfDay(day);
      if (selectionStep === 0 || selectionStep === 2) {
        // Start (or restart) a selection.
        setDateFrom(d);
        setDateTo(null);
        setSelectionStep(1);
      } else {
        // Second tap → close the range, ordering so from <= to.
        let from = dateFrom!;
        let to = d;
        if (to.getTime() < from.getTime()) {
          const tmp = from;
          from = to;
          to = tmp;
        }
        setDateFrom(from);
        setDateTo(to);
        setSelectionStep(2);
        onRangeSelected({ dateFrom: from, dateTo: to });
      }
    },
    [selectionStep, dateFrom, onRangeSelected]
  );

  // 6 rows × 7 columns, Monday-first, including leading/trailing days from adjacent months.
  const weeks = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const first = new Date(year, month, 1);
    const firstWeekday = (first.getDay() + 6) % 7; // Mon=0 … Sun=6
    const cursor = new Date(year, month, 1 - firstWeekday);
    const rows: Date[][] = [];
    for (let w = 0; w < 6; w++) {
      const row: Date[] = [];
      for (let i = 0; i < 7; i++) {
        row.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      rows.push(row);
    }
    return rows;
  }, [viewMonth]);

  const rangeStart = dateFrom;
  const rangeEnd = selectionStep === 2 ? dateTo : null;

  return (
    <View style={[styles.container, { backgroundColor: C.white, borderColor: C.redBorder }]}>
      {/* Month navigation */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={goPrevMonth} style={[styles.navBtn, { backgroundColor: C.redBg }]} hitSlop={8}>
          <ChevronLeft size={18} color={C.red} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: C.text }]}>
          {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={goNextMonth} style={[styles.navBtn, { backgroundColor: C.redBg }]} hitSlop={8}>
          <ChevronRight size={18} color={C.red} />
        </TouchableOpacity>
      </View>

      {/* Weekday labels */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map(w => (
          <View key={w} style={styles.cell}>
            <Text style={[styles.weekday, { color: C.textXs }]}>{w}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      {weeks.map((row, ri) => (
        <View key={ri} style={styles.weekRow}>
          {row.map(day => {
            const inMonth = day.getMonth() === viewMonth.getMonth();
            const isFrom = sameDay(day, rangeStart);
            const isTo = sameDay(day, rangeEnd);
            const isEndpoint = isFrom || isTo;
            const inRange = rangeStart && rangeEnd ? isBetween(day, rangeStart, rangeEnd) : false;
            const isToday = sameDay(day, today);

            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={styles.cell}
                activeOpacity={0.7}
                onPress={() => handlePress(day)}
              >
                <View
                  style={[
                    styles.dayCircle,
                    inRange && { backgroundColor: C.redBg },
                    isEndpoint && { backgroundColor: C.red },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: inMonth ? C.text : C.textXs },
                      isToday && !isEndpoint && { color: C.red, fontWeight: '800' },
                      isEndpoint && { color: '#FFF', fontWeight: '800' },
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                  {/* between-range dot */}
                  {inRange && <View style={[styles.rangeDot, { backgroundColor: C.red }]} />}
                  {/* today underline (only when not an endpoint) */}
                  {isToday && !isEndpoint && !inRange && (
                    <View style={[styles.todayUnderline, { backgroundColor: C.red }]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Selection hint */}
      <Text style={[styles.hint, { color: C.textSm }]}>
        {selectionStep === 1
          ? 'Tap the end date to set the range'
          : selectionStep === 2 && dateFrom && dateTo
            ? `${dateFrom.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${dateTo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : 'Tap a start date'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  weekday: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rangeDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  todayUnderline: {
    position: 'absolute',
    bottom: 5,
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  hint: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default CalendarRangePicker;
