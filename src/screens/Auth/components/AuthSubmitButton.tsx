import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { borderRadius } from '../../../theme/borderRadius';
import { spacing } from '../../../theme/spacing';

interface AuthSubmitButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
}

/** Full-width primary auth action button with a loading spinner. */
const AuthSubmitButton: React.FC<AuthSubmitButtonProps> = ({ label, onPress, loading = false }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.textOnPrimary} />
      ) : (
        <Text style={[styles.text, { color: colors.textOnPrimary }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing.xxl,
  },
  text: { fontSize: 16, fontWeight: 'bold' },
});

export default AuthSubmitButton;
