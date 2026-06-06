import { StyleSheet } from 'react-native';
import { spacing } from '../../../../theme/spacing';
import { borderRadius } from '../../../../theme/borderRadius';

/** Shared styles for the subscription popups (colors applied inline from the theme). */
export const subStyles = StyleSheet.create({
  stateBlock: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: spacing.md },
  stateText: { fontSize: 13, textAlign: 'center', paddingHorizontal: spacing.lg, fontWeight: '600' },
  retryBtn: { borderWidth: 1.5, borderRadius: borderRadius.md, paddingHorizontal: 18, paddingVertical: spacing.sm },
  retryText: { fontSize: 13, fontWeight: '700' },

  primaryBtn: { height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: 'bold' },
  linkBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  linkBtnText: { fontSize: 13, fontWeight: '600' },
  noteText: { fontSize: 11, textAlign: 'center', marginTop: spacing.sm, lineHeight: 15 },
  marginTopSm: { marginTop: spacing.sm },
  marginTopXs: { marginTop: spacing.xs },
  flex1: { flex: 1 },
  shrink: { flexShrink: 1 },

  // Plans
  planRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1.5, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  planIconBox: { width: 36, height: 36, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  planName: { fontSize: 14.5, fontWeight: '700' },
  planSub: { fontSize: 11.5, marginTop: 2, lineHeight: 15 },
  currentChip: { borderRadius: borderRadius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  currentChipText: { fontSize: 9, fontWeight: 'bold' },
  saveChip: { borderRadius: borderRadius.sm, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1 },
  saveChipText: { fontSize: 9, fontWeight: 'bold' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  // Transactions
  txWrap: { gap: spacing.xs },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  txIcon: { width: 32, height: 32, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontSize: 13.5, fontWeight: '600' },
  txDate: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  txRight: { alignItems: 'flex-end', gap: 1 },
  txAmount: { fontSize: 13.5, fontWeight: 'bold' },
  txStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  txStatusText: { fontSize: 9.5, fontWeight: '700' },

  // Billing cards
  cardRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, gap: spacing.md },
  cardRowIcon: { width: 36, height: 36, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  cardRowTitle: { fontSize: 14.5, fontWeight: '700' },
  cardRowSub: { fontSize: 11.5, fontWeight: '500', marginTop: 1 },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, paddingHorizontal: 6, paddingVertical: 2, gap: 3 },
  defaultBadgeText: { fontSize: 9.5, fontWeight: 'bold' },
  trashBtn: { padding: spacing.xs },
  addCardBtn: { flexDirection: 'row', gap: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1.5, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  addCardText: { fontSize: 13.5, fontWeight: 'bold' },

  // Add-card form
  addCardForm: { gap: spacing.md },
  addTitle: { fontSize: 15, fontWeight: '700', marginBottom: spacing.md },
  cardField: { width: '100%', height: 50 },
  errBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1 },
  errBannerText: { flex: 1, fontSize: 12, lineHeight: 16 },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: 2 },
  secureText: { flex: 1, fontSize: 11, lineHeight: 14 },
});
