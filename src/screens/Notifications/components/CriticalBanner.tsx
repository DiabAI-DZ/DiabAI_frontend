import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';

/** Red "requires immediate attention" banner shown atop a critical notification card. */
const CriticalBanner: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.banner, { backgroundColor: colors.primary }]}>
      <AlertTriangle size={13} color={colors.textOnPrimary} strokeWidth={2.4} />
      <Text style={[styles.text, { color: colors.textOnPrimary }]}>REQUIRES IMMEDIATE ATTENTION</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});

export default CriticalBanner;
