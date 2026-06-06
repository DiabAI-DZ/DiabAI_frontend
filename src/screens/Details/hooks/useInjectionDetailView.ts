import { useCallback, useMemo, useState } from 'react';
import { Alert, Share } from 'react-native';
import { apiService } from '../../../services/apiService';
import { emitNavigate } from '../../../services/uiEvents';
import { useInjectionDetail } from '../../../hooks/useInjectionDetail';
import { formatDay, formatHour } from '../measurementView';
import {
  insulinConfig,
  mergeInjection,
  reasonLabel,
  type InjectionEntryLike,
  type InjectionView,
  type InsulinConfig,
} from '../injectionView';
import { titleCaseWords } from '../mealView';

interface UseInjectionDetailViewResult {
  view: InjectionView;
  hasData: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  insulinCfg: InsulinConfig;
  reasonText: string | null;
  dayLabel: string;
  hourLabel: string;
  openRelatedMeal: () => void;
  openRelatedMeasurement: () => void;
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

/** All data + actions for the injection detail screen. */
export function useInjectionDetailView(
  entry: InjectionEntryLike | null | undefined,
  onBack: () => void,
  onEdit?: () => void,
): UseInjectionDetailViewResult {
  const { data, loading, error, refetch } = useInjectionDetail(entry?.id);

  const [localNotes, setLocalNotes] = useState<string | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const [notesEditorOpen, setNotesEditorOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const view = useMemo(() => mergeInjection(data, entry, localNotes), [data, entry, localNotes]);
  const insulinCfg = useMemo(() => insulinConfig(view.insulinType), [view.insulinType]);
  const reasonText = reasonLabel(view.reason);
  const dayLabel = formatDay(view.injectedAt, entry?.date);
  const hourLabel = formatHour(view.injectedAt, entry?.time);

  const openRelatedMeal = useCallback(() => {
    if (!view.relatedMeal) return;
    emitNavigate('detail', { type: 'meal', id: view.relatedMeal.id, name: view.relatedMeal.title, mealType: view.relatedMeal.meal_type });
  }, [view.relatedMeal]);

  const openRelatedMeasurement = useCallback(() => {
    if (!view.relatedMeasurement) return;
    emitNavigate('detail', {
      type: 'measurement',
      id: view.relatedMeasurement.id,
      value: view.relatedMeasurement.value_mg_dl,
      status: titleCaseWords(view.relatedMeasurement.health_status),
    });
  }, [view.relatedMeasurement]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${insulinCfg.title} — ${view.dose ?? '—'} units\nReason: ${reasonText || '—'}\n${dayLabel} at ${hourLabel}${view.notes ? `\n\nNotes: ${view.notes}` : ''}`,
      });
    } catch {
      /* dismissed */
    }
  }, [insulinCfg.title, view.dose, reasonText, dayLabel, hourLabel, view.notes]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete injection', 'Are you sure you want to delete this injection? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            if (entry?.id != null) await apiService.deleteLog(entry.id, 'injection');
            onBack();
          } catch (e) {
            setDeleting(false);
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Could not delete this injection.');
          }
        },
      },
    ]);
  }, [entry?.id, onBack]);

  const handleEdit = useCallback(() => {
    if (onEdit) onEdit();
    else Alert.alert('Edit Entry', 'Full injection editing is coming soon. You can edit notes below in the meantime.');
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
      if (entry?.id != null) await apiService.updateInjection(entry.id, { notes: next });
      setLocalNotes(next.length ? next : null);
      setNotesEditorOpen(false);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not update notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  }, [notesDraft, entry?.id]);

  return {
    view, hasData: data !== null, loading, error, refetch, insulinCfg, reasonText, dayLabel, hourLabel,
    openRelatedMeal, openRelatedMeasurement,
    deleting, handleShare, handleDelete, handleEdit,
    notesEditorOpen, notesDraft, setNotesDraft, openNotesEditor, closeNotesEditor, saveNotes, savingNotes,
  };
}
