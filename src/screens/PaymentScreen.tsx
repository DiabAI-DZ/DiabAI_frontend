import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  StripeProvider,
  CardField,
  useConfirmSetupIntent,
  CardFieldInput,
} from '@stripe/stripe-react-native';
import {
  ChevronLeft,
  CreditCard,
  Lock,
  CheckCircle,
  Sparkles,
  Shield,
  Zap,
  AlertTriangle,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import {
  subscriptionService,
  SubscriptionApiError,
  PlanKey,
} from '../services/subscriptionService';

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

// Map the screen's plan ids to the backend plan keys.
const PLAN_MAP: Record<string, PlanKey> = {
  free: 'free',
  premium: 'premium_monthly',
  annual: 'premium_annual',
};

// Optional env fallback if the backend's setup-intent response omits the publishable key.
const ENV_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

/* ─── Success Screen ─── */
const SuccessScreen: React.FC<{ plan: PlanType; onDone: () => void }> = ({ plan, onDone }) => {
  const { C } = useTheme();

  return (
    <View style={[styles.successContainer, { backgroundColor: C.bg }]}>
      <View style={styles.successIconWrapper}>
        <View style={[styles.successGlow, { backgroundColor: C.redBg }]}>
          <CheckCircle size={48} color={C.red} strokeWidth={2.5} />
        </View>
      </View>

      <Text style={[styles.successTitle, { color: C.text }]}>
        {plan.amount > 0 ? 'Payment Successful!' : 'Plan Updated'}
      </Text>
      <Text style={[styles.successSubtitle, { color: C.textMd }]}>
        Your <Text style={{ fontWeight: 'bold' }}>{plan.label}</Text> plan is now active.
      </Text>
      <Text style={[styles.successExtra, { color: C.textSm }]}>
        {plan.amount > 0 ? `${plan.price}${plan.period}, billed securely via Stripe.` : "You're on the Free plan."}
      </Text>

      <View style={[styles.successCard, { backgroundColor: C.white, borderColor: C.divider }]}>
        <Text style={[styles.cardListTitle, { color: C.red }]}>PLAN INCLUDES</Text>
        {plan.features.map((f, i) => (
          <View key={i} style={styles.successFeatureRow}>
            <CheckCircle size={16} color={C.red} strokeWidth={2.5} />
            <Text style={[styles.successFeatureText, { color: C.text }]}>{f}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onDone}
        activeOpacity={0.85}
        style={[styles.doneButton, { backgroundColor: C.red }]}
      >
        <Text style={styles.doneButtonText}>Back to Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

/* ─── Shared chrome: header + plan banner + footer pay button ─── */
const CheckoutChrome: React.FC<{
  plan: PlanType;
  onBack: () => void;
  payLabel: string;
  onPay: () => void;
  payDisabled: boolean;
  isProcessing: boolean;
  footerNote: string;
  children: React.ReactNode;
}> = ({ plan, onBack, payLabel, onPay, payDisabled, isProcessing, footerNote, children }) => {
  const { C } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.white, borderBottomColor: C.redBorder }]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.8}
          style={[styles.backBtn, { backgroundColor: C.redBg, borderColor: C.redBorder }]}
        >
          <ChevronLeft size={20} color={C.red} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Checkout</Text>
          <Text style={[styles.headerSubtitle, { color: C.textSm }]}>Secure payment</Text>
        </View>
        <View style={styles.sslBadge}>
          <Lock size={12} color="#16A34A" strokeWidth={2.5} />
          <Text style={styles.sslText}>SSL</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Plan Summary Banner */}
        <View style={[styles.planBanner, { backgroundColor: C.red }]}>
          <View style={styles.planBannerLeft}>
            <View style={styles.planIconWrapper}>
              {plan.id === "premium" ? (
                <Sparkles size={18} color="white" />
              ) : plan.id === "annual" ? (
                <Zap size={18} color="white" />
              ) : (
                <Shield size={18} color="white" />
              )}
            </View>
            <View>
              <Text style={styles.planBannerTitle}>{plan.label} Plan</Text>
              <Text style={styles.planBannerSubtitle}>{plan.sub.split("·")[0].trim()}</Text>
            </View>
          </View>
          <View style={styles.planBannerRight}>
            <Text style={styles.planBannerPrice}>{plan.price}</Text>
            {plan.period !== "" && <Text style={styles.planBannerPeriod}>{plan.period}</Text>}
          </View>
        </View>

        {children}
      </ScrollView>

      {/* Pay CTA */}
      <View style={[styles.footer, { backgroundColor: C.white, borderTopColor: C.redBorder }]}>
        <TouchableOpacity
          onPress={onPay}
          disabled={payDisabled}
          activeOpacity={0.85}
          style={[styles.payBtn, { backgroundColor: payDisabled ? '#A05050' : C.red }]}
        >
          {isProcessing ? (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.payBtnText}>Processing…</Text>
            </View>
          ) : (
            <View style={styles.processingRow}>
              <Lock size={16} color="white" strokeWidth={2.5} />
              <Text style={styles.payBtnText}>{payLabel}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.footerNote, { color: C.textSm }]}>{footerNote}</Text>
      </View>
    </SafeAreaView>
  );
};

/* ─── Paid checkout: Stripe CardField + confirmSetupIntent → subscribe ───
   Rendered INSIDE <StripeProvider> so the useConfirmSetupIntent hook is available. */
const PaidCheckout: React.FC<{
  plan: PlanType;
  backendPlan: Exclude<PlanKey, 'free'>;
  clientSecret: string;
  onBack: () => void;
  onPaid: () => void;
}> = ({ plan, backendPlan, clientSecret, onBack, onPaid }) => {
  const { C } = useTheme();
  const { refreshProfile } = useUser();
  const { confirmSetupIntent } = useConfirmSetupIntent();

  const [cardComplete, setCardComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = useCallback(async () => {
    if (!cardComplete || isProcessing) return;
    setError(null);
    setIsProcessing(true);
    try {
      // a/c. Tokenise the card on-device — raw PAN never reaches our backend.
      const { setupIntent, error: stripeError } = await confirmSetupIntent(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (stripeError) {
        setError(stripeError.message || 'We could not validate your card. Please try again.');
        return;
      }

      // d. Extract the pm_... id (field name differs slightly across SDK versions).
      const pmId =
        setupIntent?.paymentMethod?.id || (setupIntent as any)?.paymentMethodId;
      if (!pmId) {
        setError('Could not obtain a payment method from Stripe. Please try again.');
        return;
      }

      // e. Create the subscription with the tokenised payment method.
      await subscriptionService.subscribe(backendPlan, pmId);
      await refreshProfile();
      onPaid();
    } catch (err: any) {
      // Surface the backend's 422 card-decline message specifically; generic otherwise.
      if (err instanceof SubscriptionApiError) {
        setError(
          err.code === 'card_error'
            ? err.message
            : err.message || 'Subscription failed. Please try again.'
        );
      } else {
        setError(err?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [cardComplete, isProcessing, confirmSetupIntent, clientSecret, backendPlan, refreshProfile, onPaid]);

  return (
    <CheckoutChrome
      plan={plan}
      onBack={onBack}
      payLabel={`Pay ${plan.price}${plan.period}`}
      onPay={handlePay}
      payDisabled={!cardComplete || isProcessing}
      isProcessing={isProcessing}
      footerNote={`You will be charged ${plan.price}${plan.period}. Cancel anytime.`}
    >
      <View style={styles.billingSection}>
        <Text style={[styles.inputLabel, { color: C.text }]}>Card Details</Text>
        <CardField
          postalCodeEnabled={false}
          placeholders={{ number: '4242 4242 4242 4242' }}
          cardStyle={{
            backgroundColor: '#FDF9F9',
            textColor: C.text,
            placeholderColor: '#C88686',
            borderColor: C.redBorder || '#F2D0D0',
            borderWidth: 1,
            borderRadius: 14,
            fontSize: 15,
          }}
          style={styles.cardField}
          onCardChange={(d: CardFieldInput.Details) => setCardComplete(d.complete)}
        />

        {error && (
          <View style={styles.errorBanner}>
            <AlertTriangle size={14} color="#D7181D" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Secure note */}
        <View style={styles.sslBanner}>
          <Lock size={14} color="#16A34A" />
          <Text style={styles.sslBannerText}>
            Your card is encrypted and tokenized by Stripe. We never see or store your card number.
          </Text>
        </View>
      </View>
    </CheckoutChrome>
  );
};

export interface PaymentScreenProps {
  plan: PlanType;
  onBack: () => void;
  onSuccess?: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ plan, onBack, onSuccess }) => {
  const { C } = useTheme();
  const { refreshProfile } = useUser();
  const backendPlan = PLAN_MAP[plan.id] || 'premium_monthly';

  const [paid, setPaid] = useState(false);

  // Stripe SetupIntent state (paid plans only).
  const [setupLoading, setSetupLoading] = useState(plan.amount > 0);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string>(ENV_PUBLISHABLE_KEY);

  // Free-plan flow state.
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

  // Free plan downgrade (no card needed).
  const handleActivateFree = useCallback(async () => {
    setFreeProcessing(true);
    setFreeError(null);
    try {
      try {
        await subscriptionService.changePlan('free');
      } catch (e) {
        // Already free / no active subscription — treat as a no-op success.
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
    return <SuccessScreen plan={plan} onDone={handleDone} />;
  }

  // ---- Free plan ----
  if (plan.amount === 0) {
    return (
      <CheckoutChrome
        plan={plan}
        onBack={onBack}
        payLabel="Activate Free Plan"
        onPay={handleActivateFree}
        payDisabled={freeProcessing}
        isProcessing={freeProcessing}
        footerNote="No credit card required for the Free plan."
      >
        <View style={[styles.freeSection, { backgroundColor: C.white, borderColor: C.redBorder }]}>
          <Text style={[styles.freeTitle, { color: C.text }]}>What's included in Free Plan:</Text>
          {plan.features.map((f, i) => (
            <View key={i} style={styles.freeFeatureRow}>
              <CheckCircle size={16} color={C.red} strokeWidth={2.5} />
              <Text style={[styles.freeFeatureText, { color: C.text }]}>{f}</Text>
            </View>
          ))}
          {freeError && (
            <View style={styles.errorBanner}>
              <AlertTriangle size={14} color="#D7181D" />
              <Text style={styles.errorBannerText}>{freeError}</Text>
            </View>
          )}
        </View>
      </CheckoutChrome>
    );
  }

  // ---- Paid plan: setup-intent loading / error states ----
  if (setupLoading || !clientSecret || !publishableKey) {
    return (
      <CheckoutChrome
        plan={plan}
        onBack={onBack}
        payLabel={`Pay ${plan.price}${plan.period}`}
        onPay={() => {}}
        payDisabled
        isProcessing={false}
        footerNote={`You will be charged ${plan.price}${plan.period}. Cancel anytime.`}
      >
        <View style={styles.centerState}>
          {setupError ? (
            <>
              <AlertTriangle size={28} color={C.red} />
              <Text style={[styles.centerStateText, { color: C.text }]}>{setupError}</Text>
              {!publishableKey && (
                <Text style={[styles.centerStateSub, { color: C.textSm }]}>
                  Stripe is not configured (missing publishable key).
                </Text>
              )}
              <TouchableOpacity
                onPress={loadSetupIntent}
                style={[styles.retryBtn, { borderColor: C.red }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.retryBtnText, { color: C.red }]}>Try again</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={C.red} />
              <Text style={[styles.centerStateText, { color: C.textSm }]}>Preparing secure checkout…</Text>
            </>
          )}
        </View>
      </CheckoutChrome>
    );
  }

  // ---- Paid plan: Stripe-ready checkout ----
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  sslBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sslText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  planBanner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#C41E26',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  planBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  planBannerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 1,
  },
  planBannerRight: {
    alignItems: 'flex-end',
  },
  planBannerPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
  },
  planBannerPeriod: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  billingSection: {
    width: '100%',
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  cardField: {
    width: '100%',
    height: 50,
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
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 16,
  },
  sslBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  sslBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#166534',
    lineHeight: 14,
  },
  freeSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  freeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  freeFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  freeFeatureText: {
    fontSize: 13,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 14,
  },
  centerStateText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 24,
  },
  centerStateSub: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryBtn: {
    marginTop: 4,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  payBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C41E26',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 3,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIconWrapper: {
    marginBottom: 28,
  },
  successGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  successExtra: {
    fontSize: 13,
    marginBottom: 32,
    textAlign: 'center',
  },
  successCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 28,
  },
  cardListTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  successFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  successFeatureText: {
    fontSize: 13,
  },
  doneButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentScreen;
