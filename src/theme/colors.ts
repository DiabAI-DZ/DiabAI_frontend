// Centralized color tokens for DiabAI. Every screen and component reads colors
// from here through useTheme() — no hardcoded color strings should live in the UI.
//
// Two token sets are exported:
//   • LightTheme / DarkTheme — the canonical app tokens (use these in new/converted code)
//   • LegacyLightColors / LegacyDarkColors — the original `C.*` palette, kept so the many
//     screens already wired to `const { C } = useTheme()` keep rendering unchanged. Both sets
//     are driven by the same `isDark` flag, so the whole app flips together.

export const LightTheme = {
  // Backgrounds
  background:        '#F8F8F8',
  backgroundCard:    '#FFFFFF',
  backgroundInput:   '#FFFFFF',
  backgroundMuted:   '#F0F0F0',

  // Form inputs (pink-tinted fields used app-wide)
  inputBg:           '#FCF0F0',
  inputBorder:       '#EAC5C5',
  inputText:         '#C88686',

  // Brand
  primary:           '#8B0000',
  primaryLight:      '#FFF0F0',
  primaryBanner:     '#8B0000',

  // Text
  textPrimary:       '#1C1C1E',
  textSecondary:     '#8E8E93',
  textMuted:         '#C7C7CC',
  textOnPrimary:     '#FFFFFF',
  textLink:          '#8B0000',

  // Borders & dividers
  border:            '#E5E5EA',
  divider:           '#F0F0F0',

  // Severity — Critical
  criticalBg:        '#FFEAEA',
  criticalText:      '#E53935',
  criticalDot:       '#E53935',
  criticalBanner:    '#8B0000',

  // Severity — Warning
  warningBg:         '#FFF8E1',
  warningText:       '#F57F17',
  warningDot:        '#F57F17',

  // Severity — Info
  infoBg:            '#E3F2FD',
  infoText:          '#1565C0',
  infoDot:           '#1565C0',

  // Source tags
  aiDetectedBg:      '#F3E5F5',
  aiDetectedText:    '#6A1B9A',
  systemTagBg:       '#F5F5F5',
  systemTagText:     '#757575',
  loggedTagBg:       '#E8F5E9',
  loggedTagText:     '#2E7D32',

  // Nutrition rings
  carbsColor:        '#F39C12',
  proteinColor:      '#3498DB',
  fatColor:          '#9B59B6',
  fiberColor:        '#2ECC71',

  // Status
  success:           '#2ECC71',
  successBg:         '#E8FFF5',
  orange:            '#F39C12',
  teal:              '#2ECC71',
  blue:              '#3498DB',

  // Chart
  trendLine:         '#8B0000',
  trendLow:          '#E74C3C',
  trendHigh:         '#F39C12',
  chartDashed:       '#E74C3C',

  // Shadow
  shadow:            'rgba(0,0,0,0.08)',

  // Tab bar
  tabBarBg:          '#FFFFFF',
  tabBarActive:      '#8B0000',
  tabBarInactive:    '#8E8E93',

  // Toggle
  toggleOn:          '#8B0000',
  toggleOff:         '#E5E5EA',
};

export const DarkTheme = {
  // Backgrounds
  background:        '#0F0F14',
  backgroundCard:    '#1C1C22',
  backgroundInput:   '#2A2A32',
  backgroundMuted:   '#252530',

  // Form inputs (pink-tinted fields used app-wide; dark variants)
  inputBg:           '#241A1C',
  inputBorder:       '#5A3A3A',
  inputText:         '#D8A9A9',

  // Brand (keep red — it works on dark)
  primary:           '#C0392B',
  primaryLight:      '#3D1010',
  primaryBanner:     '#7D0000',

  // Text
  textPrimary:       '#F2F2F7',
  textSecondary:     '#8E8E93',
  textMuted:         '#48484A',
  textOnPrimary:     '#FFFFFF',
  textLink:          '#FF6B6B',

  // Borders & dividers
  // `border` is intentionally lighter than the input/card fills (#1C1C22 / #2A2A32) so input
  // outlines stay visible in dark mode; `divider` stays subtle for hairline separators.
  border:            '#3A3A3C',
  divider:           '#2C2C2E',

  // Severity — Critical (darker tints)
  criticalBg:        '#3D1010',
  criticalText:      '#FF6B6B',
  criticalDot:       '#FF6B6B',
  criticalBanner:    '#7D0000',

  // Severity — Warning
  warningBg:         '#3D2B00',
  warningText:       '#FFB74D',
  warningDot:        '#FFB74D',

  // Severity — Info
  infoBg:            '#0D2137',
  infoText:          '#64B5F6',
  infoDot:           '#64B5F6',

  // Source tags
  aiDetectedBg:      '#2D1A3D',
  aiDetectedText:    '#CE93D8',
  systemTagBg:       '#2C2C2E',
  systemTagText:     '#AEAEB2',
  loggedTagBg:       '#0D2B1A',
  loggedTagText:     '#81C784',

  // Nutrition rings (slightly brighter for dark bg)
  carbsColor:        '#FFB300',
  proteinColor:      '#42A5F5',
  fatColor:          '#AB47BC',
  fiberColor:        '#66BB6A',

  // Status
  success:           '#66BB6A',
  successBg:         '#0D2B1A',
  orange:            '#FFB300',
  teal:              '#4DB6AC',
  blue:              '#42A5F5',

  // Chart
  trendLine:         '#FF6B6B',
  trendLow:          '#EF5350',
  trendHigh:         '#FFA726',
  chartDashed:       '#EF5350',

  // Shadow
  shadow:            'rgba(0,0,0,0.4)',

  // Tab bar
  tabBarBg:          '#1C1C22',
  tabBarActive:      '#FF6B6B',
  tabBarInactive:    '#636366',

  // Toggle
  toggleOn:          '#C0392B',
  toggleOff:         '#3A3A3C',
};

export type AppTheme = typeof LightTheme;

/** Canonical dark-red brand gradient (Figma): top-left #A01818 → bottom-right #8B0000.
 * Shared by the home "Latest Reading" hero card, the insights prediction banner, and the
 * selected date in the insights date strip so the brand surfaces stay identical. This is a
 * decorative brand constant, not a themeable token. */
export const BRAND_RED_GRADIENT = ['#A01818', '#8B0000'] as const;

// ──────────────────────────────────────────────────────────────────────────
// Legacy palette (`C.*`). Preserved verbatim so screens migrated earlier keep
// their exact look. New code should prefer the LightTheme/DarkTheme tokens above.
// ──────────────────────────────────────────────────────────────────────────

export const LegacyLightColors = {
  red: "#C41E26",
  redDark: "#7B0C12",
  redLight: "#E32B34",
  redBg: "#FDF1F1",
  redBorder: "#F2D0D0",
  redMuted: "#A86262",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
  amber: "#D97706",
  amberBg: "#FFFBEB",
  amberBorder: "#FDE68A",
  blue: "#2563EB",
  blueBg: "#EFF6FF",
  blueBorder: "#BFDBFE",
  purple: "#7C3AED",
  purpleBg: "#F5F3FF",
  purpleBorder: "#DDD6FE",
  text: "#111827",
  textDark: "#451C1C",
  textMd: "#4B5563",
  textSm: "#6B7280",
  textXs: "#9CA3AF",
  bg: "#F8F6F6",
  divider: "#F5DEDE",
  white: "#FFFFFF",
  black: "#000000",
};

export const LegacyDarkColors = {
  ...LegacyLightColors,
  bg: "#100e10",
  divider: "#2A2424",
  text: "#f5eded",
  textDark: "#ede8e8",
  textMd: "#e8e2e2",
  textSm: "#9CA3AF",
  white: "#1a1215",
  black: "#FFFFFF",
  // Dark variants for the tint tokens (used as icon-box / pill / badge / fallback
  // backgrounds and borders). Without these, the originals stayed light-pink/green/etc
  // in dark mode. Kept in sync with the new DarkTheme severity tints. The saturated
  // foreground accents (red/green/amber/blue/purple) deliberately stay vivid.
  redBg: "#3D1010",
  redBorder: "#5A2626",
  greenBg: "#0D2B1A",
  greenBorder: "#1E5235",
  amberBg: "#3D2B00",
  amberBorder: "#5C4410",
  blueBg: "#0D2137",
  blueBorder: "#1C3D5C",
  purpleBg: "#2D1A3D",
  purpleBorder: "#43305C",
};

export type LegacyColors = typeof LegacyLightColors;
