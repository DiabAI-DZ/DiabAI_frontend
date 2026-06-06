import { useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { useUser } from '../../../context/UserContext';
import { useTheme } from '../../../context/ThemeContext';
import type { LegacyColors } from '../../../theme/colors';
import type {
  DayStats,
  Pattern,
  PatternView,
  PredView,
  Prediction,
  Recommendation,
  RecommendationView,
  WeeklyStats,
} from '../../../types/insights';
import {
  buildPredictionSVG,
  buildWeeklySVG,
  computeAvgWeekDelta,
  computeDayStats,
  computeWeeklyStats,
  computeWeeklyTrend,
  interpolateWeekly,
  mapPatterns,
  mapRecommendations,
  type PredictionSVG,
  type WeeklySVG,
} from '../insightsMath';

const RISING = ['rising', 'rising_rapidly'];
const FALLING = ['falling', 'falling_rapidly'];
const OLD_READING_MS = 6 * 60 * 60 * 1000;

/** Map a raw forecast into the prediction card's display model (or null when there's nothing to show). */
function buildPredView(predictions: Prediction[], C: LegacyColors): PredView | null {
  const p = predictions[0];
  if (!p || p.expected_mg_dl == null || p.status === 'offline') return null;

  const inTarget = p.status === 'in_target';
  const statusColor = p.alert_level === 'hypoglycemia_risk' ? C.red : inTarget ? C.green : C.amber;
  const trend = p.trend ?? '';
  const trendArrow = RISING.includes(trend) ? '↑' : FALLING.includes(trend) ? '↓' : '→';
  const trendDir: PredView['trendDir'] = RISING.includes(trend) ? 'up' : FALLING.includes(trend) ? 'down' : 'flat';

  let currentAtLabel: string | null = null;
  let readingIsOld = false;
  if (typeof p.current_at === 'string') {
    const d = new Date(p.current_at);
    if (!isNaN(d.getTime())) {
      currentAtLabel = d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      readingIsOld = Date.now() - d.getTime() > OLD_READING_MS;
    }
  }

  return {
    confidenceLow: String(p.confidence_label || '').toLowerCase() === 'low',
    readingIsOld,
    expectedAt: typeof p.expected_at === 'string' ? p.expected_at : null,
    expected: p.expected_mg_dl,
    current: typeof p.current_mg_dl === 'number' ? p.current_mg_dl : null,
    delta: typeof p.predicted_delta_mg_dl === 'number' ? p.predicted_delta_mg_dl : null,
    statusLabel: p.status_label || '',
    statusColor,
    inTarget,
    trendArrow,
    trendDir,
    confidenceLabel: p.confidence_label ? String(p.confidence_label) : null,
    aiPowered: p.ai_powered !== false,
    currentAtLabel,
  };
}

export interface InsightsDerived {
  dayStats: DayStats;
  interpolated: { label: string; value: number; real: boolean }[];
  weeklyStats: WeeklyStats;
  avgWeekDelta: number | null;
  weeklySVG: WeeklySVG;
  predictionSVG: PredictionSVG;
  patternViews: PatternView[];
  recommendationViews: RecommendationView[];
  predView: PredView | null;
}

/** Derives every view-model the dashboard cards render from logs + the loaded AI sections. */
export function useInsightsDerived(
  patterns: Pattern[],
  recommendations: Recommendation[],
  predictions: Prediction[],
): InsightsDerived {
  const { logs, selectedDate } = useData();
  const { profile } = useUser();
  const { C } = useTheme();

  const dayStats = useMemo(() => computeDayStats(logs, selectedDate, profile), [logs, selectedDate, profile]);
  const weekly = useMemo(() => computeWeeklyTrend(logs, selectedDate), [logs, selectedDate]);
  const interpolated = useMemo(() => interpolateWeekly(weekly), [weekly]);
  const weeklyStats = useMemo(() => computeWeeklyStats(logs, selectedDate), [logs, selectedDate]);
  const avgWeekDelta = useMemo(() => computeAvgWeekDelta(logs, selectedDate), [logs, selectedDate]);
  const weeklySVG = useMemo(() => buildWeeklySVG(interpolated), [interpolated]);
  const predictionSVG = useMemo(() => buildPredictionSVG(predictions), [predictions]);
  const patternViews = useMemo(() => mapPatterns(patterns), [patterns]);
  const recommendationViews = useMemo(() => mapRecommendations(recommendations), [recommendations]);
  const predView = useMemo(() => buildPredView(predictions, C), [predictions, C]);

  return { dayStats, interpolated, weeklyStats, avgWeekDelta, weeklySVG, predictionSVG, patternViews, recommendationViews, predView };
}
