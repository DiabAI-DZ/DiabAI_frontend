import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import DateStrip from './DateStrip';
import { GlucoseSummaryCard } from './GlucoseSummaryCard';
import { PredictionCard } from './PredictionCard';
import { InsulinCard } from './InsulinCard';
import { PatternsCard } from './PatternsCard';
import { RecommendationsCard } from './RecommendationsCard';
import type { InsightsDataResult } from '../hooks/useInsightsData';
import type { InsightsDerived } from '../hooks/useInsightsDerived';
import type { UsePredictionResult } from '../hooks/usePrediction';

interface InsightsDashboardProps {
  data: InsightsDataResult;
  derived: InsightsDerived;
  prediction: UsePredictionResult;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ data, derived, prediction }) => {
  const { C, colors } = useTheme();

  return (
    <>
      <DateStrip
        initialFrom={data.range?.from ?? new Date()}
        initialTo={data.range?.to ?? null}
        onRangeSelected={data.onRangeSelected}
        datesWithData={data.datesWithData}
      />
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {data.error && !data.loading && (
          <View style={[styles.errorCard, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <View style={[styles.errorIconBox, { backgroundColor: colors.criticalBg }]}>
              <AlertCircle size={20} color={colors.criticalText} />
            </View>
            <Text style={[styles.errorTitle, { color: C.text }]}>Couldn't load AI insights</Text>
            <Text style={[styles.errorDesc, { color: C.textSm }]}>
              The AI engine took too long to respond or the connection dropped. Your summary below is still up to date.
            </Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: C.red }]} onPress={data.retry}>
              <Text style={[styles.retryBtnText, { color: colors.textOnPrimary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <GlucoseSummaryCard
          dayStats={derived.dayStats}
          avgWeekDelta={derived.avgWeekDelta}
          weeklySVG={derived.weeklySVG}
          interpolated={derived.interpolated}
          weeklyStats={derived.weeklyStats}
        />
        <PredictionCard
          predView={derived.predView}
          predictionSVG={derived.predictionSVG}
          selectedHasReading={prediction.selectedHasReading}
          isTodaySelected={prediction.isTodaySelected}
        />
        <InsulinCard insulinEstimate={data.insulinEstimate} loading={data.loading} />
        <PatternsCard patterns={derived.patternViews} loading={data.loading} />
        <RecommendationsCard recommendations={derived.recommendationViews} loading={data.loading} />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.xs, gap: spacing.lg },
  errorCard: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.xl, marginBottom: spacing.lg, alignItems: 'center' },
  errorIconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  errorTitle: { fontSize: 15, fontWeight: '800', marginBottom: spacing.xs },
  errorDesc: { fontSize: 12.5, lineHeight: 18, textAlign: 'center', marginBottom: 14 },
  retryBtn: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  retryBtnText: { fontWeight: '800', fontSize: 13.5 },
  bottomSpacer: { height: spacing.xxl },
});
