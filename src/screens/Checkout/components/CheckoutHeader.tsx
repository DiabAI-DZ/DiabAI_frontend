import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, Lock } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

/** Checkout top bar: back button, "Checkout / Secure payment" title, SSL badge. */
const CheckoutHeader: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.divider }]}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.8} style={[styles.backBtn, { backgroundColor: colors.primaryLight }]}>
        <ChevronLeft size={20} color={colors.primary} strokeWidth={2.5} />
      </TouchableOpacity>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Checkout</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Secure payment</Text>
      </View>
      <View style={[styles.sslBadge, { backgroundColor: colors.primaryLight }]}>
        <Lock size={12} color={colors.primary} strokeWidth={2.5} />
        <Text style={[styles.sslText, { color: colors.primary }]}>SSL</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 1 },
  sslBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  sslText: { fontSize: 11, fontWeight: '700' },
});

export default CheckoutHeader;
