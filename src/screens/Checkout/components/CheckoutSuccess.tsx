import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import type { PlanType } from '../plans';

/** Post-payment confirmation: status, plan summary, included features, back button. */
const CheckoutSuccess: React.FC<{ plan: PlanType; onDone: () => void }> = ({ plan, onDone }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.glow, { backgroundColor: colors.primaryLight }]}>
        <CheckCircle size={48} color={colors.primary} strokeWidth={2.5} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {plan.amount > 0 ? 'Payment Successful!' : 'Plan Updated'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textPrimary }]}>
        Your <Text style={styles.bold}>{plan.label}</Text> plan is now active.
      </Text>
      <Text style={[styles.extra, { color: colors.textSecondary }]}>
        {plan.amount > 0 ? `${plan.price}${plan.period}, billed securely via Stripe.` : "You're on the Free plan."}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.primary }]}>PLAN INCLUDES</Text>
        {plan.features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <CheckCircle size={16} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>{f}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity onPress={onDone} activeOpacity={0.85} style={[styles.btn, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}>
        <Text style={[styles.btnText, { color: colors.textOnPrimary }]}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxl },
  glow: { width: 100, height: 100, borderRadius: borderRadius.pill, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: 14, marginBottom: spacing.xs, textAlign: 'center' },
  bold: { fontWeight: 'bold' },
  extra: { fontSize: 13, marginBottom: spacing.xxxl, textAlign: 'center' },
  card: { width: '100%', borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.xl, marginBottom: 28 },
  cardTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  featureText: { fontSize: 13 },
  btn: {
    width: '100%',
    height: 54,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 3,
  },
  btnText: { fontSize: 17, fontWeight: 'bold' },
});

export default CheckoutSuccess;
