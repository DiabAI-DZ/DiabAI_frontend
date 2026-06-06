// Pure helpers for the measurement detail screen: merging the fetched detail with the tapped
// logbook row, label formatting, and synthesising fallback insight copy. No React / no theme.
import { format, parseISO, isValid } from 'date-fns';
import { resolveStorageUrl } from '../../services/apiService';
import type { MeasurementDetail } from '../../hooks/useMeasurementDetail';

/** The subset of a tapped logbook row used as a fast fallback before the detail fetch resolves. */
export interface MeasurementEntryLike {
  id?: number;
  value?: number;
  unit?: string;
  status?: string;
  trend?: string;
  date?: string;
  time?: string;
  image?: string;
  tags?: string[];
  tag?: string;
  measurement_type?: string;
}

export type MeasurementStatus = 'normal' | 'high' | 'low';
export type MeasurementTrend = 'stable' | 'rising' | 'falling';

export interface MeasurementView {
  title: string;
  valueMgDl: number;
  valueGL: number;
  status: MeasurementStatus;
  trend: MeasurementTrend;
  measuredAt?: string;
  image?: string;
  notes: string | null;
  tags: string[];
  measurementType: string;
  typeLabel: string;
  comparison: MeasurementDetail['comparison'];
  insights: MeasurementDetail['health_insights'];
}

export interface InsightCardData {
  icon: string;
  title: string;
  body: string;
}

const MEASUREMENT_TYPE_LABELS: Record<string, string> = {
  before_meal: 'Before Meal',
  after_meal: 'After Meal',
  fasting: 'Fasting',
  random: 'Random',
};

export const titleCase = (s?: string): string =>
  (s || '')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// Normalises the API's trend spellings (list uses up/down/stable, detail uses rising/falling).
const normalizeTrend = (t?: string): MeasurementTrend => {
  const v = (t || '').toLowerCase();
  if (v === 'up' || v === 'rising' || v === 'rise') return 'rising';
  if (v === 'down' || v === 'falling' || v === 'fall') return 'falling';
  return 'stable';
};

const safeDate = (iso?: string): Date | null => {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? d : null;
};

export const formatDay = (iso?: string, fallback?: string): string => {
  const d = safeDate(iso);
  return d ? format(d, 'EEEE, MMMM d, yyyy') : fallback || '—';
};

export const formatHour = (iso?: string, fallback?: string): string => {
  const d = safeDate(iso);
  return d ? format(d, 'hh:mm a') : fallback || '—';
};

/** Merge the fetched detail with the tapped row so the screen renders before the fetch resolves. */
export const mergeMeasurement = (
  data: MeasurementDetail | null,
  entry: MeasurementEntryLike | null | undefined,
  localNotes: string | null | undefined,
): MeasurementView => {
  const valueMgDl = Number(data?.value_mg_dl ?? entry?.value ?? 0);
  const valueGL =
    data?.value_g_l !== undefined && data?.value_g_l !== null ? Number(data.value_g_l) : valueMgDl / 1000;
  const status = (data?.health_status ?? entry?.status ?? 'normal').toString().toLowerCase() as MeasurementStatus;
  const measurementType = data?.measurement_type ?? entry?.measurement_type ?? '';

  return {
    title: data?.title || 'Glucose Measurement',
    valueMgDl,
    valueGL,
    status,
    trend: normalizeTrend(data?.trend ?? entry?.trend),
    measuredAt: data?.measured_at ?? data?.recorded_at ?? entry?.date,
    image: data?.image_url ? resolveStorageUrl(data.image_url) : entry?.image,
    notes: localNotes !== undefined ? localNotes : data?.notes ?? null,
    tags: (data?.tags ?? entry?.tags ?? []).filter(Boolean) as string[],
    measurementType,
    typeLabel: MEASUREMENT_TYPE_LABELS[measurementType] || (entry?.tag ? entry.tag : titleCase(measurementType)) || 'General',
    comparison: data?.comparison ?? null,
    insights: data?.health_insights ?? null,
  };
};

/** Prefer API insights; otherwise synthesise in-range / out-of-range copy from the value. */
export const synthesizeInsights = (view: MeasurementView, minGoal: number, maxGoal: number): InsightCardData[] => {
  if (view.insights && view.insights.length) {
    return view.insights.map((i) => ({ icon: i.icon, title: i.title, body: i.body }));
  }
  if (view.valueMgDl >= minGoal && view.valueMgDl <= maxGoal) {
    return [
      { icon: 'heart', title: 'Great Reading!', body: `This glucose reading is within your target range (${minGoal}–${maxGoal} mg/dL). Keep up the healthy routine.` },
      { icon: 'target', title: 'On Track', body: 'Your fasting glucose is well-controlled. Consistency with meal timing supports stable levels.' },
    ];
  }
  if (view.valueMgDl > maxGoal) {
    return [
      { icon: 'alert', title: 'Above Target Range', body: `This reading exceeds ${maxGoal} mg/dL. Consider reviewing recent meals and physical activity levels.` },
      { icon: 'brain', title: 'Pattern Detected', body: 'Post-meal spikes have been more common this week. A short walk after meals may help reduce peaks.' },
    ];
  }
  return [
    { icon: 'alert', title: 'Below Target Range', body: `This reading is below the safe threshold of ${minGoal} mg/dL. Ensure you're eating regular meals.` },
    { icon: 'zap', title: 'Action Recommended', body: 'Consider consuming 15g of fast-acting carbohydrates and recheck in 15 minutes.' },
  ];
};
