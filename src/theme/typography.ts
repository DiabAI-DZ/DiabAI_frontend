// Typography scale. Spread a token into a StyleSheet entry (e.g. `...typography.cardTitle`)
// instead of writing raw `fontSize` / `fontWeight` numbers. `as const` keeps the literal
// types ('700', 'uppercase', …) so the tokens are assignable to RN TextStyle.
export const typography = {
  // Screen level
  screenTitle: { fontSize: 26, fontWeight: '700' as const },
  screenSubtitle: { fontSize: 14, fontWeight: '400' as const },

  // Cards
  cardTitle: { fontSize: 18, fontWeight: '700' as const },
  cardSubtitle: { fontSize: 13, fontWeight: '400' as const },
  sectionTitle: { fontSize: 16, fontWeight: '600' as const },

  // Body
  body: { fontSize: 14, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },

  // Labels
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  caption: { fontSize: 12, fontWeight: '400' as const },

  // Stats
  statLarge: { fontSize: 32, fontWeight: '700' as const },
  statMedium: { fontSize: 22, fontWeight: '700' as const },
  statSmall: { fontSize: 18, fontWeight: '700' as const },

  // Buttons
  button: { fontSize: 16, fontWeight: '600' as const },
  buttonSmall: { fontSize: 14, fontWeight: '600' as const },
} as const;

export type TypographyKey = keyof typeof typography;
