import { useCallback, useMemo, useState } from 'react';
import { useAsync } from '../../../hooks/useAsync';
import { homeService } from '../../../services/homeService';
import { useData } from '../../../context/DataContext';
import { useUser } from '../../../context/UserContext';
import { mapStatus, mapTrend, formatTime, convertGlucose } from '../../../services/apiService';
import type { MeasurementEntry } from '../../../types';
import type { HomeRecommendation, TrendPoint } from '../../../types/home';
import type { LatestReading } from '../components/LatestReadingCard';

export type TrendPeriod = '7d' | '30d';

interface HomeGreetingView {
  date: string;
  name: string;
}

interface UseHomeResult {
  reading: LatestReading;
  trendPoints: TrendPoint[];
  recommendations: HomeRecommendation[];
  greeting: HomeGreetingView;
  unreadAlerts: number;
  period: TrendPeriod;
  setPeriod: (p: TrendPeriod) => void;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const todayLong = (): string => {
  const now = new Date();
  return `${DAYS_LONG[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
};

// Placeholder day labels for an empty trend (so the chart axis still renders).
const pastDayLabels = (count: number): string[] => {
  const labels: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(count > 7 ? `${d.getMonth() + 1}/${d.getDate()}` : WEEKDAYS[d.getDay()]);
  }
  return labels;
};

/** Owns the Home tab's data: period toggle, /api/home fetch, and all display derivation. */
export function useHome(): UseHomeResult {
  const { logs, alerts } = useData();
  const { profile } = useUser();
  const [period, setPeriod] = useState<TrendPeriod>('7d');

  const fetchHome = useCallback(() => homeService.getHome(period), [period]);
  const { data: homeData, loading, error, refetch } = useAsync(fetchHome);

  const reading = useMemo<LatestReading>(() => {
    const measurements = logs.filter((l) => l.type === 'measurement') as MeasurementEntry[];
    const latestFromLogs = measurements[0] || null;
    const userUnit = profile?.glucoseUnit || 'mg/dL';
    const serverUnit = 'mg/dL';
    const lr = homeData?.latest_reading;

    const minGoal = convertGlucose(lr?.target?.min || profile?.goals?.min || 70, userUnit, serverUnit);
    const maxGoal = convertGlucose(lr?.target?.max || profile?.goals?.max || 140, userUnit, serverUnit);

    if (lr) {
      return {
        value: convertGlucose(lr.value_mg_dl, userUnit, serverUnit),
        unit: userUnit,
        status: mapStatus(lr.health_status ?? undefined),
        time: formatTime(lr.measured_at ?? undefined),
        delta: convertGlucose(lr.delta_since_last || 0, userUnit, serverUnit),
        trend: mapTrend(lr.trend ?? undefined),
        targetMin: minGoal,
        targetMax: maxGoal,
      };
    }
    if (latestFromLogs) {
      return {
        value: convertGlucose(latestFromLogs.value, userUnit, latestFromLogs.unit || 'mg/dL'),
        unit: userUnit,
        status: latestFromLogs.status,
        time: latestFromLogs.time,
        delta: 0,
        trend: 'stable',
        targetMin: minGoal,
        targetMax: maxGoal,
      };
    }
    return { value: null, unit: userUnit, status: 'Normal', time: '--:--', delta: 0, trend: 'stable', targetMin: minGoal, targetMax: maxGoal };
  }, [logs, profile, homeData]);

  const trendPoints = useMemo<TrendPoint[]>(() => {
    const raw = homeData?.glucose_trend?.points;
    if (raw && raw.length > 0) {
      return raw.map((p) => {
        let label = p.label ?? '';
        if (period === '30d' && p.date) {
          const parts = p.date.split('-');
          if (parts.length === 3) label = `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
        }
        return { label, value: p.avg_value ?? null, real: p.avg_value !== null && p.avg_value !== undefined };
      });
    }
    return pastDayLabels(period === '7d' ? 7 : 30).map((label) => ({ label, value: null, real: false }));
  }, [homeData, period]);

  const greeting = useMemo<HomeGreetingView>(
    () => ({
      date: homeData?.greeting?.date || todayLong(),
      name: homeData?.greeting?.name || profile?.name?.split(' ')[0] || 'there',
    }),
    [homeData, profile],
  );

  const unreadAlerts = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);

  return {
    reading,
    trendPoints,
    recommendations: homeData?.recommendations ?? [],
    greeting,
    unreadAlerts,
    period,
    setPeriod,
    loading,
    error,
    refetch,
  };
}
