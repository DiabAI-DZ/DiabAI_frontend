import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius } from '../../theme/borderRadius';

interface AvatarProps {
  /** Remote image URI. Falls back to initials when null/undefined. */
  uri?: string | null;
  /** Name used to derive initials for the fallback. */
  name?: string;
  size?: number;
}

const initialsOf = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
};

/** Circular user avatar with an initials fallback. */
export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 40 }) => {
  const { colors } = useTheme();
  const dimensions = { width: size, height: size, borderRadius: borderRadius.pill };

  if (uri) {
    return <Image source={{ uri }} style={dimensions} />;
  }

  return (
    <View
      style={[
        styles.fallback,
        dimensions,
        { backgroundColor: colors.primaryLight },
      ]}
    >
      <Text style={[styles.initials, { color: colors.primary, fontSize: size * 0.4 }]}>
        {initialsOf(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});
