import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../services/apiService';

// Comparison block returned alongside a measurement detail.
export interface MeasurementComparison {
  daily_average_mg_dl: number;
  // delta_mg_dl from the API is (daily_average - current). The screen recomputes
  // (current - daily_average) for display, so this field is informational only.
  delta_mg_dl: number;
}

// A single AI-generated insight card.
export interface HealthInsight {
  icon: string;   // "heart" | "target" | "alert" | ...
  title: string;
  body: string;
}

// Shape of GET /api/measurements/{id} -> data. Fields are optional/loose because the
// backend payload can vary; the screen merges this with the tapped logbook row as a fallback.
export interface MeasurementDetail {
  id: number;
  user_id?: number;
  title?: string;
  value_mg_dl?: number;
  value_g_l?: number;
  measurement_type?: string;      // before_meal | after_meal | fasting | random
  health_status?: string;         // normal | high | low
  trend?: string;                 // stable | rising | falling
  measured_at?: string;           // ISO datetime
  recorded_at?: string;           // ISO datetime (alternate field name)
  notes?: string | null;
  tags?: string[] | null;
  image_url?: string;
  comparison?: MeasurementComparison | null;
  health_insights?: HealthInsight[] | null;
  [key: string]: any;
}

export interface UseDetailResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// GET /api/measurements/{id}. Exposes the conventional { data, loading, error, refetch }
// surface. Re-fetches whenever the id changes and cancels in-flight updates on unmount so a
// late response can't write into an unmounted screen.
export function useMeasurementDetail(id: number | null | undefined): UseDetailResult<MeasurementDetail> {
  const [data, setData] = useState<MeasurementDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Monotonic request token so only the latest fetch is allowed to commit state.
  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    if (id === null || id === undefined) {
      setLoading(false);
      setError(new Error('Missing measurement id'));
      return;
    }
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.fetchMeasurementDetail(id as number);
      if (reqId === reqIdRef.current) setData(res ?? null);
    } catch (e: any) {
      if (reqId === reqIdRef.current) {
        setError(e instanceof Error ? e : new Error(e?.message || 'Failed to load measurement'));
      }
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    return () => {
      // Invalidate any in-flight request on unmount / id change.
      reqIdRef.current++;
    };
  }, [load]);

  return { data, loading, error, refetch: load };
}

export default useMeasurementDetail;
