export type GlucoseStatus = "Normal" | "High" | "Low";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type Severity = "critical" | "warning" | "info";
export type GlucoseTrend = "up" | "down" | "stable";
export type ImpactLevel = "low" | "medium" | "high";

export interface MeasurementEntry {
  id: number;
  type: "measurement";
  value: number;
  unit: string;
  status: GlucoseStatus;
  time: string;
  date: string; // ISO string
  tag?: string;
  trend?: GlucoseTrend;
  previousValue?: number;
  dailyAvg?: number;
}

export interface MealEntry {
  id: number;
  type: "meal";
  name: string;
  mealType: MealType;
  time: string;
  date: string; // ISO string
  carbs: number;
  calories: number;
  protein?: number;
  fat?: number;
  fiber?: number;
  impact: string;
  impactLevel: ImpactLevel;
  image: string;
  tags?: string[];
}

export interface AlertItem {
  id: number;
  severity: Severity;
  title: string;
  desc: string;
  time: string;
  date: string;
  tag?: "AI Detected" | "System" | "Logged";
  read?: boolean;
}

export type LogEntry = MeasurementEntry | MealEntry;

export interface UserProfile {
  name: string;
  email: string;
  diabetesType: "Type 1" | "Type 2" | "Gestational" | "Prediabetic";
  glucoseUnit: "mg/dL" | "mmol/L";
  goals: {
    min: number;
    max: number;
  };
  weight?: number;
  height?: number;
}

export interface ScanResult {
  value: number;
  unit: string;
  confidence: number;
  timestamp: string;
  imageUri: string;
}

export interface AISummary {
  summary: string;
  recommendation: string;
  status: "Normal" | "High" | "Low";
}

export interface HomeRecommendation {
  id: number;
  title: string;
  image_url: string | null;
  impact_level: "low" | "moderate" | "high";
  impact_label: string;
  calories: number;
  estimated_glucose_impact_mg_dl: number;
}

export interface HomeTrendPoint {
  date: string;
  label: string;
  avg_value: number | null;
}

export interface HomeData {
  greeting: {
    name: string;
    date: string;
  };
  latest_reading?: {
    id: number;
    value_mg_dl: number;
    health_status: "low" | "normal" | "high";
    trend: "stable" | "rising" | "falling" | null;
    delta_since_last: number | null;
    measured_at: string;
    target: {
      min: number;
      max: number;
    };
  } | null;
  glucose_trend: {
    period: "7d" | "30d";
    target_min: number;
    target_max: number;
    points: HomeTrendPoint[];
  };
  recommendations: HomeRecommendation[];
}
