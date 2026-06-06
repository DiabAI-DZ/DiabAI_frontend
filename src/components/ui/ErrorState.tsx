import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  subtitle?: string;
  onRetry: () => void;
}

/** Shown when a fetch fails. Always offers a retry. */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  subtitle = 'Please try again',
  onRetry,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      <View style={styles.action}>
        <Button label="Retry" onPress={onRetry} variant="primary" size="md" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxxl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.cardTitle,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  action: {
    marginTop: spacing.xl,
  },
});
