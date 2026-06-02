import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, {
  Path, Line, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText,
} from 'react-native-svg';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { convertGlucose } from '../services/apiService';
import { HomeData } from '../services/types';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 130;

interface GlucoseTrendChartProps {
  homeData: HomeData | null;
  activeTab: '7d' | '30d';
  onChangeTab: (tab: '7d' | '30d') => void;
  targetMin: number;
  targetMax: number;
  unit: string;
}

const getPastDays = (count: number): { label: string; date: string }[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      label: count > 7 ? `${d.getMonth() + 1}/${d.getDate()}` : days[d.getDay()],
      date: d.toISOString().split('T')[0],
    });
  }
  return result;
};

const getBezierCurvePath = (points: { x: number; y: number }[]): string => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 3;
    const cpX2 = p0.x + (2 * (p1.x - p0.x)) / 3;
    d += ` C ${cpX1} ${p0.y}, ${cpX2} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
};

/** White "Glucose Trend" card: 7D/30D toggle + smooth SVG line chart with threshold guides. */
const GlucoseTrendChart: React.FC<GlucoseTrendChartProps> = ({
  homeData,
  activeTab,
  onChangeTab,
  targetMin,
  targetMax,
  unit,
}) => {
  const { C, isDark } = useTheme();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const defaults = getPastDays(activeTab === '7d' ? 7 : 30);
    const points = homeData?.glucose_trend?.points;
    if (points && points.length > 0) {
      return points.map(p => {
        let label = p.label;
        if (activeTab === '30d' && p.date) {
          const parts = p.date.split('-');
          if (parts.length === 3) label = `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
        }
        return {
          label,
          value: p.avg_value ?? null,
          real: p.avg_value !== null && p.avg_value !== undefined,
        };
      });
    }
    return defaults.map(p => ({ label: p.label, value: null as number | null, real: false }));
  }, [homeData, activeTab]);

  const hasRealData = useMemo(() => chartData.some(d => d.real), [chartData]);

  const interpolatedData = useMemo(() => {
    if (!hasRealData) {
      return chartData.map((item, index) => ({ ...item, value: 100 + Math.sin(index * 1.2) * 15 }));
    }
    const result = chartData.map(item => ({ ...item }));
    for (let i = 0; i < result.length; i++) {
      if (result[i].value === null) {
        let prev: number | null = null;
        for (let j = i - 1; j >= 0; j--) if (chartData[j].real) { prev = chartData[j].value; break; }
        let next: number | null = null;
        for (let j = i + 1; j < chartData.length; j++) if (chartData[j].real) { next = chartData[j].value; break; }
        if (prev !== null && next !== null) result[i].value = prev + (next - prev) * 0.5;
        else if (prev !== null) result[i].value = prev;
        else if (next !== null) result[i].value = next;
        else result[i].value = 100;
      }
    }
    return result;
  }, [chartData, hasRealData]);

  const chartSVG = useMemo(() => {
    const minVal = 60;
    const maxVal = 200;
    const paddingLeft = 25;
    const paddingRight = 10;
    const paddingTop = 10;
    const paddingBottom = 20;
    const graphWidth = CHART_WIDTH - paddingLeft - paddingRight;
    const graphHeight = CHART_HEIGHT - paddingTop - paddingBottom;

    const points = interpolatedData.map((item, index) => {
      const x = paddingLeft + (index / Math.max(1, interpolatedData.length - 1)) * graphWidth;
      const bounded = Math.max(minVal, Math.min(maxVal, item.value || 100));
      const y = paddingTop + graphHeight - ((bounded - minVal) / (maxVal - minVal)) * graphHeight;
      return { x, y };
    });

    const linePath = getBezierCurvePath(points);
    const areaPath = points.length
      ? `${linePath} L ${points[points.length - 1].x} ${CHART_HEIGHT - paddingBottom} L ${points[0].x} ${CHART_HEIGHT - paddingBottom} Z`
      : '';

    const yFor = (v: number) =>
      paddingTop + graphHeight - ((v - minVal) / (maxVal - minVal)) * graphHeight;

    return {
      points,
      linePath,
      areaPath,
      targetMinY: yFor(targetMin),
      targetMaxY: yFor(targetMax),
      paddingLeft,
      paddingBottom,
      graphWidth,
    };
  }, [interpolatedData, targetMin, targetMax]);

  return (
    <View style={[styles.card, { backgroundColor: C.white, borderColor: C.redBorder }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: C.text }]}>Glucose Trend</Text>
          <Text style={[styles.subtitle, { color: C.textSm }]}>
            {activeTab === '7d' ? 'Last 7 days' : 'Last 30 days'}
          </Text>
        </View>
        <View style={[styles.toggle, { backgroundColor: C.redBg }]}>
          {(['7d', '30d'] as const).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => onChangeTab(t)}
              style={[styles.toggleBtn, activeTab === t && { backgroundColor: C.red }]}
            >
              <Text style={[styles.toggleText, { color: activeTab === t ? '#FFF' : C.redMuted }]}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.svgWrap}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <SvgLinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={C.red} stopOpacity={hasRealData ? 0.18 : 0.06} />
              <Stop offset="100%" stopColor={C.red} stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>

          {/* High threshold (orange dashed) */}
          <Line
            x1={chartSVG.paddingLeft} y1={chartSVG.targetMaxY}
            x2={CHART_WIDTH - 10} y2={chartSVG.targetMaxY}
            stroke="#F39C12" strokeWidth={1} strokeDasharray="4,4" strokeOpacity={0.6}
          />
          {/* Low threshold (red dashed) */}
          <Line
            x1={chartSVG.paddingLeft} y1={chartSVG.targetMinY}
            x2={CHART_WIDTH - 10} y2={chartSVG.targetMinY}
            stroke="#E74C3C" strokeWidth={1} strokeDasharray="4,4" strokeOpacity={0.6}
          />

          {chartSVG.areaPath !== '' && <Path d={chartSVG.areaPath} fill="url(#trendFill)" />}

          {chartSVG.linePath !== '' && (
            <Path
              d={chartSVG.linePath}
              fill="none"
              stroke={C.red}
              strokeWidth={2.5}
              strokeOpacity={hasRealData ? 1 : 0.3}
              strokeDasharray={hasRealData ? undefined : '4,4'}
            />
          )}

          {hasRealData && chartSVG.points.map((p, i) => {
            if (!chartData[i].real) return null;
            const isLast = i === chartSVG.points.length - 1;
            return (
              <Circle
                key={i}
                cx={p.x} cy={p.y} r={isLast ? 5 : 3.5}
                fill={isLast ? C.red : '#FFF'} stroke={C.red} strokeWidth={isLast ? 2.5 : 1.5}
              />
            );
          })}

          {chartSVG.points.map((p, i) => {
            if (activeTab === '30d' && i % 5 !== 0) return null;
            return (
              <SvgText
                key={`lbl-${i}`}
                x={p.x} y={CHART_HEIGHT - 4} textAnchor="middle"
                fill={C.redMuted} fontSize={8} fontWeight="600"
              >
                {chartData[i].label}
              </SvgText>
            );
          })}

          <SvgText x={chartSVG.paddingLeft - 6} y={chartSVG.targetMaxY + 3} textAnchor="end" fill={C.textSm} fontSize={8} fontWeight="600">
            {targetMax}
          </SvgText>
          <SvgText x={chartSVG.paddingLeft - 6} y={chartSVG.targetMinY + 3} textAnchor="end" fill={C.textSm} fontSize={8} fontWeight="600">
            {targetMin}
          </SvgText>
        </Svg>

        {/* Touch zones for tooltip */}
        <View style={[styles.touchRow, { left: chartSVG.paddingLeft, width: chartSVG.graphWidth, height: CHART_HEIGHT - chartSVG.paddingBottom }]}>
          {chartData.map((_, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={1}
              onPressIn={() => setHoverIndex(index)}
              onPressOut={() => setHoverIndex(null)}
              style={{ flex: 1, backgroundColor: hoverIndex === index ? 'rgba(196,30,38,0.05)' : 'transparent' }}
            />
          ))}
        </View>

        {hoverIndex !== null && chartSVG.points[hoverIndex] && (
          <View
            pointerEvents="none"
            style={[
              styles.tooltip,
              {
                left: Math.max(10, Math.min(CHART_WIDTH - 110, chartSVG.points[hoverIndex].x - 50)),
                top: Math.max(5, chartSVG.points[hoverIndex].y - 45),
                backgroundColor: C.redDark,
              },
            ]}
          >
            <Text style={styles.tooltipText}>
              {chartData[hoverIndex].real
                ? `${unit === 'mmol/L' ? convertGlucose(chartData[hoverIndex].value || 0, 'mmol/L', 'mg/dL').toFixed(1) : Math.round(chartData[hoverIndex].value || 0)} ${unit}`
                : 'No entry'}
            </Text>
            <Text style={styles.tooltipSub}>{chartData[hoverIndex].label}</Text>
          </View>
        )}

        {!hasRealData && (
          <View pointerEvents="none" style={[styles.noDataWrap, { left: chartSVG.paddingLeft, width: chartSVG.graphWidth, height: CHART_HEIGHT - chartSVG.paddingBottom }]}>
            <View style={[styles.noDataPill, { backgroundColor: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)', borderColor: C.redBorder }]}>
              <Sparkles size={14} color={C.red} />
              <Text style={[styles.noDataText, { color: C.textSm }]}>No data available — showing baseline</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, { backgroundColor: '#E74C3C' }]} />
          <Text style={[styles.legendText, { color: C.textSm }]}>Low &lt;{targetMin}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, { backgroundColor: '#F39C12' }]} />
          <Text style={[styles.legendText, { color: C.textSm }]}>High &gt;{targetMax}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
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
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  toggleText: { fontSize: 11, fontWeight: 'bold' },
  svgWrap: { alignItems: 'center', justifyContent: 'center' },
  touchRow: { position: 'absolute', top: 0, flexDirection: 'row', zIndex: 5 },
  tooltip: {
    position: 'absolute',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 80,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  tooltipSub: { color: 'rgba(255,255,255,0.7)', fontSize: 8, marginTop: 2 },
  noDataWrap: { position: 'absolute', top: 0, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  noDataPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  noDataText: { fontSize: 9, fontWeight: 'bold' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDash: { width: 12, height: 2, borderRadius: 1 },
  legendText: { fontSize: 11, fontWeight: '600' },
});

export default GlucoseTrendChart;
