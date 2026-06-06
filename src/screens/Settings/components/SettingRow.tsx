import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

export interface SettingBadge {
  label: string;
  color: string;
  bg: string;
}

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  value?: string;
  badge?: SettingBadge;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  icon, label, subtitle, toggle, toggleValue, onToggle, onClick, value, badge,
}) => {
  const { C, colors } = useTheme();
  return (
    <TouchableOpacity style={styles.row} onPress={onClick || onToggle} disabled={!onClick && !onToggle}>
      <View style={[styles.iconBox, { backgroundColor: C.redBg }]}>{icon}</View>
      <View style={styles.main}>
        <Text style={[styles.label, { color: C.text }]}>{label}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: C.textSm }]}>{subtitle}</Text>}
      </View>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: colors.toggleOff, true: C.red }}
          thumbColor={colors.textOnPrimary}
        />
      ) : (
        <View style={styles.right}>
          {badge && (
            <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          )}
          {value ? (
            <View style={styles.valueRow}>
              <Text style={[styles.valueText, { color: C.textSm }]}>{value}</Text>
              <ChevronRight size={16} color={C.textSm} />
            </View>
          ) : (
            <ChevronRight size={18} color={C.textSm} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  iconBox: { width: 36, height: 36, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1 },
  label: { fontSize: 14.5, fontWeight: '600' },
  subtitle: { fontSize: 11.5, fontWeight: '500', marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgePill: { borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  valueText: { fontSize: 13, fontWeight: '500' },
});
