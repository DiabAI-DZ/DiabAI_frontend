// Corner-radius scale. Use these tokens instead of raw numbers so rounding stays
// consistent across cards, pills, inputs and buttons.
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

export type BorderRadiusKey = keyof typeof borderRadius;
