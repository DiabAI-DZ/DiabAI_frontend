import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDownRight, ArrowRight, ArrowUpRight, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { cardStyles } from './insightsStyles';
import { INSIGHTS_BRAND_SHADOW, INSIGHTS_RED_HERO, INSIGHTS_RED_STRIP } from '../insightsVisuals';
import { CHART_HEIGHT, CHART_WIDTH, type PredictionSVG } from '../insightsMath';
import type { PredView } from '../../../types/insights';

interface PredictionCardProps {
  predView: PredView | null;
  predictionSVG: PredictionSVG;
  selectedHasReading: boolean | null;
  isTodaySelected: boolean;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  predView, predictionSVG, selectedHasReading, isTodaySelected,
}) => {
  const { C, colors } = useTheme();

  return (
    <View style={[cardStyles.card, cardStyles.cardPad, { backgroundColor: colors.backgroundCard, borderColor: C.redBorder, shadowColor: colors.shadow }]}>
      <View style={styles.predHeaderRow}>
        <LinearGradient colors={INSIGHTS_RED_STRIP} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.predHeaderIcon, { shadowColor: INSIGHTS_BRAND_SHADOW }]}>
          <TrendingUp size={26} color={colors.textOnPrimary} strokeWidth={2.5} />
        </LinearGradient>
        <View style={styles.flex1}>
          <Text style={[styles.predHeaderTitle, { color: colors.textPrimary }]}>Prediction</Text>
          <Text style={styles.predHeaderSubtitle}>AI-powered glucose forecast</Text>
        </View>
      </View>

      {!predView ? (
        <View style={[styles.predictionBanner, { backgroundColor: C.blueBg, borderColor: C.blueBorder }]}>
          <Text style={[styles.predBannerLabel, { color: C.textSm }]}>
            No recent reading to forecast from — take a glucose measurement to see your prediction.
          </Text>
        </View>
      ) : selectedHasReading === false ? (
        <View style={[styles.predictionBanner, styles.predictionBannerColumn, { backgroundColor: C.amberBg, borderColor: C.amber }]}>
          <Text style={[styles.predBannerLabel, { color: C.amber }]}>NO READING ON THIS DAY</Text>
          <Text style={[styles.predBannerLabel, { color: C.text }]}>Take a measurement to get a fresh forecast for this day.</Text>
          {predView.currentAtLabel && (
            <Text style={[styles.predBannerLabel, styles.predBannerHint, { color: C.textSm }]}>
              Last forecast (from your {predView.currentAtLabel} reading): {predView.expected} mg/dL
            </Text>
          )}
        </View>
      ) : (
        <LinearGradient colors={INSIGHTS_RED_HERO} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.predHero, { shadowColor: INSIGHTS_BRAND_SHADOW }]}>
          <View style={styles.predHeroTopRow}>
            <View style={styles.shrink}>
              <Text style={[styles.predHeroLabel, { color: colors.textOnPrimary }]}>
                {predView.expectedAt ? `EXPECTED AT ${predView.expectedAt}` : 'NEXT PREDICTION'}
              </Text>
              <View style={styles.predHeroValueRow}>
                <Text style={[styles.predHeroValue, { color: colors.textOnPrimary }]}>{predView.expected}</Text>
                <Text style={styles.predHeroUnit}>mg/dL</Text>
              </View>
            </View>
            <View style={styles.predHeroStatus}>
              {predView.trendDir === 'up' ? (
                <ArrowUpRight size={26} color={colors.textOnPrimary} strokeWidth={2.5} />
              ) : predView.trendDir === 'down' ? (
                <ArrowDownRight size={26} color={colors.textOnPrimary} strokeWidth={2.5} />
              ) : (
                <ArrowRight size={26} color={colors.textOnPrimary} strokeWidth={2.5} />
              )}
              <Text style={[styles.predHeroStatusText, { color: colors.textOnPrimary }]}>{predView.statusLabel}</Text>
            </View>
          </View>

          <View style={styles.predHeroFooter}>
            {predView.current != null && (
              <Text style={styles.predHeroSub}>
                {predView.current} → {predView.expected} mg/dL {predView.trendArrow}
                {predView.delta != null ? `  ${predView.delta >= 0 ? '+' : ''}${predView.delta}` : ''}
              </Text>
            )}
            <Text style={styles.predHeroSub}>
              {isTodaySelected ? '2h from now' : `2h after last reading${predView.currentAtLabel ? ` · ${predView.currentAtLabel}` : ''}`}
              {predView.confidenceLabel ? `  ·  ${predView.confidenceLabel.toUpperCase()} confidence` : ''}
            </Text>
            {predView.confidenceLow && predView.readingIsOld && (
              <Text style={styles.predHeroSub}>Based on an older reading — take a measurement for a sharper forecast.</Text>
            )}
            {!predView.aiPowered && <Text style={styles.predHeroSub}>Heuristic estimate</Text>}
          </View>
        </LinearGradient>
      )}

      <View style={[styles.predictionGraphBox, { backgroundColor: colors.backgroundMuted, borderColor: colors.border }]}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Line x1={predictionSVG.paddingLeft} y1={predictionSVG.limitY} x2={CHART_WIDTH - 10} y2={predictionSVG.limitY} stroke={C.amber} strokeWidth={1} strokeDasharray="4,4" strokeOpacity={0.6} />
          <Path d={predictionSVG.path} fill="none" stroke={C.blue} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="6,4" />
          {predictionSVG.points.map((p, idx) => (
            <Circle key={idx} cx={p.x} cy={p.y} r={idx === predictionSVG.points.length - 1 ? 5 : 3} fill={idx === predictionSVG.points.length - 1 ? C.blue : C.redBorder} stroke={colors.textOnPrimary} strokeWidth={1.5} />
          ))}
        </Svg>
      </View>

      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotSquare, { backgroundColor: C.blue }]} />
          <Text style={[styles.legendText, { color: C.textSm }]}>Predicted trend</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotThin, { backgroundColor: C.amber }]} />
          <Text style={[styles.legendText, { color: C.textSm }]}>140 mg/dL target</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  shrink: { flexShrink: 1 },
  predHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.lg },
  predHeaderIcon: {
    width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  predHeaderTitle: { fontSize: 22, fontWeight: '700' },
  predHeaderSubtitle: { fontSize: 13.5, fontWeight: '500', color: 'rgba(192,57,43,0.75)', marginTop: 1 },
  predictionBanner: {
    borderRadius: borderRadius.lg, borderWidth: 1, paddingHorizontal: 14, paddingVertical: spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md,
  },
  predictionBannerColumn: { flexDirection: 'column', alignItems: 'flex-start', gap: spacing.xs },
  predBannerLabel: { fontSize: 8, fontWeight: 'bold', letterSpacing: 0.5 },
  predBannerHint: { marginTop: 2 },
  predHero: {
    borderRadius: borderRadius.xxl, padding: spacing.xl, marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 16, elevation: 5,
  },
  predHeroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  predHeroLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1.2 },
  predHeroValueRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.xs },
  predHeroValue: { fontSize: 56, fontWeight: '800', lineHeight: 60 },
  predHeroUnit: { fontSize: 20, fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginLeft: 6, marginBottom: spacing.sm },
  predHeroStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, justifyContent: 'flex-end' },
  predHeroStatusText: { fontSize: 17, fontWeight: '600' },
  predHeroFooter: { marginTop: 14, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)', gap: spacing.xs },
  predHeroSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.85)' },
  predictionGraphBox: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: borderRadius.lg, paddingVertical: spacing.sm, marginTop: spacing.xs },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 4, borderRadius: 2 },
  legendDotSquare: { borderRadius: 0 },
  legendDotThin: { height: 2 },
  legendText: { fontSize: 9, fontWeight: '600' },
});
