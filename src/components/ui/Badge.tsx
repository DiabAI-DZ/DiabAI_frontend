import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { AppTheme } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { borderRadius } from '../../theme/borderRadius';

export type BadgeVariant =
  | 'critical'
  | 'warning'
  | 'info'
  | 'success'
  | 'ai'
  | 'system'
  | 'logged'
  | 'brand'
  | 'muted';

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  /** Shows a colored dot before the label. */
  dot?: boolean;
}

interface VariantColors {
  bg: string;
  text: string;
}

// Every variant maps to existing theme tokens — no hardcoded hex anywhere.
const variantColors = (c: AppTheme, variant: BadgeVariant): VariantColors => {
  switch (variant) {
    case 'critical':
      return { bg: c.criticalBg, text: c.criticalText };
    case 'warning':
      return { bg: c.warningBg, text: c.warningText };
    case 'info':
      return { bg: c.infoBg, text: c.infoText };
    case 'success':
      return { bg: c.successBg, text: c.success };
    case 'ai':
      return { bg: c.aiDetectedBg, text: c.aiDetectedText };
    case 'system':
      return { bg: c.systemTagBg, text: c.systemTagText };
    case 'logged':
      return { bg: c.loggedTagBg, text: c.loggedTagText };
    case 'brand':
      return { bg: c.primaryLight, text: c.primary };
    case 'muted':
    default:
      return { bg: c.backgroundMuted, text: c.textSecondary };
  }
};

export const Badge: React.FC<BadgeProps> = ({ label, variant, size = 'md', icon, dot }) => {
  const { colors } = useTheme();
  const { bg, text } = variantColors(colors, variant);
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        isSm ? styles.containerSm : styles.containerMd,
        { backgroundColor: bg },
      ]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: text }]} /> : null}
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.label, isSm && styles.labelSm, { color: text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.pill,
  },
  containerMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  containerSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.pill,
    marginRight: spacing.xs,
  },
  icon: {
    marginRight: spacing.xs,
  },
  label: {
    ...typography.label,
  },
  labelSm: {
    fontSize: 10,
  },
});
