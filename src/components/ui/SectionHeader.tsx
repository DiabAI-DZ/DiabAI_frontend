import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface SectionHeaderAction {
  label: string;
  onPress: () => void;
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: SectionHeaderAction;
}

/** Title (+ optional subtitle and trailing action) above a list/section. */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.titleColumn}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {action ? (
        <TouchableOpacity onPress={action.onPress} activeOpacity={0.7}>
          <Text style={[styles.action, { color: colors.primary }]}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    ...typography.sectionTitle,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  action: {
    ...typography.buttonSmall,
    marginLeft: spacing.md,
  },
});
