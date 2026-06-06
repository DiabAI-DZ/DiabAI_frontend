import { useCallback, useMemo, useState } from 'react';
import { Alert, Share } from 'react-native';
import { useUser } from '../../../context/UserContext';
import { apiService } from '../../../services/apiService';
import { useMeasurementDetail } from '../../../hooks/useMeasurementDetail';
import {
  formatDay,
  formatHour,
  mergeMeasurement,
  synthesizeInsights,
  titleCase,
  type InsightCardData,
  type MeasurementEntryLike,
  type MeasurementView,
} from '../measurementView';

interface UseMeasurementDetailViewResult {
  view: MeasurementView;
  hasData: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  minGoal: number;
  maxGoal: number;
  dayLabel: string;
  hourLabel: string;
  statusLabel: string;
  dailyAvg: number | null | undefined;
  delta: number | null;
  deltaPositive: boolean;
  insightCards: InsightCardData[];
  deleting: boolean;
  handleShare: () => Promise<void>;
  handleDelete: () => void;
  handleEdit: () => void;
  notesEditorOpen: boolean;
  notesDraft: string;
  setNotesDraft: (text: string) => void;
  openNotesEditor: () => void;
  closeNotesEditor: () => void;
  saveNotes: () => Promise<void>;
  savingNotes: boolean;
}

/** All data + actions for the measurement detail screen. The screen stays presentation-only. */
export function useMeasurementDetailView(
  entry: MeasurementEntryLike | null | undefined,
  onBack: () => void,
  onEdit?: () => void,
): UseMeasurementDetailViewResult {
  const { profile } = useUser();
  const { data, loading, error, refetch } = useMeasurementDetail(entry?.id);

  const [localNotes, setLocalNotes] = useState<string | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const [notesEditorOpen, setNotesEditorOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const minGoal = profile?.goals?.min || 70;
  const maxGoal = profile?.goals?.max || 140;

  const view = useMemo(() => mergeMeasurement(data, entry, localNotes), [data, entry, localNotes]);
  const insightCards = useMemo(() => synthesizeInsights(view, minGoal, maxGoal), [view, minGoal, maxGoal]);

  const dayLabel = formatDay(view.measuredAt, entry?.date);
  const hourLabel = formatHour(view.measuredAt, entry?.time);
  const statusLabel = titleCase(view.status) || 'Normal';

  const dailyAvg = view.comparison?.daily_average_mg_dl;
  const delta = dailyAvg !== undefined && dailyAvg !== null ? Math.round(view.valueMgDl - dailyAvg) : null;
  const deltaPositive = (delta ?? 0) >= 0;

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Glucose reading: ${view.valueMgDl} mg/dL (${view.valueGL.toFixed(2)} g/L) — ${statusLabel}\n${dayLabel} at ${hourLabel}${view.notes ? `\n\nNotes: ${view.notes}` : ''}`,
      });
    } catch {
      // user dismissed / share unavailable — no-op
    }
  }, [view, statusLabel, dayLabel, hourLabel]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete measurement', 'Are you sure you want to delete this reading? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            if (entry?.id != null) await apiService.deleteLog(entry.id, 'measurement');
            onBack();
          } catch (e) {
            setDeleting(false);
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Could not delete this measurement.');
          }
        },
      },
    ]);
  }, [entry?.id, onBack]);

  const handleEdit = useCallback(() => {
    if (onEdit) onEdit();
    else Alert.alert('Edit Entry', 'Full entry editing is coming soon. You can edit notes below in the meantime.');
  }, [onEdit]);

  const openNotesEditor = useCallback(() => {
    setNotesDraft(view.notes || '');
    setNotesEditorOpen(true);
  }, [view.notes]);

  const closeNotesEditor = useCallback(() => setNotesEditorOpen(false), []);

  const saveNotes = useCallback(async () => {
    const next = notesDraft.trim();
    setSavingNotes(true);
    try {
      if (entry?.id != null) await apiService.updateMeasurement(entry.id, { notes: next });
      setLocalNotes(next.length ? next : null);
      setNotesEditorOpen(false);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not update notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  }, [notesDraft, entry?.id]);

  return {
    view, hasData: data !== null, loading, error, refetch, minGoal, maxGoal,
    dayLabel, hourLabel, statusLabel, dailyAvg, delta, deltaPositive, insightCards,
    deleting, handleShare, handleDelete, handleEdit,
    notesEditorOpen, notesDraft, setNotesDraft, openNotesEditor, closeNotesEditor, saveNotes, savingNotes,
  };
}
