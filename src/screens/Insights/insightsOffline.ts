import type { InsightsBundle } from '../../services/insightsService';
import type { InsulinEstimate, Pattern, Recommendation } from '../../types/insights';

// Local placeholders shown when the AI backend returns nothing (free user / service offline).
const OFFLINE_RECS: Recommendation[] = [{
  id: 1,
  icon: 'clock',
  title: '[OFFLINE] Connect Services',
  description: 'MOCK RECOMMENDATION: Connect to a model to see personalized advice. Current status: Service Offline.',
  priority: 'high',
  priority_label: 'Mock',
  category: 'timing',
}];
const OFFLINE_PATTERNS: Pattern[] = [{
  id: 1,
  title: '[OFFLINE] Pattern Search',
  description: 'MOCK PATTERN: Unable to analyze logged data without active AI connection.',
  confidence: 0,
  trend: 'stable',
  priority: 'low',
}];
const OFFLINE_INSULIN: InsulinEstimate = {
  units: 0,
  current_mg_dl: 0,
  target_mg_dl: 0,
  basis: '[OFFLINE] MOCK ESTIMATE: Service unavailable.',
  disclaimer: 'CRITICAL: Connect to AI services to enable real estimation.',
  ai_powered: false,
};

export interface InsightsSections {
  patterns: Pattern[];
  recommendations: Recommendation[];
  insulinEstimate: InsulinEstimate;
}

/** Pull the patterns / recommendations / insulin sections out of a bundle, with offline fallbacks. */
export function resolveSections(bundle: InsightsBundle): InsightsSections {
  const recs = bundle.recommendations?.recommendations;
  const pats = bundle.patterns?.patterns;
  return {
    recommendations: Array.isArray(recs) && recs.length > 0 ? recs : OFFLINE_RECS,
    patterns: Array.isArray(pats) && pats.length > 0 ? pats : OFFLINE_PATTERNS,
    insulinEstimate: bundle.insulin?.insulin_estimate ?? OFFLINE_INSULIN,
  };
}
