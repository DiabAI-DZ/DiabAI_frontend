import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { convertGlucose } from '../../../services/apiService';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import type { TrendPoint } from '../../../types/home';
import { useTrendGeometry } from '../hooks/useTrendGeometry';
import TrendPlot from './TrendPlot';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 130;

interface GlucoseTrendChartProps {
  points: TrendPoint[];
  period: '7d' | '30d';
  onPeriodChange: (period: '7d' | '30d') => void;
  targetMin: number;
  targetMax: number;
  unit: string;
  loading?: boolean;
}

/** White "Glucose Trend" card: 7D/30D toggle, the SVG plot, an interactive tooltip and a legend. */
const GlucoseTrendChart: React.FC<GlucoseTrendChartProps> = ({
  points,
  period,
  onPeriodChange,
  targetMin,
  targetMax,
  unit,
  loading,
}) => {
  const { C, colors } = useTheme();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const geometry = useTrendGeometry(points, targetMin, targetMax, CHART_WIDTH, CHART_HEIGHT);
  const showNoData = !geometry.hasRealData && !loading;
  const hovered = hoverIndex !== null ? geometry.coords[hoverIndex] : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: C.redBorder, shadowColor: colors.shadow }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: C.text }]}>Glucose Trend</Text>
          <Text style={[styles.subtitle, { color: C.textSm }]}>
            {period === '7d' ? 'Last 7 days' : 'Last 30 days'}
          </Text>
        </View>
        <View style={[styles.toggle, { backgroundColor: C.redBg }]}>
          {(['7d', '30d'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => onPeriodChange(t)}
              style={[styles.toggleBtn, period === t && { backgroundColor: C.red }]}
            >
              <Text style={[styles.toggleText, { color: period === t ? colors.textOnPrimary : C.redMuted }]}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.svgWrap}>
        <TrendPlot
          geometry={geometry}
          points={points}
          period={period}
          targetMin={targetMin}
          targetMax={targetMax}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
        />

        {/* Touch zones for the tooltip */}
        <View style={[styles.touchRow, { left: geometry.paddingLeft, width: geometry.graphWidth, height: CHART_HEIGHT - geometry.paddingBottom }]}>
          {points.map((_, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={1}
              onPressIn={() => setHoverIndex(index)}
              onPressOut={() => setHoverIndex(null)}
              style={[styles.touchZone, hoverIndex === index && { backgroundColor: HOVER_TINT }]}
            />
          ))}
        </View>

        {hoverIndex !== null && hovered && (
          <View
            pointerEvents="none"
            style={[
              styles.tooltip,
              {
                left: Math.max(10, Math.min(CHART_WIDTH - 110, hovered.x - 50)),
                top: Math.max(5, hovered.y - 45),
                backgroundColor: C.redDark,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Text style={[styles.tooltipText, { color: colors.textOnPrimary }]}>
              {points[hoverIndex].real
                ? `${unit === 'mmol/L' ? convertGlucose(points[hoverIndex].value || 0, 'mmol/L', 'mg/dL').toFixed(1) : Math.round(points[hoverIndex].value || 0)} ${unit}`
                : 'No entry'}
            </Text>
            <Text style={[styles.tooltipSub, { color: TOOLTIP_SUB }]}>{points[hoverIndex].label}</Text>
          </View>
        )}

        {showNoData && (
          <View pointerEvents="none" style={[styles.noDataWrap, { left: geometry.paddingLeft, width: geometry.graphWidth, height: CHART_HEIGHT - geometry.paddingBottom }]}>
            <View style={[styles.noDataPill, { backgroundColor: colors.backgroundCard, borderColor: C.redBorder }]}>
              <Sparkles size={14} color={C.red} />
              <Text style={[styles.noDataText, { color: C.textSm }]}>No data available — showing baseline</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, { backgroundColor: colors.trendLow }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Low &lt;{targetMin}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, { backgroundColor: colors.trendHigh }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>High &gt;{targetMax}</Text>
        </View>
      </View>
    </View>
  );
};

// Translucent accents local to the chart (not theme palette colors).
const HOVER_TINT = 'rgba(196,30,38,0.05)';
const TOOLTIP_SUB = 'rgba(255,255,255,0.7)';

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.xxl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 1 },
  toggle: { flexDirection: 'row', borderRadius: 10, padding: 2.5 },
  toggleBtn: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: borderRadius.sm },
  toggleText: { fontSize: 11, fontWeight: 'bold' },
  svgWrap: { alignItems: 'center', justifyContent: 'center' },
  touchRow: { position: 'absolute', top: 0, flexDirection: 'row', zIndex: 5 },
  touchZone: { flex: 1, backgroundColor: 'transparent' },
  tooltip: {
    position: 'absolute',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    minWidth: 80,
    zIndex: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipText: { fontSize: 10, fontWeight: 'bold' },
  tooltipSub: { fontSize: 8, marginTop: 2 },
  noDataWrap: { position: 'absolute', top: 0, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  noDataPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  noDataText: { fontSize: 9, fontWeight: 'bold' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDash: { width: 12, height: 2, borderRadius: 1 },
  legendText: { fontSize: 11, fontWeight: '600' },
});

export default GlucoseTrendChart;
