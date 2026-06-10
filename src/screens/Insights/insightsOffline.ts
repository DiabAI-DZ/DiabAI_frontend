import type { InsightsBundle } from '../../services/insightsService';
import type { InsulinEstimate, Pattern, Recommendation } from '../../types/insights';

export interface InsightsSections {
  patterns: Pattern[];
  recommendations: Recommendation[];
  insulinEstimate: InsulinEstimate | null;
}

/**
 * Pull the patterns / recommendations / insulin sections out of a bundle.
 * When the AI backend returns nothing, sections are left empty (or null for insulin)
 * so the cards render a clean empty state rather than placeholder content.
 */
export function resolveSections(bundle: InsightsBundle): InsightsSections {
  const recs = bundle.recommendations?.recommendations;
  const pats = bundle.patterns?.patterns;
  return {
    recommendations: Array.isArray(recs) ? recs : [],
    patterns: Array.isArray(pats) ? pats : [],
    insulinEstimate: bundle.insulin?.insulin_estimate ?? null,
  };
}
