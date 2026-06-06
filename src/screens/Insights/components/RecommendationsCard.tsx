import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { cardStyles } from './insightsStyles';
import { SkeletonRow } from './Skeletons';
import { recPriorityStyle, recVisual } from '../insightsVisuals';
import type { RecommendationView } from '../../../types/insights';

interface RecommendationsCardProps {
  recommendations: RecommendationView[];
  loading: boolean;
}

export const RecommendationsCard: React.FC<RecommendationsCardProps> = ({ recommendations, loading }) => {
  const { C, colors } = useTheme();

  return (
    <View style={[cardStyles.card, cardStyles.cardPad, { backgroundColor: colors.backgroundCard, borderColor: C.redBorder, shadowColor: colors.shadow }]}>
      <View style={cardStyles.sectionTitleRow}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
          <Lightbulb size={20} color={colors.textOnPrimary} strokeWidth={2.2} />
        </View>
        <View style={styles.flex1}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>What You Should Do</Text>
          <Text style={[cardStyles.sectionSubtitle, { color: C.textSm }]}>Personalized recommendations</Text>
        </View>
      </View>

      <View style={styles.list}>
        {loading && recommendations.length === 0 ? (
          <>
            <SkeletonRow colors={colors} />
            <SkeletonRow colors={colors} />
          </>
        ) : recommendations.map((rec) => {
          const vis = recVisual(rec.category, rec.title);
          const Icon = vis.Icon;
          const badge = recPriorityStyle(rec.priority);
          return (
            <View key={rec.id} style={[styles.row, { backgroundColor: colors.backgroundCard, borderColor: colors.border, shadowColor: colors.shadow }]}>
              <View style={[styles.iconBox, { backgroundColor: vis.bg }]}>
                <Icon size={18} color={vis.color} />
              </View>
              <View style={styles.center}>
                <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{rec.title}</Text>
                <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={3}>{rec.desc}</Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                <Text style={[styles.priorityText, { color: badge.text }]}>{badge.label}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  list: { gap: spacing.sm, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.lg, borderRadius: 14, borderWidth: 1, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, paddingHorizontal: spacing.md },
  title: { fontSize: 15, fontWeight: '700' },
  desc: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  priorityBadge: { borderWidth: 1, borderRadius: borderRadius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, alignSelf: 'flex-start' },
  priorityText: { fontSize: 11, fontWeight: '700' },
});
