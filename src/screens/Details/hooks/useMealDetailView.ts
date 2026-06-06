import { useCallback, useMemo, useState } from 'react';
import { Alert, Share } from 'react-native';
import { apiService } from '../../../services/apiService';
import { useMealDetail } from '../../../hooks/useMealDetail';
import { formatDay, formatHour, type InsightCardData } from '../measurementView';
import {
  MEAL_TYPE_LABELS,
  mergeMeal,
  synthesizeMealInsights,
  titleCaseWords,
  type MealEntryLike,
  type MealView,
} from '../mealView';

interface UseMealDetailViewResult {
  view: MealView;
  hasData: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  title: string;
  typeLabel: string;
  dayLabel: string;
  hourLabel: string;
  impactMgDl: number | null;
  impactText: string;
  insightCards: InsightCardData[];
  tagCardItems: string[];
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

/** All data + actions for the meal detail screen. The screen stays presentation-only. */
export function useMealDetailView(
  entry: MealEntryLike | null | undefined,
  onBack: () => void,
  onEdit?: () => void,
): UseMealDetailViewResult {
  const { data, loading, error, refetch } = useMealDetail(entry?.id);

  const [localNotes, setLocalNotes] = useState<string | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const [notesEditorOpen, setNotesEditorOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const view = useMemo(() => mergeMeal(data, entry, localNotes), [data, entry, localNotes]);

  const title = titleCaseWords(view.titleRaw);
  const typeLabel = MEAL_TYPE_LABELS[view.mealType] || titleCaseWords(view.mealType);
  const dayLabel = formatDay(view.eatenAt, entry?.date);
  const hourLabel = formatHour(view.eatenAt, entry?.time);

  const impactMgDl = view.impactMgDl;
  const impactText = impactMgDl === null ? '—' : `${impactMgDl > 0 ? '+' : impactMgDl < 0 ? '-' : ''}${Math.abs(impactMgDl)} mg/dL`;

  const insightCards = useMemo(() => synthesizeMealInsights(view, impactText), [view, impactText]);
  const tagCardItems = useMemo(() => [typeLabel, ...view.tags], [typeLabel, view.tags]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${title} — ${typeLabel}\nEstimated glucose impact: ${impactText}\n${dayLabel} at ${hourLabel}${view.notes ? `\n\nNotes: ${view.notes}` : ''}`,
      });
    } catch {
      /* dismissed */
    }
  }, [title, typeLabel, impactText, dayLabel, hourLabel, view.notes]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete meal', 'Are you sure you want to delete this meal? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            if (entry?.id != null) await apiService.deleteLog(entry.id, 'meal');
            onBack();
          } catch (e) {
            setDeleting(false);
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Could not delete this meal.');
          }
        },
      },
    ]);
  }, [entry?.id, onBack]);

  const handleEdit = useCallback(() => {
    if (onEdit) onEdit();
    else Alert.alert('Edit Entry', 'Full meal editing is coming soon. You can edit notes below in the meantime.');
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
      if (entry?.id != null) await apiService.updateMeal(entry.id, { notes: next });
      setLocalNotes(next.length ? next : null);
      setNotesEditorOpen(false);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not update notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  }, [notesDraft, entry?.id]);

  return {
    view, hasData: data !== null, loading, error, refetch, title, typeLabel, dayLabel, hourLabel,
    impactMgDl, impactText, insightCards, tagCardItems,
    deleting, handleShare, handleDelete, handleEdit,
    notesEditorOpen, notesDraft, setNotesDraft, openNotesEditor, closeNotesEditor, saveNotes, savingNotes,
  };
}
