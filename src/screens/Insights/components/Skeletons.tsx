import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { AppTheme } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

/** Loading placeholder row for slow AI sections (patterns / recommendations). */
export const SkeletonRow: React.FC<{ colors: AppTheme }> = ({ colors }) => {
  const block = colors.border;
  return (
    <View style={[styles.skeletonRow, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
      <View style={[styles.skeletonIcon, { backgroundColor: block }]} />
      <View style={styles.skeletonTextCol}>
        <View style={[styles.skeletonLine, { width: '70%', backgroundColor: block }]} />
        <View style={[styles.skeletonLine, { width: '95%', backgroundColor: block }]} />
      </View>
    </View>
  );
};

/** Loading placeholder for the Insulin card. Mirrors the loaded card's layout (ring + text +
 * disclaimer bar) so the card keeps the SAME height while loading and never "jumps into place". */
export const InsulinSkeleton: React.FC<{ colors: AppTheme }> = ({ colors }) => {
  const block = colors.border;
  return (
    <>
      <View style={styles.insulinContent}>
        <View style={[styles.skeletonIcon, styles.insulinRing, { backgroundColor: block }]} />
        <View style={styles.skeletonTextCol}>
          <View style={[styles.skeletonLine, { width: '50%', backgroundColor: block }]} />
          <View style={[styles.skeletonLine, { width: '95%', backgroundColor: block }]} />
          <View style={[styles.skeletonLine, { width: '80%', backgroundColor: block }]} />
        </View>
      </View>
      <View style={styles.insulinDisclaimer}>
        <View style={styles.skeletonTextCol}>
          <View style={[styles.skeletonLine, { width: '90%', backgroundColor: block }]} />
          <View style={[styles.skeletonLine, { width: '70%', backgroundColor: block }]} />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  skeletonIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    opacity: 0.6,
  },
  insulinRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  skeletonTextCol: {
    flex: 1,
    gap: spacing.sm,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 5,
    opacity: 0.6,
  },
  insulinContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  insulinDisclaimer: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    gap: 10,
  },
});
