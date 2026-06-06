import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../services/apiService';
import type { UseDetailResult } from './useMeasurementDetail';

// A lightweight reference to the measurement this injection covered.
export interface RelatedMeasurement {
  id: number;
  value_mg_dl: number;
  health_status: string;
}

// A lightweight reference to the meal this injection covered.
export interface RelatedMeal {
  id: number;
  title: string;
  meal_type: string;
}

// Shape of GET /api/injections/{id} -> data. Loose by design; the screen merges with the row.
export interface InjectionDetail {
  id: number;
  user_id?: number;
  insulin_type?: string;          // rapid_acting | long_acting | mixed
  dose_units?: number;
  injection_site?: string | null;
  reason?: string;                // meal_coverage | basal | correction
  notes?: string | null;
  injected_at?: string;           // ISO datetime
  recorded_at?: string;           // alternate field name
  image_url?: string;
  entry_type?: string;
  related_measurement?: RelatedMeasurement | null;
  related_meal?: RelatedMeal | null;
}

// GET /api/injections/{id}. Same { data, loading, error, refetch } contract as the other hooks.
export function useInjectionDetail(id: number | null | undefined): UseDetailResult<InjectionDetail> {
  const [data, setData] = useState<InjectionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    if (id === null || id === undefined) {
      setLoading(false);
      setError(new Error('Missing injection id'));
      return;
    }
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.fetchInjectionDetail(id as number);
      if (reqId === reqIdRef.current) setData(res ?? null);
    } catch (e) {
      if (reqId === reqIdRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load injection'));
      }
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    return () => {
      reqIdRef.current++;
    };
  }, [load]);

  return { data, loading, error, refetch: load };
}

export default useInjectionDetail;
