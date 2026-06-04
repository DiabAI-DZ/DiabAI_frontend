import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  StripeProvider,
  CardForm,
  useConfirmSetupIntent,
} from '@stripe/stripe-react-native';
import {
  ChevronLeft,
  Lock,
  CheckCircle,
  Sparkles,
  Shield,
  Zap,
  AlertTriangle,
} from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import {
  subscriptionService,
  SubscriptionApiError,
  PlanKey,
} from '../services/subscriptionService';

/* ─── Exact design palette (per spec — light theme, fixed colors) ─── */
const P = {
  primary: '#8B0000',
  primaryDisabled: 'rgba(139,0,0,0.40)',
  primaryDark: '#6E0000',
  lightRedBg: '#FFF0F0',
  inputBorder: '#FFE4E4',
  screenBg: '#F8F8F8',
  cardBg: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  placeholder: '#C7C7CC',
  green: '#16A34A',
  divider: '#F0E6E6',
};

export const PLANS = [
  {
    id: "free",
    label: "Free",
    price: "Free",
    amount: 0,
    period: "",
    sub: "Basic glucose tracking · Limited history",
    features: ["Basic glucose tracking", "7-day history", "Manual entry only"],
    highlight: false,
  },
  {
    id: "premium",
    label: "Premium",
    price: "€4.99",
    amount: 4.99,
    period: "/month",
    sub: "Full AI insights · Unlimited history · Doctor sharing",
    features: ["Full AI insights", "Unlimited history", "Doctor sharing", "Smart scan"],
    highlight: true,
  },
  {
    id: "annual",
    label: "Annual Premium",
    price: "€41.99",
    amount: 41.99,
    period: "/year",
    sub: "Everything in Premium · Save 30%",
    features: ["All Premium features", "30% savings", "Priority support"],
    highlight: false,
  },
];

type PlanType = typeof PLANS[0];

const PLAN_MAP: Record<string, PlanKey> = {
  free: 'free',
  premium: 'premium_monthly',
  annual: 'premium_annual',
};

const ENV_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

/* ─── Header ─── */
const Header: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} activeOpacity={0.8} style={styles.backBtn}>
      <ChevronLeft size={20} color={P.primary} strokeWidth={2.5} />
    </TouchableOpacity>
    <View style={styles.headerInfo}>
      <Text style={styles.headerTitle}>Checkout</Text>
      <Text style={styles.headerSubtitle}>Secure payment</Text>
    </View>
    <View style={styles.sslBadge}>
      <Lock size={12} color={P.primary} strokeWidth={2.5} />
      <Text style={styles.sslText}>SSL</Text>
    </View>
  </View>
);

/* ─── Plan summary card ─── */
const PlanCard: React.FC<{ plan: PlanType }> = ({ plan }) => (
  <LinearGradient
    colors={[P.primary, P.primaryDark]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.planCard}
  >
    <View style={styles.planCardLeft}>
      <View style={styles.planIcon}>
        {plan.id === 'annual' ? (
          <Zap size={18} color="#fff" />
        ) : plan.id === 'free' ? (
          <Shield size={18} color="#fff" />
        ) : (
          <Sparkles size={18} color="#fff" />
        )}
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.planName}>{plan.label} Plan</Text>
        <Text style={styles.planSub}>{plan.sub.split('·')[0].trim()}</Text>
      </View>
    </View>
    <View style={styles.planCardRight}>
      <Text style={styles.planPrice}>{plan.price}</Text>
      {plan.period !== '' && <Text style={styles.planPeriod}>{plan.period}</Text>}
    </View>
  </LinearGradient>
);

/* ─── Success screen ─── */
const SuccessScreen: React.FC<{ plan: PlanType; onDone: () => void }> = ({ plan, onDone }) => (
  <View style={styles.successContainer}>
    <View style={styles.successGlow}>
      <CheckCircle size={48} color={P.primary} strokeWidth={2.5} />
    </View>
    <Text style={styles.successTitle}>
      {plan.amount > 0 ? 'Payment Successful!' : 'Plan Updated'}
    </Text>
    <Text style={styles.successSubtitle}>
      Your <Text style={{ fontWeight: 'bold' }}>{plan.label}</Text> plan is now active.
    </Text>
    <Text style={styles.successExtra}>
      {plan.amount > 0 ? `${plan.price}${plan.period}, billed securely via Stripe.` : "You're on the Free plan."}
    </Text>
    <View style={styles.successCard}>
      <Text style={styles.successCardTitle}>PLAN INCLUDES</Text>
      {plan.features.map((f, i) => (
        <View key={i} style={styles.successFeatureRow}>
          <CheckCircle size={16} color={P.primary} strokeWidth={2.5} />
          <Text style={styles.successFeatureText}>{f}</Text>
        </View>
      ))}
    </View>
    <TouchableOpacity onPress={onDone} activeOpacity={0.85} style={styles.payBtn}>
      <Text style={styles.payBtnText}>Back to Settings</Text>
    </TouchableOpacity>
  </View>
);

/* ─── Paid checkout (rendered inside StripeProvider) ─── */
const PaidCheckout: React.FC<{
  plan: PlanType;
  backendPlan: Exclude<PlanKey, 'free'>;
  clientSecret: string;
  onBack: () => void;
  onPaid: () => void;
}> = ({ plan, backendPlan, clientSecret, onBack, onPaid }) => {
  const { refreshProfile } = useUser();
  const { confirmSetupIntent } = useConfirmSetupIntent();

  const [cardComplete, setCardComplete] = useState(false);
  const [saveCard, setSaveCard] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = useCallback(async () => {
    if (!cardComplete || isProcessing) return;
    setError(null);
    setIsProcessing(true);
    try {
      // Tokenise the card on-device via Stripe — raw card data never reaches our backend.
      const { setupIntent, error: stripeError } = await confirmSetupIntent(clientSecret, {
        paymentMethodType: 'Card',
      });
      if (stripeError) {
        setError(stripeError.message || 'We could not validate your card. Please try again.');
        return;
      }
      const pmId = setupIntent?.paymentMethod?.id || (setupIntent as any)?.paymentMethodId;
      if (!pmId) {
        setError('Could not obtain a payment method from Stripe. Please try again.');
        return;
      }

      // "Save this card" → also persist as a reusable billing method (best-effort).
      if (saveCard) {
        try { await subscriptionService.addBillingMethod(pmId, true); } catch { /* non-fatal */ }
      }

      await subscriptionService.subscribe(backendPlan, pmId);
      await refreshProfile();
      onPaid();
    } catch (err: any) {
      if (err instanceof SubscriptionApiError) {
        setError(err.code === 'card_error' ? err.message : err.message || 'Subscription failed. Please try again.');
      } else {
        setError(err?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [cardComplete, isProcessing, confirmSetupIntent, clientSecret, saveCard, backendPlan, refreshProfile, onPaid]);

  const payDisabled = !cardComplete || isProcessing;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header onBack={onBack} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <PlanCard plan={plan} />

          {/* Card details (Stripe native multi-field form) */}
          <Text style={styles.fieldLabel}>Card Details</Text>
          <CardForm
            cardStyle={{
              backgroundColor: P.cardBg,
              borderColor: P.inputBorder,
              borderWidth: 1,
              borderRadius: 12,
              textColor: P.textPrimary,
              placeholderColor: P.placeholder,
              fontSize: 15,
            }}
            style={styles.cardForm}
            onFormComplete={(details: { complete: boolean } & Record<string, any>) =>
              setCardComplete(!!details.complete)
            }
          />

          {error && (
            <View style={styles.errorBanner}>
              <AlertTriangle size={14} color="#D7181D" />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Save card row */}
          <View style={styles.saveRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.saveTitle}>Save this card</Text>
              <Text style={styles.saveSub}>For faster future payments</Text>
            </View>
            <Switch
              value={saveCard}
              onValueChange={setSaveCard}
              trackColor={{ false: '#D1D5DB', true: P.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D5DB"
            />
          </View>

          {/* Secure note */}
          <View style={styles.secureRow}>
            <Lock size={13} color={P.green} />
            <Text style={styles.secureText}>
              Encrypted & tokenized by Stripe. We never see or store your card number.
            </Text>
          </View>
        </ScrollView>

        {/* Pay button + disclaimer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handlePay}
            disabled={payDisabled}
            activeOpacity={0.85}
            style={[styles.payBtn, { backgroundColor: payDisabled ? P.primaryDisabled : P.primary }]}
          >
            {isProcessing ? (
              <View style={styles.payRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.payBtnText}>Processing…</Text>
              </View>
            ) : (
              <Text style={styles.payBtnText}>{`Pay ${plan.price}${plan.period}`}</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.disclaimer}>
            {`You will be charged ${plan.price}${plan.period}. Cancel anytime.`}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export interface PaymentScreenProps {
  plan: PlanType;
  onBack: () => void;
  onSuccess?: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ plan, onBack, onSuccess }) => {
  const { refreshProfile } = useUser();
  const backendPlan = PLAN_MAP[plan.id] || 'premium_monthly';

  const [paid, setPaid] = useState(false);

  // SetupIntent state (paid plans only)
  const [setupLoading, setSetupLoading] = useState(plan.amount > 0);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string>(ENV_PUBLISHABLE_KEY);

  // Free plan
  const [freeProcessing, setFreeProcessing] = useState(false);
  const [freeError, setFreeError] = useState<string | null>(null);

  const loadSetupIntent = useCallback(async () => {
    setSetupLoading(true);
    setSetupError(null);
    try {
      const res = await subscriptionService.createSetupIntent();
      setClientSecret(res.client_secret);
      if (res.publishable_key) setPublishableKey(res.publishable_key);
    } catch (err: any) {
      setSetupError(err?.message || 'Could not start a secure checkout. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  }, []);

  useEffect(() => {
    if (plan.amount > 0) loadSetupIntent();
  }, [plan.amount, loadSetupIntent]);

  const handleDone = () => {
    onSuccess?.();
    onBack();
  };

  const handleActivateFree = useCallback(async () => {
    setFreeProcessing(true);
    setFreeError(null);
    try {
      try {
        await subscriptionService.changePlan('free');
      } catch (e) {
        if (!(e instanceof SubscriptionApiError) || e.status >= 500) throw e;
      }
      await refreshProfile();
      setPaid(true);
    } catch (err: any) {
      setFreeError(err?.message || 'Could not update your plan. Please try again.');
    } finally {
      setFreeProcessing(false);
    }
  }, [refreshProfile]);

  if (paid) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <SuccessScreen plan={plan} onDone={handleDone} />
      </SafeAreaView>
    );
  }

  /* ---- Free plan ---- */
  if (plan.amount === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header onBack={onBack} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <PlanCard plan={plan} />
          <View style={styles.freeCard}>
            <Text style={styles.freeTitle}>What's included in the Free Plan:</Text>
            {plan.features.map((f, i) => (
              <View key={i} style={styles.freeRow}>
                <CheckCircle size={16} color={P.primary} strokeWidth={2.5} />
                <Text style={styles.freeText}>{f}</Text>
              </View>
            ))}
            {freeError && (
              <View style={styles.errorBanner}>
                <AlertTriangle size={14} color="#D7181D" />
                <Text style={styles.errorBannerText}>{freeError}</Text>
              </View>
            )}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleActivateFree}
            disabled={freeProcessing}
            activeOpacity={0.85}
            style={[styles.payBtn, { backgroundColor: freeProcessing ? P.primaryDisabled : P.primary }]}
          >
            {freeProcessing ? (
              <View style={styles.payRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.payBtnText}>Processing…</Text>
              </View>
            ) : (
              <Text style={styles.payBtnText}>Activate Free Plan</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.disclaimer}>No credit card required for the Free plan.</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ---- Paid plan: setup-intent loading / error ---- */
  if (setupLoading || !clientSecret || !publishableKey) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header onBack={onBack} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <PlanCard plan={plan} />
          <View style={styles.centerState}>
            {setupError ? (
              <>
                <AlertTriangle size={28} color={P.primary} />
                <Text style={styles.centerStateText}>{setupError}</Text>
                {!publishableKey && (
                  <Text style={styles.centerStateSub}>Stripe is not configured (missing publishable key).</Text>
                )}
                <TouchableOpacity onPress={loadSetupIntent} activeOpacity={0.85} style={styles.retryBtn}>
                  <Text style={styles.retryBtnText}>Try again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={P.primary} />
                <Text style={styles.centerStateSub}>Preparing secure checkout…</Text>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ---- Paid plan: Stripe-ready checkout ---- */
  return (
    <StripeProvider publishableKey={publishableKey} merchantIdentifier="merchant.com.anonymous.DiabAI">
      <PaidCheckout
        plan={plan}
        backendPlan={backendPlan as Exclude<PlanKey, 'free'>}
        clientSecret={clientSecret}
        onBack={onBack}
        onPaid={() => setPaid(true)}
      />
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.screenBg,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: P.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: P.divider,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: P.lightRedBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: P.textPrimary },
  headerSubtitle: { fontSize: 13, color: P.textSecondary, marginTop: 1 },
  sslBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: P.lightRedBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sslText: { fontSize: 11, fontWeight: '700', color: P.primary },

  /* Scroll body */
  scrollContent: { padding: 16, paddingBottom: 24 },

  /* Plan card */
  planCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: P.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  planCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  planIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  planSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  planCardRight: { alignItems: 'flex-end' },
  planPrice: { fontSize: 22, fontWeight: '900', color: '#fff' },
  planPeriod: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  /* Fields */
  fieldLabel: { fontSize: 13, fontWeight: '600', color: P.textSecondary, marginBottom: 8 },
  cardForm: {
    width: '100%',
    height: 220,
    marginBottom: 12,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  errorBannerText: { flex: 1, fontSize: 12, color: '#B91C1C', lineHeight: 16 },

  /* Save card row */
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.inputBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  saveTitle: { fontSize: 15, fontWeight: 'bold', color: P.textPrimary },
  saveSub: { fontSize: 12, color: P.textSecondary, marginTop: 2 },

  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  secureText: { flex: 1, fontSize: 11, color: '#166534', lineHeight: 14 },

  /* Footer */
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: P.screenBg,
  },
  payBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.primary,
    shadowColor: P.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 3,
  },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  disclaimer: { fontSize: 11, color: P.textSecondary, textAlign: 'center', marginTop: 10 },

  /* Free plan */
  freeCard: {
    backgroundColor: P.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.inputBorder,
    padding: 20,
  },
  freeTitle: { fontSize: 14, fontWeight: 'bold', color: P.textPrimary, marginBottom: 12 },
  freeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  freeText: { fontSize: 13, color: P.textPrimary },

  /* Loading / error states */
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 14 },
  centerStateText: { fontSize: 14, fontWeight: '600', color: P.textPrimary, textAlign: 'center', paddingHorizontal: 24 },
  centerStateSub: { fontSize: 12, color: P.textSecondary, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: { marginTop: 4, borderWidth: 1.5, borderColor: P.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: P.primary },

  /* Success */
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  successGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: P.lightRedBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: P.textPrimary, marginBottom: 8, textAlign: 'center' },
  successSubtitle: { fontSize: 14, color: P.textPrimary, marginBottom: 4, textAlign: 'center' },
  successExtra: { fontSize: 13, color: P.textSecondary, marginBottom: 32, textAlign: 'center' },
  successCard: { width: '100%', backgroundColor: P.cardBg, borderRadius: 18, borderWidth: 1, borderColor: P.inputBorder, padding: 20, marginBottom: 28 },
  successCardTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: P.primary, marginBottom: 12 },
  successFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  successFeatureText: { fontSize: 13, color: P.textPrimary },
});

export default PaymentScreen;
