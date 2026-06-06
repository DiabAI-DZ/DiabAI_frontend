import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

interface SelectOptionProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  subtitle?: string;
  icon?: React.ReactNode;
}

/** A radio-style selectable row used inside the selection popups. */
export const SelectOption: React.FC<SelectOptionProps> = ({ label, selected, onSelect, subtitle, icon }) => {
  const { C, colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[styles.btn, { backgroundColor: selected ? C.redBg : colors.backgroundInput, borderColor: selected ? C.red : C.divider }]}
    >
      {icon && (
        <View style={[styles.iconBox, { backgroundColor: selected ? colors.primaryLight : colors.backgroundMuted }]}>{icon}</View>
      )}
      <View style={styles.main}>
        <Text style={[styles.title, { color: selected ? C.red : C.text, fontWeight: selected ? '700' : '600' }]}>{label}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: C.textSm }]}>{subtitle}</Text>}
      </View>
      <View style={[styles.radio, { backgroundColor: selected ? C.red : 'transparent', borderColor: selected ? C.red : colors.border }]}>
        {selected && <Check size={10} color={colors.textOnPrimary} strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  iconBox: { width: 32, height: 32, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1 },
  title: { fontSize: 14 },
  subtitle: { fontSize: 11.5, marginTop: 1 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
