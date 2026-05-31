import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { apiService, mapStatus, mapTrend, formatTime, convertGlucose } from '../services/apiService';
import { 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Utensils, 
  ChevronRight,
  Sparkles,
  Droplets,
  Heart,
  Clock,
  Target
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MeasurementEntry, GlucoseStatus, MealEntry, HomeData } from '../services/types';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 130;

interface DashboardProps {
  onNavigateAlerts: () => void;
  onNavigateDetail: (entry: any) => void;
  onSeeAllMeasurements: () => void;
}

// --- DYNAMIC DATES HELPERS ---
const getPast7Days = (): { label: string; date: string }[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      label: days[d.getDay()],
      date: d.toISOString().split('T')[0]
    });
  }
  return result;
};

const getPast30Days = (): { label: string; date: string }[] => {
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      date: d.toISOString().split('T')[0]
    });
  }
  return result;
};

// --- SMOOTH BEZIER PATH GENERATOR ---
const getBezierCurvePath = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    
    const cpX1 = p0.x + (p1.x - p0.x) / 3;
    const cpY1 = p0.y;
    const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
    const cpY2 = p1.y;
    
    d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
  }
  return d;
};

// --- MOCK DATA FALLBACKS (Will be rarely used now) ---
const mock7Days = [
  { day: "Mon", value: 118 }, { day: "Tue", value: 145 }, { day: "Wed", value: 132 },
  { day: "Thu", value: 98 }, { day: "Fri", value: 162 }, { day: "Sat", value: 128 }, { day: "Sun", value: 125 },
];

const Dashboard: React.FC<DashboardProps> = ({ onNavigateAlerts, onNavigateDetail, onSeeAllMeasurements }) => {
  const { C, isDark } = useTheme();
  const { logs, alerts, homeData, recommendations, premiumRecommendations, loading, refreshData } = useData();
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState<'7d' | '30d'>('7d');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    refreshData(activeTab);
  }, [activeTab]);

  // --- REAL DYNAMIC DATE GREETING ---
  const todayDateString = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  }, []);

  const stats = useMemo(() => {
    const measurements = logs.filter(l => l.type === 'measurement') as MeasurementEntry[];
    const latestFromLogs = measurements[0] || null;
    const userUnit = profile?.glucoseUnit || 'mg/dL';
    const serverUnit = 'mg/dL';

    const latest = homeData?.latest_reading ? {
      id: homeData.latest_reading.id,
      type: 'measurement' as const,
      value: convertGlucose(homeData.latest_reading.value_mg_dl, userUnit, serverUnit),
      unit: userUnit,
      status: mapStatus(homeData.latest_reading.health_status),
      time: formatTime(homeData.latest_reading.measured_at),
      date: homeData.latest_reading.measured_at,
      delta: convertGlucose(homeData.latest_reading.delta_since_last || 0, userUnit, serverUnit),
      trend: mapTrend(homeData.latest_reading.trend || undefined),
    } : (latestFromLogs ? {
      ...latestFromLogs,
      value: convertGlucose(latestFromLogs.value, userUnit, latestFromLogs.unit || 'mg/dL'),
      unit: userUnit,
      delta: 0,
      trend: 'stable' as const,
    } : null);

    const sum = measurements.reduce((acc, curr) => acc + convertGlucose(curr.value, userUnit, curr.unit || 'mg/dL'), 0);
    const avgValue = measurements.length > 0 ? (sum / measurements.length) : (latest?.value || 0);
    const avg = userUnit === 'mg/dL' ? Math.round(avgValue) : parseFloat(avgValue.toFixed(2));
    
    const minGoal = convertGlucose(homeData?.latest_reading?.target?.min || profile?.goals?.min || 70, userUnit, serverUnit);
    const maxGoal = convertGlucose(homeData?.latest_reading?.target?.max || profile?.goals?.max || 140, userUnit, serverUnit);
    
    const inRangeCount = measurements.filter(m => {
      const val = convertGlucose(m.value, userUnit, m.unit || 'mg/dL');
      return val >= minGoal && val <= maxGoal;
    }).length;
    const inRangePercent = measurements.length > 0 ? Math.round((inRangeCount / measurements.length) * 100) : 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const mealsToday = logs.filter(l => l.type === 'meal' && l.date.split('T')[0] === todayStr) as MealEntry[];
    const totalCarbs = mealsToday.reduce((acc, curr) => acc + (curr.carbs || 0), 0);

    return {
      latest,
      avg,
      inRangePercent,
      totalCarbs,
      status: latest?.status || 'Normal',
      unreadAlerts: alerts.filter(a => !a.read).length,
      targetMin: minGoal,
      targetMax: maxGoal,
      userUnit
    };
  }, [logs, alerts, profile, homeData]);

  const recentMeasurements = useMemo(() => {
    return logs.filter(l => l.type === 'measurement').slice(0, 4) as MeasurementEntry[];
  }, [logs]);

  // --- CUSTOM SVG GRAPH PATH GENERATION ---
  const chartData = useMemo(() => {
    const defaultPoints = activeTab === '7d' ? getPast7Days() : getPast30Days();
    
    if (homeData?.glucose_trend?.points && homeData.glucose_trend.points.length > 0) {
      return homeData.glucose_trend.points.map(p => {
        let label = p.label;
        if (activeTab === '30d' && p.date) {
          const parts = p.date.split('-');
          if (parts.length === 3) {
            const m = parseInt(parts[1], 10);
            const d = parseInt(parts[2], 10);
            label = `${m}/${d}`;
          }
        }
        return {
          label,
          value: p.avg_value !== null && p.avg_value !== undefined ? p.avg_value : null,
          real: p.avg_value !== null && p.avg_value !== undefined
        };
      });
    }
    
    return defaultPoints.map(p => ({
      label: p.label,
      value: null,
      real: false
    }));
  }, [homeData, activeTab]);

  const hasRealData = useMemo(() => {
    return chartData.some(item => item.real);
  }, [chartData]);

  const interpolatedData = useMemo(() => {
    if (!hasRealData) {
      return chartData.map((item, index) => ({
        ...item,
        value: 100 + Math.sin(index * 1.2) * 15,
      }));
    }
    
    const result = chartData.map(item => ({ ...item }));
    for (let i = 0; i < result.length; i++) {
      if (result[i].value === null) {
        let prevReal = null;
        for (let j = i - 1; j >= 0; j--) {
          if (chartData[j].real) {
            prevReal = chartData[j].value;
            break;
          }
        }
        let nextReal = null;
        for (let j = i + 1; j < chartData.length; j++) {
          if (chartData[j].real) {
            nextReal = chartData[j].value;
            break;
          }
        }
        
        if (prevReal !== null && nextReal !== null) {
          result[i].value = prevReal + (nextReal - prevReal) * 0.5;
        } else if (prevReal !== null) {
          result[i].value = prevReal;
        } else if (nextReal !== null) {
          result[i].value = nextReal;
        } else {
          result[i].value = 100;
        }
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
      const x = paddingLeft + (index / (interpolatedData.length - 1)) * graphWidth;
      const boundedValue = Math.max(minVal, Math.min(maxVal, item.value || 100));
      const y = paddingTop + graphHeight - ((boundedValue - minVal) / (maxVal - minVal)) * graphHeight;
      return { x, y, val: item.value };
    });

    const linePath = getBezierCurvePath(points);
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${CHART_HEIGHT - paddingBottom} L ${points[0].x} ${CHART_HEIGHT - paddingBottom} Z`
      : '';

    // Target Range Horizontal Guidelines
    const targetMinY = paddingTop + graphHeight - (((homeData?.glucose_trend?.target_min || 70) - minVal) / (maxVal - minVal)) * graphHeight;
    const targetMaxY = paddingTop + graphHeight - (((homeData?.glucose_trend?.target_max || 140) - minVal) / (maxVal - minVal)) * graphHeight;

    return {
      points,
      linePath,
      areaPath,
      targetMinY,
      targetMaxY,
      paddingLeft,
      paddingBottom,
      graphWidth,
      graphHeight,
      minVal,
      maxVal,
    };
  }, [interpolatedData, homeData]);

  const statusStyle = (status: GlucoseStatus) => {
    if (status === "High") return { color: C.amber, bg: C.amberBg, border: C.amberBorder };
    if (status === "Low") return { color: C.red, bg: C.redBg, border: C.redBorder };
    return { color: C.green, bg: C.greenBg, border: C.greenBorder };
  };

  const currentStatusStyle = statusStyle(stats.status);

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.bg }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: C.textSm }]}>{homeData?.greeting?.date || todayDateString}</Text>
          <Text style={[styles.userName, { color: C.text }]}>Hello, {homeData?.greeting?.name || profile?.name?.split(' ')[0] || 'Sarah'} 👋</Text>
          <Text style={[styles.userGoal, { color: C.textMd }]}>Track your glucose with confidence</Text>
        </View>
        <TouchableOpacity style={styles.alertButton} onPress={onNavigateAlerts}>
          <View style={[styles.alertIconBox, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <Bell size={20} color={C.red} strokeWidth={2} />
          </View>
          {stats.unreadAlerts > 0 && (
            <View style={[styles.badge, { backgroundColor: C.red, borderColor: C.bg }]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Glucose Linear Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => stats.latest && onNavigateDetail(stats.latest)}
      >
        <LinearGradient
          colors={[C.red, C.redDark]}
          style={styles.mainCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.mainCardHeader}>
            <View style={styles.mainCardTitleRow}>
              <Activity size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.mainCardTitle}>LATEST READING</Text>
            </View>
            <View style={styles.timeTag}>
              <Clock size={12} color="rgba(255,255,255,0.6)" />
              <Text style={styles.mainCardTime}>
                {stats.latest ? `${stats.latest.time}` : 'No readings yet'}
              </Text>
            </View>
          </View>
          
          <View style={styles.mainValueRow}>
            <View style={styles.valueWrap}>
              <Text style={styles.mainValue}>{stats.latest?.value ? (stats.userUnit === 'mmol/L' ? stats.latest.value.toFixed(1) : Math.round(stats.latest.value)) : '--'}</Text>
              <View style={styles.unitCol}>
                <Text style={styles.mainUnit}>{stats.userUnit}</Text>
              <View style={styles.trendRow}>
                  {stats.latest?.trend === 'up' ? <TrendingUp size={12} color="#FCD34D" /> : 
                   stats.latest?.trend === 'down' ? <TrendingDown size={12} color="#FCD34D" /> :
                   <Minus size={12} color="#FCD34D" />}
                  <Text style={styles.trendPercent}>
                    {stats.latest?.delta ? `${stats.latest.delta > 0 ? '+' : ''}${stats.latest.delta} since last` : 'Stable'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statusBubble}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBubbleText}>{stats.status}</Text>
            </View>
          </View>

          <View style={styles.mainCardFooter}>
            <View style={styles.footerItem}>
               <Text style={styles.footerLabel}>Average</Text>
               <Text style={styles.footerValue}>{stats.avg} <Text style={styles.footerUnit}>{stats.userUnit}</Text></Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerItem}>
               <Text style={styles.footerLabel}>Time in Range</Text>
               <Text style={styles.footerValue}>{stats.inRangePercent}%</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerItem}>
               <Text style={styles.footerLabel}>Target Range</Text>
               <Text style={styles.footerValue}>{stats.targetMin}-{stats.targetMax}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Glucose Trend Custom SVG Graph */}
      <View style={[styles.graphCard, { backgroundColor: C.white, borderColor: C.redBorder }]}>
        <View style={styles.graphCardHeader}>
          <View>
            <Text style={[styles.graphTitle, { color: C.text }]}>Glucose Trend</Text>
            <Text style={[styles.graphSubtitle, { color: C.textSm }]}>
              {activeTab === '7d' ? 'Last 7 days' : 'Last 30 days'}
            </Text>
          </View>
          <View style={[styles.tabToggle, { backgroundColor: C.redBg }]}>
            {(['7d', '30d'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setActiveTab(t)}
                style={[styles.toggleBtn, activeTab === t && { backgroundColor: C.red }]}
              >
                <Text style={[styles.toggleText, { color: activeTab === t ? '#FFF' : C.redMuted }]}>
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SVG Drawing */}
        <View style={styles.svgContainer}>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            <Defs>
              <SvgLinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={C.red} stopOpacity={hasRealData ? 0.2 : 0.08} />
                <Stop offset="100%" stopColor={C.red} stopOpacity={0} />
              </SvgLinearGradient>
            </Defs>

            {/* Reference Guidelines */}
            <Line
              x1={chartSVG.paddingLeft}
              y1={chartSVG.targetMaxY}
              x2={CHART_WIDTH - 10}
              y2={chartSVG.targetMaxY}
              stroke={C.amber || '#F59E0B'}
              strokeWidth={1}
              strokeDasharray="4,4"
              strokeOpacity={0.5}
            />
            <Line
              x1={chartSVG.paddingLeft}
              y1={chartSVG.targetMinY}
              x2={CHART_WIDTH - 10}
              y2={chartSVG.targetMinY}
              stroke={C.red}
              strokeWidth={1}
              strokeDasharray="4,4"
              strokeOpacity={0.5}
            />

            {/* Area Path */}
            {chartSVG.areaPath !== '' && (
              <Path d={chartSVG.areaPath} fill="url(#gradient)" />
            )}

            {/* Line Path */}
            {chartSVG.linePath !== '' && (
              <Path 
                d={chartSVG.linePath} 
                fill="none" 
                stroke={C.red} 
                strokeWidth={2.5} 
                strokeOpacity={hasRealData ? 1 : 0.3}
                strokeDasharray={hasRealData ? undefined : "4,4"}
              />
            )}

            {/* Point Markers */}
            {hasRealData && chartSVG.points.map((p, i) => {
              if (!chartData[i].real) return null;
              const isLastPoint = i === chartSVG.points.length - 1;
              return (
                <Circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={isLastPoint ? 5 : 3.5}
                  fill={isLastPoint ? C.red : '#FFF'}
                  stroke={C.red}
                  strokeWidth={isLastPoint ? 2.5 : 1.5}
                />
              );
            })}

            {/* Bottom Labels */}
            {chartSVG.points.map((p, i) => {
              if (activeTab === '30d' && i % 5 !== 0) return null;
              return (
                <SvgText
                  key={`lbl-${i}`}
                  x={p.x}
                  y={CHART_HEIGHT - 4}
                  textAnchor="middle"
                  fill={C.redMuted}
                  fontSize={8}
                  fontWeight="600"
                >
                  {chartData[i].label}
                </SvgText>
              );
            })}

            {/* Y Axis Reference Labels */}
            <SvgText
              x={chartSVG.paddingLeft - 6}
              y={chartSVG.targetMaxY + 3}
              textAnchor="end"
              fill={C.textSm}
              fontSize={8}
              fontWeight="600"
            >
              {stats.targetMax}
            </SvgText>
            <SvgText
              x={chartSVG.paddingLeft - 6}
              y={chartSVG.targetMinY + 3}
              textAnchor="end"
              fill={C.textSm}
              fontSize={8}
              fontWeight="600"
            >
              {stats.targetMin}
            </SvgText>
          </Svg>

          {/* Transparent interactive touch areas for tooltip hover */}
          <View 
            style={{
              position: 'absolute',
              left: chartSVG.paddingLeft,
              top: 0,
              width: chartSVG.graphWidth,
              height: CHART_HEIGHT - chartSVG.paddingBottom,
              flexDirection: 'row',
              zIndex: 5,
            }}
          >
            {chartData.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={1}
                onPressIn={() => setHoverIndex(index)}
                onPressOut={() => setHoverIndex(null)}
                style={{
                  flex: 1,
                  backgroundColor: hoverIndex === index ? 'rgba(196, 30, 38, 0.05)' : 'transparent',
                }}
              />
            ))}
          </View>

          {/* Absolute tooltip container */}
          {hoverIndex !== null && chartSVG.points[hoverIndex] && (
            <View
              pointerEvents="none"
              style={[
                styles.tooltip,
                {
                  left: Math.max(10, Math.min(CHART_WIDTH - 110, chartSVG.points[hoverIndex].x - 50)),
                  top: Math.max(5, chartSVG.points[hoverIndex].y - 45),
                  backgroundColor: C.redDark,
                }
              ]}
            >
              <Text style={styles.tooltipText}>
                {chartData[hoverIndex].real
                  ? `${stats.userUnit === 'mmol/L' ? convertGlucose(chartData[hoverIndex].value || 0, 'mmol/L', 'mg/dL').toFixed(1) : Math.round(chartData[hoverIndex].value || 0)} ${stats.userUnit}`
                  : 'No entry'}
              </Text>
              <Text style={styles.tooltipSubText}>
                {chartData[hoverIndex].label}
              </Text>
            </View>
          )}

          {/* Absolute overlay banner for placeholder data */}
          {!hasRealData && (
            <View 
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: chartSVG.paddingLeft,
                width: chartSVG.graphWidth,
                height: CHART_HEIGHT - chartSVG.paddingBottom,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: C.redBorder,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
                gap: 6
              }}>
                <Sparkles size={14} color={C.red} />
                <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.textSm }}>
                  No readings logged. Showing expected baseline trend.
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDash, { backgroundColor: C.amber || '#F59E0B' }]} />
            <Text style={[styles.legendText, { color: C.textSm }]}>High Target &gt;{stats.targetMax}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDash, { backgroundColor: C.red }]} />
            <Text style={[styles.legendText, { color: C.textSm }]}>Low Target &lt;{stats.targetMin}</Text>
          </View>
        </View>
      </View>

      {/* Recent Measurements */}
      <View style={[styles.graphCard, { backgroundColor: C.white, borderColor: C.redBorder, padding: 16 }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Recent Measurements</Text>
          <TouchableOpacity style={styles.seeAllBtn} onPress={onSeeAllMeasurements}>
            <Text style={[styles.seeAllText, { color: C.red }]}>See all</Text>
            <ChevronRight size={14} color={C.red} />
          </TouchableOpacity>
        </View>

        <View style={styles.measureList}>
          {recentMeasurements.length > 0 ? (
            recentMeasurements.map((m, i) => {
              const styleSet = statusStyle(m.status);
              return (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.8}
                  onPress={() => onNavigateDetail(m)}
                  style={[
                    styles.measureRow,
                    { 
                      backgroundColor: i === 0 ? C.redBg : '#FAFAFA',
                      borderColor: i === 0 ? C.redBorder : (C.divider || '#F0EDED'),
                    }
                  ]}
                >
                  <View style={[styles.measureIconBox, { backgroundColor: styleSet.bg, borderColor: styleSet.border }]}>
                    <Droplets size={16} color={styleSet.color} />
                  </View>
                  <View style={styles.measureInfo}>
                    <Text style={[styles.measureTimeLabel, { color: C.text }]}>
                      {new Date(m.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={[styles.measureTimeSub, { color: C.textSm }]}>{m.time}</Text>
                  </View>
                  <View style={styles.measureValWrap}>
                    <Text style={[styles.measureVal, { color: C.text }]}>
                      {m.value} <Text style={styles.measureValUnit}>mg/dL</Text>
                    </Text>
                    <View style={[styles.statusTag, { backgroundColor: styleSet.bg, borderColor: styleSet.border }]}>
                      <View style={[styles.statusDotSmall, { backgroundColor: styleSet.color }]} />
                      <Text style={[styles.statusTagText, { color: styleSet.color }]}>{m.status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            mock7Days.slice(0, 3).map((m, i) => {
              const status: GlucoseStatus = m.value > 140 ? "High" : m.value < 70 ? "Low" : "Normal";
              const styleSet = statusStyle(status);
              return (
                <View
                  key={i}
                  style={[
                    styles.measureRow,
                    { 
                      backgroundColor: i === 0 ? C.redBg : '#FAFAFA',
                      borderColor: i === 0 ? C.redBorder : '#F0EDED',
                    }
                  ]}
                >
                  <View style={[styles.measureIconBox, { backgroundColor: styleSet.bg, borderColor: styleSet.border }]}>
                    <Droplets size={16} color={styleSet.color} />
                  </View>
                  <View style={styles.measureInfo}>
                    <Text style={[styles.measureTimeLabel, { color: C.text }]}>Today</Text>
                    <Text style={[styles.measureTimeSub, { color: C.textSm }]}>08:30 AM</Text>
                  </View>
                  <View style={styles.measureValWrap}>
                    <Text style={[styles.measureVal, { color: C.text }]}>
                      {m.value} <Text style={styles.measureValUnit}>mg/dL</Text>
                    </Text>
                    <View style={[styles.statusTag, { backgroundColor: styleSet.bg, borderColor: styleSet.border }]}>
                      <View style={[styles.statusDotSmall, { backgroundColor: styleSet.color }]} />
                      <Text style={[styles.statusTagText, { color: styleSet.color }]}>{status}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Recommended Foods Horizontal List */}
      <View style={styles.foodSection}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderTitleRow}>
            <View style={[styles.smallIconBox, { backgroundColor: C.red }]}>
              <Sparkles size={14} color="#FFF" />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Recommended for You</Text>
              <Text style={[styles.sectionSubtitle, { color: C.textSm }]}>AI-powered suggestions</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.seeAllBtn}>
            <Text style={[styles.seeAllText, { color: C.red }]}>See all</Text>
            <ChevronRight size={14} color={C.red} />
          </TouchableOpacity>
        </View>

        {(premiumRecommendations.length > 0 || recommendations.length > 0 || (homeData?.recommendations && homeData.recommendations.length > 0)) ? (
          <FlatList
            data={premiumRecommendations.length > 0 ? premiumRecommendations : (recommendations.length > 0 ? recommendations : homeData?.recommendations || [])}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.foodListContainer}
            renderItem={({ item }) => {
              const isBlue = item.impact_level === "moderate";
              return (
                <View style={[styles.foodCard, { backgroundColor: C.white, borderColor: C.redBorder }]}>
                  <View style={styles.foodImageContainer}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.foodImage} />
                    ) : (
                      <View style={[styles.foodImage, { backgroundColor: C.redBg, justifyContent: 'center', alignItems: 'center' }]}>
                        <Utensils size={32} color={C.red} opacity={0.2} />
                      </View>
                    )}
                    <View style={[
                      styles.foodTag,
                      { 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderColor: isBlue ? C.blue : C.green
                      }
                    ]}>
                      <Text style={[styles.foodTagText, { color: isBlue ? C.blue : C.green }]}>{item.impact_label || 'Good choice'}</Text>
                    </View>
                  </View>
                  <View style={styles.foodDetails}>
                    <Text style={[styles.foodName, { color: C.text }]} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.foodMetaRow}>
                      <Text style={[styles.foodCal, { color: C.textSm }]}>{item.calories} kcal</Text>
                      <View style={[styles.giBadge, { backgroundColor: C.greenBg }]}>
                        <Text style={[styles.giText, { color: C.green }]}>-{stats.userUnit === 'mmol/L' ? convertGlucose(item.estimated_glucose_impact_mg_dl, 'mmol/L', 'mg/dL').toFixed(1) : item.estimated_glucose_impact_mg_dl} {stats.userUnit}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        ) : (
          <View style={[styles.emptyRecommendations, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
             <Sparkles size={24} color={C.redMuted} />
             <Text style={[styles.emptyRecText, { color: C.textSm }]}>Logging more meals will unlock AI recommendations</Text>
          </View>
        )}
      </View>

      {/* Weekly Health Score */}
      <View style={[
        styles.healthCard, 
        { 
          backgroundColor: isDark ? '#1E1418' : '#FFF9F9',
          borderColor: C.redBorder 
        }
      ]}>
        <View style={[styles.healthIconBox, { backgroundColor: C.greenBg, borderColor: C.greenBorder }]}>
          <Heart size={22} color={C.green} />
        </View>
        <View style={styles.healthInfo}>
          <Text style={[styles.healthLabel, { color: C.textSm }]}>Weekly Health Score</Text>
          <View style={styles.healthScoreRow}>
            <Text style={[styles.healthScore, { color: C.red }]}>{stats.inRangePercent || 0}</Text>
            <Text style={[styles.healthMax, { color: C.textSm }]}>/100</Text>
          </View>
          <View style={[styles.healthProgressBar, { backgroundColor: C.redBorder }]}>
            <View style={[styles.healthProgress, { width: `${stats.inRangePercent || 0}%`, backgroundColor: C.red }]} />
          </View>
        </View>
        <View style={[styles.healthRatingTag, { backgroundColor: stats.inRangePercent > 70 ? C.greenBg : C.amberBg, borderColor: stats.inRangePercent > 70 ? C.greenBorder : C.amberBorder }]}>
          <Text style={[styles.healthRatingText, { color: stats.inRangePercent > 70 ? C.green : C.amber }]}>
            {stats.inRangePercent > 70 ? 'Good control' : (stats.inRangePercent > 0 ? 'Getting there' : 'No data')}
          </Text>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
  },
  userGoal: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  alertButton: {
    position: 'relative',
  },
  alertIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  mainCard: {
    marginHorizontal: 24,
    borderRadius: 30,
    padding: 20,
    shadowColor: '#C41E26',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 20,
  },
  mainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainCardTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mainCardTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  mainValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  mainValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 56,
  },
  unitCol: {
    marginLeft: 8,
    paddingBottom: 4,
  },
  mainUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  trendPercent: {
    fontSize: 10,
    color: '#FCD34D',
    fontWeight: '700',
  },
  statusBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  statusBubbleText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  mainCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerItem: {
    flex: 1,
    alignItems: 'center',
  },
  footerLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  footerValue: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  footerUnit: {
    fontSize: 9,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  footerDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  graphCard: {
    marginHorizontal: 24,
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  graphCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  graphTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  graphSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  tabToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2.5,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDash: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  measureList: {
    gap: 10,
  },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  measureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  measureInfo: {
    flex: 1,
  },
  measureTimeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  measureTimeSub: {
    fontSize: 10,
    marginTop: 1,
  },
  measureValWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  measureVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  measureValUnit: {
    fontSize: 10,
    fontWeight: 'normal',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  foodSection: {
    marginVertical: 10,
  },
  foodListContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  foodCard: {
    width: 148,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 4,
  },
  foodImageContainer: {
    height: 100,
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  foodTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  foodTagText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  foodDetails: {
    padding: 10,
  },
  foodName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  foodMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  foodCal: {
    fontSize: 10,
  },
  giBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  giText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  healthCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  healthIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthInfo: {
    flex: 1,
  },
  healthLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  healthScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  healthScore: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 22,
  },
  healthMax: {
    fontSize: 11,
    marginLeft: 1,
  },
  healthProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  healthProgress: {
    height: '100%',
    borderRadius: 3,
  },
  healthRatingTag: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  healthRatingText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyRecommendations: {
    marginHorizontal: 0,
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  emptyRecText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
    zIndex: 10,
  },
  tooltipText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tooltipSubText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 8,
    marginTop: 2,
  }
});

export default Dashboard;
