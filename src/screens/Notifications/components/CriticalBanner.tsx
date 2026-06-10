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
      <AlertTriangle size={11} color={colors.textOnPrimary} strokeWidth={2.4} />
      <Text style={[styles.text, { color: colors.textOnPrimary }]}>REQUIRES IMMEDIATE ATTENTION</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  text: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default CriticalBanner;
