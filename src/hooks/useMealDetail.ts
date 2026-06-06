import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../services/apiService';
import type { HealthInsight, UseDetailResult } from './useMeasurementDetail';

// Nutrition breakdown returned with a meal detail. Field names mirror the backend payload
// already consumed elsewhere in the app (carbohydrates_g, protein_g, ...).
export interface MealNutrition {
  carbohydrates_g?: number | null;
  protein_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  calories?: number | null;
}

// Shape of GET /api/meals/{id} -> data. Loose by design; the screen merges with the tapped row.
export interface MealDetail {
  id: number;
  user_id?: number;
  title?: string;                 // "Avocado Toast & Eggs"
  meal_type?: string;             // breakfast | lunch | dinner | snack
  eaten_at?: string;              // ISO datetime (preferred)
  measured_at?: string;
  recorded_at?: string;
  glucose_impact_mg_dl?: number | null;
  impact_level?: string;          // low | moderate | high | excellent
  notes?: string | null;
  tags?: string[] | null;
  image_url?: string;
  food_items?: unknown[] | null;
  nutrition?: MealNutrition | null;
  // Some backends inline the macros at the top level instead of under `nutrition`.
  carbohydrates_g?: number | null;
  protein_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  calories?: number | null;
  health_insights?: HealthInsight[] | null;
}

// GET /api/meals/{id}. Same { data, loading, error, refetch } contract as useMeasurementDetail.
export function useMealDetail(id: number | null | undefined): UseDetailResult<MealDetail> {
  const [data, setData] = useState<MealDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    if (id === null || id === undefined) {
      setLoading(false);
      setError(new Error('Missing meal id'));
      return;
    }
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.fetchMealDetail(id as number);
      if (reqId === reqIdRef.current) setData(res ?? null);
    } catch (e) {
      if (reqId === reqIdRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load meal'));
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

export default useMealDetail;
