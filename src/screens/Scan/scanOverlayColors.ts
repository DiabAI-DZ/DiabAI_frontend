// Camera-overlay palette. These elements always sit over the (dark) live camera feed or a
// dimmed scrim, so they use fixed light/scrim colors independent of the app theme — documented
// constants, NOT theme tokens.
export const SCAN_OVERLAY = {
  white: '#FFFFFF',
  black: '#000000',
  scrim: 'rgba(0,0,0,0.5)',
  scrimSoft: 'rgba(0,0,0,0.3)',
  scrimStrong: 'rgba(0,0,0,0.6)',
  scrimHeavy: 'rgba(0,0,0,0.7)',
  sheetScrim: 'rgba(0,0,0,0.52)',
  chipBg: 'rgba(255,255,255,0.2)',
  captureRing: 'rgba(255,255,255,0.3)',
  shimmer: 'rgba(255,255,255,0.1)',
  muted: '#AAAAAA',
  flashOn: '#FFD700',
  modelCloud: '#4DB8FF',
} as const;
