import { useCallback, useMemo, useState } from 'react';
import { Alert, Share } from 'react-native';
import { apiService } from '../../../services/apiService';
import { useActivityDetail } from '../../../hooks/useActivityDetail';
import { formatDay, formatHour } from '../measurementView';
import { titleCaseWords } from '../mealView';
import { mergeActivity, type ActivityEntryLike, type ActivityView } from '../activityView';

interface UseActivityDetailViewResult {
  view: ActivityView;
  hasData: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  title: string;
  intensityLabel: string;
  dayLabel: string;
  startLabel: string;
  endLabel: string;
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

/** All data + actions for the activity detail screen. Intensity/impact visuals stay in the screen. */
export function useActivityDetailView(
  entry: ActivityEntryLike | null | undefined,
  onBack: () => void,
  onEdit?: () => void,
): UseActivityDetailViewResult {
  const { data, loading, error, refetch } = useActivityDetail(entry?.id);

  const [localNotes, setLocalNotes] = useState<string | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const [notesEditorOpen, setNotesEditorOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const view = useMemo(() => mergeActivity(data, entry, localNotes), [data, entry, localNotes]);
  const title = titleCaseWords(view.activityType);
  const intensityLabel = titleCaseWords(view.intensity) || '—';
  const dayLabel = formatDay(view.startedAt, entry?.date);
  const startLabel = formatHour(view.startedAt, entry?.time);
  const endLabel = view.endedAt ? formatHour(view.endedAt) : '—';

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${title} — ${view.durationHuman}\nIntensity: ${intensityLabel}\n${dayLabel} at ${startLabel}${view.notes ? `\n\nNotes: ${view.notes}` : ''}`,
      });
    } catch {
      /* dismissed */
    }
  }, [title, view.durationHuman, intensityLabel, dayLabel, startLabel, view.notes]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete activity', 'Are you sure you want to delete this activity? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            if (entry?.id != null) await apiService.deleteLog(entry.id, 'activity');
            onBack();
          } catch (e) {
            setDeleting(false);
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Could not delete this activity.');
          }
        },
      },
    ]);
  }, [entry?.id, onBack]);

  const handleEdit = useCallback(() => {
    if (onEdit) onEdit();
    else Alert.alert('Edit Entry', 'Full activity editing is coming soon. You can edit notes below in the meantime.');
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
      if (entry?.id != null) await apiService.updateActivity(entry.id, { notes: next });
      setLocalNotes(next.length ? next : null);
      setNotesEditorOpen(false);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not update notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  }, [notesDraft, entry?.id]);

  return {
    view, hasData: data !== null, loading, error, refetch, title, intensityLabel, dayLabel, startLabel, endLabel,
    deleting, handleShare, handleDelete, handleEdit,
    notesEditorOpen, notesDraft, setNotesDraft, openNotesEditor, closeNotesEditor, saveNotes, savingNotes,
  };
}
