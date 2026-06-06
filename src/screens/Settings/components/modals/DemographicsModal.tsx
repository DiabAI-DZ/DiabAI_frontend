import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { spacing } from '../../../../theme/spacing';
import { borderRadius } from '../../../../theme/borderRadius';
import { CenterPopup } from '../CenterPopup';
import { formStyles } from './formStyles';
import type { UseDemographicsResult } from '../../hooks/useDemographics';

const NUMERIC_FIELDS = [
  { key: 'age', label: 'Age (years)', placeholder: 'e.g. 32' },
  { key: 'weight', label: 'Weight (kg)', placeholder: 'e.g. 78' },
  { key: 'height', label: 'Height (cm)', placeholder: 'e.g. 175' },
] as const;

interface DemographicsModalProps {
  open: boolean;
  onClose: () => void;
  demographics: UseDemographicsResult;
}

export const DemographicsModal: React.FC<DemographicsModalProps> = ({ open, onClose, demographics }) => {
  const { C, colors } = useTheme();
  const { form, setField, saving, save } = demographics;
  return (
    <CenterPopup open={open} onClose={onClose} title="Demographics">
      <View style={formStyles.form}>
        <Text style={[formStyles.label, { color: C.textSm }]}>Sex</Text>
        <View style={styles.sexRow}>
          {(['male', 'female'] as const).map((s) => {
            const active = form.sex === s;
            return (
              <TouchableOpacity
                key={s}
                activeOpacity={0.85}
                onPress={() => setField('sex', s)}
                style={[styles.sexBtn, { backgroundColor: active ? C.redBg : colors.backgroundInput, borderColor: active ? C.red : C.divider }]}
              >
                <Text style={[styles.sexText, { color: active ? C.red : C.text, fontWeight: active ? '700' : '600' }]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {NUMERIC_FIELDS.map((f) => (
          <View key={f.key}>
            <Text style={[formStyles.label, { color: C.textSm }]}>{f.label}</Text>
            <TextInput
              style={[formStyles.input, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.textPrimary }]}
              value={form[f.key]}
              onChangeText={(v) => setField(f.key, v.replace(/[^0-9.]/g, ''))}
              placeholder={f.placeholder}
              placeholderTextColor={C.textXs || colors.textMuted}
              keyboardType="numeric"
            />
          </View>
        ))}

        <TouchableOpacity onPress={save} disabled={saving} activeOpacity={0.85} style={[formStyles.saveBtn, { backgroundColor: saving ? colors.primaryLight : C.red }]}>
          <Text style={[formStyles.saveText, { color: colors.textOnPrimary }]}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </CenterPopup>
  );
};

const styles = StyleSheet.create({
  sexRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  sexBtn: { flex: 1, borderWidth: 1.5, borderRadius: borderRadius.md, paddingVertical: 11, alignItems: 'center' },
  sexText: { fontSize: 14 },
});
