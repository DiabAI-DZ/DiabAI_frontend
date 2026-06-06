import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { ProgressRing } from './charts';
import { cardStyles } from './insightsStyles';
import { INSIGHTS_RED_STRIP, INSIGHTS_WEEKLY_LINE } from '../insightsVisuals';
import { WEEKLY_CHART_W, type WeeklySVG } from '../insightsMath';
import type { DayStats, WeeklyStats } from '../../../types/insights';

interface GlucoseSummaryCardProps {
  dayStats: DayStats;
  avgWeekDelta: number | null;
  weeklySVG: WeeklySVG;
  interpolated: { label: string; value: number; real: boolean }[];
  weeklyStats: WeeklyStats;
}

export const GlucoseSummaryCard: React.FC<GlucoseSummaryCardProps> = ({
  dayStats, avgWeekDelta, weeklySVG, interpolated, weeklyStats,
}) => {
  const { C, colors } = useTheme();
  const weeklyFigures = [
    { label: 'LOWEST', val: weeklyStats.lowest > 0 ? String(weeklyStats.lowest) : '--', color: colors.teal, unit: 'mg/dL' },
    { label: 'HIGHEST', val: weeklyStats.highest > 0 ? String(weeklyStats.highest) : '--', color: colors.primary, unit: 'mg/dL' },
    { label: 'READINGS', val: String(weeklyStats.readings), color: colors.primary, unit: '' },
    { label: 'STD DEV', val: weeklyStats.stdDev > 0 ? String(weeklyStats.stdDev) : '--', color: colors.primary, unit: '' },
  ];

  return (
    <View style={[cardStyles.card, { backgroundColor: colors.backgroundCard, borderColor: C.redBorder, shadowColor: colors.shadow }]}>
      <LinearGradient colors={INSIGHTS_RED_STRIP} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cardStyles.cardHeaderStrip}>
        <View style={cardStyles.cardHeaderLeft}>
          <Activity size={18} color={colors.textOnPrimary} strokeWidth={2.4} />
          <Text style={[cardStyles.cardHeaderTitle, { color: colors.textOnPrimary }]}>GLUCOSE CONTROL SUMMARY</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: colors.backgroundCard }]}>
          <View style={[styles.statusDotGreen, { backgroundColor: colors.loggedTagText }]} />
          <Text style={[styles.statusPillText, { color: colors.textPrimary }]}>Good Control</Text>
        </View>
      </LinearGradient>

      <View style={styles.summaryMetricsRow}>
        <View style={styles.metricBox}>
          <Text style={[styles.metricLabel, { color: C.textXs }]}>AVG GLUCOSE</Text>
          <Text style={[styles.metricVal, { color: colors.primary }]}>{dayStats.avg} <Text style={[styles.metricUnit, { color: C.textSm }]}>mg/dL</Text></Text>
          {avgWeekDelta != null ? (
            <View style={styles.metricTrend}>
              {avgWeekDelta <= 0 ? <TrendingDown size={13} color={colors.loggedTagText} /> : <TrendingUp size={13} color={C.red} />}
              <Text style={[styles.metricTrendText, { color: avgWeekDelta <= 0 ? colors.loggedTagText : C.red }]}>
                {avgWeekDelta > 0 ? '+' : ''}{avgWeekDelta} vs last week
              </Text>
            </View>
          ) : (
            <Text style={[styles.metricTrendText, { color: C.textSm }]}>
              {dayStats.avg > 140 ? 'High' : dayStats.avg < 70 ? 'Low' : 'In range'}
            </Text>
          )}
        </View>

        <View style={styles.ringContainer}>
          <Text style={[styles.metricLabel, styles.ringLabel, { color: C.textXs }]}>TIME IN RANGE</Text>
          <View style={styles.ringWrapper}>
            <ProgressRing value={dayStats.inRangePercent} max={100} size={64} strokeWidth={7} color={colors.teal} bgColor={colors.border} />
            <Text style={[styles.ringText, { color: colors.primary }]}>{dayStats.inRangePercent}%</Text>
          </View>
        </View>

        <View style={[styles.metricBox, styles.metricBoxEnd]}>
          <Text style={[styles.metricLabel, { color: C.textXs }]}>STABILITY</Text>
          <Text style={[styles.metricVal, { color: C.red }]}>{dayStats.stability} <Text style={[styles.metricUnit, { color: colors.textSecondary }]}>/100</Text></Text>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressLine, { width: `${dayStats.stability}%`, backgroundColor: C.red }]} />
          </View>
        </View>
      </View>

      <View style={[styles.weeklyCard, { backgroundColor: colors.criticalBg }]}>
        <View style={styles.weeklyHeaderRow}>
          <Text style={[styles.weeklyTitle, { color: colors.primary }]}>Weekly Trend</Text>
          <View style={styles.wkLegend}>
            <View style={styles.wkLegendItem}>
              <View style={[styles.wkLegendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.wkLegendText, { color: colors.textSecondary }]}>Low &lt;70</Text>
            </View>
            <View style={styles.wkLegendItem}>
              <View style={[styles.wkLegendDot, { backgroundColor: colors.warningText }]} />
              <Text style={[styles.wkLegendText, { color: colors.textSecondary }]}>High &gt;140</Text>
            </View>
          </View>
        </View>

        <Svg width={WEEKLY_CHART_W} height={90} style={styles.weeklySvg}>
          <Line x1={weeklySVG.paddingLeft} y1={weeklySVG.limitMinY} x2={WEEKLY_CHART_W - 10} y2={weeklySVG.limitMinY} stroke={colors.border} strokeWidth={1.2} strokeDasharray="5,5" />
          <Path d={weeklySVG.path} fill="none" stroke={INSIGHTS_WEEKLY_LINE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          {weeklySVG.points.map((pt, idx) => (
            <Circle key={idx} cx={pt.x} cy={pt.y} r={interpolated[idx]?.real ? 4 : 2.5} fill={interpolated[idx]?.real ? INSIGHTS_WEEKLY_LINE : colors.border} stroke={colors.textOnPrimary} strokeWidth={1.5} />
          ))}
        </Svg>
        <View style={[styles.weeklyDayLabels, { width: WEEKLY_CHART_W }]}>
          {interpolated.map((d, i) => (
            <Text key={i} style={[styles.weeklyDayLabel, { color: C.textXs }]}>{d.label}</Text>
          ))}
        </View>

        <View style={styles.weeklyStatsRow}>
          {weeklyFigures.map(({ label, val, color, unit }) => (
            <View key={label} style={styles.weeklyStat}>
              <Text style={[styles.weeklyStatLabel, { color: C.textXs }]}>{label}</Text>
              <Text style={[styles.weeklyStatVal, { color }]}>{val}</Text>
              {!!unit && <Text style={[styles.weeklyStatUnit, { color: C.textXs }]}>{unit}</Text>}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.breakdownContainer}>
        <View style={styles.breakdownBar}>
          <View style={[styles.breakdownSegment, { width: `${dayStats.lowPercent}%`, backgroundColor: colors.criticalText }]} />
          <View style={[styles.breakdownSegment, { width: `${dayStats.normalPercent}%`, backgroundColor: colors.teal }]} />
          <View style={[styles.breakdownSegment, { width: `${dayStats.highPercent}%`, backgroundColor: colors.warningText }]} />
        </View>
        <View style={styles.breakdownLabels}>
          <View style={styles.wkLegendItem}>
            <View style={[styles.wkLegendDot, { backgroundColor: colors.criticalText }]} />
            <Text style={[styles.breakdownLabelText, { color: C.textSm }]}>Low {dayStats.lowPercent}%</Text>
          </View>
          <View style={styles.wkLegendItem}>
            <View style={[styles.wkLegendDot, { backgroundColor: colors.teal }]} />
            <Text style={[styles.breakdownLabelText, styles.breakdownNormal, { color: colors.teal }]}>Normal {dayStats.normalPercent}%</Text>
          </View>
          <View style={styles.wkLegendItem}>
            <View style={[styles.wkLegendDot, { backgroundColor: colors.warningText }]} />
            <Text style={[styles.breakdownLabelText, { color: C.textSm }]}>High {dayStats.highPercent}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: borderRadius.pill, paddingHorizontal: 11, paddingVertical: 5 },
  statusDotGreen: { width: 7, height: 7, borderRadius: 3.5 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  summaryMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  metricBox: { flex: 1 },
  metricBoxEnd: { alignItems: 'flex-end' },
  metricLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: spacing.xs },
  ringLabel: { marginBottom: 6 },
  metricVal: { fontSize: 24, fontWeight: '900' },
  metricUnit: { fontSize: 10, fontWeight: '500' },
  metricTrend: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: spacing.xs },
  metricTrendText: { fontSize: 9, fontWeight: '700' },
  ringContainer: { alignItems: 'center', flex: 1.2 },
  ringWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', fontSize: 14, fontWeight: 'bold' },
  progressBar: { height: 5, borderRadius: 2.5, width: '80%', overflow: 'hidden', marginTop: 6 },
  progressLine: { height: '100%', borderRadius: 2.5 },
  weeklyCard: { borderRadius: borderRadius.lg, marginHorizontal: 14, marginBottom: 14, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  weeklyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weeklyTitle: { fontSize: 15, fontWeight: '600' },
  weeklySvg: { marginTop: 6 },
  wkLegend: { flexDirection: 'row', gap: spacing.md },
  wkLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  wkLegendDot: { width: 8, height: 8, borderRadius: 4 },
  wkLegendText: { fontSize: 11, fontWeight: '500' },
  weeklyDayLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.sm, marginTop: 2 },
  weeklyDayLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center', flex: 1 },
  weeklyStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  weeklyStat: { alignItems: 'center', flex: 1 },
  weeklyStatLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  weeklyStatVal: { fontSize: 16, fontWeight: '900' },
  weeklyStatUnit: { fontSize: 8, marginTop: 1 },
  breakdownContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.xs },
  breakdownBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
  breakdownSegment: { height: '100%' },
  breakdownLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  breakdownLabelText: { fontSize: 10, fontWeight: '600' },
  breakdownNormal: { fontWeight: '700' },
});
