import React, { useState } from 'react';
import { KeyboardTypeOptions, StyleProp, StyleSheet, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

interface AuthInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** Renders a password field with a show/hide eye toggle (owns its own visibility state). */
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  maxLength?: number;
  /** Override outer spacing / text styling (callers vary the gap or e.g. center an OTP). */
  containerStyle?: StyleProp<ViewStyle>;
}

/** Themed auth text field. Plain by default; a password variant adds the eye toggle. */
const AuthInput: React.FC<AuthInputProps> = ({
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType,
  autoCapitalize = 'none',
  maxLength,
  containerStyle,
}) => {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(true);

  if (secure) {
    return (
      <View style={[styles.passwordContainer, { backgroundColor: colors.inputPinkBg, borderColor: colors.inputPinkBorder }, containerStyle]}>
        <TextInput
          style={[styles.input, styles.passwordInput, { color: colors.textPrimary }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          autoCapitalize="none"
          autoCorrect={false}
          value={value}
          onChangeText={onChangeText}
        />
        <TouchableOpacity onPress={() => setHidden(!hidden)} style={styles.eyeIcon}>
          {hidden ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TextInput
      style={[styles.input, { backgroundColor: colors.inputPinkBg, borderColor: colors.inputPinkBorder, color: colors.textPrimary }, containerStyle]}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      maxLength={maxLength}
      value={value}
      onChangeText={onChangeText}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 2,
    borderRadius: borderRadius.md,
    height: 56,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: borderRadius.md,
    height: 56,
    paddingRight: spacing.lg,
    marginBottom: spacing.md,
  },
  passwordInput: {
    flex: 1,
    marginBottom: 0,
    borderWidth: 0,
  },
  eyeIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AuthInput;
