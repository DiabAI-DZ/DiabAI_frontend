import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft, Clock, TrendingUp, TrendingDown, ArrowRight, Flame, Utensils, Pencil,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/borderRadius';
import NutritionRings from './components/NutritionRings';
import InsightCard from './components/InsightCard';
import MetadataRow from './components/MetadataRow';
import HeroImageArea from './components/HeroImageArea';
import ActionButtonsRow from './components/ActionButtonsRow';
import NotesEditorModal from './components/NotesEditorModal';
import { useMealDetailView } from './hooks/useMealDetailView';
import type { MealEntryLike } from './mealView';
import { titleCaseWords } from './mealView';

const { height } = Dimensions.get('window');
const HERO_OVERLAY = ['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)'] as const;
const TITLE_SHADOW = 'rgba(0,0,0,0.35)';
const META_OVERLAY = 'rgba(255,255,255,0.85)';

interface MealDetailScreenProps {
  entry: MealEntryLike;
  onBack: () => void;
  onEdit?: () => void;
}

const MealDetailScreen: React.FC<MealDetailScreenProps> = ({ entry, onBack, onEdit }) => {
  const { C, colors } = useTheme();
  const v = useMealDetailView(entry, onBack, onEdit);
  const { view } = v;
  const onPrimary = colors.textOnPrimary;

  const ImpactIcon = (v.impactMgDl ?? 0) > 0 ? TrendingUp : (v.impactMgDl ?? 0) < 0 ? TrendingDown : ArrowRight;

  const impactLevelCfg = (() => {
    switch (view.impactLevel) {
      case 'low': return { label: 'Low Impact', color: colors.teal };
      case 'moderate': return { label: 'Moderate Impact', color: colors.orange };
      case 'high': return { label: 'High Impact', color: C.red };
      case 'excellent': return { label: 'Excellent', color: C.green };
      default: return view.impactLevel ? { label: `${titleCaseWords(view.impactLevel)} Impact`, color: C.textSm } : null;
    }
  })();

  if (v.error && !v.hasData) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: C.bg }]}>
        <TouchableOpacity onPress={onBack} style={[styles.errBack, { backgroundColor: colors.primary }]}>
          <ChevronLeft size={22} color={onPrimary} />
        </TouchableOpacity>
        <Text style={[styles.errorTitle, { color: C.text }]}>Couldn't load meal</Text>
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
              <Utensils size={80} color={C.red} strokeWidth={1} style={styles.heroFallbackIcon} />
            </View>
          }
        >
          <LinearGradient colors={HERO_OVERLAY} style={styles.heroGradient} />
          <View style={styles.heroTitleBlock}>
            <Text style={[styles.heroTitle, { color: onPrimary, textShadowColor: TITLE_SHADOW }]}>{v.title}</Text>
            <View style={styles.heroMetaRow}>
              <Clock size={12} color={META_OVERLAY} />
              <Text style={[styles.heroMetaText, { color: META_OVERLAY }]}>{v.hourLabel}  ·  {v.dayLabel}</Text>
            </View>
          </View>
        </HeroImageArea>

        {/* Estimated glucose impact */}
        <View style={[styles.impactRow, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.divider }]}>
          <View style={styles.impactText}>
            <Text style={[styles.impactLabel, { color: colors.teal }]}>ESTIMATED GLUCOSE IMPACT</Text>
            <Text style={[styles.impactValue, { color: colors.teal }]}>{v.impactText}</Text>
          </View>
          <View style={[styles.impactIcon, { backgroundColor: colors.successBg }]}>
            <ImpactIcon size={24} color={colors.teal} />
          </View>
        </View>

        {/* Details */}
        <View style={[styles.metaCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <MetadataRow label="Meal" value={v.title} valueColor={C.red} />
          <MetadataRow label="Type" value={v.typeLabel} />
          <MetadataRow label="Day" value={v.dayLabel} valueColor={colors.teal} />
          <MetadataRow label="Hour" value={v.hourLabel} />
          <MetadataRow
            label="Carbohydrates"
            value={view.carbsMeta != null ? `${Math.round(view.carbsMeta)}g` : '—'}
            valueColor={C.red}
            last={!impactLevelCfg}
          />
          {impactLevelCfg && (
            <MetadataRow label="Impact Level" value={impactLevelCfg.label} valueColor={impactLevelCfg.color} valueBold last />
          )}
        </View>

        {/* Nutrition breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced, { color: C.text }]}>Nutrition Breakdown</Text>
          <View style={[styles.nutritionCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <NutritionRings carbs={view.carbsRing} protein={view.proteinRing} fat={view.fatRing} fiber={view.fiberRing} />
            <View style={[styles.caloriesRow, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
              <View style={styles.caloriesLeft}>
                <Flame size={16} color={C.red} />
                <Text style={[styles.caloriesLabel, { color: C.text }]}>Total Calories</Text>
              </View>
              <Text style={[styles.caloriesValue, { color: C.red }]}>
                {view.calories != null ? `${Math.round(view.calories)} kcal` : '—'}
              </Text>
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

        {/* Tags card */}
        <View style={styles.section}>
          <View style={[styles.tagsCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Text style={[styles.tagsCardTitle, { color: C.text }]}>Tags</Text>
            <View style={styles.tagsRow}>
              {v.tagCardItems.map((tag, idx) => (
                <View key={`${tag}-${idx}`} style={[styles.tagPill, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
                  <Text style={[styles.tagPillText, { color: C.redMuted }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

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
              <InsightCard key={idx} icon={ins.icon} title={ins.title} body={ins.body} />
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
        placeholder="Add a note about this meal…"
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
  heroGradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  heroTitleBlock: { position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 18 },
  heroTitle: {
    fontSize: 24, fontWeight: '900',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  heroMetaText: { fontSize: 13, fontWeight: '500' },

  impactRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl, borderBottomWidth: 1,
  },
  impactText: { flex: 1 },
  impactLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.xs },
  impactValue: { fontSize: 32, fontWeight: '900', lineHeight: 36 },
  impactIcon: { width: 52, height: 52, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },

  section: { paddingHorizontal: spacing.xl, marginTop: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionTitleSpaced: { marginBottom: 14 },
  aiBadge: { borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  aiBadgeText: { fontSize: 10.5, fontWeight: '700' },
  insightList: { gap: spacing.sm },

  tagsCard: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.lg },
  tagsCardTitle: { fontSize: 15, fontWeight: '800', marginBottom: spacing.md },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tagPill: { borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: 6 },
  tagPillText: { fontSize: 12, fontWeight: '700' },

  editPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  editPillText: { fontSize: 12, fontWeight: '700' },
  notesText: { fontSize: 13.5, lineHeight: 20 },
  notesEmpty: { fontSize: 13.5, fontStyle: 'italic' },

  metaCard: { marginHorizontal: spacing.xl, marginTop: 22, borderRadius: borderRadius.xl, borderWidth: 1, paddingHorizontal: 18 },
  nutritionCard: { borderWidth: 1, borderRadius: borderRadius.xl, padding: 18 },
  caloriesRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: borderRadius.md, borderWidth: 1, marginTop: 18,
  },
  caloriesLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  caloriesLabel: { fontSize: 14, fontWeight: '700' },
  caloriesValue: { fontSize: 17, fontWeight: '900' },

  inlineLoading: { paddingTop: 18, alignItems: 'center' },
  bottomSpacer: { height: spacing.xxxl },

  errBack: { position: 'absolute', top: 56, left: spacing.xl, width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '800', marginBottom: spacing.sm, textAlign: 'center' },
  errorBody: { fontSize: 13, textAlign: 'center', marginBottom: spacing.xl },
  retryBtn: { paddingHorizontal: 28, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  retryText: { fontWeight: '800', fontSize: 14 },
});

export default MealDetailScreen;
