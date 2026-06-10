import { useEffect, useState } from 'react';
import { useData } from '../../../context/DataContext';
import { apiService } from '../../../services/apiService';
import type { CalendarDay, Prediction } from '../../../types/insights';
import { formatDateStr } from '../insightsVisuals';

interface PredictionResponse {
  prediction?: Prediction | null;
  calendar?: { days?: CalendarDay[] } | null;
}

export interface UsePredictionResult {
  predictions: Prediction[];
  /** Whether the selected day actually has a reading (from the forecast calendar). */
  selectedHasReading: boolean | null;
  isTodaySelected: boolean;
}

/**
 * Dedicated glucose-forecast loader. The forecast is anchored server-side to the latest reading
 * + 24h of carbs/insulin, so it refetches (a) when the selected date / window changes and
 * (b) after ANY new log (a meal/insulin only affects the forecast once a reading exists), never
 * relying on cached app state. Light call — separate from the heavy aggregate bundle.
 */
export function usePrediction(
  isActive: boolean,
  range: { from: Date; to: Date } | null,
  defaultRange: { from: Date; to: Date },
): UsePredictionResult {
  const { logs, selectedDate } = useData();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedHasReading, setSelectedHasReading] = useState<boolean | null>(null);

  const logCount = logs.length;
  const predFrom = formatDateStr(range?.from ?? defaultRange.from);
  const predTo = formatDateStr(range?.to ?? defaultRange.to);
  // Anchor the forecast to the strip's date_to (its last 24h of data) — same as the insulin
  // estimate — rather than the global "today" selectedDate.
  const predSelected = formatDateStr(range?.to ?? selectedDate ?? defaultRange.to);
  // Today predicts from "now"; past dates stay anchored to that day's last reading.
  const isTodaySelected = predSelected === formatDateStr(new Date());

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    (async () => {
      const result = (await apiService.fetchPrediction(predFrom, predTo, predSelected)) as PredictionResponse | null;
      if (cancelled) return;
      setPredictions(result?.prediction ? [result.prediction] : []);
      const days = result?.calendar?.days;
      if (Array.isArray(days)) {
        const sel = days.find((d) => d?.is_selected) || days.find((d) => d?.date === predSelected);
        setSelectedHasReading(sel ? !!sel.has_data : null);
      } else {
        setSelectedHasReading(null);
      }
    })();
    return () => { cancelled = true; };
  }, [isActive, predFrom, predTo, predSelected, logCount]);

  return { predictions, selectedHasReading, isTodaySelected };
}
