import { StyleSheet } from 'react-native';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

/** Styles shared across the dashboard cards (the card frame + section title rows). Colors are
 * always applied inline from the active theme; only static geometry lives here. */
export const cardStyles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardPad: {
    padding: spacing.xl,
  },
  cardHeaderStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
});
