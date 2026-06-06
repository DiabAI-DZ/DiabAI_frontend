import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardForm } from '@stripe/stripe-react-native';
import { Lock, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import type { PlanKey } from '../../../services/subscriptionService';
import { CHECKOUT_PRIMARY_DISABLED, type PlanType } from '../plans';
import { usePaidCheckout } from '../hooks/usePaidCheckout';
import CheckoutHeader from './CheckoutHeader';
import PlanCard from './PlanCard';

interface PaidCheckoutProps {
  plan: PlanType;
  backendPlan: Exclude<PlanKey, 'free'>;
  clientSecret: string;
  onBack: () => void;
  onPaid: () => void;
}

/** Paid-plan checkout: Stripe card form + save-card toggle + pay button. */
const PaidCheckout: React.FC<PaidCheckoutProps> = ({ plan, backendPlan, clientSecret, onBack, onPaid }) => {
  const { colors } = useTheme();
  const c = usePaidCheckout(clientSecret, backendPlan, onPaid);
  const payDisabled = !c.cardComplete || c.isProcessing;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <CheckoutHeader onBack={onBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <PlanCard plan={plan} />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Card Details</Text>
          <CardForm
            cardStyle={{
              backgroundColor: colors.backgroundInput,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: borderRadius.md,
              textColor: colors.textPrimary,
              placeholderColor: colors.textMuted,
              fontSize: 15,
            }}
            style={styles.cardForm}
            onFormComplete={(details) => c.setCardComplete(!!details.complete)}
          />

          {c.error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.criticalBg, borderColor: colors.border }]}>
              <AlertTriangle size={14} color={colors.criticalText} />
              <Text style={[styles.errorBannerText, { color: colors.criticalText }]}>{c.error}</Text>
            </View>
          )}

          <View style={[styles.saveRow, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <View style={styles.flex}>
              <Text style={[styles.saveTitle, { color: colors.textPrimary }]}>Save this card</Text>
              <Text style={[styles.saveSub, { color: colors.textSecondary }]}>For faster future payments</Text>
            </View>
            <Switch
              value={c.saveCard}
              onValueChange={c.setSaveCard}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.textOnPrimary}
              ios_backgroundColor={colors.border}
            />
          </View>

          <View style={styles.secureRow}>
            <Lock size={13} color={colors.success} />
            <Text style={[styles.secureText, { color: colors.success }]}>
              Encrypted & tokenized by Stripe. We never see or store your card number.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            onPress={c.handlePay}
            disabled={payDisabled}
            activeOpacity={0.85}
            style={[styles.payBtn, { backgroundColor: payDisabled ? CHECKOUT_PRIMARY_DISABLED : colors.primary, shadowColor: colors.shadow }]}
          >
            {c.isProcessing ? (
              <View style={styles.payRow}>
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
                <Text style={[styles.payBtnText, { color: colors.textOnPrimary }]}>Processing…</Text>
              </View>
            ) : (
              <Text style={[styles.payBtnText, { color: colors.textOnPrimary }]}>{`Pay ${plan.price}${plan.period}`}</Text>
            )}
          </TouchableOpacity>
          <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
            {`You will be charged ${plan.price}${plan.period}. Cancel anytime.`}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: spacing.sm },
  cardForm: { width: '100%', height: 220, marginBottom: spacing.md },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md,
    borderRadius: borderRadius.md, borderWidth: 1, marginBottom: spacing.md,
  },
  errorBannerText: { flex: 1, fontSize: 12, lineHeight: 16 },
  saveRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: borderRadius.md, padding: 14, marginBottom: 14,
  },
  saveTitle: { fontSize: 15, fontWeight: 'bold' },
  saveSub: { fontSize: 12, marginTop: 2 },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: 2 },
  secureText: { flex: 1, fontSize: 11, lineHeight: 14 },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  payBtn: {
    height: 54, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 3,
  },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  payBtnText: { fontSize: 17, fontWeight: 'bold' },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: spacing.sm },
});

export default PaidCheckout;
