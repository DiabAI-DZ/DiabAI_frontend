// Pure mapping helpers for notifications: relative time + severity/source/icon visuals.
// All colors come from the theme (passed in) so there are no hardcoded values here.
import {
  AlertTriangle,
  Zap,
  TrendingUp,
  Activity,
  Utensils,
  CheckCircle2,
  Droplets,
  Settings as SettingsIcon,
  Bell,
  type LucideIcon,
} from 'lucide-react-native';
import type { AppTheme } from '../../theme/colors';
import type { AlertItem } from '../../types';

/** Relative-time formatter from an ISO timestamp ("5 mins ago"). */
export const timeAgo = (iso?: string): string => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min${m > 1 ? 's' : ''} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
};

export interface SeverityTag {
  label: string;
  bg: string;
  text: string;
  dot: string;
  border: string;
  filled: boolean;
}

export const severityTag = (sev: string, c: AppTheme): SeverityTag => {
  if (sev === 'critical') return { label: 'Critical', bg: c.criticalText, text: c.textOnPrimary, dot: c.textOnPrimary, border: c.criticalText, filled: true };
  if (sev === 'warning') return { label: 'Warning', bg: c.warningBg, text: c.warningText, dot: c.warningText, border: c.warningBg, filled: false };
  if (sev === 'info') return { label: 'Info', bg: c.infoBg, text: c.infoText, dot: c.infoText, border: c.infoBg, filled: false };
  return { label: 'Alert', bg: c.systemTagBg, text: c.systemTagText, dot: c.textMuted, border: c.border, filled: false };
};

export interface SourceTag {
  label: string;
  bg: string;
  text: string;
  Icon: LucideIcon;
}

export const sourceTag = (item: AlertItem, c: AppTheme): SourceTag => {
  const text = `${item.title || ''} ${item.desc || ''}`.toLowerCase();
  if (item.tag === 'AI Detected') return { label: 'AI Detected', bg: c.aiDetectedBg, text: c.aiDetectedText, Icon: Zap };
  if (item.tag === 'Logged' || (item.severity === 'info' && /log|logged|meal|breakfast|lunch|dinner|estimat|carb/.test(text))) {
    return { label: 'Logged', bg: c.loggedTagBg, text: c.loggedTagText, Icon: CheckCircle2 };
  }
  return { label: 'System', bg: c.systemTagBg, text: c.systemTagText, Icon: SettingsIcon };
};

export interface CardIcon {
  Icon: LucideIcon;
  circle: string;
  color: string;
}

/** Solid severity-colored icon circle with a white glyph (dark red / orange / blue). */
export const cardIcon = (item: AlertItem, c: AppTheme): CardIcon => {
  const sev = item.severity;
  const t = `${item.title || ''} ${item.desc || ''}`.toLowerCase();
  const white = c.textOnPrimary;
  if (sev === 'critical') {
    return { Icon: item.tag === 'System' ? AlertTriangle : Zap, circle: c.primary, color: white };
  }
  if (sev === 'warning') {
    return { Icon: /variab|fluctuat|unusual/.test(t) ? Activity : TrendingUp, circle: c.warningText, color: white };
  }
  // info (and anything else): pick a relevant glyph, blue circle
  let Icon: LucideIcon = Bell;
  if (/log|meal|breakfast|lunch|dinner|carb|oatmeal|snack/.test(t)) Icon = Utensils;
  else if (/normal|in range|target|good|stable/.test(t)) Icon = CheckCircle2;
  else if (/activity|exercise|walk|step|run/.test(t)) Icon = Activity;
  else if (/reading|glucose|fasting|mg\/dl/.test(t)) Icon = Droplets;
  return { Icon, circle: c.infoText, color: white };
};

export const unreadDotColor = (sev: string, c: AppTheme): string =>
  sev === 'critical' ? c.criticalDot : sev === 'warning' ? c.warningDot : sev === 'info' ? c.infoDot : c.textMuted;
