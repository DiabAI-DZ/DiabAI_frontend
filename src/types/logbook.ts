// Logbook filter + section types. Query/stat shapes live in apiService; re-exported here so
// Logbook code has one feature-local import surface.
import type { LogEntry } from './index';

export type { LogbookQueryParams, LogbookStats } from '../services/apiService';

export type LogGlucoseStatus = 'Normal' | 'High' | 'Low';
export type FilterType = 'all' | 'measurements' | 'meals' | 'injections' | 'activities';
export type DatePreset = 'today' | '7days' | '30days' | 'custom';
export type MealTypeFilter = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type GlucosePreset = 'low' | 'normal' | 'high' | null;

export interface Filters {
  typeFilter: FilterType;
  datePreset: DatePreset;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  glucosePreset: GlucosePreset;
  glucoseMin: number;
  glucoseMax: number;
  mealTypes: MealTypeFilter[];
}

export const defaultFilters: Filters = {
  typeFilter: 'all',
  datePreset: '30days',
  rangeStart: null,
  rangeEnd: null,
  glucosePreset: null,
  glucoseMin: 40,
  glucoseMax: 300,
  mealTypes: [],
};

/** How many entries to request per /api/logbook page for infinite scroll. */
export const PAGE_SIZE = 20;

/** One calendar-day group of entries, newest day first. */
export interface LogbookSection {
  key: string;
  label: string;
  sublabel: string;
  entries: LogEntry[];
}
