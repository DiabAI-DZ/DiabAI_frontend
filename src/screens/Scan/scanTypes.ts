import type { Animated } from 'react-native';

export type ScanMode = 'glucose' | 'meal';
export type ScanState = 'camera' | 'analyzing' | 'adjustment' | 'confirm' | 'manual' | 'error';
export type OcrModel = 'tflite' | 'backend';

/** Loose merged result the confirm sheet edits — superset of glucose + meal scan fields. */
export interface ScanResultState {
  // glucose
  value?: number;
  unit?: string;
  tag?: string;
  // meal
  title?: string;
  meal_type?: string;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  impact?: number;
  food_items?: Array<{ name: string; carbs: number }>;
  predicted_label?: string;
  model_version?: string;
  // shared
  confidence?: number | null;
  time?: string;
  date?: string;
  imageUri?: string;
  imagePath?: string;
  is_mock?: boolean;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  anim: Animated.Value;
}

/** A single food entry from the local nutrient DB. */
export interface FoodNutrients {
  calories: number;
  carbs: number;
  protein?: number;
  fat?: number;
  impact: number;
}
