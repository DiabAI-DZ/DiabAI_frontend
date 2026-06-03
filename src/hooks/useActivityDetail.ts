import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../services/apiService';
import type { UseDetailResult } from './useMeasurementDetail';

// Shape of GET /api/activities/{id} -> data. Loose by design; the screen merges with the row.
export interface ActivityDetail {
  id: number;
  user_id?: number;
  activity_type?: string;         // basketball | running | walking | ...
  duration_minutes?: number;
  intensity?: string;             // low | moderate | high
  calories_burned?: number | null;
  distance_km?: number | null;
  steps?: number | null;
  heart_rate_avg?: number | null;
  glucose_impact?: string;        // decrease | stable | increase
  notes?: string | null;
  started_at?: string;            // ISO datetime
  ended_at?: string;              // ISO datetime
  recorded_at?: string;           // alternate field name
  duration_human?: string;        // "45 min"
  distance_human?: string | null; // "5.2 km"
  image_url?: string;
  entry_type?: string;
  [key: string]: any;
}

// GET /api/activities/{id}. Same { data, loading, error, refetch } contract as the other hooks.
export function useActivityDetail(id: number | null | undefined): UseDetailResult<ActivityDetail> {
  const [data, setData] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    if (id === null || id === undefined) {
      setLoading(false);
      setError(new Error('Missing activity id'));
      return;
    }
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.fetchActivityDetail(id as number);
      if (reqId === reqIdRef.current) setData(res ?? null);
    } catch (e: any) {
      if (reqId === reqIdRef.current) {
        setError(e instanceof Error ? e : new Error(e?.message || 'Failed to load activity'));
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

export default useActivityDetail;
