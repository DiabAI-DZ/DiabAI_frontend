import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isSameDay, isAfter, subDays } from 'date-fns';
import { useTheme } from '../../../theme/ThemeContext';
import { borderRadius } from '../../../theme/borderRadius';

interface FilterDateStripProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}

const ACTIVE_DAY_NAME = 'rgba(255,255,255,0.8)';
const ACTIVE_DOT = 'rgba(255,255,255,0.7)';

/** Horizontal 14-day strip (7 past + today + 6 future, future disabled) for custom range pick. */
const FilterDateStrip: React.FC<FilterDateStripProps> = ({ selectedDate, onSelect }) => {
  const { C, colors } = useTheme();
  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => subDays(today, 7 - i)), [today]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent} style={styles.frame}>
      {days.map((day) => {
        const isActive = selectedDate ? isSameDay(day, selectedDate) : isSameDay(day, today);
        const isToday = isSameDay(day, today);
        const isFuture = isAfter(day, today);

        return (
          <TouchableOpacity
            key={day.toISOString()}
            onPress={() => !isFuture && onSelect(day)}
            disabled={isFuture}
            style={[
              styles.card,
              {
                borderColor: isActive ? C.red : isToday ? C.redBorder : colors.border,
                backgroundColor: isActive ? 'transparent' : colors.backgroundMuted,
                opacity: isFuture ? 0.35 : 1,
              },
            ]}
          >
            {isActive ? (
              <LinearGradient colors={[C.red, C.redDark]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            ) : null}
            <Text style={[styles.dayName, { color: isActive ? ACTIVE_DAY_NAME : C.redMuted }]}>{format(day, 'EEE').toUpperCase()}</Text>
            <Text style={[styles.dayNum, { color: isActive ? colors.textOnPrimary : C.textDark }]}>{format(day, 'd')}</Text>
            {isToday && <View style={[styles.todayDot, { backgroundColor: isActive ? ACTIVE_DOT : C.red }]} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  frame: { marginTop: 6 },
  scrollContent: { gap: 8, paddingBottom: 4 },
  card: { width: 50, height: 64, borderRadius: borderRadius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  dayName: { fontSize: 8.5, fontWeight: '700', letterSpacing: 0.3 },
  dayNum: { fontSize: 18, fontWeight: '900', lineHeight: 20, marginTop: 2 },
  todayDot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 4 },
});

export default FilterDateStrip;
