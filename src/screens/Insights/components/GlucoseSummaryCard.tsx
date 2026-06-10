import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { ProgressRing } from './charts';
import { cardStyles } from './insightsStyles';
import { INSIGHTS_WEEKLY_LINE } from '../insightsVisuals';
import { BRAND_RED_GRADIENT } from '../../../theme/colors';
import { WEEKLY_CHART_W, type WeeklySVG } from '../insightsMath';
import type { DayStats, WeeklyStats } from '../../../types/insights';

interface GlucoseSummaryCardProps {
  dayStats: DayStats;
  avgWeekDelta: number | null;
  weeklySVG: WeeklySVG;
  interpolated: { label: string; value: number; real: boolean }[];
  weeklyStats: WeeklyStats;
}

const WEEKLY_CHART_H = 104;

export const GlucoseSummaryCard: React.FC<GlucoseSummaryCardProps> = ({
  dayStats, avgWeekDelta, weeklySVG, interpolated, weeklyStats,
}) => {
  const { C, colors } = useTheme();

  // ≥70% time-in-range → green ring; otherwise red.
  const goodControl = dayStats.inRangePercent >= 70;
  const ringColor = goodControl ? colors.success : colors.criticalText;
  const hasRealData = interpolated.some((d) => d.real);

  const weeklyFigures = [
    { label: 'LOWEST', val: weeklyStats.lowest > 0 ? String(weeklyStats.lowest) : '--', color: colors.success, unit: 'mg/dL' },
    { label: 'HIGHEST', val: weeklyStats.highest > 0 ? String(weeklyStats.highest) : '--', color: colors.primary, unit: 'mg/dL' },
    { label: 'READINGS', val: String(weeklyStats.readings), color: colors.textPrimary, unit: '' },
    { label: 'STD DEV', val: weeklyStats.stdDev > 0 ? String(weeklyStats.stdDev) : '--', color: colors.textPrimary, unit: '' },
  ];

  return (
    <View style={[cardStyles.card, { backgroundColor: colors.backgroundCard, borderColor: C.redBorder, shadowColor: colors.shadow }]}>
      {/* Dark-red header bar with title + status pill */}
      <LinearGradient colors={BRAND_RED_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cardStyles.cardHeaderStrip}>
        <View style={cardStyles.cardHeaderLeft}>
          <Activity size={18} color={colors.textOnPrimary} strokeWidth={2.4} />
          <Text allowFontScaling={false} style={[cardStyles.cardHeaderTitle, { color: colors.textOnPrimary }]}>GLUCOSE CONTROL SUMMARY</Text>
        </View>
      </LinearGradient>

      {/* Top stats: AVG GLUCOSE · TIME IN RANGE ring · STABILITY */}
      <View style={styles.summaryMetricsRow}>
        <View style={styles.metricBox}>
          <Text allowFontScaling={false} style={[styles.metricLabel, { color: C.textXs }]}>AVG GLUCOSE</Text>
          <Text allowFontScaling={false} style={[styles.metricVal, { color: colors.primary }]}>
            {dayStats.avg} <Text allowFontScaling={false} style={[styles.metricUnit, { color: C.textSm }]}>mg/dL</Text>
          </Text>
          {avgWeekDelta != null ? (
            <View style={styles.metricTrend}>
              {avgWeekDelta <= 0 ? <TrendingDown size={13} color={colors.success} /> : <TrendingUp size={13} color={C.red} />}
              <Text allowFontScaling={false} style={[styles.metricTrendText, { color: avgWeekDelta <= 0 ? colors.success : C.red }]}>
                {avgWeekDelta > 0 ? '+' : ''}{avgWeekDelta} vs last week
              </Text>
            </View>
          ) : (
            <Text allowFontScaling={false} style={[styles.metricTrendText, { color: C.textSm }]}>
              {dayStats.avg > 140 ? 'High' : dayStats.avg < 70 ? 'Low' : 'In range'}
            </Text>
          )}
        </View>

        <View style={styles.ringContainer}>
          <Text allowFontScaling={false} style={[styles.metricLabel, styles.ringLabel, { color: C.textXs }]}>TIME IN RANGE</Text>
          <View style={styles.ringWrapper}>
            <ProgressRing value={dayStats.inRangePercent} max={100} size={64} strokeWidth={7} color={ringColor} bgColor={colors.border} />
            <Text allowFontScaling={false} style={[styles.ringText, { color: colors.primary }]}>{dayStats.inRangePercent}%</Text>
          </View>
        </View>

        <View style={[styles.metricBox, styles.metricBoxEnd]}>
          <Text allowFontScaling={false} style={[styles.metricLabel, { color: C.textXs }]}>STABILITY</Text>
          <Text allowFontScaling={false} style={[styles.metricVal, { color: colors.primary }]}>
            {dayStats.stability} <Text allowFontScaling={false} style={[styles.metricUnit, { color: colors.textSecondary }]}>/100</Text>
          </Text>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressLine, { width: `${dayStats.stability}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>
      </View>

      {/* Weekly trend box: title + legend, chart, day axis, then 4-stat row */}
      <View style={styles.weeklyCard}>
        <View style={styles.weeklyHeaderRow}>
          <Text allowFontScaling={false} style={[styles.weeklyTitle, { color: colors.primary }]}>Weekly Trend</Text>
          <View style={styles.wkLegend}>
            <View style={styles.wkLegendItem}>
              <View style={[styles.wkLegendDot, { backgroundColor: colors.criticalText }]} />
              <Text allowFontScaling={false} style={[styles.wkLegendText, { color: colors.textSecondary }]}>Low &lt;70</Text>
            </View>
            <View style={styles.wkLegendItem}>
              <View style={[styles.wkLegendDot, { backgroundColor: colors.warningText }]} />
              <Text allowFontScaling={false} style={[styles.wkLegendText, { color: colors.textSecondary }]}>High &gt;140</Text>
            </View>
          </View>
        </View>

        {/* Same SVG technique as the home TrendPlot: gradient area fill, dashed guides,
            smooth line, real-data dots, and axis labels rendered inside the SVG. */}
        <Svg width={WEEKLY_CHART_W} height={WEEKLY_CHART_H} style={styles.weeklySvg}>
          <Defs>
            <SvgLinearGradient id="weeklyFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={INSIGHTS_WEEKLY_LINE} stopOpacity={hasRealData ? 0.18 : 0.06} />
              <Stop offset="100%" stopColor={INSIGHTS_WEEKLY_LINE} stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>

          {/* High threshold (orange dashed @140) */}
          <Line x1={weeklySVG.paddingLeft} y1={weeklySVG.limitMaxY} x2={WEEKLY_CHART_W - 10} y2={weeklySVG.limitMaxY} stroke={colors.warningText} strokeWidth={1} strokeDasharray="4,4" strokeOpacity={0.6} />
          {/* Low threshold (red dashed @70) */}
          <Line x1={weeklySVG.paddingLeft} y1={weeklySVG.limitMinY} x2={WEEKLY_CHART_W - 10} y2={weeklySVG.limitMinY} stroke={colors.criticalText} strokeWidth={1} strokeDasharray="4,4" strokeOpacity={0.6} />

          {weeklySVG.areaPath !== '' && <Path d={weeklySVG.areaPath} fill="url(#weeklyFill)" />}

          <Path
            d={weeklySVG.path}
            fill="none"
            stroke={INSIGHTS_WEEKLY_LINE}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={hasRealData ? 1 : 0.3}
            strokeDasharray={hasRealData ? undefined : '4,4'}
          />

          {weeklySVG.points.map((pt, idx) => {
            if (!interpolated[idx]?.real) return null;
            const isLast = idx === weeklySVG.points.length - 1;
            return (
              <Circle
                key={idx}
                cx={pt.x} cy={pt.y} r={isLast ? 5 : 3.5}
                fill={isLast ? INSIGHTS_WEEKLY_LINE : colors.backgroundCard}
                stroke={INSIGHTS_WEEKLY_LINE} strokeWidth={isLast ? 2.5 : 1.5}
              />
            );
          })}

          {weeklySVG.points.map((pt, idx) => (
            <SvgText
              key={`lbl-${idx}`}
              x={pt.x} y={WEEKLY_CHART_H - 6} textAnchor="middle"
              fill={colors.textSecondary} fontSize={9} fontWeight="600"
            >
              {interpolated[idx]?.label}
            </SvgText>
          ))}
        </Svg>

        {/* divider separating the axis from the 4-stat row */}
        <View style={[styles.weeklyDivider, { backgroundColor: C.redBorder }]} />

        <View style={styles.weeklyStatsRow}>
          {weeklyFigures.map(({ label, val, color, unit }) => (
            <View key={label} style={styles.weeklyStat}>
              <Text allowFontScaling={false} style={[styles.weeklyStatLabel, { color: C.textXs }]}>{label}</Text>
              <Text allowFontScaling={false} style={[styles.weeklyStatVal, { color }]}>{val}</Text>
              {!!unit && <Text allowFontScaling={false} style={[styles.weeklyStatUnit, { color: C.textXs }]}>{unit}</Text>}
            </View>
          ))}
        </View>
      </View>

      {/* Distribution bar + labels */}
      <View style={styles.breakdownContainer}>
        <View style={styles.breakdownBar}>
          <View style={[styles.breakdownSegment, { width: `${dayStats.lowPercent}%`, backgroundColor: colors.criticalText }]} />
          <View style={[styles.breakdownSegment, { width: `${dayStats.normalPercent}%`, backgroundColor: colors.teal }]} />
          <View style={[styles.breakdownSegment, { width: `${dayStats.highPercent}%`, backgroundColor: colors.warningText }]} />
        </View>
        <View style={styles.breakdownLabels}>
          <View style={styles.wkLegendItem}>
            <View style={[styles.wkLegendDot, { backgroundColor: colors.criticalText }]} />
            <Text allowFontScaling={false} style={[styles.breakdownLabelText, { color: C.textSm }]}>Low {dayStats.lowPercent}%</Text>
          </View>
          <View style={styles.wkLegendItem}>
            <View style={[styles.wkLegendDot, { backgroundColor: colors.teal }]} />
            <Text allowFontScaling={false} style={[styles.breakdownLabelText, styles.breakdownNormal, { color: colors.teal }]}>Normal {dayStats.normalPercent}%</Text>
          </View>
          <View style={styles.wkLegendItem}>
            <View style={[styles.wkLegendDot, { backgroundColor: colors.warningText }]} />
            <Text allowFontScaling={false} style={[styles.breakdownLabelText, { color: C.textSm }]}>High {dayStats.highPercent}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Top stats
  summaryMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  metricBox: { flex: 1 },
  metricBoxEnd: { alignItems: 'flex-end' },
  metricLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, marginBottom: spacing.xs },
  ringLabel: { marginBottom: 6 },
  metricVal: { fontSize: 28, fontWeight: '800' },
  metricUnit: { fontSize: 13, fontWeight: '500' },
  metricTrend: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: spacing.xs },
  metricTrendText: { fontSize: 12, fontWeight: '600' },
  ringContainer: { alignItems: 'center', flex: 1.1 },
  ringWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', fontSize: 18, fontWeight: '800' },
  progressBar: { height: 5, borderRadius: 2.5, width: '80%', overflow: 'hidden', marginTop: 8 },
  progressLine: { height: '100%', borderRadius: 2.5 },

  // Weekly trend box
  weeklyCard: { borderRadius: borderRadius.xl, borderWidth: 1, borderColor: '#F0EDED', backgroundColor: '#FAFAFA', marginHorizontal: spacing.lg, marginBottom: spacing.md, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.md },
  weeklyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weeklyTitle: { fontSize: 16, fontWeight: '700' },
  weeklySvg: { marginTop: 8, alignSelf: 'center' },
  wkLegend: { flexDirection: 'row', gap: spacing.md },
  wkLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  wkLegendDot: { width: 8, height: 8, borderRadius: 4 },
  wkLegendText: { fontSize: 12, fontWeight: '500' },
  weeklyDivider: { height: StyleSheet.hairlineWidth, marginTop: spacing.md, marginBottom: spacing.md, opacity: 0.7 },
  weeklyStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weeklyStat: { alignItems: 'center', flex: 1 },
  weeklyStatLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, marginBottom: 3 },
  weeklyStatVal: { fontSize: 16, fontWeight: '800' },
  weeklyStatUnit: { fontSize: 9, marginTop: 1 },

  // Distribution
  breakdownContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.xs },
  breakdownBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
  breakdownSegment: { height: '100%' },
  breakdownLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  breakdownLabelText: { fontSize: 12, fontWeight: '600' },
  breakdownNormal: { fontWeight: '700' },
});
