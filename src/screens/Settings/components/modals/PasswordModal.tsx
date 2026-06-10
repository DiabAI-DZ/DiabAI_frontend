import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { spacing } from '../../../../theme/spacing';
import { CenterPopup } from '../CenterPopup';
import { formStyles } from './formStyles';
import type { UsePasswordChangeResult } from '../../hooks/usePasswordChange';

const FIELDS = [
  { key: 'current', label: 'Current Password' },
  { key: 'next', label: 'New Password' },
  { key: 'confirm', label: 'Confirm New Password' },
] as const;

interface PasswordModalProps {
  open: boolean;
  onClose: () => void;
  password: UsePasswordChangeResult;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ open, onClose, password }) => {
  const { C, colors } = useTheme();
  const { form, setField, saving, error, save } = password;
  return (
    <CenterPopup open={open} onClose={onClose} title="Change Password">
      <View style={formStyles.form}>
        {FIELDS.map((f) => (
          <View key={f.key}>
            <Text style={[formStyles.label, { color: C.textSm }]}>{f.label}</Text>
            <TextInput
              style={[formStyles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={form[f.key]}
              onChangeText={(v) => setField(f.key, v)}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.inputText}
            />
          </View>
        ))}

        {error && <Text style={[styles.errorText, { color: colors.criticalText }]}>{error}</Text>}

        <TouchableOpacity onPress={save} disabled={saving} activeOpacity={0.85} style={[formStyles.saveBtn, { backgroundColor: saving ? colors.primaryLight : C.red }]}>
          <Text style={[formStyles.saveText, { color: colors.textOnPrimary }]}>{saving ? 'Updating…' : 'Update Password'}</Text>
        </TouchableOpacity>
      </View>
    </CenterPopup>
  );
};

const styles = StyleSheet.create({
  errorText: { fontSize: 12, marginTop: spacing.sm },
});
