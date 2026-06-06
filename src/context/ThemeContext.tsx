// The theme system now lives in src/theme. This module is kept as a compatibility
// re-export so the many screens/components importing `../context/ThemeContext`
// keep working unchanged while gaining persistence, system-default detection, and
// the new `colors` token API.
export {
  ThemeProvider,
  useTheme,
  type ThemeMode,
} from '../theme/ThemeContext';

export {
  LegacyLightColors as COLORS,
  LegacyDarkColors as DARK_COLORS,
} from '../theme/colors';
