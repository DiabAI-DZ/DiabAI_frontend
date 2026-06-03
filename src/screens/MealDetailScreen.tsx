import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Share,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Maximize2,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Flame,
  Utensils,
  Share2,
  Pencil,
  Trash2,
  X,
} from 'lucide-react-native';
import { format, parseISO, isValid } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { apiService, resolveStorageUrl } from '../services/apiService';
import { useMealDetail } from '../hooks/useMealDetail';
import NutritionRings from '../components/NutritionRings';
import InsightCard from '../components/InsightCard';
import MetadataRow from '../components/MetadataRow';

const { width, height } = Dimensions.get('window');

// Exact palette from the Meal Details spec.
const TEAL = '#2ECC71';
const TEAL_BG = '#E8FFF5';
const PRIMARY_RED = '#8B0000';
const ORANGE = '#F39C12';

interface MealDetailScreenProps {
  entry: any;
  onBack: () => void;
  onEdit?: () => void;
}

// "avocado_toast" / "juice" -> "Avocado Toast" / "Juice"
const titleCaseWords = (s?: string) =>
  (s || '')
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const safeDate = (iso?: string): Date | null => {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? d : null;
};

const parseImpact = (numeric?: number | null, str?: string): number | null => {
  if (numeric !== undefined && numeric !== null && !Number.isNaN(Number(numeric))) {
    return Math.round(Number(numeric));
  }
  if (str) {
    const m = str.match(/-?\d+(\.\d+)?/);
    if (m) return Math.round(parseFloat(m[0]));
  }
  return null;
};

// First numeric value among the args, or null if none are numbers (preserves the
// null vs 0 distinction the metadata "—" rule needs).
const numOrNull = (...vals: any[]): number | null => {
  for (const v of vals) {
    if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
};

const MealDetailScreen: React.FC<MealDetailScreenProps> = ({ entry, onBack, onEdit }) => {
  const { C } = useTheme();
  const { data, loading, error, refetch } = useMealDetail(entry?.id);

  const [imageViewer, setImageViewer] = useState(false);
  const [notesEditorOpen, setNotesEditorOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState<string | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  // Merge fetched detail with the tapped logbook row so the screen renders immediately.
  const meal = useMemo(() => {
    const n = data?.nutrition || {};
    const carbsRing = numOrNull(n.carbohydrates_g, data?.carbohydrates_g, entry?.carbs) ?? 0;
    const proteinRing = numOrNull(n.protein_g, data?.protein_g, entry?.protein) ?? 0;
    const fatRing = numOrNull(n.fat_g, data?.fat_g, entry?.fat) ?? 0;
    const fiberRing = numOrNull(n.fiber_g, data?.fiber_g, entry?.fiber) ?? 0;

    // For the metadata "Carbohydrates" row, only the detail payload distinguishes null (→ "—").
    const carbsMeta =
      data?.carbohydrates_g ?? (data?.nutrition ? data.nutrition.carbohydrates_g : undefined) ?? null;
    const calories = data?.calories ?? null;

    return {
      titleRaw: data?.title || entry?.name || 'Logged Meal',
      mealType: data?.meal_type || entry?.mealType || 'snack',
      eatenAt: data?.eaten_at ?? data?.measured_at ?? data?.recorded_at ?? entry?.date,
      impactMgDl: parseImpact(data?.glucose_impact_mg_dl, entry?.impact),
      impactLevel: (data?.impact_level || entry?.impactLevel || '').toLowerCase(),
      carbsRing,
      proteinRing,
      fatRing,
      fiberRing,
      carbsMeta,
      calories,
      notes: localNotes !== undefined ? localNotes : data?.notes ?? null,
      tags: (data?.tags ?? entry?.tags ?? []).filter(Boolean) as string[],
      image: data?.image_url ? resolveStorageUrl(data.image_url) : entry?.image,
      insights: data?.health_insights ?? null,
    };
  }, [data, entry, localNotes]);

  const title = titleCaseWords(meal.titleRaw);
  const typeLabel = MEAL_TYPE_LABELS[meal.mealType] || titleCaseWords(meal.mealType);

  const dateObj = safeDate(meal.eatenAt);
  const dayLabel = dateObj ? format(dateObj, 'EEEE, MMMM d, yyyy') : entry?.date || '—';
  const hourLabel = dateObj ? format(dateObj, 'hh:mm a') : entry?.time || '—';

  // ----- Glucose impact -----
  const impact = meal.impactMgDl;
  const impactPositive = impact !== null && impact > 0;
  const impactNegative = impact !== null && impact < 0;
  const ImpactIcon = impactPositive ? TrendingUp : impactNegative ? TrendingDown : ArrowRight;
  const impactText =
    impact === null ? '—' : `${impact > 0 ? '+' : impact < 0 ? '-' : ''}${Math.abs(impact)} mg/dL`;

  // ----- Impact level pill (metadata) -----
  const impactLevelCfg = (() => {
    switch (meal.impactLevel) {
      case 'low':
        return { label: 'Low Impact', color: TEAL };
      case 'moderate':
        return { label: 'Moderate Impact', color: ORANGE };
      case 'high':
        return { label: 'High Impact', color: C.red };
      case 'excellent':
        return { label: 'Excellent', color: C.green };
      default:
        return meal.impactLevel
          ? { label: `${titleCaseWords(meal.impactLevel)} Impact`, color: C.textSm }
          : null;
    }
  })();

  // ----- Insights (API first, otherwise synthesised to match the reference) -----
  const insightCards = useMemo(() => {
    if (meal.insights && meal.insights.length) {
      return meal.insights.map((i) => ({ icon: i.icon, title: i.title, body: i.body }));
    }
    const impactWord = meal.impactLevel ? titleCaseWords(meal.impactLevel) : 'Moderate';
    return [
      {
        icon: 'globe',
        title: `${impactWord} Glucose Impact`,
        body: `This meal is estimated to raise your glucose by ${impactText}. The ${Math.round(
          meal.carbsRing,
        )}g of carbs are the primary contributor.`,
      },
      {
        icon: 'sparkle',
        title: 'Recommendation',
        body: 'Pairing high-carb meals with a 15-minute walk can reduce post-meal glucose spikes by up to 30%.',
      },
      {
        icon: 'chart',
        title: 'Meal Pattern',
        body: 'Your lunch meals tend to have the highest carb content. Consider adding more fiber-rich foods to slow glucose absorption.',
      },
    ];
  }, [meal.insights, meal.impactLevel, meal.carbsRing, impactText]);

  // ----- Tags shown in the Tags card: meal_type always, then any data.tags -----
  const tagCardItems = useMemo(() => [typeLabel, ...meal.tags], [typeLabel, meal.tags]);

  // ----- Actions -----
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${title} — ${typeLabel}\nEstimated glucose impact: ${impactText}\n${dayLabel} at ${hourLabel}${
          meal.notes ? `\n\nNotes: ${meal.notes}` : ''
        }`,
      });
    } catch (e) {
      /* dismissed */
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete meal', 'Are you sure you want to delete this meal? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await apiService.deleteLog(entry.id, 'meal');
            onBack();
          } catch (e: any) {
            setDeleting(false);
            Alert.alert('Delete failed', e?.message || 'Could not delete this meal.');
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    if (onEdit) onEdit();
    else Alert.alert('Edit Entry', 'Full meal editing is coming soon. You can edit notes below in the meantime.');
  };

  const openNotesEditor = () => {
    setNotesDraft(meal.notes || '');
    setNotesEditorOpen(true);
  };

  const saveNotes = async () => {
    const next = notesDraft.trim();
    setSavingNotes(true);
    try {
      await apiService.updateMeal(entry.id, { notes: next });
      setLocalNotes(next.length ? next : null);
      setNotesEditorOpen(false);
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Could not update notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  };

  // ----- Error state -----
  if (error && !data) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: C.bg }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: PRIMARY_RED }]}>
          <ChevronLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.errorTitle, { color: C.text }]}>Couldn't load meal</Text>
        <Text style={[styles.errorBody, { color: C.textSm }]}>{error.message}</Text>
        <TouchableOpacity onPress={refetch} style={[styles.retryBtn, { backgroundColor: PRIMARY_RED }]}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* SECTION 1 — HERO IMAGE AREA */}
        <View style={styles.hero}>
          {meal.image ? (
            <Image source={{ uri: meal.image }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <View style={[styles.heroFallback, { backgroundColor: C.redBg }]}>
              <Utensils size={80} color={C.red} strokeWidth={1} style={{ opacity: 0.25 }} />
            </View>
          )}

          <LinearGradient colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)']} style={styles.heroGradient} />

          <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: PRIMARY_RED }]} activeOpacity={0.85}>
            <ChevronLeft size={22} color="#FFF" />
          </TouchableOpacity>

          {!!meal.image && (
            <TouchableOpacity style={[styles.expandBtn, { backgroundColor: PRIMARY_RED }]} onPress={() => setImageViewer(true)} activeOpacity={0.85}>
              <Maximize2 size={16} color="#FFF" />
            </TouchableOpacity>
          )}

          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroTitle}>{title}</Text>
            <View style={styles.heroMetaRow}>
              <Clock size={12} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroMetaText}>
                {hourLabel}  ·  {dayLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION 2 — ESTIMATED GLUCOSE IMPACT */}
        <View style={[styles.impactRow, { backgroundColor: C.white, borderBottomColor: C.divider }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.impactLabel}>ESTIMATED GLUCOSE IMPACT</Text>
            <Text style={styles.impactValue}>{impactText}</Text>
          </View>
          <View style={[styles.impactIcon, { backgroundColor: TEAL_BG }]}>
            <ImpactIcon size={24} color={TEAL} />
          </View>
        </View>

        {/* SECTION 3 — DETAILS (metadata rows) */}
        <View style={[styles.metaCard, { backgroundColor: C.white, borderColor: C.divider }]}>
          <MetadataRow label="Meal" value={title} valueColor={C.red} />
          <MetadataRow label="Type" value={typeLabel} />
          <MetadataRow label="Day" value={dayLabel} valueColor={TEAL} />
          <MetadataRow label="Hour" value={hourLabel} />
          <MetadataRow
            label="Carbohydrates"
            value={meal.carbsMeta !== null && meal.carbsMeta !== undefined ? `${Math.round(meal.carbsMeta)}g` : '—'}
            valueColor={C.red}
            last={!impactLevelCfg}
          />
          {impactLevelCfg && (
            <MetadataRow label="Impact Level" value={impactLevelCfg.label} valueColor={impactLevelCfg.color} valueBold last />
          )}
        </View>

        {/* SECTION 4 — NUTRITION BREAKDOWN */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text, marginBottom: 14 }]}>Nutrition Breakdown</Text>
          <View style={[styles.nutritionCard, { backgroundColor: C.white, borderColor: C.divider }]}>
            <NutritionRings carbs={meal.carbsRing} protein={meal.proteinRing} fat={meal.fatRing} fiber={meal.fiberRing} />

            <View style={[styles.caloriesRow, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
              <View style={styles.caloriesLeft}>
                <Flame size={16} color={C.red} />
                <Text style={[styles.caloriesLabel, { color: C.text }]}>Total Calories</Text>
              </View>
              <Text style={[styles.caloriesValue, { color: C.red }]}>
                {meal.calories !== null && meal.calories !== undefined ? `${Math.round(meal.calories)} kcal` : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION 5 — NOTES & CONTEXT */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Notes &amp; Context</Text>
            <TouchableOpacity style={[styles.editPill, { backgroundColor: C.redBg, borderColor: C.redBorder }]} onPress={openNotesEditor} activeOpacity={0.85}>
              <Pencil size={12} color={C.red} />
              <Text style={[styles.editPillText, { color: C.red }]}>Edit</Text>
            </TouchableOpacity>
          </View>

          {meal.notes ? (
            <Text style={[styles.notesText, { color: C.textSm }]}>{meal.notes}</Text>
          ) : (
            <Text style={[styles.notesEmpty, { color: C.textXs }]}>No notes added yet.</Text>
          )}

          {meal.tags.length > 0 && (
            <View style={[styles.tagsRow, { marginTop: 14 }]}>
              {meal.tags.map((tag) => (
                <View key={tag} style={[styles.tagPillOutline, { borderColor: C.divider }]}>
                  <Text style={[styles.tagPillOutlineText, { color: C.redMuted }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* SECTION 6 — TAGS CARD */}
        <View style={styles.section}>
          <View style={[styles.tagsCard, { backgroundColor: C.white, borderColor: C.divider }]}>
            <Text style={[styles.tagsCardTitle, { color: C.text }]}>Tags</Text>
            <View style={styles.tagsRow}>
              {tagCardItems.map((tag, idx) => (
                <View key={`${tag}-${idx}`} style={[styles.tagPillFilled, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
                  <Text style={[styles.tagPillFilledText, { color: C.redMuted }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* SECTION 7 — HEALTH INSIGHTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Health Insights</Text>
            <View style={[styles.aiBadge, { backgroundColor: C.purpleBg, borderColor: C.purpleBorder }]}>
              <Text style={[styles.aiBadgeText, { color: C.purple }]}>AI Powered</Text>
            </View>
          </View>
          <View style={{ gap: 10 }}>
            {insightCards.map((ins, idx) => (
              <InsightCard key={idx} icon={ins.icon} title={ins.title} body={ins.body} />
            ))}
          </View>
        </View>

        {/* SECTION 8 — ACTION BUTTONS */}
        <View style={[styles.actionsRow, { marginTop: 22 }]}>
          <TouchableOpacity style={[styles.actionBtn, styles.actionSecondary, { backgroundColor: C.redBg }]} onPress={handleShare} activeOpacity={0.85}>
            <Share2 size={16} color={C.red} />
            <Text style={[styles.actionSecondaryText, { color: C.text }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary, { backgroundColor: PRIMARY_RED }]} onPress={handleEdit} activeOpacity={0.9}>
            <Pencil size={16} color="#FFF" />
            <Text style={styles.actionPrimaryText}>Edit Entry</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: C.redBg }]} onPress={handleDelete} disabled={deleting} activeOpacity={0.85}>
            {deleting ? <ActivityIndicator size="small" color={C.red} /> : <Trash2 size={18} color={C.red} />}
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color={C.red} />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Fullscreen image viewer */}
      <Modal visible={imageViewer} transparent animationType="fade" onRequestClose={() => setImageViewer(false)}>
        <View style={styles.viewerBackdrop}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setImageViewer(false)}>
            <X size={26} color="#FFF" />
          </TouchableOpacity>
          {!!meal.image && <Image source={{ uri: meal.image }} style={styles.viewerImg} resizeMode="contain" />}
        </View>
      </Modal>

      {/* Notes editor */}
      <Modal visible={notesEditorOpen} transparent animationType="slide" onRequestClose={() => setNotesEditorOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { backgroundColor: C.white }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: C.text }]}>Edit Notes</Text>
              <TouchableOpacity onPress={() => setNotesEditorOpen(false)}>
                <X size={22} color={C.textSm} />
              </TouchableOpacity>
            </View>
            <TextInput
              value={notesDraft}
              onChangeText={setNotesDraft}
              placeholder="Add a note about this meal…"
              placeholderTextColor={C.textXs}
              multiline
              style={[styles.notesInput, { color: C.text, borderColor: C.divider, backgroundColor: C.bg }]}
            />
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: PRIMARY_RED, opacity: savingNotes ? 0.7 : 1 }]}
              onPress={saveNotes}
              disabled={savingNotes}
              activeOpacity={0.9}
            >
              {savingNotes ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save Notes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  scroll: { paddingBottom: 24 },

  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 44,
    left: 16,
    zIndex: 20,
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },

  hero: { height: height * 0.4, maxHeight: 380, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  heroGradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  expandBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  heroTitleBlock: { position: 'absolute', left: 20, right: 20, bottom: 18 },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  heroMetaText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  impactLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4, color: TEAL },
  impactValue: { fontSize: 32, fontWeight: '900', lineHeight: 36, color: TEAL },
  impactIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 18 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 16 },
  actionSecondary: { flex: 1 },
  actionSecondaryText: { fontSize: 14, fontWeight: '700' },
  actionPrimary: { flex: 1.4 },
  actionPrimaryText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  deleteBtn: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  section: { paddingHorizontal: 20, marginTop: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  aiBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  aiBadgeText: { fontSize: 10.5, fontWeight: '700' },

  tagsCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  tagsCardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPillFilled: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  tagPillFilledText: { fontSize: 12, fontWeight: '700' },
  tagPillOutline: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  tagPillOutlineText: { fontSize: 12, fontWeight: '600' },

  editPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  editPillText: { fontSize: 12, fontWeight: '700' },
  notesText: { fontSize: 13.5, lineHeight: 20 },
  notesEmpty: { fontSize: 13.5, fontStyle: 'italic' },

  metaCard: { marginHorizontal: 20, marginTop: 22, borderRadius: 20, borderWidth: 1, paddingHorizontal: 18 },

  nutritionCard: { borderWidth: 1, borderRadius: 20, padding: 18 },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 18,
  },
  caloriesLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  caloriesLabel: { fontSize: 14, fontWeight: '700' },
  caloriesValue: { fontSize: 17, fontWeight: '900' },

  inlineLoading: { paddingTop: 18, alignItems: 'center' },

  errorTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  errorBody: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
  retryBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
  retryText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  viewerClose: { position: 'absolute', top: 54, right: 20, zIndex: 10, padding: 6 },
  viewerImg: { width: '100%', height: '80%' },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 36 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  notesInput: { minHeight: 120, borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, textAlignVertical: 'top', marginBottom: 18 },
  saveBtn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});

export default MealDetailScreen;
