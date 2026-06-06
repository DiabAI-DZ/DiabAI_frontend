import {
  Activity,
  BarChart3,
  Clock,
  Coffee,
  Moon,
  Pill,
  Sparkles,
  Star,
  Sun,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import type { PatternView } from '../../types/insights';

/**
 * Fixed Insights brand gradients (Figma). These are the app's red brand colors used on card
 * header strips, the prediction hero and circular icons — intentional design constants, NOT
 * themeable tokens, so they are kept verbatim here as the single source of truth.
 */
export const INSIGHTS_RED_STRIP = ['#C0392B', '#991B1B'] as const;
export const INSIGHTS_RED_HERO = ['#991B1B', '#C0392B', '#991B1B'] as const;
export const INSIGHTS_WEEKLY_LINE = '#C0392B';
/** Deep-red brand drop-shadow on the prediction hero + circular icon. */
export const INSIGHTS_BRAND_SHADOW = '#991B1B';

/** A category/trend accent: lucide icon + soft background + matching dark icon color. */
export interface Visual {
  Icon: LucideIcon;
  bg: string;
  color: string;
}

/** yyyy-mm-dd in local time (matches the keys the backend calendar/logs use). */
export const formatDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizePatternTrend = (t?: string): PatternView['trend'] => {
  const v = String(t || 'stable').toLowerCase();
  if (v === 'rising' || v === 'up') return 'rising';
  if (v === 'falling' || v === 'declining' || v === 'down') return 'declining';
  return 'stable';
};

export const normalizePatternConfidence = (c: unknown): number => {
  const n = typeof c === 'number' ? c : parseFloat(String(c));
  if (isNaN(n)) return 0;
  return Math.round(n <= 1 ? n * 100 : n);
};

// Decorative, category-specific accent colors (Figma legend). These map a pattern/recommendation
// to an icon + soft pastel background; they are illustrative UI constants, not theme tokens.
export const patternVisual = (category?: string, title?: string): Visual => {
  const text = `${category || ''} ${title || ''}`.toLowerCase();
  if (/meal|food|lunch|dinner|breakfast|carb|diet/.test(text)) return { Icon: Utensils, bg: '#FFF3E0', color: '#FB8C00' };
  if (/morning|sunrise|dawn|\bam\b/.test(text)) return { Icon: Sun, bg: '#FFFDE7', color: '#F9A825' };
  if (/weekend|trend|elevat/.test(text)) return { Icon: BarChart3, bg: '#E0F7F4', color: '#2BA8A0' };
  if (/exercise|activity|workout|walk|run|step/.test(text)) return { Icon: Activity, bg: '#E3F2FD', color: '#1E88E5' };
  if (/night|sleep|nocturnal|bed/.test(text)) return { Icon: Moon, bg: '#F3E5F5', color: '#8E24AA' };
  return { Icon: Sparkles, bg: '#F3F4F6', color: '#9CA3AF' };
};

// Trend → sparkline shape (raw y-coords: larger value sits lower, so "rising" reads upward).
export const PATTERN_SPARK: Record<PatternView['trend'], { data: number[]; color: string }> = {
  rising: { data: [20, 18, 15, 10, 6, 2], color: '#F39C12' },
  stable: { data: [15, 14, 16, 13, 15, 14], color: '#2ECC71' },
  declining: { data: [2, 5, 8, 13, 17, 20], color: '#3498DB' },
};

// Category/title → icon + soft background. Order matters: more specific matches (snack, activity,
// timing, medication) are checked before the broad "meal" match.
export const recVisual = (category?: string, title?: string): Visual => {
  const text = `${category || ''} ${title || ''}`.toLowerCase();
  if (/snack|coffee|protein/.test(text)) return { Icon: Coffee, bg: '#E8F5E9', color: '#2E7D32' };
  if (/activity|exercise|walk|workout|\brun\b|step|move/.test(text)) return { Icon: Activity, bg: '#E3F2FD', color: '#1565C0' };
  if (/timing|time|schedule|window|consistent/.test(text)) return { Icon: Clock, bg: '#F3E5F5', color: '#6A1B9A' };
  if (/medication|pill|insulin|dose|\bmed\b/.test(text)) return { Icon: Pill, bg: '#E0F7F4', color: '#00897B' };
  if (/meal|food|diet|carb|lunch|dinner|breakfast|rice|\beat\b/.test(text)) return { Icon: Utensils, bg: '#FFF3E0', color: '#E65100' };
  return { Icon: Star, bg: '#F5F5F5', color: '#757575' };
};

export interface PriorityStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
}

// Priority → badge label + colors (decorative status palette).
export const recPriorityStyle = (priority?: string): PriorityStyle => {
  const p = String(priority || '').toLowerCase();
  if (p === 'high') return { label: 'High', bg: '#FFEAEA', text: '#E53935', border: '#FFCDD2' };
  if (p === 'medium') return { label: 'Medium', bg: '#FFF8E1', text: '#F57F17', border: '#FFE082' };
  if (p === 'low' || p === 'suggested') return { label: 'Suggested', bg: '#EDE7F6', text: '#6A1B9A', border: '#D1C4E9' };
  const label = priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Suggested';
  return { label, bg: '#F5F5F5', text: '#757575', border: '#E0E0E0' };
};
