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
  ChevronRight,
  Maximize2,
  Clock,
  Syringe,
  Zap,
  Layers,
  Utensils,
  Droplet,
  Share2,
  Pencil,
  Trash2,
  X,
} from 'lucide-react-native';
import { format, parseISO, isValid } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { apiService, resolveStorageUrl } from '../services/apiService';
import { emitNavigate } from '../services/uiEvents';
import { useInjectionDetail } from '../hooks/useInjectionDetail';
import MetadataRow from '../components/MetadataRow';

const { width, height } = Dimensions.get('window');

const PRIMARY_RED = '#8B0000';
const RED_BG = '#FFF0F0';

interface InjectionDetailScreenProps {
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

const safeDate = (iso?: string): Date | null => {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? d : null;
};

const InjectionDetailScreen: React.FC<InjectionDetailScreenProps> = ({ entry, onBack, onEdit }) => {
  const { C } = useTheme();
  const { data, loading, error, refetch } = useInjectionDetail(entry?.id);

  const [imageViewer, setImageViewer] = useState(false);
  const [notesEditorOpen, setNotesEditorOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState<string | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  const inj = useMemo(() => {
    const insulinType = (data?.insulin_type ?? entry?.insulinType ?? '').toLowerCase();
    const reason = (data?.reason ?? entry?.reason ?? '').toLowerCase();
    return {
      insulinType,
      dose: data?.dose_units ?? entry?.dose ?? null,
      site: data?.injection_site ?? entry?.site ?? null,
      reason,
      injectedAt: data?.injected_at ?? data?.recorded_at ?? entry?.date,
      notes: localNotes !== undefined ? localNotes : data?.notes ?? entry?.notes ?? null,
      image: data?.image_url ? resolveStorageUrl(data.image_url) : entry?.image,
      relatedMeal: data?.related_meal ?? null,
      relatedMeasurement: data?.related_measurement ?? null,
    };
  }, [data, entry, localNotes]);

  // ----- Insulin type config -----
  const insulinCfg = (() => {
    switch (inj.insulinType) {
      case 'rapid_acting':
        return { title: 'Rapid Acting Insulin', short: 'Rapid Acting', desc: 'Fast onset, peaks in 1-2 hours', Icon: Zap };
      case 'long_acting':
        return { title: 'Long Acting Insulin', short: 'Long Acting', desc: 'Slow release, lasts 18-24 hours', Icon: Clock };
      case 'mixed':
        return { title: 'Mixed Insulin', short: 'Mixed', desc: 'Combination of rapid and long acting', Icon: Layers };
      default:
        return { title: titleCaseWords(inj.insulinType) || 'Insulin', short: titleCaseWords(inj.insulinType) || 'Insulin', desc: '', Icon: Syringe };
    }
  })();

  // ----- Reason config -----
  const reasonCfg = (() => {
    switch (inj.reason) {
      case 'meal_coverage':
        return { label: 'Meal Coverage', color: PRIMARY_RED };
      case 'basal':
        return { label: 'Basal', color: C.blue };
      case 'correction':
        return { label: 'Correction', color: C.amber };
      default:
        return inj.reason ? { label: titleCaseWords(inj.reason), color: C.textSm } : null;
    }
  })();

  const dateObj = safeDate(inj.injectedAt);
  const dayLabel = dateObj ? format(dateObj, 'EEEE, MMMM d, yyyy') : entry?.date || '—';
  const hourLabel = dateObj ? format(dateObj, 'hh:mm a') : entry?.time || '—';

  // ----- Related-entry navigation (custom state navigator: emit a 'detail' route with a row payload) -----
  const openRelatedMeal = () => {
    if (!inj.relatedMeal) return;
    emitNavigate('detail', {
      type: 'meal',
      id: inj.relatedMeal.id,
      name: inj.relatedMeal.title,
      mealType: inj.relatedMeal.meal_type,
    });
  };
  const openRelatedMeasurement = () => {
    if (!inj.relatedMeasurement) return;
    emitNavigate('detail', {
      type: 'measurement',
      id: inj.relatedMeasurement.id,
      value: inj.relatedMeasurement.value_mg_dl,
      status: titleCaseWords(inj.relatedMeasurement.health_status),
    });
  };

  const measurementStatusColor = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'high') return C.red;
    if (s === 'low') return C.amber;
    return C.green;
  };

  // ----- Actions -----
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${insulinCfg.title} — ${inj.dose ?? '—'} units\nReason: ${reasonCfg?.label || '—'}\n${dayLabel} at ${hourLabel}${
          inj.notes ? `\n\nNotes: ${inj.notes}` : ''
        }`,
      });
    } catch (e) {
      /* dismissed */
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete injection', 'Are you sure you want to delete this injection? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await apiService.deleteLog(entry.id, 'injection');
            onBack();
          } catch (e: any) {
            setDeleting(false);
            Alert.alert('Delete failed', e?.message || 'Could not delete this injection.');
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    if (onEdit) onEdit();
    else Alert.alert('Edit Entry', 'Full injection editing is coming soon. You can edit notes below in the meantime.');
  };

  const openNotesEditor = () => {
    setNotesDraft(inj.notes || '');
    setNotesEditorOpen(true);
  };

  const saveNotes = async () => {
    const next = notesDraft.trim();
    setSavingNotes(true);
    try {
      await apiService.updateInjection(entry.id, { notes: next });
      setLocalNotes(next.length ? next : null);
      setNotesEditorOpen(false);
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Could not update notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  };

  if (error && !data) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: C.bg }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: PRIMARY_RED }]}>
          <ChevronLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.errorTitle, { color: C.text }]}>Couldn't load injection</Text>
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
          {inj.image ? (
            <Image source={{ uri: inj.image }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <View style={[styles.heroFallback, { backgroundColor: C.redBg }]}>
              <Syringe size={80} color={C.red} strokeWidth={1} style={{ opacity: 0.25 }} />
            </View>
          )}
          <LinearGradient colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)']} style={styles.heroGradient} />

          <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: PRIMARY_RED }]} activeOpacity={0.85}>
            <ChevronLeft size={22} color="#FFF" />
          </TouchableOpacity>
          {!!inj.image && (
            <TouchableOpacity style={[styles.expandBtn, { backgroundColor: PRIMARY_RED }]} onPress={() => setImageViewer(true)} activeOpacity={0.85}>
              <Maximize2 size={16} color="#FFF" />
            </TouchableOpacity>
          )}

          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroTitle}>{insulinCfg.title}</Text>
            <View style={styles.heroMetaRow}>
              <Clock size={12} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroMetaText}>
                {hourLabel}  ·  {dayLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION 2 — DOSE HIGHLIGHT */}
        <View style={[styles.highlightRow, { backgroundColor: C.white, borderBottomColor: C.divider }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.highlightLabel, { color: PRIMARY_RED }]}>INSULIN DOSE</Text>
            <View style={styles.highlightValueRow}>
              <Text style={[styles.highlightValue, { color: PRIMARY_RED }]}>{inj.dose ?? '—'}</Text>
              <Text style={[styles.highlightUnit, { color: C.textSm }]}>units</Text>
            </View>
          </View>
          <View style={[styles.highlightIcon, { backgroundColor: RED_BG }]}>
            <Syringe size={24} color={PRIMARY_RED} />
          </View>
        </View>

        {/* SECTION 3 — DETAILS (metadata rows) */}
        <View style={[styles.metaCard, { backgroundColor: C.white, borderColor: C.divider }]}>
          <MetadataRow label="Title" value={insulinCfg.title} valueColor={C.red} />
          <MetadataRow label="Dose" value={inj.dose !== null && inj.dose !== undefined ? `${inj.dose} units` : '—'} />
          <MetadataRow label="Reason" value={reasonCfg?.label || '—'} />
          <MetadataRow label="Day" value={dayLabel} />
          <MetadataRow label="Hour" value={hourLabel} />
          <MetadataRow label="Injection Site" value={inj.site ? titleCaseWords(inj.site) : '—'} valueColor={inj.site ? undefined : C.textXs} last />
        </View>

        {/* SECTION 4 — INJECTION SUMMARY CARD */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text, marginBottom: 14 }]}>Injection Summary</Text>
          <View style={[styles.summaryCard, { backgroundColor: C.white, borderColor: C.divider }]}>
            {reasonCfg && (
              <>
                <View style={styles.summaryReasonRow}>
                  <Text style={[styles.summaryReasonLabel, { color: C.textSm }]}>Reason</Text>
                  <View style={[styles.reasonPill, { backgroundColor: reasonCfg.color }]}>
                    <Text style={styles.reasonPillText}>{reasonCfg.label}</Text>
                  </View>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: C.divider }]} />
              </>
            )}

            <View style={styles.summaryTypeRow}>
              <View style={[styles.summaryTypeIcon, { backgroundColor: RED_BG }]}>
                <insulinCfg.Icon size={20} color={PRIMARY_RED} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryTypeTitle, { color: C.text }]}>{insulinCfg.short}</Text>
                {!!insulinCfg.desc && <Text style={[styles.summaryTypeDesc, { color: C.textSm }]}>{insulinCfg.desc}</Text>}
              </View>
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
          {inj.notes ? (
            <Text style={[styles.notesText, { color: C.textSm }]}>{inj.notes}</Text>
          ) : (
            <Text style={[styles.notesEmpty, { color: C.textXs }]}>No notes added yet.</Text>
          )}
        </View>

        {/* SECTION 6 — RELATED ENTRIES */}
        {(inj.relatedMeal || inj.relatedMeasurement) && (
          <View style={styles.section}>
            {inj.relatedMeal && (
              <>
                <Text style={[styles.sectionTitle, { color: C.text, marginBottom: 12 }]}>Related Meal</Text>
                <TouchableOpacity
                  style={[styles.relatedCard, { backgroundColor: C.white, borderColor: C.divider }]}
                  onPress={openRelatedMeal}
                  activeOpacity={0.8}
                >
                  <View style={[styles.relatedIcon, { backgroundColor: C.amberBg }]}>
                    <Utensils size={18} color={C.amber} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.relatedTitle, { color: C.text }]}>{titleCaseWords(inj.relatedMeal.title)}</Text>
                    <Text style={[styles.relatedSub, { color: C.textSm }]}>{titleCaseWords(inj.relatedMeal.meal_type)}</Text>
                  </View>
                  <ChevronRight size={20} color={C.textXs} />
                </TouchableOpacity>
              </>
            )}

            {inj.relatedMeasurement && (
              <>
                <Text style={[styles.sectionTitle, { color: C.text, marginTop: inj.relatedMeal ? 18 : 0, marginBottom: 12 }]}>Related Reading</Text>
                <TouchableOpacity
                  style={[styles.relatedCard, { backgroundColor: C.white, borderColor: C.divider }]}
                  onPress={openRelatedMeasurement}
                  activeOpacity={0.8}
                >
                  <View style={[styles.relatedIcon, { backgroundColor: C.redBg }]}>
                    <Droplet size={18} color={C.red} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.relatedTitle, { color: C.text }]}>{inj.relatedMeasurement.value_mg_dl} mg/dL</Text>
                    <Text style={[styles.relatedSub, { color: measurementStatusColor(inj.relatedMeasurement.health_status), fontWeight: '700' }]}>
                      {titleCaseWords(inj.relatedMeasurement.health_status)}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={C.textXs} />
                </TouchableOpacity>
              </>
            )}
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
          {!!inj.image && <Image source={{ uri: inj.image }} style={styles.viewerImg} resizeMode="contain" />}
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
              placeholder="Add a note about this injection…"
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

  summaryCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  summaryReasonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryReasonLabel: { fontSize: 14, fontWeight: '700' },
  reasonPill: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  reasonPillText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  summaryDivider: { height: 1, marginVertical: 14 },
  summaryTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryTypeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryTypeTitle: { fontSize: 14, fontWeight: '800' },
  summaryTypeDesc: { fontSize: 12, marginTop: 2 },

  relatedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  relatedIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  relatedTitle: { fontSize: 14, fontWeight: '800' },
  relatedSub: { fontSize: 12, marginTop: 2 },

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

export default InjectionDetailScreen;
