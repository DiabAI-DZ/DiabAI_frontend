import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

interface TagPillProps {
  label: string;
  backgroundColor: string;
  textColor: string;
  /** Colored dot before the label (severity pills). */
  dotColor?: string;
  /** Pre-rendered leading icon (source pills). */
  icon?: React.ReactNode;
  /** When set, the pill is outlined instead of filled. */
  borderColor?: string;
}

/** Small rounded label pill used for severity + source tags on a notification. */
const TagPill: React.FC<TagPillProps> = ({ label, backgroundColor, textColor, dotColor, icon, borderColor }) => (
  <View
    style={[
      styles.pill,
      { backgroundColor },
      borderColor ? { borderWidth: 1, borderColor } : null,
    ]}
  >
    {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
    {icon}
    <Text style={[styles.text, { color: textColor }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 9,
    paddingVertical: spacing.xs,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '700' },
});

export default TagPill;
