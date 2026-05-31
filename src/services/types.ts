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
  notes?: string;
  imagePath?: string;
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
  notes?: string;
  predicted_label?: string;
  corrected_label?: string;
  model_version?: string;
  confidence?: number | null;
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

export interface InsulinInjectionEntry {
  id: number;
  type: "injection";
  insulinType: "rapid_acting" | "short_acting" | "intermediate" | "long_acting" | "ultra_long_acting" | "mixed";
  dose: number;
  site?: "abdomen" | "thigh" | "arm" | "buttock";
  reason: "basal" | "correction" | "meal_coverage" | "other";
  time: string;
  date: string;
  notes?: string;
}

export interface ActivityEntry {
  id: number;
  type: "activity";
  activityType: "walking" | "running" | "cycling" | "swimming" | "gym" | "yoga" | "football" | "basketball" | "other";
  duration: number; // minutes
  intensity: "low" | "moderate" | "high";
  calories?: number;
  distance?: number;
  steps?: number;
  heartRate?: number;
  impact?: "decrease" | "stable" | "increase";
  time: string;
  date: string;
  notes?: string;
}

export type LogEntry = MeasurementEntry | MealEntry | InsulinInjectionEntry | ActivityEntry;

export interface UserProfile {
  name: string;
  email: string;
  diabetesType: "Type 1" | "Type 2" | "Gestational" | "Prediabetic";
  glucoseUnit: "mg/dL" | "mmol/L";
  goals: {
    min: number;
    max: number;
  };
  phone_number?: string;
  address?: string;
  weight?: number;
  height?: number;
  age?: number;
  sex?: 'male' | 'female';
  isPremium?: boolean;
}

export interface ScanResult {
  value: number;
  unit: string;
  confidence: number;
  timestamp: string;
  imageUri: string;
  imagePath?: string;
}

export interface MealScanResult {
  title: string;
  meal_type: MealType;
  calories: number;
  carbs: number;
  protein?: number;
  fat?: number;
  impact: number;
  confidence: number | null;
  imageUri?: string;
  imagePath?: string;
  food_items?: Array<{ name: string; carbs: number }>;
  predicted_label?: string;
  model_version?: string;
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
