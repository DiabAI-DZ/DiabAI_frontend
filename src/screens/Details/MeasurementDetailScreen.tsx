import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  ChevronLeft, Maximize2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, Pencil,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/borderRadius';
import GlucoseRangeBar from './components/GlucoseRangeBar';
import InsightCard from './components/InsightCard';
import MetadataRow from './components/MetadataRow';
import HeroImageArea from './components/HeroImageArea';
import ActionButtonsRow from './components/ActionButtonsRow';
import NotesEditorModal from './components/NotesEditorModal';
import { useMeasurementDetailView } from './hooks/useMeasurementDetailView';
import type { MeasurementEntryLike } from './measurementView';

interface MeasurementDetailScreenProps {
  entry: MeasurementEntryLike;
  onBack: () => void;
  onEdit?: () => void;
}

const MeasurementDetailScreen: React.FC<MeasurementDetailScreenProps> = ({ entry, onBack, onEdit }) => {
  const { C, colors } = useTheme();
  const v = useMeasurementDetailView(entry, onBack, onEdit);
  const { view } = v;

  const trendCfg =
    view.trend === 'rising' ? { label: 'Rising', color: C.red, border: C.redBorder, Icon: TrendingUp }
    : view.trend === 'falling' ? { label: 'Falling', color: C.blue, border: C.blueBorder, Icon: TrendingDown }
    : { label: 'Stable', color: C.textSm, border: C.divider, Icon: null };
  const statusColor = view.status === 'high' ? C.red : view.status === 'low' ? C.amber : C.green;

  if (v.error && !v.hasData) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: C.bg }]}>
        <TouchableOpacity onPress={onBack} style={[styles.errBack, { backgroundColor: colors.primary }]}>
          <ChevronLeft size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={[styles.errorTitle, { color: C.text }]}>Couldn't load measurement</Text>
        <Text style={[styles.errorBody, { color: C.textSm }]}>{v.error.message}</Text>
        <TouchableOpacity onPress={v.refetch} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.retryText, { color: colors.textOnPrimary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <HeroImageArea
          imageUri={view.image}
          onBack={onBack}
          fallback={<Activity size={96} color={C.red} strokeWidth={1} style={styles.heroFallback} />}
        />

        {/* Value header */}
        <View style={[styles.valueRow, { borderBottomColor: colors.divider }]}>
          <View style={styles.valueLeft}>
            <Text style={[styles.valueNumber, { color: C.red }]}>{view.valueMgDl}</Text>
            <Text style={[styles.valueUnit, { color: C.textSm }]}>mg/dL</Text>
          </View>
          <View style={[styles.trendPill, { borderColor: trendCfg.border }]}>
            {trendCfg.Icon ? <trendCfg.Icon size={13} color={trendCfg.color} /> : null}
            <Text style={[styles.trendText, { color: trendCfg.color }]}>{trendCfg.label}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={[styles.metaCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <MetadataRow label="Title" value={view.title} />
          <MetadataRow label="Measurement" value={`${view.valueGL.toFixed(1)} g/L`} />
          <MetadataRow label="Day" value={v.dayLabel} />
          <MetadataRow label="Hour" value={v.hourLabel} />
          <MetadataRow label="Measurement Type" value={view.typeLabel} />
          <MetadataRow label="Health Insights" value={v.statusLabel} valueColor={statusColor} valueBold last />
        </View>

        {/* Glucose range position */}
        <View style={styles.section}>
          <GlucoseRangeBar value={view.valueMgDl} min={v.minGoal} max={v.maxGoal} />
        </View>

        {/* Notes & context */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Notes &amp; Context</Text>
            <TouchableOpacity style={[styles.editPill, { backgroundColor: C.redBg, borderColor: C.redBorder }]} onPress={v.openNotesEditor} activeOpacity={0.85}>
              <Pencil size={12} color={C.red} />
              <Text style={[styles.editPillText, { color: C.red }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          {view.notes ? (
            <Text style={[styles.notesText, { color: C.textSm }]}>{view.notes}</Text>
          ) : (
            <Text style={[styles.notesEmpty, { color: C.textXs }]}>No notes added yet.</Text>
          )}
          {view.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {view.tags.map((tag) => (
                <View key={tag} style={[styles.tagPill, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
                  <Text style={[styles.tagText, { color: C.redMuted }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Comparison */}
        {v.delta !== null && v.dailyAvg != null && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Comparison</Text>
              <View style={[styles.mutedBadge, { backgroundColor: colors.backgroundMuted, borderColor: colors.border }]}>
                <Text style={[styles.mutedBadgeText, { color: colors.textSecondary }]}>vs previous</Text>
              </View>
            </View>
            <View style={[styles.compareCard, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.compareLabel, { color: C.textSm }]}>Daily Average</Text>
                <Text style={[styles.compareValue, { color: C.text }]}>
                  {Math.round(v.dailyAvg)} <Text style={[styles.compareValueUnit, { color: C.textSm }]}>mg/dL</Text>
                </Text>
              </View>
              <View style={[styles.deltaPill, { backgroundColor: v.deltaPositive ? C.red : C.green }]}>
                {v.deltaPositive ? <ArrowUpRight size={14} color={colors.textOnPrimary} /> : <ArrowDownRight size={14} color={colors.textOnPrimary} />}
                <Text style={[styles.deltaText, { color: colors.textOnPrimary }]}>
                  {v.deltaPositive ? '+' : '-'}{Math.abs(v.delta)} mg/dL
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Health insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Health Insights</Text>
            <View style={[styles.aiBadge, { backgroundColor: C.purpleBg, borderColor: C.purpleBorder }]}>
              <Text style={[styles.aiBadgeText, { color: C.purple }]}>AI Powered</Text>
            </View>
          </View>
          <View style={styles.insightList}>
            {v.insightCards.map((ins, idx) => (
              <InsightCard key={idx} icon={ins.icon} title={ins.title} body={ins.body} status={view.status} />
            ))}
          </View>
        </View>

        <ActionButtonsRow onShare={v.handleShare} onEdit={v.handleEdit} onDelete={v.handleDelete} deleting={v.deleting} />

        {v.loading && (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color={C.red} />
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <NotesEditorModal
        visible={v.notesEditorOpen}
        value={v.notesDraft}
        onChange={v.setNotesDraft}
        onSave={v.saveNotes}
        onClose={v.closeNotesEditor}
        saving={v.savingNotes}
        placeholder="Add a note about this reading…"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxxl },
  scroll: { paddingBottom: spacing.xxl },
  heroFallback: { opacity: 0.18 },

  valueRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl, paddingVertical: 22, borderBottomWidth: 1,
  },
  valueLeft: { flexDirection: 'row', alignItems: 'baseline' },
  valueNumber: { fontSize: 52, fontWeight: '900', lineHeight: 56 },
  valueUnit: { fontSize: 16, fontWeight: '600', marginLeft: spacing.sm },
  trendPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1,
    borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: 6,
  },
  trendText: { fontSize: 12, fontWeight: '700' },

  section: { paddingHorizontal: spacing.xl, marginTop: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  aiBadge: { borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  aiBadgeText: { fontSize: 10.5, fontWeight: '700' },
  mutedBadge: { borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  mutedBadgeText: { fontSize: 10.5, fontWeight: '700' },
  insightList: { gap: spacing.sm },

  compareCard: {
    borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  compareLabel: { fontSize: 12, fontWeight: '500', marginBottom: spacing.xs },
  compareValue: { fontSize: 22, fontWeight: '900' },
  compareValueUnit: { fontSize: 12, fontWeight: '600' },
  deltaPill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  deltaText: { fontSize: 13, fontWeight: '800' },

  editPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1,
    borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: 5,
  },
  editPillText: { fontSize: 12, fontWeight: '700' },
  notesText: { fontSize: 14, lineHeight: 21 },
  notesEmpty: { fontSize: 14, fontStyle: 'italic' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 14 },
  tagPill: { borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: 6 },
  tagText: { fontSize: 12, fontWeight: '700' },

  metaCard: {
    marginHorizontal: spacing.xl, marginTop: 22, borderRadius: borderRadius.xl,
    borderWidth: 1, paddingHorizontal: 18,
  },
  inlineLoading: { paddingTop: 18, alignItems: 'center' },
  bottomSpacer: { height: spacing.xxxl },

  errBack: {
    position: 'absolute', top: 56, left: spacing.xl, width: 40, height: 40,
    borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center',
  },
  errorTitle: { fontSize: 18, fontWeight: '800', marginBottom: spacing.sm, textAlign: 'center' },
  errorBody: { fontSize: 13, textAlign: 'center', marginBottom: spacing.xl },
  retryBtn: { paddingHorizontal: 28, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  retryText: { fontWeight: '800', fontSize: 14 },
});

export default MeasurementDetailScreen;
