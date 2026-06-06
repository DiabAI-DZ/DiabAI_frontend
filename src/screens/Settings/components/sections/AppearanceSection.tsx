import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Palette, Monitor, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { spacing } from '../../../../theme/spacing';
import { borderRadius } from '../../../../theme/borderRadius';
import { SectionCard } from '../SectionCard';

const SEGMENTS = [
  { key: 'system', label: 'System', Icon: Monitor },
  { key: 'light', label: 'Light', Icon: Sun },
  { key: 'dark', label: 'Dark', Icon: Moon },
] as const;

export const AppearanceSection: React.FC = () => {
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
  return (
    <SectionCard title="Appearance" icon={<Palette size={11} color={colors.textOnPrimary} />}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
          <Moon size={18} color={colors.primary} strokeWidth={1.8} />
        </View>
        <View style={styles.main}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Dark Mode</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Follows system by default</Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={() => setThemeMode(isDark ? 'light' : 'dark')}
          trackColor={{ false: colors.toggleOff, true: colors.toggleOn }}
          thumbColor={colors.textOnPrimary}
          ios_backgroundColor={colors.toggleOff}
        />
      </View>

      <View style={[styles.segmentRow, { backgroundColor: colors.backgroundMuted }]}>
        {SEGMENTS.map((opt) => {
          const active = themeMode === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              activeOpacity={0.85}
              onPress={() => setThemeMode(opt.key)}
              style={[styles.segmentBtn, { backgroundColor: active ? colors.primary : 'transparent' }]}
            >
              <opt.Icon size={15} color={active ? colors.textOnPrimary : colors.textSecondary} strokeWidth={2} />
              <Text style={[styles.segmentText, { color: active ? colors.textOnPrimary : colors.textSecondary }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SectionCard>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  iconBox: { width: 36, height: 36, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1 },
  label: { fontSize: 14.5, fontWeight: '600' },
  subtitle: { fontSize: 11.5, fontWeight: '500', marginTop: 1 },
  segmentRow: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.xs, marginBottom: spacing.sm, padding: spacing.xs, borderRadius: borderRadius.md, gap: spacing.xs },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: borderRadius.sm },
  segmentText: { fontSize: 12.5, fontWeight: '700' },
});
