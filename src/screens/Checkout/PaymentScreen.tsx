import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/borderRadius';
import type { PlanKey } from '../../services/subscriptionService';
import { backendPlanFor, type PlanType } from './plans';
import { useCheckout } from './hooks/useCheckout';
import CheckoutHeader from './components/CheckoutHeader';
import PlanCard from './components/PlanCard';
import CheckoutSuccess from './components/CheckoutSuccess';
import FreePlanView from './components/FreePlanView';
import PaidCheckout from './components/PaidCheckout';

export { PLANS } from './plans';

export interface PaymentScreenProps {
  plan: PlanType;
  onBack: () => void;
  onSuccess?: () => void;
}

/** Checkout orchestrator: routes between success / free / Stripe-setup / paid-checkout states. */
const PaymentScreen: React.FC<PaymentScreenProps> = ({ plan, onBack, onSuccess }) => {
  const { colors } = useTheme();
  const co = useCheckout(plan, onBack, onSuccess);

  if (co.paid) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <CheckoutSuccess plan={plan} onDone={co.handleDone} />
      </SafeAreaView>
    );
  }

  if (plan.amount === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <FreePlanView plan={plan} processing={co.freeProcessing} error={co.freeError} onBack={onBack} onActivate={co.activateFree} />
      </SafeAreaView>
    );
  }

  if (co.setupLoading || !co.clientSecret || !co.publishableKey) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <CheckoutHeader onBack={onBack} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <PlanCard plan={plan} />
          <View style={styles.centerState}>
            {co.setupError ? (
              <>
                <AlertTriangle size={28} color={colors.primary} />
                <Text style={[styles.centerStateText, { color: colors.textPrimary }]}>{co.setupError}</Text>
                {!co.publishableKey && (
                  <Text style={[styles.centerStateSub, { color: colors.textSecondary }]}>Stripe is not configured (missing publishable key).</Text>
                )}
                <TouchableOpacity onPress={co.loadSetupIntent} activeOpacity={0.85} style={[styles.retryBtn, { borderColor: colors.primary }]}>
                  <Text style={[styles.retryBtnText, { color: colors.primary }]}>Try again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.centerStateSub, { color: colors.textSecondary }]}>Preparing secure checkout…</Text>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <StripeProvider publishableKey={co.publishableKey} merchantIdentifier="merchant.com.anonymous.DiabAI">
      <PaidCheckout
        plan={plan}
        backendPlan={backendPlanFor(plan.id) as Exclude<PlanKey, 'free'>}
        clientSecret={co.clientSecret}
        onBack={onBack}
        onPaid={co.markPaid}
      />
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 14 },
  centerStateText: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: spacing.xxl },
  centerStateSub: { fontSize: 12, textAlign: 'center', paddingHorizontal: spacing.xxl },
  retryBtn: { marginTop: spacing.xs, borderWidth: 1.5, borderRadius: borderRadius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  retryBtnText: { fontSize: 14, fontWeight: '700' },
});

export default PaymentScreen;
