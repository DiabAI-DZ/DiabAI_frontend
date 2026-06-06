import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Activity, Utensils, Syringe, Zap } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import type { LogbookStats } from '../../../types/logbook';

/** Four summary tiles (scans/meals/doses/active) from the server's whole-result-set stats. */
const SummaryStats: React.FC<{ stats: LogbookStats | null }> = ({ stats }) => {
  const { C, colors } = useTheme();

  const statsData = useMemo(
    () => [
      { label: 'Scans', value: String(stats?.totalScans ?? 0), icon: Activity, color: C.red },
      { label: 'Meals', value: String(stats?.totalMeals ?? 0), icon: Utensils, color: C.amber },
      { label: 'Doses', value: String(stats?.totalInjections ?? 0), icon: Syringe, color: C.blue },
      { label: 'Active', value: String(stats?.totalActivities ?? 0), icon: Zap, color: C.green },
    ],
    [stats, C],
  );

  return (
    <View style={styles.row}>
      {statsData.map((s) => {
        const Icon = s.icon;
        return (
          <View key={s.label} style={[styles.box, { borderColor: C.redBorder, backgroundColor: colors.backgroundCard, shadowColor: colors.shadow }]}>
            <View style={[styles.iconBox, { backgroundColor: `${s.color}12` }]}>
              <Icon size={13} color={s.color} />
            </View>
            <View style={styles.valContainer}>
              <Text style={[styles.valText, { color: C.text }]}>{s.value}</Text>
            </View>
            <Text style={[styles.labelText, { color: C.textSm }]}>{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  box: {
    flex: 1, borderWidth: 1, borderRadius: borderRadius.lg, paddingVertical: spacing.sm, alignItems: 'center',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  iconBox: { width: 26, height: 26, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  valContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  valText: { fontSize: 15, fontWeight: '900', lineHeight: 18 },
  labelText: { fontSize: 8.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 1 },
});

export default SummaryStats;
