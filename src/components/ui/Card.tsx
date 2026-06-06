import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, SpacingKey } from '../../theme/spacing';
import { borderRadius, BorderRadiusKey } from '../../theme/borderRadius';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: SpacingKey;
  radius?: BorderRadiusKey;
  onPress?: () => void;
  testID?: string;
}

/** Surface container with themed background + shadow. Pure presentation, zero logic. */
export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'lg',
  radius = 'lg',
  onPress,
  testID,
}) => {
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    backgroundColor: colors.backgroundCard,
    padding: spacing[padding],
    borderRadius: borderRadius[radius],
    shadowColor: colors.shadow,
    ...styles.shadow,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.85}
        onPress={onPress}
        style={[containerStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={[containerStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // shadowColor is applied dynamically from the theme; offset/opacity/elevation are static.
  shadow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
});
