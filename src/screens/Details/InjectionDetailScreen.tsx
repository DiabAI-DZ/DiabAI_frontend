import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight, Syringe, Utensils, Droplet, Pencil } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/borderRadius';
import MetadataRow from './components/MetadataRow';
import HeroImageArea from './components/HeroImageArea';
import HeroTitleOverlay from './components/HeroTitleOverlay';
import ActionButtonsRow from './components/ActionButtonsRow';
import NotesEditorModal from './components/NotesEditorModal';
import { useInjectionDetailView } from './hooks/useInjectionDetailView';
import { titleCaseWords } from './mealView';
import type { InjectionEntryLike } from './injectionView';

const { height } = Dimensions.get('window');

interface InjectionDetailScreenProps {
  entry: InjectionEntryLike;
  onBack: () => void;
  onEdit?: () => void;
}

const InjectionDetailScreen: React.FC<InjectionDetailScreenProps> = ({ entry, onBack, onEdit }) => {
  const { C, colors } = useTheme();
  const v = useInjectionDetailView(entry, onBack, onEdit);
  const { view } = v;
  const InsulinIcon = v.insulinCfg.Icon;
  const onPrimary = colors.textOnPrimary;

  const reasonColor =
    view.reason === 'meal_coverage' ? colors.primary
    : view.reason === 'basal' ? C.blue
    : view.reason === 'correction' ? C.amber
    : C.textSm;

  const measurementStatusColor = (status?: string): string => {
    const s = (status || '').toLowerCase();
    return s === 'high' ? C.red : s === 'low' ? C.amber : C.green;
  };

  if (v.error && !v.hasData) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: C.bg }]}>
        <TouchableOpacity onPress={onBack} style={[styles.errBack, { backgroundColor: colors.primary }]}>
          <ChevronLeft size={22} color={onPrimary} />
        </TouchableOpacity>
        <Text style={[styles.errorTitle, { color: C.text }]}>Couldn't load injection</Text>
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
              <Syringe size={80} color={C.red} strokeWidth={1} style={styles.heroFallbackIcon} />
            </View>
          }
        >
          <HeroTitleOverlay title={v.insulinCfg.title} hourLabel={v.hourLabel} dayLabel={v.dayLabel} />
        </HeroImageArea>

        {/* Dose highlight */}
        <View style={[styles.highlightRow, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.divider }]}>
          <View style={styles.highlightText}>
            <Text style={[styles.highlightLabel, { color: colors.primary }]}>INSULIN DOSE</Text>
            <View style={styles.highlightValueRow}>
              <Text style={[styles.highlightValue, { color: colors.primary }]}>{view.dose ?? '—'}</Text>
              <Text style={[styles.highlightUnit, { color: colors.textSecondary }]}>units</Text>
            </View>
          </View>
          <View style={[styles.highlightIcon, { backgroundColor: colors.primaryLight }]}>
            <Syringe size={24} color={colors.primary} />
          </View>
        </View>

        {/* Details */}
        <View style={[styles.metaCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <MetadataRow label="Title" value={v.insulinCfg.title} valueColor={C.red} />
          <MetadataRow label="Dose" value={view.dose != null ? `${view.dose} units` : '—'} />
          <MetadataRow label="Reason" value={v.reasonText || '—'} />
          <MetadataRow label="Day" value={v.dayLabel} />
          <MetadataRow label="Hour" value={v.hourLabel} />
          <MetadataRow label="Injection Site" value={view.site ? titleCaseWords(view.site) : '—'} valueColor={view.site ? undefined : C.textXs} last />
        </View>

        {/* Injection summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced, { color: C.text }]}>Injection Summary</Text>
          <View style={[styles.summaryCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            {v.reasonText && (
              <>
                <View style={styles.summaryReasonRow}>
                  <Text style={[styles.summaryReasonLabel, { color: C.textSm }]}>Reason</Text>
                  <View style={[styles.reasonPill, { backgroundColor: reasonColor }]}>
                    <Text style={[styles.reasonPillText, { color: onPrimary }]}>{v.reasonText}</Text>
                  </View>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
              </>
            )}
            <View style={styles.summaryTypeRow}>
              <View style={[styles.summaryTypeIcon, { backgroundColor: colors.primaryLight }]}>
                <InsulinIcon size={20} color={colors.primary} />
              </View>
              <View style={styles.summaryTypeText}>
                <Text style={[styles.summaryTypeTitle, { color: C.text }]}>{v.insulinCfg.short}</Text>
                {!!v.insulinCfg.desc && <Text style={[styles.summaryTypeDesc, { color: C.textSm }]}>{v.insulinCfg.desc}</Text>}
              </View>
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

        {/* Related entries */}
        {(view.relatedMeal || view.relatedMeasurement) && (
          <View style={styles.section}>
            {view.relatedMeal && (
              <>
                <Text style={[styles.sectionTitle, styles.relatedHeading, { color: C.text }]}>Related Meal</Text>
                <TouchableOpacity style={[styles.relatedCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]} onPress={v.openRelatedMeal} activeOpacity={0.8}>
                  <View style={[styles.relatedIcon, { backgroundColor: C.amberBg }]}>
                    <Utensils size={18} color={C.amber} />
                  </View>
                  <View style={styles.relatedText}>
                    <Text style={[styles.relatedTitle, { color: C.text }]}>{titleCaseWords(view.relatedMeal.title)}</Text>
                    <Text style={[styles.relatedSub, { color: C.textSm }]}>{titleCaseWords(view.relatedMeal.meal_type)}</Text>
                  </View>
                  <ChevronRight size={20} color={C.textXs} />
                </TouchableOpacity>
              </>
            )}
            {view.relatedMeasurement && (
              <>
                <Text style={[styles.sectionTitle, view.relatedMeal ? styles.relatedHeadingStacked : styles.relatedHeading, { color: C.text }]}>Related Reading</Text>
                <TouchableOpacity style={[styles.relatedCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]} onPress={v.openRelatedMeasurement} activeOpacity={0.8}>
                  <View style={[styles.relatedIcon, { backgroundColor: C.redBg }]}>
                    <Droplet size={18} color={C.red} />
                  </View>
                  <View style={styles.relatedText}>
                    <Text style={[styles.relatedTitle, { color: C.text }]}>{view.relatedMeasurement.value_mg_dl} mg/dL</Text>
                    <Text style={[styles.relatedSubBold, { color: measurementStatusColor(view.relatedMeasurement.health_status) }]}>
                      {titleCaseWords(view.relatedMeasurement.health_status)}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={C.textXs} />
                </TouchableOpacity>
              </>
            )}
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
        placeholder="Add a note about this injection…"
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
  relatedHeading: { marginBottom: spacing.md },
  relatedHeadingStacked: { marginTop: 18, marginBottom: spacing.md },

  summaryCard: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.lg },
  summaryReasonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryReasonLabel: { fontSize: 14, fontWeight: '700' },
  reasonPill: { borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 6 },
  reasonPillText: { fontSize: 12, fontWeight: '800' },
  summaryDivider: { height: 1, marginVertical: 14 },
  summaryTypeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryTypeIcon: { width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  summaryTypeText: { flex: 1 },
  summaryTypeTitle: { fontSize: 14, fontWeight: '800' },
  summaryTypeDesc: { fontSize: 12, marginTop: 2 },

  relatedCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: borderRadius.lg, padding: 14 },
  relatedIcon: { width: 40, height: 40, borderRadius: borderRadius.pill, alignItems: 'center', justifyContent: 'center' },
  relatedText: { flex: 1 },
  relatedTitle: { fontSize: 14, fontWeight: '800' },
  relatedSub: { fontSize: 12, marginTop: 2 },
  relatedSubBold: { fontSize: 12, marginTop: 2, fontWeight: '700' },

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

export default InjectionDetailScreen;
