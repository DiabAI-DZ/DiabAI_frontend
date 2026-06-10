import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { BRAND_RED_GRADIENT } from '../../../theme/colors';

export interface DateRange {
  dateFrom: Date | null;
  dateTo: Date | null;
}

interface DateStripProps {
  /**
   * Fired on every selection change:
   *   tap 1 → { dateFrom, dateTo: null }
   *   tap 2 → { dateFrom, dateTo }            (dateTo always after dateFrom)
   *   tap 3 → starts a new range: { dateFrom, dateTo: null }
   * (A full clear emits { dateFrom: null, dateTo: null }.)
   */
  onRangeSelected: (range: DateRange) => void;
  initialFrom?: Date | null;
  initialTo?: Date | null;
  /** Set of 'YYYY-MM-DD' strings that have logged data (gray dot under the day). */
  datesWithData?: Set<string>;
}

const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const CELL_WIDTH = 52;
const CELL_GAP = 8;
const ITEM_SIZE = CELL_WIDTH + CELL_GAP;

const startOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const fmt = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isToday = (d: Date): boolean => fmt(d) === fmt(new Date());

/**
 * Horizontal scrollable date RANGE selector.
 * Two taps pick a range (date_from → date_to); a third tap starts a new range.
 * Tapping a day before the current date_from makes it the new date_from and clears date_to.
 */
const DateStrip: React.FC<DateStripProps> = ({
  onRangeSelected,
  initialFrom,
  initialTo,
  datesWithData,
}) => {
  const { C, colors } = useTheme();
  const listRef = useRef<FlatList<Date>>(null);

  const [dateFrom, setDateFrom] = useState<Date | null>(initialFrom ? startOfDay(initialFrom) : null);
  const [dateTo, setDateTo] = useState<Date | null>(initialTo ? startOfDay(initialTo) : null);
  // 0 = nothing, 1 = from set, 2 = both set (next tap starts a new range).
  const [selectionStep, setSelectionStep] = useState<0 | 1 | 2>(
    initialFrom && initialTo ? 2 : initialFrom ? 1 : 0
  );

  const dates = useMemo(() => {
    // Span 30 days before today through 30 days after today (61 days total).
    const start = startOfDay(new Date());
    start.setDate(start.getDate() - 30);
    const arr: Date[] = [];
    const cur = new Date(start);
    for (let i = 0; i <= 60; i++) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }, []);

  const fromStr = dateFrom ? fmt(dateFrom) : null;
  const toStr = dateTo ? fmt(dateTo) : null;

  // Keep the (start of the) range — or today — centred.
  const focusIndex = useMemo(() => {
    const target = startOfDay(dateFrom ?? new Date());
    const ts = fmt(target);
    return dates.findIndex(d => fmt(d) === ts);
  }, [dates, dateFrom]);

  useEffect(() => {
    if (focusIndex < 0) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: focusIndex, viewPosition: 0.5, animated: true });
    }, 120);
    return () => clearTimeout(t);
  }, [focusIndex]);

  const handlePress = useCallback(
    (day: Date) => {
      const d = startOfDay(day);
      // Start (or restart) a range.
      if (selectionStep === 0 || selectionStep === 2) {
        setDateFrom(d);
        setDateTo(null);
        setSelectionStep(1);
        onRangeSelected({ dateFrom: d, dateTo: null });
        return;
      }
      // selectionStep === 1: choose the second end.
      if (dateFrom && d.getTime() > startOfDay(dateFrom).getTime()) {
        setDateTo(d);
        setSelectionStep(2);
        onRangeSelected({ dateFrom, dateTo: d });
      } else {
        // Tapped on/before date_from → it becomes the new date_from, date_to cleared.
        setDateFrom(d);
        setDateTo(null);
        setSelectionStep(1);
        onRangeSelected({ dateFrom: d, dateTo: null });
      }
    },
    [selectionStep, dateFrom, onRangeSelected]
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<Date> | null | undefined, index: number) => ({
      length: ITEM_SIZE,
      offset: ITEM_SIZE * index,
      index,
    }),
    []
  );

  const isBetween = useCallback(
    (d: Date): boolean => {
      if (!dateFrom || !dateTo) return false;
      const t = startOfDay(d).getTime();
      return t > startOfDay(dateFrom).getTime() && t < startOfDay(dateTo).getTime();
    },
    [dateFrom, dateTo]
  );

  const renderItem = useCallback(
    ({ item }: { item: Date }) => {
      const str = fmt(item);
      const isEndpoint = str === fromStr || str === toStr;
      const between = isBetween(item);
      const hasData = datesWithData?.has(str);
      const today = isToday(item);

      const cellStyle = isEndpoint
        ? [styles.cellActive]
        : between
          ? [styles.cellBetween, { backgroundColor: colors.primaryLight, borderColor: C.redBorder }]
          : [styles.cellInactive, { backgroundColor: colors.backgroundCard, borderColor: C.redBorder }];

      // Dot: between = red; endpoint w/ data = white; unselected w/ data = gray.
      let dotColor: string | null = null;
      if (between) dotColor = C.red;
      else if (isEndpoint) dotColor = hasData ? colors.textOnPrimary : null;
      else if (hasData) dotColor = colors.textSecondary;

      return (
        <TouchableOpacity activeOpacity={0.8} onPress={() => handlePress(item)} style={[styles.cell, ...cellStyle, isEndpoint && { shadowColor: colors.primary }]}>
          {isEndpoint && (
            <LinearGradient
              colors={BRAND_RED_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
          )}
          <Text style={[styles.dayLabel, { color: isEndpoint ? colors.textOnPrimary : colors.textPrimary }]}>
            {DAY_ABBR[item.getDay()]}
          </Text>
          <Text
            style={[
              styles.dayNum,
              { color: isEndpoint ? colors.textOnPrimary : colors.textPrimary },
              today && !isEndpoint && { color: C.red },
            ]}
          >
            {item.getDate()}
          </Text>
          <View style={styles.dotSlot}>
            {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
          </View>
        </TouchableOpacity>
      );
    },
    [fromStr, toStr, isBetween, datesWithData, handlePress, C]
  );

  return (
    <FlatList
      ref={listRef}
      data={dates}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={d => d.toISOString()}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      initialScrollIndex={focusIndex >= 0 ? focusIndex : undefined}
      snapToInterval={ITEM_SIZE}
      decelerationRate="fast"
      style={styles.list}
      contentContainerStyle={styles.content}
      onScrollToIndexFailed={info => {
        setTimeout(() => {
          listRef.current?.scrollToOffset({ offset: ITEM_SIZE * info.index, animated: true });
        }, 60);
      }}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flexGrow: 0,
    paddingVertical: 12,
  },
  content: {
    paddingHorizontal: 16,
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_WIDTH,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cellBetween: {
    borderWidth: 1,
  },
  cellInactive: {
    borderWidth: 1,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  dotSlot: {
    height: 8,
    marginTop: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default DateStrip;
