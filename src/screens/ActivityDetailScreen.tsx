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
  Zap,
  Flame,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Share2,
  Pencil,
  Trash2,
  Activity as ActivityIcon,
  X,
} from 'lucide-react-native';
import { format, parseISO, isValid } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { apiService, resolveStorageUrl } from '../services/apiService';
import { useActivityDetail } from '../hooks/useActivityDetail';
import MetadataRow from '../components/MetadataRow';

const { width, height } = Dimensions.get('window');

const PRIMARY_RED = '#8B0000';
const TEAL = '#2ECC71';
const ORANGE = '#F39C12';
const RED = '#E74C3C';

interface ActivityDetailScreenProps {
  entry: any;
  onBack: () => void;
  onEdit?: () => void;
}

const titleCaseWords = (s?: string) =>
  (s || '')
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const safeDate = (iso?: string | null): Date | null => {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? d : null;
};

const num = (...vals: any[]): number | null => {
  for (const v of vals) {
    if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
};

const ActivityDetailScreen: React.FC<ActivityDetailScreenProps> = ({ entry, onBack, onEdit }) => {
  const { C } = useTheme();
  const { data, loading, error, refetch } = useActivityDetail(entry?.id);

  const [imageViewer, setImageViewer] = useState(false);
  const [notesEditorOpen, setNotesEditorOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState<string | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  const act = useMemo(() => {
    const durationMin = num(data?.duration_minutes, entry?.duration);
    const distanceKm = num(data?.distance_km, entry?.distance);
    return {
      activityType: data?.activity_type ?? entry?.activityType ?? 'activity',
      durationMin,
      intensity: (data?.intensity ?? entry?.intensity ?? '').toLowerCase(),
      calories: num(data?.calories_burned, entry?.calories),
      distanceKm,
      steps: num(data?.steps, entry?.steps),
      heartRate: num(data?.heart_rate_avg, entry?.heartRate),
      glucoseImpact: (data?.glucose_impact ?? entry?.impact ?? '').toLowerCase(),
      startedAt: data?.started_at ?? data?.recorded_at ?? entry?.date,
      endedAt: data?.ended_at ?? null,
      durationHuman: data?.duration_human ?? (durationMin !== null ? `${durationMin} min` : '—'),
      distanceHuman: data?.distance_human ?? (distanceKm !== null ? `${distanceKm} km` : null),
      notes: localNotes !== undefined ? localNotes : data?.notes ?? entry?.notes ?? null,
      image: data?.image_url ? resolveStorageUrl(data.image_url) : entry?.image,
    };
  }, [data, entry, localNotes]);

  const title = titleCaseWords(act.activityType);

  // ----- Intensity config -----
  const intensityCfg = (() => {
    switch (act.intensity) {
      case 'low':
        return { label: 'Low', color: TEAL, bg: '#E8FFF5', Icon: Zap };
      case 'moderate':
        return { label: 'Moderate', color: ORANGE, bg: '#FFF5E8', Icon: Zap };
      case 'high':
        return { label: 'High', color: RED, bg: '#FFF0F0', Icon: Flame };
      default:
        return { label: titleCaseWords(act.intensity) || '—', color: C.textSm, bg: C.bg, Icon: ActivityIcon };
    }
  })();

  // ----- Glucose impact config -----
  const impactCfg = (() => {
    switch (act.glucoseImpact) {
      case 'decrease':
        return {
          Icon: TrendingDown,
          color: C.green,
          bg: C.greenBg,
          title: 'Glucose Decrease Expected',
          sub: 'Physical activity typically lowers blood glucose',
          badge: 'Beneficial',
          badgeColor: C.green,
        };
      case 'increase':
        return {
          Icon: TrendingUp,
          color: C.red,
          bg: C.redBg,
          title: 'Glucose Increase Possible',
          sub: 'High intensity may temporarily raise glucose',
          badge: 'Monitor',
          badgeColor: C.amber,
        };
      case 'stable':
        return {
          Icon: ArrowRight,
          color: C.textSm,
          bg: C.bg,
          title: 'Minimal Glucose Change',
          sub: 'Low intensity activity with minimal glucose effect',
          badge: 'Neutral',
          badgeColor: C.textSm,
        };
      default:
        return null;
    }
  })();

  const dateObj = safeDate(act.startedAt);
  const endObj = safeDate(act.endedAt);
  const dayLabel = dateObj ? format(dateObj, 'EEEE, MMMM d, yyyy') : entry?.date || '—';
  const startLabel = dateObj ? format(dateObj, 'hh:mm a') : entry?.time || '—';
  const endLabel = endObj ? format(endObj, 'hh:mm a') : '—';

  // ----- Stats grid: always Duration + Intensity, optional ones only when present -----
  type Stat = { key: string; label: string; value?: string; badge?: { label: string; color: string } };
  const stats: Stat[] = useMemo(() => {
    const list: Stat[] = [
      { key: 'duration', label: 'Duration', value: act.durationHuman },
      { key: 'intensity', label: 'Intensity', badge: { label: intensityCfg.label, color: intensityCfg.color } },
    ];
    if (act.calories !== null) list.push({ key: 'calories', label: 'Calories', value: `${Math.round(act.calories)} kcal` });
    if (act.distanceHuman) list.push({ key: 'distance', label: 'Distance', value: act.distanceHuman });
    if (act.steps !== null) list.push({ key: 'steps', label: 'Steps', value: act.steps.toLocaleString() });
    if (act.heartRate !== null) list.push({ key: 'hr', label: 'Heart Rate', value: `${Math.round(act.heartRate)} bpm` });
    return list;
  }, [act, intensityCfg]);

  // ----- Actions -----
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${title} — ${act.durationHuman}\nIntensity: ${intensityCfg.label}\n${dayLabel} at ${startLabel}${
          act.notes ? `\n\nNotes: ${act.notes}` : ''
        }`,
      });
    } catch (e) {
      /* dismissed */
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete activity', 'Are you sure you want to delete this activity? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await apiService.deleteLog(entry.id, 'activity');
            onBack();
          } catch (e: any) {
            setDeleting(false);
            Alert.alert('Delete failed', e?.message || 'Could not delete this activity.');
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    if (onEdit) onEdit();
    else Alert.alert('Edit Entry', 'Full activity editing is coming soon. You can edit notes below in the meantime.');
  };

  const openNotesEditor = () => {
    setNotesDraft(act.notes || '');
    setNotesEditorOpen(true);
  };

  const saveNotes = async () => {
    const next = notesDraft.trim();
    setSavingNotes(true);
    try {
      await apiService.updateActivity(entry.id, { notes: next });
      setLocalNotes(next.length ? next : null);
      setNotesEditorOpen(false);
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Could not update notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  };

  const dash = (v: string | null | undefined) => (v !== null && v !== undefined ? v : '—');

  if (error && !data) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: C.bg }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: PRIMARY_RED }]}>
          <ChevronLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.errorTitle, { color: C.text }]}>Couldn't load activity</Text>
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
        {/* SECTION 1 — HERO */}
        <View style={styles.hero}>
          {act.image ? (
            <Image source={{ uri: act.image }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <View style={[styles.heroFallback, { backgroundColor: C.redBg }]}>
              <ActivityIcon size={80} color={C.red} strokeWidth={1} style={{ opacity: 0.25 }} />
            </View>
          )}
          <LinearGradient colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)']} style={styles.heroGradient} />

          <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: PRIMARY_RED }]} activeOpacity={0.85}>
            <ChevronLeft size={22} color="#FFF" />
          </TouchableOpacity>
          {!!act.image && (
            <TouchableOpacity style={[styles.expandBtn, { backgroundColor: PRIMARY_RED }]} onPress={() => setImageViewer(true)} activeOpacity={0.85}>
              <Maximize2 size={16} color="#FFF" />
            </TouchableOpacity>
          )}

          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroTitle}>{title}</Text>
            <View style={styles.heroMetaRow}>
              <Clock size={12} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroMetaText}>
                {startLabel}  ·  {dayLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION 2 — ACTIVITY HIGHLIGHT (Duration) */}
        <View style={[styles.highlightRow, { backgroundColor: C.white, borderBottomColor: C.divider }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.highlightLabel, { color: TEAL }]}>DURATION</Text>
            <View style={styles.highlightValueRow}>
              <Text style={[styles.highlightValue, { color: TEAL }]}>{act.durationMin ?? '—'}</Text>
              <Text style={[styles.highlightUnit, { color: C.textSm }]}>minutes</Text>
            </View>
          </View>
          <View style={[styles.highlightIcon, { backgroundColor: intensityCfg.bg }]}>
            <intensityCfg.Icon size={24} color={intensityCfg.color} />
          </View>
        </View>

        {/* SECTION 3 — DETAILS (metadata rows) */}
        <View style={[styles.metaCard, { backgroundColor: C.white, borderColor: C.divider }]}>
          <MetadataRow label="Activity" value={title} valueColor={C.red} />
          <MetadataRow label="Duration" value={act.durationHuman} />
          <MetadataRow label="Intensity" value={titleCaseWords(act.intensity) || '—'} valueColor={intensityCfg.color} valueBold />
          <MetadataRow label="Start Time" value={startLabel} />
          <MetadataRow label="End Time" value={endLabel} valueColor={endObj ? undefined : C.textXs} />
          <MetadataRow label="Day" value={dayLabel} />
          <MetadataRow
            label="Calories"
            value={act.calories !== null ? `${Math.round(act.calories)} kcal` : '—'}
            valueColor={act.calories !== null ? undefined : C.textXs}
          />
          <MetadataRow
            label="Distance"
            value={dash(act.distanceHuman)}
            valueColor={act.distanceHuman ? undefined : C.textXs}
          />
          <MetadataRow
            label="Steps"
            value={act.steps !== null ? act.steps.toLocaleString() : '—'}
            valueColor={act.steps !== null ? undefined : C.textXs}
          />
          <MetadataRow
            label="Heart Rate"
            value={act.heartRate !== null ? `${Math.round(act.heartRate)} bpm` : '—'}
            valueColor={act.heartRate !== null ? undefined : C.textXs}
            last
          />
        </View>

        {/* SECTION 4 — ACTIVITY STATS GRID */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text, marginBottom: 14 }]}>Activity Stats</Text>
          <View style={[styles.statsCard, { backgroundColor: C.white, borderColor: C.divider }]}>
            <View style={styles.statsGrid}>
              {stats.map((s) => (
                <View key={s.key} style={styles.statCell}>
                  <Text style={[styles.statLabel, { color: C.textSm }]}>{s.label}</Text>
                  {s.badge ? (
                    <View style={[styles.intensityPill, { backgroundColor: s.badge.color }]}>
                      <Text style={styles.intensityPillText}>{s.badge.label}</Text>
                    </View>
                  ) : (
                    <Text style={[styles.statValue, { color: C.text }]}>{s.value}</Text>
                  )}
                </View>
              ))}
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
          {act.notes ? (
            <Text style={[styles.notesText, { color: C.textSm }]}>{act.notes}</Text>
          ) : (
            <Text style={[styles.notesEmpty, { color: C.textXs }]}>No notes added yet.</Text>
          )}
        </View>

        {/* SECTION 6 — GLUCOSE IMPACT CARD */}
        {impactCfg && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text, marginBottom: 14 }]}>Glucose Impact</Text>
            <View style={[styles.impactCard, { backgroundColor: C.white, borderColor: C.divider }]}>
              <View style={[styles.impactIconCircle, { backgroundColor: impactCfg.bg }]}>
                <impactCfg.Icon size={20} color={impactCfg.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.impactCardTitle, { color: C.text }]}>{impactCfg.title}</Text>
                <Text style={[styles.impactCardSub, { color: C.textSm }]}>{impactCfg.sub}</Text>
              </View>
              <View style={[styles.impactBadge, { backgroundColor: impactCfg.badgeColor }]}>
                <Text style={styles.impactBadgeText}>{impactCfg.badge}</Text>
              </View>
            </View>
          </View>
        )}

        {/* SECTION 7 — ACTION BUTTONS */}
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
          {!!act.image && <Image source={{ uri: act.image }} style={styles.viewerImg} resizeMode="contain" />}
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
              placeholder="Add a note about this activity…"
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

  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  highlightLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  highlightValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  highlightValue: { fontSize: 34, fontWeight: '900', lineHeight: 38 },
  highlightUnit: { fontSize: 14, fontWeight: '600', marginLeft: 8 },
  highlightIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

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

  statsCard: { borderWidth: 1, borderRadius: 18, padding: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCell: { width: '50%', paddingHorizontal: 12, paddingVertical: 14 },
  statLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800' },
  intensityPill: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  intensityPillText: { fontSize: 13, fontWeight: '800', color: '#FFF' },

  impactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, padding: 14 },
  impactIconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  impactCardTitle: { fontSize: 14, fontWeight: '800' },
  impactCardSub: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  impactBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  impactBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },

  editPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  editPillText: { fontSize: 12, fontWeight: '700' },
  notesText: { fontSize: 13.5, lineHeight: 20 },
  notesEmpty: { fontSize: 13.5, fontStyle: 'italic' },

  metaCard: { marginHorizontal: 20, marginTop: 22, borderRadius: 20, borderWidth: 1, paddingHorizontal: 18 },

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

export default ActivityDetailScreen;
