// Single import surface for the theme system. Prefer `import { spacing, useTheme } from '../theme'`.
export { spacing, type SpacingKey } from './spacing';
export { typography, type TypographyKey } from './typography';
export { borderRadius, type BorderRadiusKey } from './borderRadius';
export {
  LightTheme,
  DarkTheme,
  type AppTheme,
  LegacyLightColors,
  LegacyDarkColors,
  type LegacyColors,
} from './colors';
export { ThemeProvider, useTheme, type ThemeMode } from './ThemeContext';
