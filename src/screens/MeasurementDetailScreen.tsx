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
import {
  ChevronLeft,
  Maximize2,
  Share2,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  X,
} from 'lucide-react-native';
import { format, parseISO, isValid } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { apiService, resolveStorageUrl } from '../services/apiService';
import { useMeasurementDetail } from '../hooks/useMeasurementDetail';
import GlucoseRangeBar from '../components/GlucoseRangeBar';
import InsightCard from '../components/InsightCard';
import MetadataRow from '../components/MetadataRow';

const { width } = Dimensions.get('window');

interface MeasurementDetailScreenProps {
  // The tapped logbook row (used as a fast fallback while/if the detail fetch lags or omits fields).
  entry: any;
  onBack: () => void;
  // Optional hook to a full edit screen. Falls back to an informational alert when absent.
  onEdit?: () => void;
}

// "before_meal" -> "Before Meal", etc.
const MEASUREMENT_TYPE_LABELS: Record<string, string> = {
  before_meal: 'Before Meal',
  after_meal: 'After Meal',
  fasting: 'Fasting',
  random: 'Random',
};

const titleCase = (s?: string) =>
  (s || '')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// Normalises the various trend spellings used across the API (list row uses up/down/stable,
// detail uses rising/falling/stable) into one canonical set.
const normalizeTrend = (t?: string): 'stable' | 'rising' | 'falling' => {
  const v = (t || '').toLowerCase();
  if (v === 'up' || v === 'rising' || v === 'rise') return 'rising';
  if (v === 'down' || v === 'falling' || v === 'fall') return 'falling';
  return 'stable';
};

const safeDate = (iso?: string): Date | null => {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? d : null;
};

const MeasurementDetailScreen: React.FC<MeasurementDetailScreenProps> = ({ entry, onBack, onEdit }) => {
  const { C, isDark } = useTheme();
  const { profile } = useUser();

  const { data, loading, error, refetch } = useMeasurementDetail(entry?.id);

  const [imageViewer, setImageViewer] = useState(false);
  const [notesEditorOpen, setNotesEditorOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  // Locally-overridden notes after a successful inline edit (keeps the screen in sync without refetch).
  const [localNotes, setLocalNotes] = useState<string | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  // Target goals for the range bar + in-range insights.
  const minGoal = profile?.goals?.min || 70;
  const maxGoal = profile?.goals?.max || 140;

  // Merge the fetched detail with the tapped row so the screen renders meaningfully even
  // before the network round-trip resolves (or if a field is missing from one source).
  const m = useMemo(() => {
    const valueMgDl = Number(data?.value_mg_dl ?? entry?.value ?? 0);
    const valueGL =
      data?.value_g_l !== undefined && data?.value_g_l !== null
        ? Number(data.value_g_l)
        : valueMgDl / 1000;
    const status = (data?.health_status ?? entry?.status ?? 'normal').toString().toLowerCase();
    const trend = normalizeTrend(data?.trend ?? entry?.trend);
    const measuredAt = data?.measured_at ?? data?.recorded_at ?? entry?.date;
    const rawImage = data?.image_url ? resolveStorageUrl(data.image_url) : entry?.image;
    const notes = localNotes !== undefined ? localNotes : data?.notes ?? null;
    const tags: string[] = (data?.tags ?? entry?.tags ?? []).filter(Boolean);
    const measurementType = data?.measurement_type ?? entry?.measurement_type ?? '';

    return {
      title: data?.title || 'Glucose Measurement',
      valueMgDl,
      valueGL,
      status: status as 'normal' | 'high' | 'low',
      trend,
      measuredAt,
      image: rawImage,
      notes,
      tags,
      measurementType,
      typeLabel:
        MEASUREMENT_TYPE_LABELS[measurementType] ||
        (entry?.tag ? entry.tag : titleCase(measurementType)) ||
        'General',
      comparison: data?.comparison ?? null,
      insights: data?.health_insights ?? null,
    };
  }, [data, entry, localNotes]);

  const dateObj = safeDate(m.measuredAt);
  const dayLabel = dateObj ? format(dateObj, 'EEEE, MMMM d, yyyy') : entry?.date || '—';
  const hourLabel = dateObj ? format(dateObj, 'hh:mm a') : entry?.time || '—';

  // ----- Trend pill styling -----
  const trendCfg =
    m.trend === 'rising'
      ? { label: 'Rising', color: C.red, border: C.redBorder, Icon: TrendingUp }
      : m.trend === 'falling'
      ? { label: 'Falling', color: C.blue, border: C.blueBorder, Icon: TrendingDown }
      : { label: 'Stable', color: C.textSm, border: C.divider, Icon: null as any };

  // ----- Status colour (for the metadata "Health Insights" value) -----
  const statusColor =
    m.status === 'high' ? C.red : m.status === 'low' ? C.amber : C.green;
  const statusLabel = titleCase(m.status) || 'Normal';

  // ----- Comparison delta (current - daily average) -----
  const dailyAvg = m.comparison?.daily_average_mg_dl;
  const delta =
    dailyAvg !== undefined && dailyAvg !== null ? Math.round(m.valueMgDl - dailyAvg) : null;
  const deltaPositive = (delta ?? 0) >= 0;

  // ----- Insights: prefer API, otherwise synthesise sensible in-range / out-of-range copy -----
  const insightCards = useMemo(() => {
    if (m.insights && m.insights.length) {
      return m.insights.map((i) => ({ icon: i.icon, title: i.title, body: i.body }));
    }
    const inRange = m.valueMgDl >= minGoal && m.valueMgDl <= maxGoal;
    if (inRange) {
      return [
        {
          icon: 'heart',
          title: 'Great Reading!',
          body: `This glucose reading is within your target range (${minGoal}–${maxGoal} mg/dL). Keep up the healthy routine.`,
        },
        {
          icon: 'target',
          title: 'On Track',
          body: 'Your fasting glucose is well-controlled. Consistency with meal timing supports stable levels.',
        },
      ];
    }
    if (m.valueMgDl > maxGoal) {
      return [
        {
          icon: 'alert',
          title: 'Above Target Range',
          body: `This reading exceeds ${maxGoal} mg/dL. Consider reviewing recent meals and physical activity levels.`,
        },
        {
          icon: 'brain',
          title: 'Pattern Detected',
          body: 'Post-meal spikes have been more common this week. A short walk after meals may help reduce peaks.',
        },
      ];
    }
    return [
      {
        icon: 'alert',
        title: 'Below Target Range',
        body: `This reading is below the safe threshold of ${minGoal} mg/dL. Ensure you're eating regular meals.`,
      },
      {
        icon: 'zap',
        title: 'Action Recommended',
        body: 'Consider consuming 15g of fast-acting carbohydrates and recheck in 15 minutes.',
      },
    ];
  }, [m.insights, m.valueMgDl, minGoal, maxGoal]);

  // ----- Actions -----
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Glucose reading: ${m.valueMgDl} mg/dL (${m.valueGL.toFixed(2)} g/L) — ${statusLabel}\n${dayLabel} at ${hourLabel}${m.notes ? `\n\nNotes: ${m.notes}` : ''}`,
      });
    } catch (e) {
      // user dismissed / share unavailable — no-op
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete measurement',
      'Are you sure you want to delete this reading? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await apiService.deleteLog(entry.id, 'measurement');
              onBack();
            } catch (e: any) {
              setDeleting(false);
              Alert.alert('Delete failed', e?.message || 'Could not delete this measurement.');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    if (onEdit) onEdit();
    else Alert.alert('Edit Entry', 'Full entry editing is coming soon. You can edit notes below in the meantime.');
  };

  const openNotesEditor = () => {
    setNotesDraft(m.notes || '');
    setNotesEditorOpen(true);
  };

  const saveNotes = async () => {
    const next = notesDraft.trim();
    setSavingNotes(true);
    try {
      await apiService.updateMeasurement(entry.id, { notes: next });
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
        <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: C.red }]}>
          <ChevronLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.errorTitle, { color: C.text }]}>Couldn't load measurement</Text>
        <Text style={[styles.errorBody, { color: C.textSm }]}>{error.message}</Text>
        <TouchableOpacity onPress={refetch} style={[styles.retryBtn, { backgroundColor: C.red }]}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Back button (absolute, over the image hero) */}
      <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: C.red }]} activeOpacity={0.85}>
        <ChevronLeft size={22} color="#FFF" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* SECTION 1 — Header image area */}
        <View style={[styles.hero, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderBottomColor: C.divider }]}>
          {m.image ? (
            <Image source={{ uri: m.image }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <Activity size={96} color={C.red} strokeWidth={1} style={{ opacity: 0.18 }} />
          )}
          {!!m.image && (
            <TouchableOpacity
              style={[styles.expandBtn, { backgroundColor: C.red }]}
              onPress={() => setImageViewer(true)}
              activeOpacity={0.85}
            >
              <Maximize2 size={16} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* SECTION 2 — Value header */}
        <View style={[styles.valueRow, { borderBottomColor: C.divider }]}>
          <View style={styles.valueLeft}>
            <Text style={[styles.valueNumber, { color: C.red }]}>{m.valueMgDl}</Text>
            <Text style={[styles.valueUnit, { color: C.textSm }]}>mg/dL</Text>
          </View>
          <View style={[styles.trendPill, { borderColor: trendCfg.border }]}>
            {trendCfg.Icon ? <trendCfg.Icon size={13} color={trendCfg.color} /> : null}
            <Text style={[styles.trendText, { color: trendCfg.color }]}>{trendCfg.label}</Text>
          </View>
        </View>

        {/* SECTION 3 — Details (metadata rows) */}
        <View style={[styles.metaCard, { backgroundColor: C.white, borderColor: C.divider }]}>
          <MetadataRow label="Title" value={m.title} />
          <MetadataRow label="Measurement" value={`${m.valueGL.toFixed(1)} g/L`} />
          <MetadataRow label="Day" value={dayLabel} />
          <MetadataRow label="Hour" value={hourLabel} />
          <MetadataRow label="Measurement Type" value={m.typeLabel} />
          <MetadataRow label="Health Insights" value={statusLabel} valueColor={statusColor} valueBold last />
        </View>

        {/* SECTION 4 — Glucose Range Position */}
        <View style={[styles.section, { marginTop: 22 }]}>
          <GlucoseRangeBar value={m.valueMgDl} min={minGoal} max={maxGoal} />
        </View>

        {/* SECTION 5 — Notes & Context */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Notes &amp; Context</Text>
            <TouchableOpacity
              style={[styles.editPill, { backgroundColor: C.redBg, borderColor: C.redBorder }]}
              onPress={openNotesEditor}
              activeOpacity={0.85}
            >
              <Pencil size={12} color={C.red} />
              <Text style={[styles.editPillText, { color: C.red }]}>Edit</Text>
            </TouchableOpacity>
          </View>

          {m.notes ? (
            <Text style={[styles.notesText, { color: C.textSm }]}>{m.notes}</Text>
          ) : (
            <Text style={[styles.notesEmpty, { color: C.textXs }]}>No notes added yet.</Text>
          )}

          {m.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {m.tags.map((tag) => (
                <View key={tag} style={[styles.tagPill, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
                  <Text style={[styles.tagText, { color: C.redMuted }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* SECTION 6 — Comparison */}
        {delta !== null && dailyAvg !== undefined && dailyAvg !== null && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Comparison</Text>
              <View style={[styles.mutedBadge, { backgroundColor: C.bg, borderColor: C.divider }]}>
                <Text style={[styles.mutedBadgeText, { color: C.textSm }]}>vs previous</Text>
              </View>
            </View>
            <View style={[styles.compareCard, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
              <View>
                <Text style={[styles.compareLabel, { color: C.textSm }]}>Daily Average</Text>
                <Text style={[styles.compareValue, { color: C.text }]}>
                  {Math.round(dailyAvg)} <Text style={[styles.compareValueUnit, { color: C.textSm }]}>mg/dL</Text>
                </Text>
              </View>
              <View style={[styles.deltaPill, { backgroundColor: deltaPositive ? C.red : C.green }]}>
                {deltaPositive ? <ArrowUpRight size={14} color="#FFF" /> : <ArrowDownRight size={14} color="#FFF" />}
                <Text style={styles.deltaText}>
                  {deltaPositive ? '+' : '-'}
                  {Math.abs(delta)} mg/dL
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* SECTION 7 — Health Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Health Insights</Text>
            <View style={[styles.aiBadge, { backgroundColor: C.purpleBg, borderColor: C.purpleBorder }]}>
              <Text style={[styles.aiBadgeText, { color: C.purple }]}>AI Powered</Text>
            </View>
          </View>
          <View style={{ gap: 10 }}>
            {insightCards.map((ins, idx) => (
              <InsightCard key={idx} icon={ins.icon} title={ins.title} body={ins.body} status={m.status} />
            ))}
          </View>
        </View>

        {/* SECTION 8 — Action buttons */}
        <View style={[styles.actionsRow, { marginTop: 22 }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionSecondary, { backgroundColor: C.redBg }]}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Share2 size={16} color={C.red} />
            <Text style={[styles.actionSecondaryText, { color: C.text }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionPrimary, { backgroundColor: '#8B0000' }]}
            onPress={handleEdit}
            activeOpacity={0.9}
          >
            <Pencil size={16} color="#FFF" />
            <Text style={styles.actionPrimaryText}>Edit Entry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: C.redBg }]}
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.85}
          >
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
          {!!m.image && <Image source={{ uri: m.image }} style={styles.viewerImg} resizeMode="contain" />}
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
              placeholder="Add a note about this reading…"
              placeholderTextColor={C.textXs}
              multiline
              style={[styles.notesInput, { color: C.text, borderColor: C.divider, backgroundColor: C.bg }]}
            />
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: '#8B0000', opacity: savingNotes ? 0.7 : 1 }]}
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
    left: 20,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },

  hero: {
    height: width * 0.95,
    maxHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  heroImg: { width: '100%', height: '100%' },
  expandBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },

  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 22,
    borderBottomWidth: 1,
  },
  valueLeft: { flexDirection: 'row', alignItems: 'baseline' },
  valueNumber: { fontSize: 52, fontWeight: '900', lineHeight: 56 },
  valueUnit: { fontSize: 16, fontWeight: '600', marginLeft: 10 },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  trendText: { fontSize: 12, fontWeight: '700' },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
  },
  actionSecondary: { flex: 1 },
  actionSecondaryText: { fontSize: 14, fontWeight: '700' },
  actionPrimary: { flex: 1.4 },
  actionPrimaryText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  deleteBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: { paddingHorizontal: 20, marginTop: 22 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  aiBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  aiBadgeText: { fontSize: 10.5, fontWeight: '700' },
  mutedBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  mutedBadgeText: { fontSize: 10.5, fontWeight: '700' },

  compareCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compareLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  compareValue: { fontSize: 22, fontWeight: '900' },
  compareValueUnit: { fontSize: 12, fontWeight: '600' },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deltaText: { fontSize: 13, fontWeight: '800', color: '#FFF' },

  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editPillText: { fontSize: 12, fontWeight: '700' },
  notesText: { fontSize: 14, lineHeight: 21 },
  notesEmpty: { fontSize: 14, fontStyle: 'italic' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  tagPill: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 12, fontWeight: '700' },

  metaCard: {
    marginHorizontal: 20,
    marginTop: 22,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
  },

  inlineLoading: { paddingTop: 18, alignItems: 'center' },

  // Error
  errorTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  errorBody: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
  retryBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
  retryText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  // Image viewer
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  viewerClose: { position: 'absolute', top: 54, right: 20, zIndex: 10, padding: 6 },
  viewerImg: { width: '100%', height: '80%' },

  // Notes sheet
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 36 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  notesInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  saveBtn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});

export default MeasurementDetailScreen;
