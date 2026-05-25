import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import {
  Send,
  Sparkles,
  User,
  Trash2,
  AlertCircle,
  Brain,
  Activity,
  AlertTriangle,
  Clock,
  Zap,
  Moon,
  Eye,
  Utensils,
  Sun,
  BarChart3,
  Lightbulb,
  Coffee,
  Syringe,
  Shield,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/apiService';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 110;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
}

// Sparkline Component using Svg
const MiniSparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const h = 24;
  const w = 56;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * w;
    const y = h - ((val - min) / range) * (h - 4) - 2;
    return { x, y };
  });

  const path = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <Svg width={w} height={h}>
      <Path d={path} fill="none" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
};

// Circular Progress Component using Svg
const ProgressRing: React.FC<{ value: number; max: number; size: number; strokeWidth: number; color: string; bgColor: string }> = ({
  value,
  max,
  size,
  strokeWidth,
  color,
  bgColor,
}) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const strokeDashoffset = circ - (value / max) * circ;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
};

interface AIInsightsScreenProps {
  onNavigateAlerts?: () => void;
}

const formatDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AIInsightsScreen: React.FC<AIInsightsScreenProps> = ({ onNavigateAlerts }) => {
  const { C, isDark } = useTheme();
  const { logs, alerts, getAIInsight, selectedDate, setSelectedDate, loading: dataLoading } = useData();
  const { profile } = useUser();
  const [activeSegment, setActiveSegment] = useState<'dashboard' | 'chat'>('dashboard');

  // --- CHAT STATE ---
  const initialMessage: Message = {
    id: '1',
    text: `Hello ${profile?.name || 'there'}! I'm your DiabAI assistant. How can I help you manage your health today?`,
    sender: 'ai',
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [anomalyList, setAnomalyList] = useState<any[]>([]);
  const [detectedPatterns, setDetectedPatterns] = useState<any[]>([]);
  const [recList, setRecList] = useState<any[]>([]);
  const [insulinEstimate, setInsulinEstimate] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      // 7-day window centered on selectedDate (-3 days to +3 days)
      const dateFrom = formatDateStr(new Date(selectedDate.getTime() - 3 * 24 * 60 * 60 * 1000));
      const dateTo = formatDateStr(new Date(selectedDate.getTime() + 3 * 24 * 60 * 60 * 1000));
      const selDateStr = formatDateStr(selectedDate);

      const [recsResult, patternsResult, predsResult, insulinResult] = await Promise.all([
        apiService.fetchRecommendations(dateFrom, dateTo, selDateStr).catch(e => { console.warn(e); return null; }),
        apiService.fetchPatterns(dateFrom, dateTo, selDateStr).catch(e => { console.warn(e); return null; }),
        apiService.fetchPredictions(dateFrom, dateTo, selDateStr).catch(e => { console.warn(e); return null; }),
        apiService.fetchInsulinEstimate(dateFrom, dateTo, selDateStr).catch(e => { console.warn(e); return null; }),
      ]);

      if (recsResult?.calendar?.days) {
        setCalendarDays(recsResult.calendar.days);
      } else {
        // Fallback generated calendar days
        const fallbackDays = [];
        for (let i = -3; i <= 3; i++) {
          const dayDate = new Date(selectedDate.getTime() + i * 24 * 60 * 60 * 1000);
          const dayStr = formatDateStr(dayDate);
          fallbackDays.push({
            date: dayStr,
            label: dayDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            day: dayDate.getDate(),
            has_data: logs.some(l => l.type === 'measurement' && formatDateStr(new Date(l.date)) === dayStr),
            is_selected: i === 0
          });
        }
        setCalendarDays(fallbackDays);
      }

      setRecList(recsResult?.recommendations || []);
      setDetectedPatterns(patternsResult?.patterns || []);
      setPredictions(predsResult?.prediction ? [predsResult.prediction] : []);
      setAnomalyList((patternsResult?.patterns || []).filter((p: any) => p.trend === 'rising' || p.priority === 'high'));
      setInsulinEstimate(insulinResult?.insulin_estimate || null);
    } catch (error) {
      console.error("[AIInsights] Failed to fetch backend insights:", error);
    } finally {
      setInsightsLoading(false);
    }
  }, [selectedDate, logs]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const insight = await getAIInsight(input);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: insight,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting to my AI model right now. Please try again in a moment.",
        sender: 'ai',
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const clearChat = useCallback(() => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to reset the conversation?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive", 
          onPress: () => setMessages([initialMessage]) 
        }
      ]
    );
  }, [profile]);

  // --- DERIVED METRICS FOR SELECTED DAY ---
  const selectedDayStats = useMemo(() => {
    const selectedDateStr = formatDateStr(selectedDate);
    const dayLogs = logs.filter(l => 
      l.type === 'measurement' && 
      formatDateStr(new Date(l.date)) === selectedDateStr
    );
    
    const minGoal = profile?.goals?.min || 70;
    const maxGoal = profile?.goals?.max || 140;
    
    if (dayLogs.length === 0) {
      return { avg: 120, inRangePercent: 75, stability: 75, lowPercent: 10, normalPercent: 75, highPercent: 15, count: 0 };
    }
    
    const values = dayLogs.map(l => l.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / values.length);
    
    const lowCount = dayLogs.filter(l => l.value < minGoal).length;
    const normalCount = dayLogs.filter(l => l.value >= minGoal && l.value <= maxGoal).length;
    const highCount = dayLogs.filter(l => l.value > maxGoal).length;
    
    const lowPercent = Math.round((lowCount / values.length) * 100);
    const normalPercent = Math.round((normalCount / values.length) * 100);
    const highPercent = 100 - lowPercent - normalPercent;
    
    return {
      avg,
      inRangePercent: normalPercent,
      stability: normalPercent,
      lowPercent,
      normalPercent,
      highPercent,
      count: values.length
    };
  }, [logs, selectedDate, profile]);

  const derivedStats = selectedDayStats;

  // Past 7 days ending at selectedDate
  const weeklyTrendData = useMemo(() => {
    const points = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(selectedDate);
      d.setDate(selectedDate.getDate() - i);
      const dateStr = formatDateStr(d);
      
      const dayLogs = logs.filter(l => 
        l.type === 'measurement' && 
        formatDateStr(new Date(l.date)) === dateStr
      );
      
      const sum = dayLogs.reduce((acc, curr) => acc + (curr.value || 0), 0);
      const avg = dayLogs.length > 0 ? Math.round(sum / dayLogs.length) : null;
      
      points.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }), // "M", "T" etc
        value: avg,
        real: avg !== null
      });
    }
    return points;
  }, [logs, selectedDate]);

  const hasWeeklyTrendData = useMemo(() => {
    return weeklyTrendData.some(p => p.real);
  }, [weeklyTrendData]);

  const interpolatedWeeklyTrendData = useMemo(() => {
    if (!hasWeeklyTrendData) {
      return weeklyTrendData.map((item, index) => ({
        ...item,
        value: 120 + Math.sin(index * 1.2) * 15,
      }));
    }
    
    const data = [...weeklyTrendData];
    let lastRealVal = 120;
    
    const firstReal = data.find(d => d.real);
    if (firstReal && firstReal.value !== null) {
      lastRealVal = firstReal.value;
    }
    
    for (let i = 0; i < data.length; i++) {
      if (data[i].value === null) {
        let nextRealIndex = -1;
        for (let j = i + 1; j < data.length; j++) {
          if (data[j].real) {
            nextRealIndex = j;
            break;
          }
        }
        
        if (nextRealIndex !== -1 && data[nextRealIndex].value !== null) {
          const nextRealVal = data[nextRealIndex].value!;
          const steps = nextRealIndex - (i - 1);
          const valDiff = nextRealVal - lastRealVal;
          data[i].value = lastRealVal + valDiff / steps;
        } else {
          data[i].value = lastRealVal;
        }
      } else {
        lastRealVal = data[i].value!;
      }
    }
    return data as { label: string; value: number; real: boolean }[];
  }, [weeklyTrendData, hasWeeklyTrendData]);

  const weeklyStats = useMemo(() => {
    const startDate = new Date(selectedDate);
    startDate.setDate(selectedDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);
    
    const past7DaysLogs = logs.filter(l => {
      const logDate = new Date(l.date);
      return l.type === 'measurement' && logDate >= startDate && logDate <= endDate;
    }) as any[];
    
    if (past7DaysLogs.length === 0) {
      return { lowest: 0, highest: 0, readings: 0, stdDev: 0 };
    }
    
    const values = past7DaysLogs.map(l => l.value);
    const lowest = Math.min(...values);
    const highest = Math.max(...values);
    const readings = values.length;
    
    const mean = values.reduce((a, b) => a + b, 0) / readings;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / readings;
    const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;
    
    return { lowest, highest, readings, stdDev };
  }, [logs, selectedDate]);

  const weeklySVG = useMemo(() => {
    const minVal = 50;
    const maxVal = 200;
    const paddingLeft = 25;
    const paddingRight = 10;
    const paddingTop = 10;
    const paddingBottom = 20;

    const graphWidth = CHART_WIDTH - paddingLeft - paddingRight;
    const graphHeight = 70;

    const points = interpolatedWeeklyTrendData.map((item, index) => {
      const x = paddingLeft + (index / (interpolatedWeeklyTrendData.length - 1)) * graphWidth;
      const y = paddingTop + graphHeight - ((item.value - minVal) / (maxVal - minVal)) * graphHeight;
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    const limitMinY = paddingTop + graphHeight - ((70 - minVal) / (maxVal - minVal)) * graphHeight;
    const limitMaxY = paddingTop + graphHeight - ((140 - minVal) / (maxVal - minVal)) * graphHeight;

    return {
      points,
      path,
      limitMinY,
      limitMaxY,
      paddingLeft
    };
  }, [interpolatedWeeklyTrendData]);

  const unreadAlertsCount = useMemo(() => {
    return alerts.filter(a => !a.read).length;
  }, [alerts]);

  const selectedDateHeaderStr = useMemo(() => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }, [selectedDate]);

  const mealImpactData = useMemo(() => {
    const selectedDateStr = formatDateStr(selectedDate);
    const mealLogs = logs.filter(l => 
      l.type === 'meal' && 
      formatDateStr(new Date(l.date)) === selectedDateStr
    ).slice(0, 4);
    
    if (mealLogs.length === 0) return [];
    return mealLogs.map((m: any) => ({
      meal: m.name,
      before: "--",
      after: m.after_meal_glucose || "--",
      delta: m.impact || "--",
      emoji: "🥗",
      severity: (parseInt(m.impact) > 30) ? "high" : "low" as const
    }));
  }, [logs, selectedDate]);

  const anomalyAlerts = useMemo(() => {
    if (anomalyList.length > 0) {
      return anomalyList.map((a, i) => ({
        id: a.id || i,
        title: a.title,
        desc: a.desc || a.description,
        severity: (a.severity || "medium") as "high" | "medium" | "low",
        icon: AlertTriangle,
        iconColor: a.severity === 'high' ? '#EF4444' : C.amber,
        bg: a.severity === 'high' ? '#FEF2F2' : C.amberBg,
        border: a.severity === 'high' ? '#FECACA' : C.amberBorder,
        time: "Detected pattern"
      }));
    }
    return [];
  }, [anomalyList, C]);

  const p_patterns = useMemo(() => {
    if (detectedPatterns.length > 0) {
      return detectedPatterns.map((p, i) => ({
        id: p.id || i,
        title: p.title,
        desc: p.description || p.desc,
        icon: p.category === 'diet' ? Utensils : (p.category === 'activity' ? Activity : Brain),
        iconBg: p.trend === 'rising' ? C.amberBg : C.greenBg,
        color: p.trend === 'rising' ? C.amber : C.green,
        confidence: p.confidence || 85,
        trend: (p.trend || 'stable') as "up" | "down" | "stable",
        sparkData: p.spark_data || [110, 115, 120, 118, 122, 120]
      }));
    }
    return [];
  }, [detectedPatterns, C]);

  const p_recommendations = useMemo(() => {
    if (recList.length > 0) {
      return recList.map((r: any, i: number) => ({
        id: r.id || i,
        title: r.title,
        desc: r.description || r.desc,
        icon: r.category === 'diet' ? Utensils : (r.category === 'activity' ? Activity : Coffee),
        iconBg: r.priority === 'high' ? '#FEF2F2' : C.greenBg,
        priority: r.priority_label || r.priority,
        color: r.priority === 'high' ? '#EF4444' : C.amber,
        bg: r.priority === 'high' ? '#FEF2F2' : C.amberBg,
        border: r.priority === 'high' ? '#FECACA' : C.amberBorder
      }));
    }
    return [];
  }, [recList, C]);

  // Prediction SVG chart (decorative trend using backend prediction value)
  const predictionSVG = useMemo(() => {
    const pred = predictions[0];
    const minVal = 70; const maxVal = 220;
    const pL = 10; const pR = 10; const pT = 10;
    const gW = CHART_WIDTH - pL - pR;
    const gH = CHART_HEIGHT - pT - 20;
    const base = pred?.expected_mg_dl ? Math.max(minVal, pred.expected_mg_dl * 0.65) : 110;
    const end = pred?.expected_mg_dl ?? 160;
    const fakeSeries = [base, base * 1.05, base * 1.12, base * 1.2, end];
    const points = fakeSeries.map((v, i) => ({
      x: pL + (i / (fakeSeries.length - 1)) * gW,
      y: pT + gH - ((Math.min(v, maxVal) - minVal) / (maxVal - minVal)) * gH,
    }));
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]; const p1 = points[i + 1];
      const cpX = p0.x + (p1.x - p0.x) / 2;
      path += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    const limitY = pT + gH - ((140 - minVal) / (maxVal - minVal)) * gH;
    return { points, path, limitY, paddingLeft: pL };
  }, [predictions]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: C.bg }]}
    >
      {/* Header — date greeting + bell */}
      <View style={[styles.header, { borderBottomColor: C.divider }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerDateText, { color: C.textSm }]}>{selectedDateHeaderStr}</Text>
          <Text style={[styles.headerTitleText, { color: C.text }]}>AI Insights ✨</Text>
          <Text style={[styles.headerSubText, { color: C.textSm }]}>Personalized advice by Gemini</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {activeSegment === 'chat' && (
            <TouchableOpacity onPress={clearChat} style={[styles.clearBtn, { backgroundColor: C.redBg }]}>
              <Trash2 size={18} color={C.red} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.alertButton} onPress={onNavigateAlerts}>
            <View style={[styles.alertIconBox, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
              <Bell size={20} color={C.red} strokeWidth={2} />
            </View>
            {unreadAlertsCount > 0 && (
              <View style={[styles.alertBadgeDot, { backgroundColor: C.red, borderColor: C.bg }]} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Day Selector Chips */}
      {activeSegment === 'dashboard' && calendarDays.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayScrollRow}
          contentContainerStyle={styles.dayScrollContent}
        >
          {calendarDays.map((day) => (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.dayChip,
                day.is_selected
                  ? [styles.dayChipActive, { backgroundColor: C.red }]
                  : [styles.dayChipInactive, { backgroundColor: C.redBg, borderColor: C.redBorder }],
              ]}
              onPress={() => setSelectedDate(new Date(day.date + 'T12:00:00'))}
            >
              <Text style={[styles.dayChipLabel, { color: day.is_selected ? 'rgba(255,255,255,0.75)' : C.textSm }]}>
                {day.label}
              </Text>
              <Text style={[styles.dayChipDay, { color: day.is_selected ? '#FFF' : C.text }]}>
                {day.day}
              </Text>
              {day.has_data && (
                <View style={[styles.dayChipDot, { backgroundColor: day.is_selected ? '#FFF' : C.red }]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Segment Selector Tab */}
      <View style={styles.tabSelectorContainer}>
        <View style={[styles.tabSelectorBg, { backgroundColor: C.redBg }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeSegment === 'dashboard' && [styles.activeTabBtn, { backgroundColor: C.red }]]}
            onPress={() => setActiveSegment('dashboard')}
          >
            <Text style={[styles.tabBtnText, { color: activeSegment === 'dashboard' ? '#FFF' : C.redMuted }]}>
              Intelligence Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeSegment === 'chat' && [styles.activeTabBtn, { backgroundColor: C.red }]]}
            onPress={() => setActiveSegment('chat')}
          >
            <Text style={[styles.tabBtnText, { color: activeSegment === 'chat' ? '#FFF' : C.redMuted }]}>
              Ask DiabAI
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeSegment === 'dashboard' ? (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Card 1: Glucose Control Summary */}
          <View style={[styles.card, { backgroundColor: C.white, borderColor: C.redBorder }]}>
            <LinearGradient colors={[C.red, C.redDark]} style={styles.cardHeaderStrip}>
              <View style={styles.cardHeaderLeft}>
                <Activity size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.cardHeaderTitle}>GLUCOSE CONTROL SUMMARY</Text>
              </View>
              <View style={styles.statusPill}>
                <View style={styles.statusDotGreen} />
                <Text style={styles.statusPillText}>Good Control</Text>
              </View>
            </LinearGradient>

            <View style={styles.summaryMetricsRow}>
              {/* Avg */}
              <View style={styles.metricBox}>
                <Text style={[styles.metricLabel, { color: C.textXs }]}>AVG GLUCOSE</Text>
                <Text style={[styles.metricVal, { color: C.text }]}>{derivedStats.avg} <Text style={styles.metricUnit}>mg/dL</Text></Text>
                <View style={styles.metricTrend}>
                  <TrendingDown size={11} color={C.green} />
                  <Text style={[styles.metricTrendText, { color: C.green }]}>Status: {derivedStats.avg > 140 ? 'High' : (derivedStats.avg < 70 ? 'Low' : 'Normal')}</Text>
                </View>
              </View>

              {/* Progress Ring */}
              <View style={styles.ringContainer}>
                <Text style={[styles.metricLabel, { color: C.textXs, marginBottom: 4 }]}>TIME IN RANGE</Text>
                <View style={styles.ringWrapper}>
                  <ProgressRing value={derivedStats.inRangePercent} max={100} size={54} strokeWidth={5} color={C.green} bgColor={C.redBorder || '#F2D0D0'} />
                  <Text style={[styles.ringText, { color: C.green }]}>{derivedStats.inRangePercent}%</Text>
                </View>
              </View>

              {/* Stability */}
              <View style={[styles.metricBox, { alignItems: 'flex-end' }]}>
                <Text style={[styles.metricLabel, { color: C.textXs }]}>STABILITY</Text>
                <Text style={[styles.metricVal, { color: C.red }]}>{derivedStats.stability} <Text style={styles.metricUnit}>/100</Text></Text>
                <View style={[styles.progressBar, { backgroundColor: C.redBorder || '#F2D0D0' }]}>
                  <View style={[styles.progressLine, { width: `${derivedStats.stability}%`, backgroundColor: C.red }]} />
                </View>
              </View>
            </View>

            {/* Time in Range Breakdown */}
            <View style={styles.breakdownContainer}>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownSegment, { width: `${derivedStats.lowPercent}%`, backgroundColor: '#EF4444' }]} />
                <View style={[styles.breakdownSegment, { width: `${derivedStats.normalPercent}%`, backgroundColor: C.green }]} />
                <View style={[styles.breakdownSegment, { width: `${derivedStats.highPercent}%`, backgroundColor: '#F59E0B' }]} />
              </View>
              <View style={styles.breakdownLabels}>
                <Text style={[styles.breakdownLabelText, { color: C.textSm }]}>🔴 Low {derivedStats.lowPercent}%</Text>
                <Text style={[styles.breakdownLabelText, { color: C.green, fontWeight: 'bold' }]}>🟢 Normal {derivedStats.normalPercent}%</Text>
                <Text style={[styles.breakdownLabelText, { color: C.textSm }]}>🟡 High {derivedStats.highPercent}%</Text>
              </View>
            </View>

            {/* Weekly Trend SVG + Stats */}
            <View style={[styles.weeklySection, { borderTopColor: C.divider }]}>
              <View style={styles.weeklyStatsRow}>
                {[
                  { label: 'LOWEST', val: weeklyStats.lowest > 0 ? String(weeklyStats.lowest) : '--', color: C.blue },
                  { label: 'HIGHEST', val: weeklyStats.highest > 0 ? String(weeklyStats.highest) : '--', color: C.red },
                  { label: 'READINGS', val: String(weeklyStats.readings), color: C.text },
                  { label: 'STD DEV', val: weeklyStats.stdDev > 0 ? String(weeklyStats.stdDev) : '--', color: C.amber },
                ].map(({ label, val, color }) => (
                  <View key={label} style={styles.weeklyStat}>
                    <Text style={[styles.weeklyStatLabel, { color: C.textXs }]}>{label}</Text>
                    <Text style={[styles.weeklyStatVal, { color }]}>{val}</Text>
                    <Text style={[styles.weeklyStatUnit, { color: C.textXs }]}>mg/dL</Text>
                  </View>
                ))}
              </View>
              <Svg width={CHART_WIDTH - 32} height={90} style={{ marginTop: 4 }}>
                <Path
                  d={`M ${weeklySVG.paddingLeft} ${weeklySVG.limitMaxY} L ${CHART_WIDTH - 42} ${weeklySVG.limitMaxY} L ${CHART_WIDTH - 42} ${weeklySVG.limitMinY} L ${weeklySVG.paddingLeft} ${weeklySVG.limitMinY} Z`}
                  fill={C.green + '18'}
                />
                <Line x1={weeklySVG.paddingLeft} y1={weeklySVG.limitMaxY} x2={CHART_WIDTH - 42} y2={weeklySVG.limitMaxY} stroke={C.green} strokeWidth={0.8} strokeDasharray="3,3" strokeOpacity={0.5} />
                <Line x1={weeklySVG.paddingLeft} y1={weeklySVG.limitMinY} x2={CHART_WIDTH - 42} y2={weeklySVG.limitMinY} stroke="#F59E0B" strokeWidth={0.8} strokeDasharray="3,3" strokeOpacity={0.5} />
                <Path d={weeklySVG.path} fill="none" stroke={C.red} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                {weeklySVG.points.map((pt, idx) => (
                  <Circle key={idx} cx={pt.x} cy={pt.y} r={interpolatedWeeklyTrendData[idx]?.real ? 3.5 : 2} fill={interpolatedWeeklyTrendData[idx]?.real ? C.red : C.redBorder} stroke="#FFF" strokeWidth={1} />
                ))}
              </Svg>
              <View style={styles.weeklyDayLabels}>
                {interpolatedWeeklyTrendData.map((d, i) => (
                  <Text key={i} style={[styles.weeklyDayLabel, { color: C.textXs }]}>{d.label}</Text>
                ))}
              </View>
            </View>
          </View>

          {/* Card 2: Alerts & Anomalies */}
          <View style={[styles.card, { backgroundColor: C.white, borderColor: C.redBorder, padding: 16 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: '#EF4444' }]}>
                <AlertTriangle size={15} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: C.text }]}>Alerts & Anomalies</Text>
                <Text style={[styles.sectionSubtitle, { color: C.textSm }]}>Requires your attention</Text>
              </View>
              <View style={styles.alertCountBadge}>
                <Text style={styles.alertCountText}>{anomalyAlerts.length > 0 ? `${anomalyAlerts.length} active` : 'None'}</Text>
              </View>
            </View>

            <View style={styles.alertList}>
              {anomalyAlerts.map((alert) => {
                const AlertIcon = alert.icon;
                return (
                  <View key={alert.id} style={[styles.alertCard, { borderColor: alert.border }]}>
                    <View style={[styles.alertCardHeader, { backgroundColor: alert.bg }]}>
                      <View style={[styles.alertIconBox, { backgroundColor: `${alert.iconColor}18` }]}>
                        <AlertIcon size={14} color={alert.iconColor} />
                      </View>
                      <Text style={[styles.alertTitle, { color: C.text }]} numberOfLines={1}>{alert.title}</Text>
                      <View style={[styles.severityBadge, { borderColor: alert.border }]}>
                        <Text style={[styles.severityText, { color: alert.iconColor }]}>
                          {alert.severity.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.alertBody}>
                      <Text style={[styles.alertDesc, { color: C.textMd }]}>{alert.desc}</Text>
                      <View style={styles.alertTimeRow}>
                        <Clock size={10} color={C.textXs} />
                        <Text style={[styles.alertTimeText, { color: C.textXs }]}>{alert.time}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Card 3: Patterns Detected */}
          <View style={[styles.card, { backgroundColor: C.white, borderColor: C.redBorder, padding: 16 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: C.purple }]}>
                <Eye size={15} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: C.text }]}>Patterns Detected</Text>
                <Text style={[styles.sectionSubtitle, { color: C.textSm }]}>AI-identified from history</Text>
              </View>
              <View style={[styles.alertCountBadge, { backgroundColor: C.purpleBg }]}>
                <Text style={[styles.alertCountText, { color: C.purple }]}>{p_patterns.length > 0 ? `${p_patterns.length} patterns` : 'None'}</Text>
              </View>
            </View>

            <View style={styles.patternList}>
              {p_patterns.map((p) => {
                const PatternIcon = p.icon;
                return (
                  <View key={p.id} style={[styles.patternRow, { backgroundColor: '#FAFAFA', borderColor: C.divider || '#F0EDED' }]}>
                    <View style={[styles.patternIconWrapper, { backgroundColor: p.iconBg, borderColor: `${p.color}25` }]}>
                      <PatternIcon size={14} color={p.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.patternRowHeader}>
                        <Text style={[styles.patternTitleText, { color: C.text }]} numberOfLines={1}>{p.title}</Text>
                        <MiniSparkline data={p.sparkData} color={p.color} />
                      </View>
                      <Text style={[styles.patternDescText, { color: C.textMd }]}>{p.desc}</Text>
                      <View style={styles.patternMetaRow}>
                        <View style={[styles.confBadge, { backgroundColor: `${p.color}10`, borderColor: `${p.color}30` }]}>
                          <Text style={[styles.confText, { color: p.color }]}>{p.confidence}% confidence</Text>
                        </View>
                        <View style={styles.trendRowSmall}>
                          {p.trend === 'up' && <TrendingUp size={11} color={C.amber} />}
                          {p.trend === 'down' && <TrendingDown size={11} color={C.green} />}
                          {p.trend === 'stable' && <Minus size={11} color={C.green} />}
                          <Text style={[styles.trendRowText, { color: p.trend === 'up' ? C.amber : C.green }]}>
                            {p.trend === 'up' ? 'Rising' : p.trend === 'down' ? 'Declining' : 'Stable'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Card 4: Prediction Forecast */}
          <View style={[styles.card, { backgroundColor: C.white, borderColor: C.redBorder, padding: 16 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: C.blue }]}>
                <TrendingUp size={15} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: C.text }]}>Prediction</Text>
                <Text style={[styles.sectionSubtitle, { color: C.textSm }]}>AI-powered forecast</Text>
              </View>
            </View>

            {predictions.length > 0 ? (
              <View style={[styles.predictionBanner, { backgroundColor: C.blueBg, borderColor: C.blueBorder }]}>
                <View>
                  <Text style={[styles.predBannerLabel, { color: C.blue }]}>
                    {predictions[0]?.expected_at
                      ? `EXPECTED AT ${new Date(predictions[0].expected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'NEXT PREDICTION'}
                  </Text>
                  <Text style={[styles.predBannerVal, { color: C.blue }]}>
                    {predictions[0]?.expected_mg_dl ?? '--'}{' '}
                    <Text style={styles.predBannerUnit}>mg/dL</Text>
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[styles.predBannerAlert, { color: predictions[0]?.status_label === 'normal' ? C.green : C.amber }]}>
                    {predictions[0]?.status_label === 'normal' ? '✅ In target' : '⚠️ Above target'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.predictionBanner, { backgroundColor: C.blueBg, borderColor: C.blueBorder }]}>
                <Text style={[styles.predBannerLabel, { color: C.textSm }]}>No prediction available for this period</Text>
              </View>
            )}

            {/* Smooth Prediction Trend Chart */}
            <View style={styles.predictionGraphBox}>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Line
                  x1={predictionSVG.paddingLeft}
                  y1={predictionSVG.limitY}
                  x2={CHART_WIDTH - 10}
                  y2={predictionSVG.limitY}
                  stroke={C.amber}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                  strokeOpacity={0.6}
                />
                <Path d={predictionSVG.path} fill="none" stroke={C.blue} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="6,4" />
                {predictionSVG.points.map((p, idx) => (
                  <Circle key={idx} cx={p.x} cy={p.y} r={idx === predictionSVG.points.length - 1 ? 5 : 3} fill={idx === predictionSVG.points.length - 1 ? C.blue : C.redBorder} stroke="#FFF" strokeWidth={1.5} />
                ))}
              </Svg>
            </View>

            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: C.blue, borderRadius: 0 }]} />
                <Text style={[styles.legendText, { color: C.textSm }]}>Predicted trend</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: C.amber, height: 2 }]} />
                <Text style={[styles.legendText, { color: C.textSm }]}>140 mg/dL target</Text>
              </View>
            </View>
          </View>

          {/* Card 5: Meal Impact Analysis */}
          <View style={[styles.card, { backgroundColor: C.white, borderColor: C.redBorder, padding: 16 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: C.green }]}>
                <Utensils size={15} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: C.text }]}>Meal Impact</Text>
                <Text style={[styles.sectionSubtitle, { color: C.textSm }]}>How food affects your glucose</Text>
              </View>
            </View>

            <View style={styles.mealImpactList}>
              {mealImpactData.map((m) => {
                const isHigh = m.severity === "high";
                const colorToken = isHigh ? C.amber : C.green;
                return (
                  <View key={m.meal} style={[styles.mealImpactRow, { borderColor: isHigh ? C.amberBorder : '#F0EDED' }]}>
                    <View style={styles.mealLeft}>
                      <Text style={styles.mealEmoji}>{m.emoji}</Text>
                      <View>
                        <Text style={[styles.mealName, { color: C.text }]}>{m.meal}</Text>
                        <Text style={[styles.mealDeltaText, { color: C.textSm }]}>
                          {m.before} → <Text style={{ fontWeight: 'bold', color: isHigh ? C.amber : C.text }}>{m.after}</Text> mg/dL
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={[styles.deltaVal, { color: colorToken }]}>{m.delta}</Text>
                      <View style={[styles.severityPill, { backgroundColor: isHigh ? C.amberBg : C.greenBg, borderColor: isHigh ? C.amberBorder : C.greenBorder }]}>
                        <Text style={[styles.severityPillText, { color: colorToken }]}>
                          {isHigh ? "High Impact" : "Low Impact"}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Card 6: AI Recommendations */}
          <View style={[styles.card, { backgroundColor: C.white, borderColor: C.redBorder, padding: 16 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: C.red }]}>
                <Lightbulb size={15} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: C.text }]}>What You Should Do</Text>
                <Text style={[styles.sectionSubtitle, { color: C.textSm }]}>Personalized recommendations</Text>
              </View>
            </View>

            <View style={styles.recList}>
              {p_recommendations.map((rec) => {
                const RecIcon = rec.icon;
                return (
                  <View key={rec.id} style={[styles.recRow, { backgroundColor: '#FAFAFA', borderColor: C.divider || '#F0EDED' }]}>
                    <View style={[styles.recIconBox, { backgroundColor: rec.iconBg }]}>
                      <RecIcon size={14} color={rec.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.recRowHeader}>
                        <Text style={[styles.recTitle, { color: C.text }]} numberOfLines={1}>{rec.title}</Text>
                        <View style={[styles.recPriorityBadge, { backgroundColor: rec.bg, borderColor: rec.border }]}>
                          <Text style={[styles.recPriorityText, { color: rec.color }]}>{rec.priority}</Text>
                        </View>
                      </View>
                      <Text style={[styles.recDesc, { color: C.textMd }]}>{rec.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Card 7: Insulin Estimate */}
          <View style={[styles.card, { backgroundColor: C.white, borderColor: C.redBorder, overflow: 'hidden' }]}>
            <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.insulinHeaderStrip}>
              <Syringe size={15} color="#FFF" />
              <Text style={styles.insulinHeaderTitle}>ESTIMATED INSULIN NEED</Text>
            </LinearGradient>

            <View style={styles.insulinBody}>
              <View style={styles.insulinContent}>
                <View style={styles.insulinRingContainer}>
                  <ProgressRing
                    value={insulinEstimate?.units ?? 4}
                    max={10}
                    size={60}
                    strokeWidth={5}
                    color="#6366F1"
                    bgColor="#DDD6FE"
                  />
                  <View style={styles.insulinUnitsBox}>
                    <Text style={styles.insulinUnitsVal}>{insulinEstimate?.units ?? 4}</Text>
                    <Text style={styles.insulinUnitsLbl}>units</Text>
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.insulinTitle, { color: C.text }]}>Next meal estimate</Text>
                  <Text style={[styles.insulinDesc, { color: C.textMd }]}>
                    {insulinEstimate?.basis ?? 'Based on your current glucose, predicted trend, and typical meal impact.'}
                    {insulinEstimate?.current_mg_dl ? ` Current: ${insulinEstimate.current_mg_dl} mg/dL.` : ''}
                  </Text>
                </View>
              </View>

              <View style={[styles.disclaimerBox, { backgroundColor: '#FAFAFA', borderColor: C.divider || '#F0EDED' }]}>
                <Shield size={14} color={C.textXs} style={{ marginTop: 1 }} />
                <Text style={[styles.disclaimerText, { color: C.textSm }]}>
                  <Text style={{ fontWeight: 'bold' }}>Disclaimer:</Text>{' '}
                  {insulinEstimate?.disclaimer ?? 'For informational purposes only. This is not medical advice. Always consult your healthcare provider before adjusting insulin dosage.'}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      ) : (
        /* Conversation Mode (Chat Assistant) */
        <View style={styles.chatContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper
                ]}
              >
                <View style={[
                  styles.avatarContainer,
                  { backgroundColor: msg.sender === 'user' ? C.bg : C.redBg }
                ]}>
                  {msg.sender === 'user' ? <User size={15} color={C.textSm} /> : <Sparkles size={15} color={C.red} />}
                </View>
                <View style={[
                  styles.messageBubble,
                  { backgroundColor: msg.sender === 'user' ? C.red : (msg.isError ? '#FEF2F2' : C.white) },
                  msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
                  msg.isError && { borderColor: '#FECACA', borderWidth: 1 }
                ]}>
                  {msg.isError && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <AlertCircle size={14} color="#EF4444" />
                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#EF4444' }}>ERROR</Text>
                    </View>
                  )}
                  <Text style={[
                    styles.messageText,
                    { color: msg.sender === 'user' ? '#FFF' : (msg.isError ? '#B91C1C' : C.text) }
                  ]}>
                    {msg.text}
                  </Text>
                  <Text style={[
                    styles.messageTime,
                    { color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : C.textXs }
                  ]}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))}
            {loading && (
              <View style={styles.aiWrapper}>
                <View style={[styles.avatarContainer, { backgroundColor: C.redBg }]}>
                  <Sparkles size={15} color={C.red} />
                </View>
                <View style={[styles.messageBubble, { backgroundColor: C.white }, styles.aiBubble]}>
                  <View style={styles.typingIndicator}>
                    <ActivityIndicator size="small" color={C.red} />
                    <Text style={[styles.messageText, { color: C.textSm, marginLeft: 8 }]}>Thinking...</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputContainer, { backgroundColor: C.white, borderTopColor: C.divider }]}>
            <TextInput
              style={[styles.input, { color: C.text, backgroundColor: isDark ? '#222' : '#F5F5F5' }]}
              placeholder="Ask about your trends, sugar levels..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              multiline
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!input.trim() || loading}
              style={[
                styles.sendBtn,
                { backgroundColor: input.trim() && !loading ? C.red : C.redBorder }
              ]}
            >
              <Send size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '900',
  },
  headerSubText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDateText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  alertButton: {
    position: 'relative',
  },
  alertIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  // Day selector chips
  dayScrollRow: {
    maxHeight: 76,
  },
  dayScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayChip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 48,
    gap: 2,
  },
  dayChipActive: {
    shadowColor: '#C41E26',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  dayChipInactive: {
    borderWidth: 1,
  },
  dayChipLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dayChipDay: {
    fontSize: 16,
    fontWeight: '900',
  },
  dayChipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
  // Weekly trend in summary card
  weeklySection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  weeklyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weeklyStat: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyStatLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  weeklyStatVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  weeklyStatUnit: {
    fontSize: 8,
    marginTop: 1,
  },
  weeklyDayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 2,
  },
  weeklyDayLabel: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  tabSelectorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabSelectorBg: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabBtn: {
    shadowColor: '#C41E26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 16,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeaderStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  statusPillText: {
    color: '#16A34A',
    fontSize: 9,
    fontWeight: 'bold',
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  metricBox: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 24,
    fontWeight: '900',
  },
  metricUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  metricTrendText: {
    fontSize: 9,
    fontWeight: '700',
  },
  ringContainer: {
    alignItems: 'center',
    flex: 1.2,
  },
  ringWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 5,
    borderRadius: 2.5,
    width: '80%',
    overflow: 'hidden',
    marginTop: 6,
  },
  progressLine: {
    height: '100%',
    borderRadius: 2.5,
  },
  breakdownContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  breakdownBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  breakdownSegment: {
    height: '100%',
  },
  breakdownLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  breakdownLabelText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  alertCountBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  alertCountText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: 'bold',
  },
  alertList: {
    gap: 12,
  },
  alertCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  alertIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  severityBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  severityText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  alertBody: {
    padding: 12,
    backgroundColor: '#FFF',
  },
  alertDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  alertTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  alertTimeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  patternList: {
    gap: 10,
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  patternIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingRight: 32,
  },
  patternTitleText: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  patternDescText: {
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 2,
    paddingRight: 24,
  },
  patternMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  confBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  confText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  trendRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendRowText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  predictionBanner: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  predBannerLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  predBannerVal: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
    lineHeight: 26,
  },
  predBannerUnit: {
    fontSize: 11,
    fontWeight: 'normal',
  },
  predBannerAlert: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  predictionGraphBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  svgLabel: {
    fontSize: 8,
    fontWeight: '600',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 4,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '600',
  },
  mealImpactList: {
    gap: 10,
  },
  mealImpactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  mealLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mealEmoji: {
    fontSize: 20,
  },
  mealName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  mealDeltaText: {
    fontSize: 10,
    marginTop: 1,
  },
  deltaVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  severityPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  severityPillText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  recList: {
    gap: 10,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  recIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingRight: 28,
  },
  recTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  recPriorityBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  recPriorityText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  recDesc: {
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 2,
    paddingRight: 24,
  },
  insulinHeaderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  insulinHeaderTitle: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  insulinBody: {
    padding: 16,
  },
  insulinContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  insulinRingContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insulinUnitsBox: {
    position: 'absolute',
    alignItems: 'center',
  },
  insulinUnitsVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#6366F1',
    lineHeight: 16,
  },
  insulinUnitsLbl: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 1,
  },
  insulinTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  insulinDesc: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  disclaimerBox: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 12,
  },

  // --- CHAT STYLE SHEET ---
  chatContainer: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    gap: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    gap: 12,
    maxWidth: '85%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  userBubble: {
    borderTopRightRadius: 2,
  },
  aiBubble: {
    borderTopLeftRadius: 2,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 100,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AIInsightsScreen;
