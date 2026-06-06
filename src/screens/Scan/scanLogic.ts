import { convertGlucose } from '../../services/apiService';
import type { LogEntry } from '../../services/types';
import foodDatabaseMin from '../../assets/food_database_min.json';
import mealNames from '../../assets/meal_names.json';
import type { FoodNutrients, ScanMode, ScanResultState } from './scanTypes';

type GlucoseStatus = 'Low' | 'Normal' | 'High';
type FoodDb = Record<string, FoodNutrients>;

const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** Local time + ISO date stamps for a fresh scan result. */
export const nowMeta = (): { time: string; date: string } => {
  const now = new Date();
  return { time: formatTime(now), date: now.toISOString().split('T')[0] };
};

/** Glucose status vs the user's goal range (goals are in mg/dL; converted for mmol/L readings). */
export function getStatus(value: number, unit: string, min = 70, max = 140): GlucoseStatus {
  const isMmol = unit === 'mmol/L';
  const lowLimit = isMmol ? convertGlucose(min, 'mmol/L', 'mg/dL') : min;
  const highLimit = isMmol ? convertGlucose(max, 'mmol/L', 'mg/dL') : max;
  if (value < lowLimit) return 'Low';
  if (value > highLimit) return 'High';
  return 'Normal';
}

/** Look up nutrients by exact key, then by fuzzy substring match. */
export function lookupMealNutrients(mealName: string): FoodNutrients | null {
  if (!mealName) return null;
  const db = foodDatabaseMin as FoodDb;
  const key = mealName.toLowerCase().trim();
  const exact = db[key];
  if (exact) return exact;
  const foundKey = Object.keys(db).find((k) => k.includes(key) || key.includes(k));
  return foundKey ? db[foundKey] : null;
}

/** Turn raw OCR text into a glucose result, handling Hi/Lo/Err codes + a mmol/L heuristic. Throws on unreadable input. */
export function parseGlucoseReading(rawText: string, confidence: number, imageUri: string, imagePath?: string): ScanResultState {
  const base: ScanResultState = { confidence, tag: 'Fasting', ...nowMeta(), imageUri, imagePath };
  if (/^(Hi|HI|HIGH)$/i.test(rawText)) return { ...base, value: 500, unit: 'mg/dL' };
  if (/^(Lo|LO|LOW)$/i.test(rawText)) return { ...base, value: 20, unit: 'mg/dL' };
  if (/^(Er|ERR|ERROR)$/i.test(rawText)) throw new Error('Glucometer shows an error code. Please retry with a valid reading.');

  const numericValue = parseFloat(rawText.replace(/[^0-9.]/g, ''));
  if (isNaN(numericValue) || numericValue <= 0) {
    throw new Error(`Could not read a valid glucose value from the image. OCR detected: "${rawText}"`);
  }
  // mmol/L values are typically 1.1–33.3 (and dotted); mg/dL values are 20–600.
  const unit = numericValue <= 33.3 && rawText.includes('.') ? 'mmol/L' : 'mg/dL';
  return { ...base, value: numericValue, unit };
}

/** Seed result for manual entry (empty glucose reading or a blank meal). */
export function buildManualResult(mode: ScanMode, glucoseUnit?: string): ScanResultState {
  const meta = nowMeta();
  if (mode === 'glucose') return { value: 0, unit: glucoseUnit || 'mg/dL', tag: 'Fasting', ...meta };
  return { title: 'New Meal', meal_type: 'snack', calories: 0, carbs: 0, impact: 0, food_items: [], ...meta };
}

/** Whether a meal title exactly matches a known meal-name DB entry. */
export function isValidMealName(title?: string): boolean {
  const v = (title || '').toLowerCase().trim();
  return (mealNames as string[]).some((n) => n.toLowerCase().trim() === v);
}

/** Up to 5 meal-name autocomplete suggestions for a partial title. */
export function mealSuggestions(title?: string): string[] {
  const q = (title || '').toLowerCase().trim();
  if (!q) return [];
  return (mealNames as string[]).filter((n) => n.toLowerCase().includes(q) && n.toLowerCase().trim() !== q).slice(0, 5);
}

/** Apply a chosen/typed meal name, merging in DB nutrients when the name matches. */
export function applyMealSelection(prev: ScanResultState, name: string): ScanResultState {
  const db = lookupMealNutrients(name);
  if (db) return { ...prev, title: name, calories: db.calories, carbs: db.carbs, protein: db.protein || 0, fat: db.fat || 0, impact: db.impact };
  return { ...prev, title: name };
}

/** addLog payload for a scanned/manual glucose measurement. */
export function buildMeasurementLog(result: ScanResultState, notes: string, status: GlucoseStatus, isManual: boolean, isoNow: string): Omit<LogEntry, 'id'> {
  return {
    type: 'measurement',
    value: result.value,
    unit: result.unit || 'mg/dL',
    status,
    time: formatTime(new Date(isoNow)),
    date: isoNow,
    tag: result.tag || (isManual ? 'Manual' : 'Scan'),
    notes,
    trend: 'stable',
    imagePath: result.imagePath,
  } as unknown as Omit<LogEntry, 'id'>;
}

/** addLog payload for a scanned/manual meal. */
export function buildMealLog(result: ScanResultState, notes: string, photo: string | null, isoNow: string): Omit<LogEntry, 'id'> {
  return {
    type: 'meal',
    name: result.title,
    mealType: result.meal_type,
    time: formatTime(new Date(isoNow)),
    date: isoNow,
    carbs: result.carbs,
    calories: result.calories,
    protein: result.protein || 0,
    fat: result.fat || 0,
    impact: result.impact,
    image: photo || '',
    imagePath: result.imagePath,
    food_items: result.food_items || [],
    notes,
    tags: [],
    predicted_label: result.predicted_label,
    corrected_label: result.title,
    model_version: result.model_version,
    confidence: result.confidence,
  } as unknown as Omit<LogEntry, 'id'>;
}
