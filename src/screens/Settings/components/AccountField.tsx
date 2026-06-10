import React, { useState } from 'react';
import { KeyboardTypeOptions, StyleSheet, Text, TextInput, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

interface AccountFieldProps {
  label: string;
  icon: LucideIcon;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: KeyboardTypeOptions;
}

/** Labeled icon text field with a focus highlight. Owns its own focus state. */
const AccountField: React.FC<AccountFieldProps> = ({ label, icon: Icon, value, onChangeText, keyboardType }) => {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: focused ? colors.primary : colors.textSecondary }]}>{label}</Text>
      <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: focused ? colors.primary : colors.inputBorder }]}>
        <View style={styles.icon}>
          <Icon size={18} color={colors.inputText} strokeWidth={1.8} />
        </View>
        <TextInput
          style={[styles.input, { color: colors.inputText }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType || 'default'}
          placeholder={label}
          placeholderTextColor={colors.inputText}
          autoCorrect={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: spacing.sm },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 2,
    height: 56,
    paddingHorizontal: spacing.lg,
  },
  icon: { marginRight: spacing.md },
  input: { flex: 1, fontSize: 16, height: '100%' },
});

export default AccountField;
