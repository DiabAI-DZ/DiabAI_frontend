import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useUser } from '../../../../../context/UserContext';
import { subscriptionService, SubscriptionApiError, type SubscriptionResource, type PlanKey } from '../../../../../services/subscriptionService';
import { subErrorMessage } from '../format';

export interface UseChangePlanResult {
  sub: SubscriptionResource | null;
  loading: boolean;
  error: string | null;
  selectedKey: string | null;
  setSelectedKey: (k: string) => void;
  processing: boolean;
  currentKey: string | undefined;
  load: () => void;
  confirm: () => void;
}

/** Loads available plans + drives the change-plan action. */
export function useChangePlan(onClose: () => void): UseChangePlanResult {
  const { refreshProfile } = useUser();
  const [sub, setSub] = useState<SubscriptionResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await subscriptionService.getSubscription();
      setSub(data);
      const current = data.available_plans.find((p) => p.is_current);
      setSelectedKey(current?.key ?? data.plan);
    } catch (err) {
      setError(subErrorMessage(err, 'Could not load plans.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const currentKey = sub?.available_plans.find((p) => p.is_current)?.key ?? sub?.plan;

  const confirm = useCallback(async () => {
    if (!selectedKey || selectedKey === currentKey || processing) return;
    setProcessing(true);
    try {
      await subscriptionService.changePlan(selectedKey as PlanKey);
      await refreshProfile();
      onClose();
    } catch (err) {
      const msg = err instanceof SubscriptionApiError ? err.message : subErrorMessage(err, 'Could not change your plan.');
      Alert.alert('Plan change failed', msg);
    } finally {
      setProcessing(false);
    }
  }, [selectedKey, currentKey, processing, refreshProfile, onClose]);

  return { sub, loading, error, selectedKey, setSelectedKey, processing, currentKey, load, confirm };
}
