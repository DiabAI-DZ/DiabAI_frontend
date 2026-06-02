import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { mapStatus, mapTrend, formatTime, convertGlucose } from '../services/apiService';
import { Bell } from 'lucide-react-native';
import { MeasurementEntry } from '../services/types';
import LatestReadingCard, { LatestReading } from '../components/LatestReadingCard';
import GlucoseTrendChart from '../components/GlucoseTrendChart';
import RecommendedMeals from '../components/RecommendedMeals';

interface DashboardProps {
  onNavigateAlerts: () => void;
  onNavigateDetail: (entry: any) => void;
  onSeeAllMeasurements: () => void;
  onSeeAllRecommendations?: () => void;
  isActive?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
  onNavigateAlerts,
  onNavigateDetail,
  onSeeAllRecommendations,
  isActive,
}) => {
  const { C } = useTheme();
  const { logs, alerts, homeData, loading, refreshData } = useData();
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    refreshData(activeTab);
  }, [activeTab, refreshData]);

  useEffect(() => {
    if (isActive) refreshData(activeTab);
  }, [isActive, activeTab, refreshData]);

  const todayDateString = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  }, []);

  const { reading, unreadAlerts } = useMemo(() => {
    const measurements = logs.filter(l => l.type === 'measurement') as MeasurementEntry[];
    const latestFromLogs = measurements[0] || null;
    const userUnit = profile?.glucoseUnit || 'mg/dL';
    const serverUnit = 'mg/dL';

    const minGoal = convertGlucose(homeData?.latest_reading?.target?.min || profile?.goals?.min || 70, userUnit, serverUnit);
    const maxGoal = convertGlucose(homeData?.latest_reading?.target?.max || profile?.goals?.max || 140, userUnit, serverUnit);

    const r: LatestReading = homeData?.latest_reading
      ? {
          value: convertGlucose(homeData.latest_reading.value_mg_dl, userUnit, serverUnit),
          unit: userUnit,
          status: mapStatus(homeData.latest_reading.health_status),
          time: formatTime(homeData.latest_reading.measured_at),
          delta: convertGlucose(homeData.latest_reading.delta_since_last || 0, userUnit, serverUnit),
          trend: mapTrend(homeData.latest_reading.trend || undefined),
          targetMin: minGoal,
          targetMax: maxGoal,
        }
      : latestFromLogs
        ? {
            value: convertGlucose(latestFromLogs.value, userUnit, latestFromLogs.unit || 'mg/dL'),
            unit: userUnit,
            status: latestFromLogs.status,
            time: latestFromLogs.time,
            delta: 0,
            trend: 'stable',
            targetMin: minGoal,
            targetMax: maxGoal,
          }
        : { value: null, unit: userUnit, status: 'Normal', time: '--:--', delta: 0, trend: 'stable', targetMin: minGoal, targetMax: maxGoal };

    return { reading: r, unreadAlerts: alerts.filter(a => !a.read).length };
  }, [logs, alerts, profile, homeData]);

  const recommendations = homeData?.recommendations ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.date, { color: C.textSm }]}>{homeData?.greeting?.date || todayDateString}</Text>
          <Text style={[styles.greeting, { color: C.text }]}>
            Hello, {homeData?.greeting?.name || profile?.name?.split(' ')[0] || 'there'}
          </Text>
          <Text style={[styles.subtitle, { color: C.textMd }]}>Track your glucose with confidence</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} onPress={onNavigateAlerts}>
          <View style={[styles.bellBox, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <Bell size={20} color={C.red} strokeWidth={2} />
          </View>
          {unreadAlerts > 0 && <View style={[styles.bellBadge, { backgroundColor: C.red, borderColor: C.bg }]} />}
        </TouchableOpacity>
      </View>

      {/* Latest Reading */}
      <LatestReadingCard
        reading={reading}
        loading={loading}
        onPress={reading.value ? () => onNavigateDetail({ ...reading, type: 'measurement' }) : undefined}
      />

      {/* Glucose Trend */}
      <GlucoseTrendChart
        homeData={homeData}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        targetMin={reading.targetMin}
        targetMax={reading.targetMax}
        unit={reading.unit}
      />

      {/* Recommended for You */}
      <RecommendedMeals
        recommendations={recommendations}
        loading={loading}
        onSeeAll={onSeeAllRecommendations}
      />

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  date: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  greeting: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  bellBtn: { position: 'relative' },
  bellBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
});

export default Dashboard;
