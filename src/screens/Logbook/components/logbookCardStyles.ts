import { Dimensions, StyleSheet } from 'react-native';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

const { width } = Dimensions.get('window');

// On-card whites over the gradient band / photo (theme-independent overlays, not palette tokens).
export const BADGE_BG = 'rgba(255,255,255,0.93)';
// Fixed neutral-gray gradient for injection cards (intentionally not a theme token).
export const INJECTION_GRADIENT = ['#4B5563', '#1F2937'] as const;

/** Shared styles for the four logbook entry cards + their day group. */
export const cardStyles = StyleSheet.create({
  groupFrame: { flex: 1 },
  groupTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  groupLabelWrapper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  groupLabelText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  groupCountBadge: { borderRadius: borderRadius.sm, borderWidth: 1, paddingHorizontal: spacing.xs, paddingVertical: 1 },
  groupCountText: { fontSize: 9, fontWeight: 'bold' },
  groupSubLabelText: { fontSize: 10, fontWeight: '500' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  gridCardWrapper: {
    width: (width - 50) / 2,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  gridCardTopGlucometer: { width: '100%', height: 120, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  gridCardTopMeal: { height: 120, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%' },

  statusBadgeFloating: {
    position: 'absolute', top: spacing.sm, right: spacing.sm, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: spacing.xs, paddingVertical: 2, gap: spacing.xs,
    backgroundColor: BADGE_BG,
  },
  statusBadgeFloatingLeft: {
    position: 'absolute', top: spacing.sm, left: spacing.sm, borderWidth: 1, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs, paddingVertical: 2, backgroundColor: BADGE_BG,
  },
  statusBadgeFloatingRight: {
    position: 'absolute', top: spacing.sm, right: spacing.sm, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs, paddingVertical: 2, backgroundColor: BADGE_BG,
  },
  statusBadgeDot: { width: 4, height: 4, borderRadius: 2 },
  statusBadgeText: { fontSize: 8.5, fontWeight: 'bold' },

  cardHeaderBand: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  cardHeaderCategoryText: { color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardHeaderMainValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2, gap: 2 },
  cardHeaderValueText: { fontSize: 20, fontWeight: '900', lineHeight: 22 },
  cardHeaderUnitText: { color: 'rgba(255,255,255,0.85)', fontSize: 9, fontWeight: '600' },
  cardHeaderMealName: { fontSize: 11, fontWeight: 'bold', lineHeight: 14, marginTop: 2, height: 28 },

  gridCardBottomInfo: { padding: spacing.sm, gap: spacing.xs },
  trendBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: spacing.xs, paddingVertical: 2, gap: 3 },
  trendBadgeText: { fontSize: 8.5, fontWeight: 'bold' },
  cardTimeRow: { flexDirection: 'row', alignItems: 'center' },
  cardTimeText: { fontSize: 9, fontWeight: '500' },
  mealMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  mealMetricBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, gap: 3 },
  mealMetricVal: { fontSize: 8.5, fontWeight: '700' },
});
