import { useEffect, useState } from 'react';
import { useData } from '../../../context/DataContext';
import { apiService } from '../../../services/apiService';
import type { InsulinEstimate } from '../../../types/insights';
import { formatDateStr } from '../insightsVisuals';

// Model is fixed to the backend default (matches useInsightsData).
const SELECTED_MODEL = 'kaggle';

export interface UseInsulinEstimateResult {
  insulinEstimate: InsulinEstimate | null;
  loading: boolean;
}

/**
 * Dedicated insulin-estimate loader. Like the glucose forecast (usePrediction), it runs as its
 * OWN light call against /api/insights/insulin-estimate rather than waiting on the heavy aggregate
 * bundle (patterns + recommendations), so the insulin card fills in as soon as the estimate is
 * ready instead of blocking on the slow LLM sections. Anchored to the strip's date_to (last 24h),
 * never cached, and refetched on a date change or ANY new log (a meal/insulin shifts the estimate).
 */
export function useInsulinEstimate(
  isActive: boolean,
  range: { from: Date; to: Date } | null,
  defaultRange: { from: Date; to: Date },
): UseInsulinEstimateResult {
  const { logs, selectedDate } = useData();
  const [insulinEstimate, setInsulinEstimate] = useState<InsulinEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  const logCount = logs.length;
  const from = formatDateStr(range?.from ?? defaultRange.from);
  const to = formatDateStr(range?.to ?? defaultRange.to);
  // Anchor to the strip's date_to (its last 24h of data) — same anchor as the forecast.
  const selected = formatDateStr(range?.to ?? selectedDate ?? defaultRange.to);

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const result = await apiService.fetchInsulinEstimate(from, to, selected, SELECTED_MODEL);
      if (cancelled) return;
      // Tolerate both the wrapped { insulin_estimate: {...} } shape and a bare estimate object.
      const est = result?.insulin_estimate ?? (result && 'units' in result ? (result as InsulinEstimate) : null);
      setInsulinEstimate(est ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [isActive, from, to, selected, logCount]);

  return { insulinEstimate, loading };
}
