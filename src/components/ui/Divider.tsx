import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';

interface DividerProps {
  /** Vertical margin above/below the line. Defaults to no margin. */
  spacingY?: keyof typeof spacing;
  style?: ViewStyle;
}

/** Hairline separator using the theme divider token. */
export const Divider: React.FC<DividerProps> = ({ spacingY, style }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.line,
        { backgroundColor: colors.divider },
        spacingY ? { marginVertical: spacing[spacingY] } : null,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
