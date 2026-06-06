import { useCallback, useEffect, useState } from 'react';
import { useUser } from '../../../context/UserContext';
import { subscriptionService, SubscriptionApiError } from '../../../services/subscriptionService';
import { backendPlanFor, type PlanType } from '../plans';

const ENV_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

interface UseCheckoutResult {
  paid: boolean;
  markPaid: () => void;
  setupLoading: boolean;
  setupError: string | null;
  clientSecret: string | null;
  publishableKey: string;
  loadSetupIntent: () => Promise<void>;
  freeProcessing: boolean;
  freeError: string | null;
  activateFree: () => Promise<void>;
  handleDone: () => void;
}

/** Orchestrates checkout state: free-plan activation + paid-plan Stripe SetupIntent. */
export function useCheckout(plan: PlanType, onBack: () => void, onSuccess?: () => void): UseCheckoutResult {
  const { refreshProfile } = useUser();

  const [paid, setPaid] = useState(false);
  const [setupLoading, setSetupLoading] = useState(plan.amount > 0);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string>(ENV_PUBLISHABLE_KEY);
  const [freeProcessing, setFreeProcessing] = useState(false);
  const [freeError, setFreeError] = useState<string | null>(null);

  const loadSetupIntent = useCallback(async () => {
    setSetupLoading(true);
    setSetupError(null);
    try {
      const res = await subscriptionService.createSetupIntent();
      setClientSecret(res.client_secret);
      if (res.publishable_key) setPublishableKey(res.publishable_key);
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : 'Could not start a secure checkout. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  }, []);

  useEffect(() => {
    if (plan.amount > 0) loadSetupIntent();
  }, [plan.amount, loadSetupIntent]);

  const activateFree = useCallback(async () => {
    setFreeProcessing(true);
    setFreeError(null);
    try {
      try {
        await subscriptionService.changePlan('free');
      } catch (e) {
        // A client (<500) subscription error is tolerated here (already-free, etc.); rethrow real failures.
        if (!(e instanceof SubscriptionApiError) || e.status >= 500) throw e;
      }
      await refreshProfile();
      setPaid(true);
    } catch (err) {
      setFreeError(err instanceof Error ? err.message : 'Could not update your plan. Please try again.');
    } finally {
      setFreeProcessing(false);
    }
  }, [refreshProfile]);

  const handleDone = useCallback(() => {
    onSuccess?.();
    onBack();
  }, [onSuccess, onBack]);

  return {
    paid,
    markPaid: useCallback(() => setPaid(true), []),
    setupLoading,
    setupError,
    clientSecret,
    publishableKey,
    loadSetupIntent,
    freeProcessing,
    freeError,
    activateFree,
    handleDone,
  };
}
