import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import {
  ChevronLeft, Zap, Flame, TrendingUp, TrendingDown, ArrowRight, Activity as ActivityIcon, Pencil, type LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/borderRadius';
import MetadataRow from './components/MetadataRow';
import HeroImageArea from './components/HeroImageArea';
import HeroTitleOverlay from './components/HeroTitleOverlay';
import ActionButtonsRow from './components/ActionButtonsRow';
import NotesEditorModal from './components/NotesEditorModal';
import { useActivityDetailView } from './hooks/useActivityDetailView';
import { titleCaseWords } from './mealView';
import type { ActivityEntryLike } from './activityView';

const { height } = Dimensions.get('window');

interface ActivityDetailScreenProps {
  entry: ActivityEntryLike;
  onBack: () => void;
  onEdit?: () => void;
}

type Stat = { key: string; label: string; value?: string; badge?: { label: string; color: string } };

const ActivityDetailScreen: React.FC<ActivityDetailScreenProps> = ({ entry, onBack, onEdit }) => {
  const { C, colors } = useTheme();
  const v = useActivityDetailView(entry, onBack, onEdit);
  const { view } = v;
  const onPrimary = colors.textOnPrimary;

  const intensityCfg = ((): { color: string; bg: string; Icon: LucideIcon } => {
    switch (view.intensity) {
      case 'low': return { color: colors.teal, bg: colors.successBg, Icon: Zap };
      case 'moderate': return { color: colors.orange, bg: colors.warningBg, Icon: Zap };
      case 'high': return { color: colors.criticalText, bg: colors.primaryLight, Icon: Flame };
      default: return { color: C.textSm, bg: C.bg, Icon: ActivityIcon };
    }
  })();

  const impactCfg = ((): { Icon: LucideIcon; color: string; bg: string; title: string; sub: string; badge: string; badgeColor: string } | null => {
    switch (view.glucoseImpact) {
      case 'decrease': return { Icon: TrendingDown, color: C.green, bg: C.greenBg, title: 'Glucose Decrease Expected', sub: 'Physical activity typically lowers blood glucose', badge: 'Beneficial', badgeColor: C.green };
      case 'increase': return { Icon: TrendingUp, color: C.red, bg: C.redBg, title: 'Glucose Increase Possible', sub: 'High intensity may temporarily raise glucose', badge: 'Monitor', badgeColor: C.amber };
      case 'stable': return { Icon: ArrowRight, color: C.textSm, bg: C.bg, title: 'Minimal Glucose Change', sub: 'Low intensity activity with minimal glucose effect', badge: 'Neutral', badgeColor: C.textSm };
      default: return null;
    }
  })();
  const ImpactIcon = impactCfg?.Icon;
  const IntensityHeroIcon = intensityCfg.Icon;

  const stats = useMemo<Stat[]>(() => {
    const list: Stat[] = [
      { key: 'duration', label: 'Duration', value: view.durationHuman },
      { key: 'intensity', label: 'Intensity', badge: { label: v.intensityLabel, color: intensityCfg.color } },
    ];
    if (view.calories !== null) list.push({ key: 'calories', label: 'Calories', value: `${Math.round(view.calories)} kcal` });
    if (view.distanceHuman) list.push({ key: 'distance', label: 'Distance', value: view.distanceHuman });
    if (view.steps !== null) list.push({ key: 'steps', label: 'Steps', value: view.steps.toLocaleString() });
    if (view.heartRate !== null) list.push({ key: 'hr', label: 'Heart Rate', value: `${Math.round(view.heartRate)} bpm` });
    return list;
  }, [view, v.intensityLabel, intensityCfg.color]);

  if (v.error && !v.hasData) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: C.bg }]}>
        <TouchableOpacity onPress={onBack} style={[styles.errBack, { backgroundColor: colors.primary }]}>
          <ChevronLeft size={22} color={onPrimary} />
        </TouchableOpacity>
        <Text style={[styles.errorTitle, { color: C.text }]}>Couldn't load activity</Text>
        <Text style={[styles.errorBody, { color: C.textSm }]}>{v.error.message}</Text>
        <TouchableOpacity onPress={v.refetch} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.retryText, { color: onPrimary }]}>Retry</Text>
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
          containerStyle={styles.heroMeal}
          fallback={
            <View style={[styles.heroFallback, { backgroundColor: C.redBg }]}>
              <ActivityIcon size={80} color={C.red} strokeWidth={1} style={styles.heroFallbackIcon} />
            </View>
          }
        >
          <HeroTitleOverlay title={v.title} hourLabel={v.startLabel} dayLabel={v.dayLabel} />
        </HeroImageArea>

        {/* Duration highlight */}
        <View style={[styles.highlightRow, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.divider }]}>
          <View style={styles.highlightText}>
            <Text style={[styles.highlightLabel, { color: colors.teal }]}>DURATION</Text>
            <View style={styles.highlightValueRow}>
              <Text style={[styles.highlightValue, { color: colors.teal }]}>{view.durationMin ?? '—'}</Text>
              <Text style={[styles.highlightUnit, { color: colors.textSecondary }]}>minutes</Text>
            </View>
          </View>
          <View style={[styles.highlightIcon, { backgroundColor: intensityCfg.bg }]}>
            <IntensityHeroIcon size={24} color={intensityCfg.color} />
          </View>
        </View>

        {/* Details */}
        <View style={[styles.metaCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <MetadataRow label="Activity" value={v.title} valueColor={C.red} />
          <MetadataRow label="Duration" value={view.durationHuman} />
          <MetadataRow label="Intensity" value={v.intensityLabel} valueColor={intensityCfg.color} valueBold />
          <MetadataRow label="Start Time" value={v.startLabel} />
          <MetadataRow label="End Time" value={v.endLabel} valueColor={view.endedAt ? undefined : C.textXs} />
          <MetadataRow label="Day" value={v.dayLabel} />
          <MetadataRow label="Calories" value={view.calories !== null ? `${Math.round(view.calories)} kcal` : '—'} valueColor={view.calories !== null ? undefined : C.textXs} />
          <MetadataRow label="Distance" value={view.distanceHuman ?? '—'} valueColor={view.distanceHuman ? undefined : C.textXs} />
          <MetadataRow label="Steps" value={view.steps !== null ? view.steps.toLocaleString() : '—'} valueColor={view.steps !== null ? undefined : C.textXs} />
          <MetadataRow label="Heart Rate" value={view.heartRate !== null ? `${Math.round(view.heartRate)} bpm` : '—'} valueColor={view.heartRate !== null ? undefined : C.textXs} last />
        </View>

        {/* Activity stats grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced, { color: C.text }]}>Activity Stats</Text>
          <View style={[styles.statsCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <View style={styles.statsGrid}>
              {stats.map((s) => (
                <View key={s.key} style={styles.statCell}>
                  <Text style={[styles.statLabel, { color: C.textSm }]}>{s.label}</Text>
                  {s.badge ? (
                    <View style={[styles.intensityPill, { backgroundColor: s.badge.color }]}>
                      <Text style={[styles.intensityPillText, { color: onPrimary }]}>{s.badge.label}</Text>
                    </View>
                  ) : (
                    <Text style={[styles.statValue, { color: C.text }]}>{s.value}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
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
        </View>

        {/* Glucose impact */}
        {impactCfg && ImpactIcon && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced, { color: C.text }]}>Glucose Impact</Text>
            <View style={[styles.impactCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <View style={[styles.impactIconCircle, { backgroundColor: impactCfg.bg }]}>
                <ImpactIcon size={20} color={impactCfg.color} />
              </View>
              <View style={styles.impactTextCol}>
                <Text style={[styles.impactCardTitle, { color: C.text }]}>{impactCfg.title}</Text>
                <Text style={[styles.impactCardSub, { color: C.textSm }]}>{impactCfg.sub}</Text>
              </View>
              <View style={[styles.impactBadge, { backgroundColor: impactCfg.badgeColor }]}>
                <Text style={[styles.impactBadgeText, { color: onPrimary }]}>{impactCfg.badge}</Text>
              </View>
            </View>
          </View>
        )}

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
        placeholder="Add a note about this activity…"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxxl },
  scroll: { paddingBottom: spacing.xxl },

  heroMeal: { height: height * 0.4, maxHeight: 380, borderBottomWidth: 0 },
  heroFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  heroFallbackIcon: { opacity: 0.25 },

  highlightRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl, borderBottomWidth: 1,
  },
  highlightText: { flex: 1 },
  highlightLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.xs },
  highlightValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  highlightValue: { fontSize: 34, fontWeight: '900', lineHeight: 38 },
  highlightUnit: { fontSize: 14, fontWeight: '600', marginLeft: spacing.sm },
  highlightIcon: { width: 52, height: 52, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },

  section: { paddingHorizontal: spacing.xl, marginTop: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionTitleSpaced: { marginBottom: 14 },

  statsCard: { borderWidth: 1, borderRadius: borderRadius.lg, padding: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCell: { width: '50%', paddingHorizontal: spacing.md, paddingVertical: 14 },
  statLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800' },
  intensityPill: { alignSelf: 'flex-start', borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  intensityPillText: { fontSize: 13, fontWeight: '800' },

  impactCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: borderRadius.lg, padding: 14 },
  impactIconCircle: { width: 40, height: 40, borderRadius: borderRadius.pill, alignItems: 'center', justifyContent: 'center' },
  impactTextCol: { flex: 1 },
  impactCardTitle: { fontSize: 14, fontWeight: '800' },
  impactCardSub: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  impactBadge: { borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  impactBadgeText: { fontSize: 11, fontWeight: '800' },

  editPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  editPillText: { fontSize: 12, fontWeight: '700' },
  notesText: { fontSize: 13.5, lineHeight: 20 },
  notesEmpty: { fontSize: 13.5, fontStyle: 'italic' },

  metaCard: { marginHorizontal: spacing.xl, marginTop: 22, borderRadius: borderRadius.xl, borderWidth: 1, paddingHorizontal: 18 },
  inlineLoading: { paddingTop: 18, alignItems: 'center' },
  bottomSpacer: { height: spacing.xxxl },

  errBack: { position: 'absolute', top: 56, left: spacing.xl, width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '800', marginBottom: spacing.sm, textAlign: 'center' },
  errorBody: { fontSize: 13, textAlign: 'center', marginBottom: spacing.xl },
  retryBtn: { paddingHorizontal: 28, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  retryText: { fontWeight: '800', fontSize: 14 },
});

export default ActivityDetailScreen;
