// Insights feature types. The screen + service currently pass these sections around as `any`;
// these interfaces are the typed contract the Insights hook and cards adopt as that screen is
// decomposed. Field sets mirror the live /api/insights aggregate (see insightsService mapping
// comments) and the screen's existing reads — optional/loose where the backend payload varies.

// ── Raw API section payloads (as mapped into the InsightsBundle) ─────────────
export interface CalendarDay {
  date: string;
  label?: string;
  day?: number;
  has_data?: boolean;
  is_selected?: boolean;
}

export interface Calendar {
  days?: CalendarDay[];
  selected_date?: string;
}

export interface Pattern {
  id?: number | string;
  title?: string;
  name?: string;
  description?: string;
  desc?: string;
  evidence?: string;
  category?: string;
  confidence?: number;
  trend?: string;
  priority?: string;
  severity?: string;
}

export interface Recommendation {
  id?: number | string;
  title?: string;
  action?: string;
  description?: string;
  desc?: string;
  reason?: string;
  body?: string;
  icon?: string;
  category?: string;
  priority?: string;
  priority_label?: string;
}

export interface Prediction {
  expected_mg_dl?: number | null;
  expected_at?: string;
  current_mg_dl?: number;
  current_at?: string;
  status?: string;            // 'in_target' | 'offline' | ...
  status_label?: string;
  alert_level?: string;       // 'hypoglycemia_risk' | ...
  trend?: string;             // 'rising' | 'rising_rapidly' | 'falling' | ...
  predicted_delta_mg_dl?: number;
  confidence_label?: string;
  ai_powered?: boolean;
}

/** The prediction card's display model, derived from a raw Prediction + theme colors. */
export interface PredView {
  confidenceLow: boolean;
  readingIsOld: boolean;
  expectedAt: string | null;
  expected: number;
  current: number | null;
  delta: number | null;
  statusLabel: string;
  statusColor: string;
  inTarget: boolean;
  trendArrow: string;
  trendDir: 'up' | 'down' | 'flat';
  confidenceLabel: string | null;
  aiPowered: boolean;
  currentAtLabel: string | null;
}

export interface InsulinEstimate {
  units?: number;
  current_mg_dl?: number;
  target_mg_dl?: number;
  basis?: string;
  disclaimer?: string;
  ai_powered?: boolean;
}

// ── Bundle section wrappers (the shape applyBundle reads) ────────────────────
export interface RecommendationsResult {
  recommendations: Recommendation[] | null;
  calendar: Calendar | null;
  model_used: string | null;
}

export interface PatternsResult {
  patterns: Pattern[] | null;
  model_used: string | null;
}

export interface PredictionResult {
  prediction: Prediction | null;
}

export interface InsulinResult {
  insulin_estimate: InsulinEstimate | null;
  calendar: Calendar | null;
}

// ── Derived view models consumed by the cards ───────────────────────────────
export interface DayStats {
  avg: number;
  inRangePercent: number;
  stability: number;
  lowPercent: number;
  normalPercent: number;
  highPercent: number;
  count: number;
}

export interface WeeklyTrendPoint {
  date?: string;
  label: string;
  value: number | null;
  real: boolean;
}

export interface WeeklyStats {
  lowest: number;
  highest: number;
  readings: number;
  stdDev: number;
}

export interface MealImpact {
  meal: string;
  before: string;
  after: string | number;
  delta: string | number;
  emoji: string;
  severity: 'high' | 'low';
}

export interface PatternView {
  id: number | string;
  title: string;
  desc: string;
  category: string;
  confidencePct: number;
  trend: 'rising' | 'stable' | 'declining';
}

export interface RecommendationView {
  id: number | string;
  title: string;
  desc: string;
  category: string;
  priority: string;
}

/** A chat message in the Insights assistant. */
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
}
