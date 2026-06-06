import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { ErrorState } from '../../components/ui';
import type { LogEntry } from '../../types';
import { useHome } from './hooks/useHome';
import DashboardHeader from './components/DashboardHeader';
import LatestReadingCard from './components/LatestReadingCard';
import GlucoseTrendChart from './components/GlucoseTrendChart';
import RecommendedMeals from './components/RecommendedMeals';

interface DashboardProps {
  onNavigateAlerts: () => void;
  onNavigateDetail: (entry: LogEntry) => void;
  onSeeAllMeasurements: () => void;
  onSeeAllRecommendations?: () => void;
  isActive?: boolean;
}

/** Home tab: coordinates useHome() + the Home cards. No fetching or derivation lives here. */
const Dashboard: React.FC<DashboardProps> = ({
  onNavigateAlerts,
  onSeeAllRecommendations,
  isActive,
}) => {
  const { C } = useTheme();
  const {
    reading,
    trendPoints,
    recommendations,
    greeting,
    unreadAlerts,
    period,
    setPeriod,
    loading,
    error,
    refetch,
  } = useHome();

  // Re-fetch when this tab becomes active (mirrors the previous focus refresh).
  useEffect(() => {
    if (isActive) refetch();
  }, [isActive, refetch]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <DashboardHeader
        date={greeting.date}
        name={greeting.name}
        unreadAlerts={unreadAlerts}
        onNavigateAlerts={onNavigateAlerts}
      />

      {error ? (
        <ErrorState subtitle={error} onRetry={refetch} />
      ) : (
        <>
          <LatestReadingCard reading={reading} loading={loading} />
          <GlucoseTrendChart
            points={trendPoints}
            period={period}
            onPeriodChange={setPeriod}
            targetMin={reading.targetMin}
            targetMax={reading.targetMax}
            unit={reading.unit}
            loading={loading}
          />
          <RecommendedMeals
            recommendations={recommendations}
            loading={loading}
            onSeeAll={onSeeAllRecommendations}
          />
        </>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  bottomSpacer: { height: spacing.xxl },
});

export default Dashboard;
