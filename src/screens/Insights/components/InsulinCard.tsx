import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Syringe } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { cardStyles } from './insightsStyles';
import { InsulinSkeleton } from './Skeletons';
import { INSIGHTS_RED_STRIP } from '../insightsVisuals';
import type { InsulinEstimate } from '../../../types/insights';

// Bespoke warm-red palette for the insulin card (Figma) — intentional decorative constants,
// NOT theme tokens. Kept here verbatim as the single source of truth.
const INSULIN = {
  value: '#C0392B',
  valueMuted: 'rgba(192,57,43,0.7)',
  title: '#8B3A3A',
  desc: 'rgba(192,57,43,0.65)',
  chipNeutralBg: '#FBF7F6',
  chipNeutralBorder: '#EAD9D7',
  chipNeutralText: '#8B3A3A',
  chipTargetBg: '#E8F5E9',
  chipTargetBorder: '#A5D6A7',
  chipTargetText: '#2E7D32',
  disclaimerBg: '#FDECEA',
  disclaimerText: 'rgba(139,58,58,0.85)',
} as const;

const DEFAULT_DESC = 'Based on your current glucose, predicted trend, and typical meal impact.';
const DEFAULT_DISCLAIMER = 'For informational purposes only. This is not medical advice. Always consult your healthcare provider before adjusting insulin dosage.';

interface InsulinCardProps {
  insulinEstimate: InsulinEstimate | null;
  loading: boolean;
}

export const InsulinCard: React.FC<InsulinCardProps> = ({ insulinEstimate, loading }) => {
  const { C, colors } = useTheme();
  const current = insulinEstimate?.current_mg_dl;
  const desc = insulinEstimate?.basis
    ?? `Based on your current glucose${current ? ` (${current} mg/dL)` : ''}, predicted trend, and typical meal impact.`;

  return (
    <View style={[cardStyles.card, styles.overflow, { backgroundColor: colors.backgroundCard, borderColor: C.redBorder, shadowColor: colors.shadow }]}>
      <LinearGradient colors={INSIGHTS_RED_STRIP} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerStrip}>
        <Syringe size={20} color={colors.textOnPrimary} strokeWidth={2.2} />
        <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]}>ESTIMATED INSULIN NEED</Text>
      </LinearGradient>

      <View style={styles.body}>
        {loading && !insulinEstimate ? (
          <InsulinSkeleton colors={colors} />
        ) : (
          <>
            <View style={styles.content}>
              <View style={styles.circle}>
                <Text style={styles.unitsVal}>{insulinEstimate?.units ?? 4}</Text>
                <Text style={styles.unitsLbl}>units</Text>
              </View>

              <View style={styles.flex1}>
                <Text style={styles.title}>Next meal estimate</Text>
                <Text style={styles.desc}>{desc || DEFAULT_DESC}</Text>
                <View style={styles.chipRow}>
                  {current != null && (
                    <View style={styles.chipNeutral}>
                      <Text style={styles.chipNeutralText}>Current: {current} mg/dL</Text>
                    </View>
                  )}
                  <View style={styles.chipTarget}>
                    <Text style={styles.chipTargetText}>Target: {insulinEstimate?.target_mg_dl ?? 110} mg/dL</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.disclaimer}>
              <Shield size={16} color={colors.primary} style={styles.shieldIcon} />
              <Text style={styles.disclaimerText}>
                <Text style={[styles.disclaimerBold, { color: colors.primary }]}>Disclaimer:</Text>{' '}
                {insulinEstimate?.disclaimer ?? DEFAULT_DISCLAIMER}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overflow: { overflow: 'hidden' },
  flex1: { flex: 1 },
  headerStrip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: spacing.lg, gap: spacing.md },
  headerTitle: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  body: { padding: 18 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  circle: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: INSULIN.value, alignItems: 'center', justifyContent: 'center' },
  unitsVal: { fontSize: 32, fontWeight: '800', color: INSULIN.value, lineHeight: 34 },
  unitsLbl: { fontSize: 12, fontWeight: '600', color: INSULIN.valueMuted, marginTop: 1 },
  title: { fontSize: 17, fontWeight: '600', color: INSULIN.title },
  desc: { fontSize: 12.5, lineHeight: 17, marginTop: spacing.xs, color: INSULIN.desc },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chipNeutral: { borderRadius: borderRadius.pill, paddingHorizontal: spacing.md, paddingVertical: 7, backgroundColor: INSULIN.chipNeutralBg, borderWidth: 1, borderColor: INSULIN.chipNeutralBorder },
  chipNeutralText: { fontSize: 12.5, fontWeight: '600', color: INSULIN.chipNeutralText },
  chipTarget: { borderRadius: borderRadius.pill, paddingHorizontal: spacing.md, paddingVertical: 7, backgroundColor: INSULIN.chipTargetBg, borderWidth: 1, borderColor: INSULIN.chipTargetBorder },
  chipTargetText: { fontSize: 12.5, fontWeight: '700', color: INSULIN.chipTargetText },
  disclaimer: { flexDirection: 'row', padding: 14, borderRadius: borderRadius.lg, marginTop: spacing.lg, gap: spacing.sm, backgroundColor: INSULIN.disclaimerBg },
  shieldIcon: { marginTop: 1 },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 17, color: INSULIN.disclaimerText },
  disclaimerBold: { fontWeight: 'bold' },
});
