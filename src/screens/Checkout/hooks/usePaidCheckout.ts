import { useCallback, useState } from 'react';
import { useConfirmSetupIntent } from '@stripe/stripe-react-native';
import { useUser } from '../../../context/UserContext';
import { subscriptionService, SubscriptionApiError, type PlanKey } from '../../../services/subscriptionService';

interface UsePaidCheckoutResult {
  cardComplete: boolean;
  setCardComplete: (v: boolean) => void;
  saveCard: boolean;
  setSaveCard: (v: boolean) => void;
  isProcessing: boolean;
  error: string | null;
  handlePay: () => Promise<void>;
}

/** Card payment flow: tokenize via Stripe, optionally save the card, then subscribe. */
export function usePaidCheckout(
  clientSecret: string,
  backendPlan: Exclude<PlanKey, 'free'>,
  onPaid: () => void,
): UsePaidCheckoutResult {
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
      const { setupIntent, error: stripeError } = await confirmSetupIntent(clientSecret, { paymentMethodType: 'Card' });
      if (stripeError) {
        setError(stripeError.message || 'We could not validate your card. Please try again.');
        return;
      }
      const pmId =
        setupIntent?.paymentMethod?.id ?? (setupIntent as { paymentMethodId?: string } | undefined)?.paymentMethodId;
      if (!pmId) {
        setError('Could not obtain a payment method from Stripe. Please try again.');
        return;
      }

      // "Save this card" → also persist as a reusable billing method (best-effort).
      if (saveCard) {
        try {
          await subscriptionService.addBillingMethod(pmId, true);
        } catch {
          /* non-fatal */
        }
      }

      await subscriptionService.subscribe(backendPlan, pmId);
      await refreshProfile();
      onPaid();
    } catch (err) {
      if (err instanceof SubscriptionApiError) {
        setError(err.message || 'Subscription failed. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [cardComplete, isProcessing, confirmSetupIntent, clientSecret, saveCard, backendPlan, refreshProfile, onPaid]);

  return { cardComplete, setCardComplete, saveCard, setSaveCard, isProcessing, error, handlePay };
}
