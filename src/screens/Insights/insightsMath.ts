import { Dimensions } from 'react-native';
import type { LogEntry, MeasurementEntry, UserProfile } from '../../services/types';
import type {
  DayStats,
  Pattern,
  PatternView,
  Prediction,
  Recommendation,
  RecommendationView,
  WeeklyStats,
  WeeklyTrendPoint,
} from '../../types/insights';
import { formatDateStr, normalizePatternConfidence, normalizePatternTrend } from './insightsVisuals';

const { width } = Dimensions.get('window');
export const CHART_WIDTH = width - 48;
// The weekly-trend chart sits inside an inset inner card, so it's narrower than the content width.
export const WEEKLY_CHART_W = CHART_WIDTH - 48;
export const CHART_HEIGHT = 110;

const DAY_MS = 24 * 60 * 60 * 1000;
const isMeasurementOn = (l: LogEntry, dateStr: string): l is MeasurementEntry =>
  l.type === 'measurement' && formatDateStr(new Date(l.date)) === dateStr;

/** Glucose distribution + averages for a single day (with sensible placeholders for empty days). */
export function computeDayStats(logs: LogEntry[], selectedDate: Date, profile: UserProfile | null): DayStats {
  const dateStr = formatDateStr(selectedDate);
  const dayLogs = logs.filter((l): l is MeasurementEntry => isMeasurementOn(l, dateStr));
  const minGoal = profile?.goals?.min || 70;
  const maxGoal = profile?.goals?.max || 140;

  if (dayLogs.length === 0) {
    return { avg: 120, inRangePercent: 75, stability: 75, lowPercent: 10, normalPercent: 75, highPercent: 15, count: 0 };
  }

  const values = dayLogs.map((l) => l.value);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const lowCount = dayLogs.filter((l) => l.value < minGoal).length;
  const normalCount = dayLogs.filter((l) => l.value >= minGoal && l.value <= maxGoal).length;
  const lowPercent = Math.round((lowCount / values.length) * 100);
  const normalPercent = Math.round((normalCount / values.length) * 100);
  const highPercent = 100 - lowPercent - normalPercent;

  return { avg, inRangePercent: normalPercent, stability: normalPercent, lowPercent, normalPercent, highPercent, count: values.length };
}

/** Daily average glucose for the 7 days ending at selectedDate (value null on days with no data). */
export function computeWeeklyTrend(logs: LogEntry[], selectedDate: Date): WeeklyTrendPoint[] {
  const points: WeeklyTrendPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(selectedDate);
    d.setDate(selectedDate.getDate() - i);
    const dateStr = formatDateStr(d);
    const dayLogs = logs.filter((l): l is MeasurementEntry => isMeasurementOn(l, dateStr));
    const avg = dayLogs.length > 0 ? Math.round(dayLogs.reduce((acc, c) => acc + (c.value || 0), 0) / dayLogs.length) : null;
    points.push({ date: dateStr, label: d.toLocaleDateString('en-US', { weekday: 'narrow' }), value: avg, real: avg !== null });
  }
  return points;
}

/** Fill gaps in the weekly trend by linear interpolation so the line stays continuous. */
export function interpolateWeekly(weekly: WeeklyTrendPoint[]): { label: string; value: number; real: boolean }[] {
  const hasReal = weekly.some((p) => p.real);
  if (!hasReal) {
    return weekly.map((item, index) => ({ ...item, value: 120 + Math.sin(index * 1.2) * 15 }));
  }
  const data = weekly.map((p) => ({ ...p }));
  let lastRealVal = 120;
  const firstReal = data.find((d) => d.real);
  if (firstReal && firstReal.value !== null) lastRealVal = firstReal.value;

  for (let i = 0; i < data.length; i++) {
    if (data[i].value === null) {
      let nextRealIndex = -1;
      for (let j = i + 1; j < data.length; j++) {
        if (data[j].real) { nextRealIndex = j; break; }
      }
      if (nextRealIndex !== -1 && data[nextRealIndex].value !== null) {
        const nextRealVal = data[nextRealIndex].value!;
        const steps = nextRealIndex - (i - 1);
        data[i].value = lastRealVal + (nextRealVal - lastRealVal) / steps;
      } else {
        data[i].value = lastRealVal;
      }
    } else {
      lastRealVal = data[i].value!;
    }
  }
  return data as { label: string; value: number; real: boolean }[];
}

/** Lowest / highest / count / std-dev across the 7 days ending at selectedDate. */
export function computeWeeklyStats(logs: LogEntry[], selectedDate: Date): WeeklyStats {
  const startDate = new Date(selectedDate);
  startDate.setDate(selectedDate.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(selectedDate);
  endDate.setHours(23, 59, 59, 999);

  const weekLogs = logs.filter((l): l is MeasurementEntry => {
    const d = new Date(l.date);
    return l.type === 'measurement' && d >= startDate && d <= endDate;
  });
  if (weekLogs.length === 0) return { lowest: 0, highest: 0, readings: 0, stdDev: 0 };

  const values = weekLogs.map((l) => l.value);
  const readings = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / readings;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / readings;
  return { lowest: Math.min(...values), highest: Math.max(...values), readings, stdDev: Math.round(Math.sqrt(variance) * 10) / 10 };
}

/** This week's mean glucose minus the prior week's. null if either week has no readings. */
export function computeAvgWeekDelta(logs: LogEntry[], selectedDate: Date): number | null {
  const end = new Date(selectedDate); end.setHours(23, 59, 59, 999);
  const thisStart = new Date(end.getTime() - 6 * DAY_MS); thisStart.setHours(0, 0, 0, 0);
  const prevEnd = new Date(thisStart.getTime() - 1);
  const prevStart = new Date(thisStart.getTime() - 7 * DAY_MS);
  const meanIn = (from: Date, to: Date): number | null => {
    const vals = logs
      .filter((l): l is MeasurementEntry => l.type === 'measurement' && new Date(l.date) >= from && new Date(l.date) <= to)
      .map((l) => l.value);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const cur = meanIn(thisStart, end);
  const prev = meanIn(prevStart, prevEnd);
  if (cur == null || prev == null) return null;
  return Math.round(cur - prev);
}

export interface WeeklySVG {
  points: { x: number; y: number }[];
  path: string;
  limitMinY: number;
  limitMaxY: number;
  paddingLeft: number;
}

/** Smooth cubic-bezier path + target lines for the weekly trend chart. */
export function buildWeeklySVG(interpolated: { value: number }[]): WeeklySVG {
  const minVal = 50, maxVal = 200;
  const paddingLeft = 25, paddingRight = 10, paddingTop = 10;
  const graphWidth = WEEKLY_CHART_W - paddingLeft - paddingRight;
  const graphHeight = 70;

  const points = interpolated.map((item, index) => ({
    x: paddingLeft + (index / (interpolated.length - 1)) * graphWidth,
    y: paddingTop + graphHeight - ((item.value - minVal) / (maxVal - minVal)) * graphHeight,
  }));

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i], p1 = points[i + 1];
    const cpX = p0.x + (p1.x - p0.x) / 2;
    path += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  const limitMinY = paddingTop + graphHeight - ((70 - minVal) / (maxVal - minVal)) * graphHeight;
  const limitMaxY = paddingTop + graphHeight - ((140 - minVal) / (maxVal - minVal)) * graphHeight;
  return { points, path, limitMinY, limitMaxY, paddingLeft };
}

export interface PredictionSVG {
  points: { x: number; y: number }[];
  path: string;
  limitY: number;
  paddingLeft: number;
}

/** Decorative forecast trend curve ending at the backend's predicted value. */
export function buildPredictionSVG(predictions: Prediction[]): PredictionSVG {
  const pred = predictions[0];
  const minVal = 70, maxVal = 220, pL = 10, pR = 10, pT = 10;
  const gW = CHART_WIDTH - pL - pR;
  const gH = CHART_HEIGHT - pT - 20;
  const base = pred?.expected_mg_dl ? Math.max(minVal, pred.expected_mg_dl * 0.65) : 110;
  const end = pred?.expected_mg_dl ?? 160;
  const series = [base, base * 1.05, base * 1.12, base * 1.2, end];
  const points = series.map((v, i) => ({
    x: pL + (i / (series.length - 1)) * gW,
    y: pT + gH - ((Math.min(v, maxVal) - minVal) / (maxVal - minVal)) * gH,
  }));
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i], p1 = points[i + 1];
    const cpX = p0.x + (p1.x - p0.x) / 2;
    path += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  const limitY = pT + gH - ((140 - minVal) / (maxVal - minVal)) * gH;
  return { points, path, limitY, paddingLeft: pL };
}

export function mapPatterns(detected: Pattern[]): PatternView[] {
  return detected.map((p, i) => ({
    id: p.id ?? i,
    title: p.title || p.name || 'Pattern',
    desc: p.description || p.desc || p.evidence || '',
    category: p.category || '',
    confidencePct: normalizePatternConfidence(p.confidence ?? 0.85),
    trend: normalizePatternTrend(p.trend),
  }));
}

export function mapRecommendations(recs: Recommendation[]): RecommendationView[] {
  return recs.map((r, i) => ({
    id: r.id ?? i,
    title: r.title || r.action || 'Recommendation',
    desc: r.description || r.desc || r.reason || r.body || '',
    category: r.category || '',
    priority: r.priority || r.priority_label || 'suggested',
  }));
}
