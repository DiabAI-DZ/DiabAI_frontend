// Pure helpers for the activity detail screen: merge fetched detail with the tapped row.
// Intensity/impact visual config is theme-dependent and stays in the screen.
import { resolveStorageUrl } from '../../services/apiService';
import type { ActivityDetail } from '../../hooks/useActivityDetail';

export interface ActivityEntryLike {
  id?: number;
  activityType?: string;
  duration?: number;
  distance?: number;
  intensity?: string;
  calories?: number;
  steps?: number;
  heartRate?: number;
  impact?: string;
  date?: string;
  time?: string;
  notes?: string;
  image?: string;
}

export interface ActivityView {
  activityType: string;
  durationMin: number | null;
  intensity: string;
  calories: number | null;
  distanceKm: number | null;
  steps: number | null;
  heartRate: number | null;
  glucoseImpact: string;
  startedAt?: string;
  endedAt?: string | null;
  durationHuman: string;
  distanceHuman: string | null;
  notes: string | null;
  image?: string;
}

const num = (...vals: Array<number | string | null | undefined>): number | null => {
  for (const v of vals) {
    if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
};

export const mergeActivity = (
  data: ActivityDetail | null,
  entry: ActivityEntryLike | null | undefined,
  localNotes: string | null | undefined,
): ActivityView => {
  const durationMin = num(data?.duration_minutes, entry?.duration);
  const distanceKm = num(data?.distance_km, entry?.distance);
  return {
    activityType: data?.activity_type ?? entry?.activityType ?? 'activity',
    durationMin,
    intensity: (data?.intensity ?? entry?.intensity ?? '').toLowerCase(),
    calories: num(data?.calories_burned, entry?.calories),
    distanceKm,
    steps: num(data?.steps, entry?.steps),
    heartRate: num(data?.heart_rate_avg, entry?.heartRate),
    glucoseImpact: (data?.glucose_impact ?? entry?.impact ?? '').toLowerCase(),
    startedAt: data?.started_at ?? data?.recorded_at ?? entry?.date,
    endedAt: data?.ended_at ?? null,
    durationHuman: data?.duration_human ?? (durationMin !== null ? `${durationMin} min` : '—'),
    distanceHuman: data?.distance_human ?? (distanceKm !== null ? `${distanceKm} km` : null),
    notes: localNotes !== undefined ? localNotes : data?.notes ?? entry?.notes ?? null,
    image: data?.image_url ? resolveStorageUrl(data.image_url) : entry?.image,
  };
};
