// Spacing scale. Every margin/padding/gap in the app must come from here — no raw
// pixel numbers in component styles. Values are in density-independent points.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
} as const;

export type SpacingKey = keyof typeof spacing;
