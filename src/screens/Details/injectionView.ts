// Pure helpers for the injection detail screen: merge fetched detail with the tapped row, plus
// insulin-type config (icon + copy) and reason labels. No React / no theme.
import { Zap, Clock, Layers, Syringe, type LucideIcon } from 'lucide-react-native';
import { resolveStorageUrl } from '../../services/apiService';
import { titleCaseWords } from './mealView';
import type { InjectionDetail, RelatedMeal, RelatedMeasurement } from '../../hooks/useInjectionDetail';

export interface InjectionEntryLike {
  id?: number;
  insulinType?: string;
  dose?: number;
  site?: string;
  reason?: string;
  date?: string;
  time?: string;
  notes?: string;
  image?: string;
}

export interface InjectionView {
  insulinType: string;
  dose: number | null;
  site: string | null;
  reason: string;
  injectedAt?: string;
  notes: string | null;
  image?: string;
  relatedMeal: RelatedMeal | null;
  relatedMeasurement: RelatedMeasurement | null;
}

export interface InsulinConfig {
  title: string;
  short: string;
  desc: string;
  Icon: LucideIcon;
}

export const mergeInjection = (
  data: InjectionDetail | null,
  entry: InjectionEntryLike | null | undefined,
  localNotes: string | null | undefined,
): InjectionView => ({
  insulinType: (data?.insulin_type ?? entry?.insulinType ?? '').toLowerCase(),
  dose: data?.dose_units ?? entry?.dose ?? null,
  site: data?.injection_site ?? entry?.site ?? null,
  reason: (data?.reason ?? entry?.reason ?? '').toLowerCase(),
  injectedAt: data?.injected_at ?? data?.recorded_at ?? entry?.date,
  notes: localNotes !== undefined ? localNotes : data?.notes ?? entry?.notes ?? null,
  image: data?.image_url ? resolveStorageUrl(data.image_url) : entry?.image,
  relatedMeal: data?.related_meal ?? null,
  relatedMeasurement: data?.related_measurement ?? null,
});

export const insulinConfig = (insulinType: string): InsulinConfig => {
  switch (insulinType) {
    case 'rapid_acting':
      return { title: 'Rapid Acting Insulin', short: 'Rapid Acting', desc: 'Fast onset, peaks in 1-2 hours', Icon: Zap };
    case 'long_acting':
      return { title: 'Long Acting Insulin', short: 'Long Acting', desc: 'Slow release, lasts 18-24 hours', Icon: Clock };
    case 'mixed':
      return { title: 'Mixed Insulin', short: 'Mixed', desc: 'Combination of rapid and long acting', Icon: Layers };
    default: {
      const t = titleCaseWords(insulinType) || 'Insulin';
      return { title: t, short: t, desc: '', Icon: Syringe };
    }
  }
};

export const reasonLabel = (reason: string): string | null => {
  switch (reason) {
    case 'meal_coverage': return 'Meal Coverage';
    case 'basal': return 'Basal';
    case 'correction': return 'Correction';
    default: return reason ? titleCaseWords(reason) : null;
  }
};
