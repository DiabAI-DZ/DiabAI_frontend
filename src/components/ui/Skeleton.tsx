import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius as radii } from '../../theme/borderRadius';

interface SkeletonProps {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Shimmer placeholder shown while data loads. The `useEffect` here drives the looping
 * animation only — it is an animation lifecycle, not data/business logic, which is the
 * one effect a presentational component is allowed to own.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius = radii.sm,
  style,
}) => {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0, duration: 800, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.backgroundMuted, colors.backgroundCard],
  });

  return (
    <Animated.View
      style={[styles.base, { width, height, borderRadius, backgroundColor }, style]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
