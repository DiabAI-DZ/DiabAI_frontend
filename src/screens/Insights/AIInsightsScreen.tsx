import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { InsightsHeader } from './components/InsightsHeader';
import { InsightsDashboard } from './components/InsightsDashboard';
import { InsightsChat } from './components/InsightsChat';
import { useInsightsData } from './hooks/useInsightsData';
import { usePrediction } from './hooks/usePrediction';
import { useInsulinEstimate } from './hooks/useInsulinEstimate';
import { useInsightsDerived } from './hooks/useInsightsDerived';
import { useInsightsChat } from './hooks/useInsightsChat';

interface AIInsightsScreenProps {
  onNavigateAlerts?: () => void;
  /** When mounted in a hidden tab container, disable network loading. */
  isActive?: boolean;
}

/**
 * Coordinator for the AI Insights tab. Owns the dashboard ↔ chat segment and wires the data,
 * prediction, derived view-model and chat hooks into the header + the two view shells.
 * (The dashboard/chat segment selector is currently hidden by design, so this stays on
 * 'dashboard'; the chat wiring is retained so it can be re-enabled without rework.)
 */
const AIInsightsScreen: React.FC<AIInsightsScreenProps> = ({ onNavigateAlerts, isActive = true }) => {
  const { C } = useTheme();
  const [activeSegment] = useState<'dashboard' | 'chat'>('dashboard');

  const data = useInsightsData(isActive);
  const prediction = usePrediction(isActive, data.range, data.defaultRange);
  const insulin = useInsulinEstimate(isActive, data.range, data.defaultRange);
  const derived = useInsightsDerived(data.patterns, data.recommendations, prediction.predictions);
  const chat = useInsightsChat();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: C.bg }]}
    >
      <InsightsHeader showClear={activeSegment === 'chat'} onClear={chat.clear} onNavigateAlerts={onNavigateAlerts} />
      {activeSegment === 'dashboard' ? (
        <InsightsDashboard data={data} derived={derived} prediction={prediction} insulin={insulin} />
      ) : (
        <InsightsChat chat={chat} />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default AIInsightsScreen;
