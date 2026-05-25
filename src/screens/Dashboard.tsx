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
import Svg, { Path, Line, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { apiService, mapStatus, mapTrend, formatTime } from '../services/apiService';
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
}

// --- MOCK DATA FALLBACKS (Will be rarely used now) ---
const mock7Days = [
  { day: "Mon", value: 118 }, { day: "Tue", value: 145 }, { day: "Wed", value: 132 },
  { day: "Thu", value: 98 }, { day: "Fri", value: 162 }, { day: "Sat", value: 128 }, { day: "Sun", value: 125 },
];

const Dashboard: React.FC<DashboardProps> = ({ onNavigateAlerts, onNavigateDetail }) => {
  const { C, isDark } = useTheme();
  const { logs, alerts, homeData, recommendations, loading, refreshData } = useData();
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  // --- STATS COMPUTATION ---
  const stats = useMemo(() => {
    const measurements = logs.filter(l => l.type === 'measurement') as MeasurementEntry[];
    const latestFromLogs = measurements[0] || null;

    const latest = homeData?.latest_reading ? {
      id: homeData.latest_reading.id,
      type: 'measurement' as const,
      value: homeData.latest_reading.value_mg_dl,
      unit: 'mg/dL',
      status: mapStatus(homeData.latest_reading.health_status),
      time: formatTime(homeData.latest_reading.measured_at),
      date: homeData.latest_reading.measured_at,
      delta: homeData.latest_reading.delta_since_last,
      trend: mapTrend(homeData.latest_reading.trend || undefined),
    } : (latestFromLogs ? {
      ...latestFromLogs,
      delta: 0,
      trend: 'stable' as const,
    } : null);

    const sum = measurements.reduce((acc, curr) => acc + curr.value, 0);
    const avg = measurements.length > 0 ? Math.round(sum / measurements.length) : (latest?.value || 0);
    
    const minGoal = homeData?.latest_reading?.target?.min || profile?.goals?.min || 70;
    const maxGoal = homeData?.latest_reading?.target?.max || profile?.goals?.max || 140;
    
    const inRangeCount = measurements.filter(m => m.value >= minGoal && m.value <= maxGoal).length;
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
      targetMax: maxGoal
    };
  }, [logs, alerts, profile, homeData]);

  const recentMeasurements = useMemo(() => {
    return logs.filter(l => l.type === 'measurement').slice(0, 4) as MeasurementEntry[];
  }, [logs]);

  // --- CUSTOM SVG GRAPH PATH GENERATION ---
  const chartData = useMemo(() => {
    if (homeData?.glucose_trend?.points && homeData.glucose_trend.points.length > 0) {
      return homeData.glucose_trend.points.map(p => ({
        label: p.label,
        value: p.avg_value || 0
      }));
    }
    // If no real data, try to extract from logs of the last 7 days
    const measurements = logs.filter(l => l.type === 'measurement') as MeasurementEntry[];
    if (measurements.length > 0) {
       // Just show last few measurements as points if no full trend from backend
       return measurements.slice(0, 7).reverse().map((m, i) => ({
         label: m.time,
         value: m.value
       }));
    }
    return [
      { label: "Empty", value: 0 },
      { label: "Empty", value: 0 },
      { label: "Empty", value: 0 },
      { label: "Empty", value: 0 }
    ];
  }, [homeData, logs]);

  const chartSVG = useMemo(() => {
    const minVal = 60;
    const maxVal = 200;
    const paddingLeft = 25;
    const paddingRight = 10;
    const paddingTop = 10;
    const paddingBottom = 20;

    const graphWidth = CHART_WIDTH - paddingLeft - paddingRight;
    const graphHeight = CHART_HEIGHT - paddingTop - paddingBottom;

    const points = chartData.map((item, index) => {
      const x = paddingLeft + (index / (chartData.length - 1)) * graphWidth;
      const y = paddingTop + graphHeight - ((item.value - minVal) / (maxVal - minVal)) * graphHeight;
      return { x, y, val: item.value };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
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
  }, [chartData]);

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
          <Text style={[styles.greeting, { color: C.textSm }]}>{homeData?.greeting?.date || 'Today'}</Text>
          <Text style={[styles.userName, { color: C.text }]}>Hello, {homeData?.greeting?.name || profile?.name?.split(' ')[0] || 'Sarah'} 👋</Text>
          <Text style={[styles.userGoal, { color: C.textMd }]}>Track your glucose with confidence</Text>
        </View>
        <TouchableOpacity style={styles.alertButton} onPress={onNavigateAlerts}>
          <View style={[styles.alertIconBox, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <Bell size={20} color={C.red} strokeWidth={2} />
          </View>
          {stats.unreadAlerts > 0 && (
            <View style={[styles.badge, { backgroundColor: C.red }]}>
              <Text style={styles.badgeText}>{stats.unreadAlerts}</Text>
            </View>
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
              <Text style={styles.mainValue}>{stats.latest?.value || '--'}</Text>
              <View style={styles.unitCol}>
                <Text style={styles.mainUnit}>mg/dL</Text>
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
               <Text style={styles.footerValue}>{stats.avg} <Text style={styles.footerUnit}>mg/dL</Text></Text>
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
                <Stop offset="0%" stopColor={C.red} stopOpacity={0.2} />
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
              <Path d={chartSVG.linePath} fill="none" stroke={C.red} strokeWidth={2.5} />
            )}

            {/* Point Markers */}
            {chartSVG.points.map((p, i) => (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={i === chartSVG.points.length - 1 ? 5 : 3.5}
                fill={i === chartSVG.points.length - 1 ? C.red : '#FFF'}
                stroke={C.red}
                strokeWidth={i === chartSVG.points.length - 1 ? 2.5 : 1.5}
              />
            ))}

            {/* Bottom Labels */}
            {chartSVG.points.map((p, i) => {
              if (activeTab === '30d' && i % 3 !== 0) return null;
              return (
                <Text
                  key={`lbl-${i}`}
                  style={[
                    styles.svgLabel, 
                    { 
                      position: 'absolute', 
                      left: p.x - 12, 
                      top: CHART_HEIGHT - 16,
                      color: C.redMuted 
                    }
                  ]}
                >
                  {chartData[i].label}
                </Text>
              );
            })}

            {/* Y Axis Reference Labels */}
            <Text style={[styles.svgLabel, { position: 'absolute', left: 2, top: chartSVG.targetMaxY - 6, color: C.textSm }]}>140</Text>
            <Text style={[styles.svgLabel, { position: 'absolute', left: 2, top: chartSVG.targetMinY - 6, color: C.textSm }]}>70</Text>
          </Svg>
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
          <TouchableOpacity style={styles.seeAllBtn}>
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

        {(recommendations.length > 0 || (homeData?.recommendations && homeData.recommendations.length > 0)) ? (
          <FlatList
            data={recommendations.length > 0 ? recommendations : homeData?.recommendations || []}
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
                        <Text style={[styles.giText, { color: C.green }]}>-{item.estimated_glucose_impact_mg_dl} mg/dL</Text>
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
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
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
  }
});

export default Dashboard;
