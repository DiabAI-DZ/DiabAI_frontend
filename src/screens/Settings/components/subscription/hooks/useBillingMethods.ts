import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { subscriptionService, SubscriptionApiError, type PaymentMethod } from '../../../../../services/subscriptionService';
import { subErrorMessage } from '../format';

const ENV_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

interface SetupState { clientSecret: string; pk: string }

export interface UseBillingMethodsResult {
  methods: PaymentMethod[];
  loading: boolean;
  error: string | null;
  busyId: string | number | null;
  addMode: boolean;
  setup: SetupState | null;
  preparing: boolean;
  load: () => void;
  startAdd: () => void;
  saved: (pmId: string) => Promise<void>;
  setDefault: (m: PaymentMethod) => void;
  remove: (m: PaymentMethod) => void;
  cancelAdd: () => void;
}

/** Owns the saved-cards list + add/set-default/remove + Stripe setup-intent flow. */
export function useBillingMethods(): UseBillingMethodsResult {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [preparing, setPreparing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMethods(await subscriptionService.getBillingMethods());
    } catch (err) {
      setError(subErrorMessage(err, 'Could not load your cards.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startAdd = useCallback(async () => {
    setPreparing(true);
    try {
      const res = await subscriptionService.createSetupIntent();
      const pk = res.publishable_key || ENV_PUBLISHABLE_KEY;
      if (!pk) {
        Alert.alert('Stripe not configured', 'Missing publishable key.');
        return;
      }
      setSetup({ clientSecret: res.client_secret, pk });
      setAddMode(true);
    } catch (err) {
      Alert.alert('Could not start', subErrorMessage(err, 'Please try again.'));
    } finally {
      setPreparing(false);
    }
  }, []);

  const saved = useCallback(async (pmId: string) => {
    await subscriptionService.addBillingMethod(pmId, methods.length === 0);
    setAddMode(false);
    setSetup(null);
    await load();
  }, [methods.length, load]);

  const setDefault = useCallback(async (m: PaymentMethod) => {
    if (m.is_default) return;
    setBusyId(m.id);
    try {
      await subscriptionService.setDefaultBillingMethod(m.id);
      await load();
    } catch (err) {
      Alert.alert('Could not set default', subErrorMessage(err, 'Please try again.'));
    } finally {
      setBusyId(null);
    }
  }, [load]);

  const remove = useCallback((m: PaymentMethod) => {
    Alert.alert('Remove card', `Remove ${m.masked_number}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusyId(m.id);
          try {
            await subscriptionService.deleteBillingMethod(m.id);
            await load();
          } catch (err) {
            // 422: can't delete the default card while a subscription is active.
            const msg = err instanceof SubscriptionApiError ? err.message : subErrorMessage(err, 'Please try again.');
            Alert.alert('Could not remove card', msg);
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  }, [load]);

  const cancelAdd = useCallback(() => { setAddMode(false); setSetup(null); }, []);

  return { methods, loading, error, busyId, addMode, setup, preparing, load, startAdd, saved, setDefault, remove, cancelAdd };
}
