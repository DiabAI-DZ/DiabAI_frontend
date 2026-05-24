import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Utensils, 
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MeasurementEntry } from '../services/types';

const { width } = Dimensions.get('window');

interface DashboardProps {
  onNavigateAlerts: () => void;
  onNavigateDetail: (entry: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateAlerts, onNavigateDetail }) => {
  const { C, isDark } = useTheme();
  const { logs, alerts, loading } = useData();
  const { profile } = useUser();

  // --- DYNAMIC CALCULATIONS ---
  
  const stats = useMemo(() => {
    const measurements = logs.filter(l => l.type === 'measurement') as MeasurementEntry[];
    const latest = measurements[0] || null;
    
    // Average
    const sum = measurements.reduce((acc, curr) => acc + curr.value, 0);
    const avg = measurements.length > 0 ? Math.round(sum / measurements.length) : 0;
    
    // In Range (70-140 mg/dL by default)
    const inRangeCount = measurements.filter(m => m.value >= 70 && m.value <= 140).length;
    const inRangePercent = measurements.length > 0 ? Math.round((inRangeCount / measurements.length) * 100) : 0;
    
    // Total Carbs Today
    const todayStr = new Date().toISOString().split('T')[0];
    const mealsToday = logs.filter(l => l.type === 'meal' && l.date.split('T')[0] === todayStr);
    const totalCarbs = mealsToday.reduce((acc, curr: any) => acc + (curr.carbs || 0), 0);

    return {
      latest,
      avg,
      inRangePercent,
      totalCarbs,
      status: latest ? (latest.value > 140 ? 'High' : (latest.value < 70 ? 'Low' : 'Normal')) : '--',
      unreadAlerts: alerts.filter(a => !a.read).length
    };
  }, [logs, alerts]);

  const renderStatCard = (label: string, value: string, unit: string, Icon: any, color: string, trend?: 'up' | 'down') => (
    <View style={[styles.statCard, { backgroundColor: C.white, borderColor: C.redBorder }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statLabel, { color: C.textSm }]}>{label}</Text>
        <View style={styles.statValueRow}>
          <Text style={[styles.statValue, { color: C.text }]}>{value}</Text>
          <Text style={[styles.statUnit, { color: C.textXs }]}>{unit}</Text>
        </View>
      </View>
      {trend && (
        <View style={[styles.trendBadge, { backgroundColor: trend === 'up' ? C.amber + '15' : C.green + '15' }]}>
           {trend === 'up' ? <TrendingUp size={12} color={C.amber} /> : <TrendingDown size={12} color={C.green} />}
        </View>
      )}
    </View>
  );

  if (loading && logs.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.red} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.bg }]} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: C.textSm }]}>Good Day,</Text>
          <Text style={[styles.userName, { color: C.text }]}>{profile?.name || 'User'} 👋</Text>
        </View>
        <TouchableOpacity style={styles.alertButton} onPress={onNavigateAlerts}>
          <View style={[styles.alertIconBox, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <Bell size={22} color={C.red} />
          </View>
          {stats.unreadAlerts > 0 && (
            <View style={[styles.badge, { backgroundColor: C.red }]}>
              <Text style={styles.badgeText}>{stats.unreadAlerts}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Glucose Card */}
      <LinearGradient
        colors={[C.red, C.redDark]}
        style={styles.mainCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.mainCardHeader}>
          <View style={styles.mainCardTitleRow}>
            <Activity size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.mainCardTitle}>LATEST GLUCOSE</Text>
          </View>
          <Text style={styles.mainCardTime}>
            {stats.latest ? `Measured at ${stats.latest.time}` : 'No data yet'}
          </Text>
        </View>
        
        <View style={styles.mainValueRow}>
          <Text style={styles.mainValue}>{stats.latest?.value || '--'}</Text>
          <Text style={styles.mainUnit}>{stats.latest?.unit || 'mg/dL'}</Text>
          <View style={styles.mainTrend}>
            {stats.latest?.trend === 'up' ? <TrendingUp size={24} color="#FFF" /> : 
             stats.latest?.trend === 'down' ? <TrendingDown size={24} color="#FFF" /> :
             <Minus size={24} color="#FFF" />}
            <Text style={styles.mainTrendText}>{stats.latest?.trend === 'stable' ? 'Stable' : (stats.latest?.trend?.toUpperCase() || '--')}</Text>
          </View>
        </View>

        <View style={styles.mainCardFooter}>
          <View style={styles.footerItem}>
             <Text style={styles.footerLabel}>Average</Text>
             <Text style={styles.footerValue}>{stats.avg}</Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerItem}>
             <Text style={styles.footerLabel}>In Range</Text>
             <Text style={styles.footerValue}>{stats.inRangePercent}%</Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerItem}>
             <Text style={styles.footerLabel}>Status</Text>
             <Text style={styles.footerValue}>{stats.status}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        {renderStatCard("Daily Carbs", stats.totalCarbs.toString(), "g", Utensils, C.amber)}
        {renderStatCard("Alerts", stats.unreadAlerts.toString(), "Unread", Bell, C.blue)}
      </View>

      {/* AI Insights Snippet */}
      <TouchableOpacity 
        style={[styles.aiSnippet, { backgroundColor: C.white, borderColor: C.redBorder }]}
      >
        <View style={[styles.aiIcon, { backgroundColor: C.redBg }]}>
          <Sparkles size={20} color={C.red} />
        </View>
        <View style={styles.aiContent}>
          <Text style={[styles.aiTitle, { color: C.text }]}>DIABAI INSIGHT</Text>
          <Text style={[styles.aiText, { color: C.textSm }]} numberOfLines={2}>
            {stats.inRangePercent > 80 
              ? "Excellent consistency today! Staying above 80% in range significantly reduces long-term risks."
              : "I noticed a few spikes today. Try taking a 10-minute walk after your next carb-heavy meal."}
          </Text>
        </View>
        <ChevronRight size={20} color={C.textXs} />
      </TouchableOpacity>

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Recent Activity</Text>
      </View>

      <View style={styles.activityList}>
        {logs.slice(0, 4).map((log) => (
          <TouchableOpacity 
            key={log.id} 
            style={[styles.activityItem, { backgroundColor: C.white, borderColor: C.redBorder }]}
            onPress={() => onNavigateDetail(log)}
          >
            <View style={[styles.activityIcon, { backgroundColor: log.type === 'measurement' ? C.redBg : C.amber + '15' }]}>
               {log.type === 'measurement' ? <Activity size={20} color={C.red} /> : <Utensils size={20} color={C.amber} />}
            </View>
            <View style={styles.activityContent}>
               <Text style={[styles.activityTitle, { color: C.text }]}>{log.type === 'measurement' ? 'Glucose Reading' : log.name}</Text>
               <Text style={[styles.activityTime, { color: C.textXs }]}>{log.time}</Text>
            </View>
            <View style={styles.activityValue}>
               <Text style={[styles.activityText, { color: C.text, fontWeight: '800' }]}>
                 {log.type === 'measurement' ? `${log.value} ${log.unit}` : `${log.carbs}g Carbs`}
               </Text>
               <ChevronRight size={16} color={C.textXs} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: { fontSize: 14, fontWeight: '600' },
  userName: { fontSize: 24, fontWeight: '900' },
  alertButton: { position: 'relative' },
  alertIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  mainCard: {
    marginHorizontal: 24,
    borderRadius: 32,
    padding: 24,
    elevation: 10,
    shadowColor: '#C41E26',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  mainCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mainCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mainCardTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  mainCardTime: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
  mainValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 24 },
  mainValue: { fontSize: 64, fontWeight: '900', color: '#FFF' },
  mainUnit: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginLeft: 8 },
  mainTrend: { marginLeft: 'auto', alignItems: 'center' },
  mainTrendText: { color: '#FFF', fontSize: 10, fontWeight: '800', marginTop: 4 },
  mainCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 16,
  },
  footerItem: { alignItems: 'center' },
  footerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  footerValue: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  footerDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 24, marginTop: 20, gap: 12 },
  statCard: { flex: 1, borderRadius: 24, padding: 16, borderWidth: 1, position: 'relative' },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statContent: {},
  statLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  statValue: { fontSize: 20, fontWeight: '900' },
  statUnit: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  trendBadge: { position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  aiSnippet: {
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
  },
  aiIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  aiContent: { flex: 1 },
  aiTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  aiText: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  activityList: { paddingHorizontal: 24, gap: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1 },
  activityIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  activityTime: { fontSize: 11, fontWeight: '600' },
  activityValue: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activityText: { fontSize: 13 },
});

export default Dashboard;
