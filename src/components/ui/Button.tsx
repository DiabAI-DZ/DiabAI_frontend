import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { AppTheme } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { borderRadius } from '../../theme/borderRadius';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

interface VariantColors {
  bg: string;
  text: string;
  border: string;
}

const variantColors = (c: AppTheme, variant: ButtonVariant): VariantColors => {
  switch (variant) {
    case 'secondary':
      return { bg: c.backgroundMuted, text: c.textPrimary, border: c.border };
    case 'ghost':
      return { bg: 'transparent', text: c.primary, border: 'transparent' };
    case 'danger':
      return { bg: c.criticalText, text: c.textOnPrimary, border: c.criticalText };
    case 'primary':
    default:
      return { bg: c.primary, text: c.textOnPrimary, border: c.primary };
  }
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
}) => {
  const { colors } = useTheme();
  const { bg, text, border } = variantColors(colors, variant);
  const isDisabled = disabled || loading;

  const sizeStyle = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  const labelStyle = size === 'sm' ? styles.labelSm : styles.label;

  const containerStyle: ViewStyle = {
    backgroundColor: bg,
    borderColor: border,
    opacity: isDisabled ? 0.5 : 1,
    ...(fullWidth ? styles.fullWidth : null),
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.base, sizeStyle, containerStyle]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={text} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
          <Text style={[labelStyle, { color: text }]} numberOfLines={1}>
            {label}
          </Text>
          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  label: {
    ...typography.button,
  },
  labelSm: {
    ...typography.buttonSmall,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});
