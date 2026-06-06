import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowDownRight, ArrowUpRight, Eye, Minus } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { cardStyles } from './insightsStyles';
import { PatternSparkline } from './charts';
import { SkeletonRow } from './Skeletons';
import { patternVisual } from '../insightsVisuals';
import type { PatternView } from '../../../types/insights';

interface PatternsCardProps {
  patterns: PatternView[];
  loading: boolean;
}

const TREND_LABEL: Record<PatternView['trend'], string> = { rising: 'Rising', declining: 'Declining', stable: 'Stable' };

export const PatternsCard: React.FC<PatternsCardProps> = ({ patterns, loading }) => {
  const { C, colors } = useTheme();
  const trendColor = (t: PatternView['trend']) =>
    t === 'rising' ? colors.warningText : t === 'declining' ? colors.teal : colors.textSecondary;

  return (
    <View style={[cardStyles.card, cardStyles.cardPad, { backgroundColor: colors.backgroundCard, borderColor: C.redBorder, shadowColor: colors.shadow }]}>
      <View style={cardStyles.sectionTitleRow}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
          <Eye size={20} color={colors.textOnPrimary} strokeWidth={2.2} />
        </View>
        <View style={styles.flex1}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Patterns Detected</Text>
          <Text style={[cardStyles.sectionSubtitle, { color: C.textSm }]}>AI-identified from your history</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{patterns.length > 0 ? `${patterns.length} patterns` : 'None'}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {loading && patterns.length === 0 ? (
          <>
            <SkeletonRow colors={colors} />
            <SkeletonRow colors={colors} />
          </>
        ) : patterns.map((p) => {
          const vis = patternVisual(p.category, p.title);
          const Icon = vis.Icon;
          const tc = trendColor(p.trend);
          return (
            <View key={p.id} style={[styles.row, { backgroundColor: colors.backgroundCard, borderColor: colors.border, shadowColor: colors.shadow }]}>
              <View style={[styles.iconCircle, { backgroundColor: vis.bg }]}>
                <Icon size={18} color={vis.color} />
              </View>
              <View style={styles.center}>
                <Text style={[styles.titleText, { color: colors.textPrimary }]} numberOfLines={1}>{p.title}</Text>
                <Text style={[styles.descText, { color: colors.textSecondary }]} numberOfLines={2}>{p.desc}</Text>
                <View style={styles.metaRow}>
                  <View style={[styles.confBadge, { backgroundColor: colors.warningBg }]}>
                    <Text style={[styles.confText, { color: colors.warningText }]}>{p.confidencePct}% confidence</Text>
                  </View>
                  <View style={styles.trendRow}>
                    {p.trend === 'rising' && <ArrowUpRight size={13} color={tc} />}
                    {p.trend === 'declining' && <ArrowDownRight size={13} color={tc} />}
                    {p.trend === 'stable' && <Minus size={13} color={tc} />}
                    <Text style={[styles.trendText, { color: tc }]}>{TREND_LABEL[p.trend]}</Text>
                  </View>
                </View>
              </View>
              <PatternSparkline trend={p.trend} />
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
  badge: { borderRadius: borderRadius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  list: { gap: spacing.sm, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, paddingHorizontal: spacing.md },
  titleText: { fontSize: 15, fontWeight: '700' },
  descText: { fontSize: 13, lineHeight: 17, marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  confBadge: { borderRadius: borderRadius.pill, paddingHorizontal: 9, paddingVertical: 3 },
  confText: { fontSize: 11, fontWeight: '600' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendText: { fontSize: 11, fontWeight: '700' },
});
