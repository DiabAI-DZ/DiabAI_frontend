import { useCallback, useEffect, useState } from 'react';
import { subscriptionService, type PaymentHistoryItem } from '../../../../../services/subscriptionService';
import { subErrorMessage } from '../format';

export interface UsePaymentHistoryResult {
  items: PaymentHistoryItem[];
  loading: boolean;
  error: string | null;
  load: () => void;
}

/** Loads the recent payment-history transactions. */
export function usePaymentHistory(): UsePaymentHistoryResult {
  const [items, setItems] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await subscriptionService.getPaymentHistory(20);
      setItems(res.data ?? []);
    } catch (err) {
      setError(subErrorMessage(err, 'Could not load payment history.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { items, loading, error, load };
}
