// Home feature types. The /api/home payload types live in services/types.ts (imported widely);
// re-exported here so Home code has a single feature-local import surface.
export type {
  HomeData,
  HomeTarget,
  HomeLatestReading,
  HomeGreeting,
  HomeGlucoseTrend,
  HomeGlucoseTrendPoint,
  HomeRecommendation,
} from '../services/types';

/** A processed point ready for the chart: a value (or null for a gap) + whether it's real data. */
export interface TrendPoint {
  label: string;
  value: number | null;
  real: boolean;
}
