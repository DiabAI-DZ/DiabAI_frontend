// Pure helpers for the meal detail screen: merge fetched detail with the tapped row, parse the
// glucose impact, and synthesise fallback insight copy. No React / no theme.
import { resolveStorageUrl } from '../../services/apiService';
import type { MealDetail } from '../../hooks/useMealDetail';
import type { InsightCardData } from './measurementView';

/** Subset of a tapped meal logbook row used as a fast fallback before the detail fetch resolves. */
export interface MealEntryLike {
  id?: number;
  name?: string;
  mealType?: string;
  date?: string;
  time?: string;
  carbs?: number;
  protein?: number;
  fat?: number;
  fiber?: number;
  impact?: string | number;
  impactLevel?: string;
  tags?: string[];
  image?: string;
}

export interface MealView {
  titleRaw: string;
  mealType: string;
  eatenAt?: string;
  impactMgDl: number | null;
  impactLevel: string;
  carbsRing: number;
  proteinRing: number;
  fatRing: number;
  fiberRing: number;
  carbsMeta: number | null;
  calories: number | null;
  notes: string | null;
  tags: string[];
  image?: string;
  insights: MealDetail['health_insights'];
}

export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const titleCaseWords = (s?: string): string =>
  (s || '')
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export const parseImpact = (numeric?: number | null, str?: string | number): number | null => {
  if (numeric !== undefined && numeric !== null && !Number.isNaN(Number(numeric))) {
    return Math.round(Number(numeric));
  }
  if (typeof str === 'string') {
    const m = str.match(/-?\d+(\.\d+)?/);
    if (m) return Math.round(parseFloat(m[0]));
  } else if (typeof str === 'number' && !Number.isNaN(str)) {
    return Math.round(str);
  }
  return null;
};

// First numeric value among the args, or null (preserves the null-vs-0 distinction the "—" rule needs).
const numOrNull = (...vals: Array<number | string | null | undefined>): number | null => {
  for (const v of vals) {
    if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
};

export const mergeMeal = (
  data: MealDetail | null,
  entry: MealEntryLike | null | undefined,
  localNotes: string | null | undefined,
): MealView => {
  const n = data?.nutrition || {};
  const carbsMeta =
    data?.carbohydrates_g ?? (data?.nutrition ? data.nutrition.carbohydrates_g : undefined) ?? null;

  return {
    titleRaw: data?.title || entry?.name || 'Logged Meal',
    mealType: data?.meal_type || entry?.mealType || 'snack',
    eatenAt: data?.eaten_at ?? data?.measured_at ?? data?.recorded_at ?? entry?.date,
    impactMgDl: parseImpact(data?.glucose_impact_mg_dl, entry?.impact),
    impactLevel: (data?.impact_level || entry?.impactLevel || '').toLowerCase(),
    carbsRing: numOrNull(n.carbohydrates_g, data?.carbohydrates_g, entry?.carbs) ?? 0,
    proteinRing: numOrNull(n.protein_g, data?.protein_g, entry?.protein) ?? 0,
    fatRing: numOrNull(n.fat_g, data?.fat_g, entry?.fat) ?? 0,
    fiberRing: numOrNull(n.fiber_g, data?.fiber_g, entry?.fiber) ?? 0,
    carbsMeta,
    calories: data?.calories ?? null,
    notes: localNotes !== undefined ? localNotes : data?.notes ?? null,
    tags: (data?.tags ?? entry?.tags ?? []).filter(Boolean) as string[],
    image: data?.image_url ? resolveStorageUrl(data.image_url) : entry?.image,
    insights: data?.health_insights ?? null,
  };
};

export const synthesizeMealInsights = (view: MealView, impactText: string): InsightCardData[] => {
  if (view.insights && view.insights.length) {
    return view.insights.map((i) => ({ icon: i.icon, title: i.title, body: i.body }));
  }
  const impactWord = view.impactLevel ? titleCaseWords(view.impactLevel) : 'Moderate';
  return [
    {
      icon: 'globe',
      title: `${impactWord} Glucose Impact`,
      body: `This meal is estimated to raise your glucose by ${impactText}. The ${Math.round(view.carbsRing)}g of carbs are the primary contributor.`,
    },
    {
      icon: 'sparkle',
      title: 'Recommendation',
      body: 'Pairing high-carb meals with a 15-minute walk can reduce post-meal glucose spikes by up to 30%.',
    },
    {
      icon: 'chart',
      title: 'Meal Pattern',
      body: 'Your lunch meals tend to have the highest carb content. Consider adding more fiber-rich foods to slow glucose absorption.',
    },
  ];
};
