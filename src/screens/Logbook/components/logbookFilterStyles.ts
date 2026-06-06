import { Dimensions, StyleSheet } from 'react-native';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

const { width } = Dimensions.get('window');

export const SHEET_BACKDROP = 'rgba(0,0,0,0.4)';

/** Styles for the Logbook advanced-filters bottom sheet. */
export const filterStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: SHEET_BACKDROP, justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  content: { borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, maxHeight: '76%', paddingBottom: spacing.xxl },
  handleRow: { alignItems: 'center', paddingVertical: spacing.sm },
  dragHandle: { width: 36, height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  titleText: { fontSize: 17, fontWeight: '900' },
  subtitleText: { fontSize: 11, fontWeight: '500' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  resetBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, gap: spacing.xs },
  resetText: { fontSize: 10, fontWeight: 'bold' },
  closeBtn: { width: 28, height: 28, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.xl },

  section: { marginBottom: spacing.xl },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  sectionIconBox: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  presetChip: { borderRadius: borderRadius.sm, borderWidth: 1.5, paddingHorizontal: spacing.md, paddingVertical: 5 },
  presetChipText: { fontSize: 10.5, fontWeight: 'bold' },

  typeTabsRow: { flexDirection: 'row', gap: spacing.sm },
  typeTabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.md, borderWidth: 1.5, paddingVertical: spacing.sm, gap: spacing.xs },
  typeTabText: { fontSize: 11, fontWeight: 'bold' },

  glucosePresetCard: { flex: 1, minWidth: 80, borderRadius: borderRadius.md, borderWidth: 1.5, paddingVertical: spacing.xs, alignItems: 'center' },
  glucosePresetLabel: { fontSize: 11, fontWeight: 'bold' },
  glucosePresetRange: { fontSize: 8.5, fontWeight: '600', marginTop: 1 },

  mealGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  mealItem: { width: (width - 48) / 2, flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, borderWidth: 1.5, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  checkbox: { width: 14, height: 14, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  mealItemLabel: { fontSize: 11, fontWeight: 'bold' },

  footer: { flexDirection: 'row', paddingHorizontal: spacing.xl, paddingTop: 14, borderTopWidth: 1, gap: spacing.sm },
  cancelBtn: { flex: 1, borderRadius: borderRadius.lg, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', height: 44 },
  cancelText: { fontSize: 12, fontWeight: 'bold' },
  applyBtn: { flex: 2, borderRadius: borderRadius.lg, overflow: 'hidden', height: 44 },
  applyGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  applyText: { fontSize: 12, fontWeight: 'bold' },
});
