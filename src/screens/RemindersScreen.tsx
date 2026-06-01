import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import {
  ChevronLeft,
  Bell,
  Clock,
  Plus,
  Trash2,
  Droplets,
  Syringe,
  Utensils,
  Calendar,
  X,
  Check,
  Pencil,
} from 'lucide-react-native';

type ReminderType = 'glucose' | 'medication' | 'meal';

interface Reminder {
  id: string;
  type: ReminderType;
  time: string;
  days: string[];
  enabled: boolean;
  notes?: string;
}

interface ReminderDraft {
  type: ReminderType;
  time: string;
  days: string[];
  enabled: boolean;
  notes: string;
}

interface RemindersScreenProps {
  onBack: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STORAGE_KEY = '@diabai_health_reminders';

const DEFAULT_REMINDERS: Reminder[] = [
  { id: '1', type: 'glucose', time: '08:00 AM', days: DAYS, enabled: true, notes: 'Morning fasting' },
  { id: '2', type: 'medication', time: '09:00 AM', days: DAYS, enabled: true, notes: 'Metformin' },
  { id: '3', type: 'meal', time: '01:00 PM', days: DAYS, enabled: false },
  { id: '4', type: 'glucose', time: '10:00 PM', days: DAYS, enabled: true, notes: 'Before bed' },
];

const REMINDER_TYPES: Array<{ type: ReminderType; label: string }> = [
  { type: 'glucose', label: 'Glucose' },
  { type: 'medication', label: 'Medication' },
  { type: 'meal', label: 'Meal' },
];

const QUICK_TIMES = ['08:00 AM', '12:00 PM', '06:00 PM', '10:00 PM'];

const createEmptyDraft = (): ReminderDraft => ({
  type: 'glucose',
  time: '08:00 AM',
  days: DAYS,
  enabled: true,
  notes: '',
});

const sortDays = (days: string[]) => DAYS.filter(day => days.includes(day));

const normalizeTime = (value: string) => {
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, ' ');
  const match = cleaned.match(/^(\d{1,2})(?::?(\d{2}))?\s*(AM|PM)$/);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? '00');

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${match[3]}`;
};

const createReminderId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const RemindersScreen: React.FC<RemindersScreenProps> = ({ onBack }) => {
  const { C, isDark } = useTheme();

  const [reminders, setReminders] = useState<Reminder[]>(DEFAULT_REMINDERS);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReminderDraft>(createEmptyDraft);
  const [formError, setFormError] = useState('');
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadReminders = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isMounted) return;

        if (saved) {
          const parsed = JSON.parse(saved) as Reminder[];
          if (Array.isArray(parsed)) {
            setReminders(parsed);
          }
        }
      } catch {
        if (isMounted) {
          setStorageError('Saved reminders could not be loaded.');
        }
      } finally {
        if (isMounted) {
          setHasLoaded(true);
        }
      }
    };

    loadReminders();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders)).catch(() => {
      setStorageError('Reminder changes could not be saved on this device.');
    });
  }, [hasLoaded, reminders]);

  const openCreateEditor = () => {
    setEditingId(null);
    setDraft(createEmptyDraft());
    setFormError('');
    setIsEditorOpen(true);
  };

  const openEditEditor = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setDraft({
      type: reminder.type,
      time: reminder.time,
      days: sortDays(reminder.days),
      enabled: reminder.enabled,
      notes: reminder.notes ?? '',
    });
    setFormError('');
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setFormError('');
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const toggleDraftDay = (day: string) => {
    setDraft(prev => {
      const nextDays = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : sortDays([...prev.days, day]);

      return { ...prev, days: nextDays };
    });
  };

  const toggleAllDraftDays = () => {
    setDraft(prev => ({
      ...prev,
      days: prev.days.length === DAYS.length ? [] : DAYS,
    }));
  };

  const saveDraft = () => {
    const normalizedTime = normalizeTime(draft.time);

    if (!normalizedTime) {
      setFormError('Enter a time like 08:00 AM or 10 PM.');
      return;
    }

    if (draft.days.length === 0) {
      setFormError('Choose at least one repeat day.');
      return;
    }

    const reminder: Reminder = {
      id: editingId ?? createReminderId(),
      type: draft.type,
      time: normalizedTime,
      days: sortDays(draft.days),
      enabled: draft.enabled,
      notes: draft.notes.trim() || undefined,
    };

    setReminders(prev => {
      if (!editingId) {
        return [reminder, ...prev];
      }

      return prev.map(item => item.id === editingId ? reminder : item);
    });

    closeEditor();
  };

  const deleteReminder = (reminder: Reminder) => {
    Alert.alert(
      'Delete Reminder',
      `Remove the ${reminder.time} ${reminder.type} reminder?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setReminders(prev => prev.filter(r => r.id !== reminder.id)),
        },
      ]
    );
  };

  const getTypeIcon = (type: ReminderType, size = 20) => {
    switch (type) {
      case 'glucose': return <Droplets size={size} color={C.red} />;
      case 'medication': return <Syringe size={size} color={C.blue} />;
      case 'meal': return <Utensils size={size} color={C.amber} />;
    }
  };

  const getTypeColor = (type: ReminderType) => {
    switch (type) {
      case 'glucose': return C.red;
      case 'medication': return C.blue;
      case 'meal': return C.amber;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { borderBottomColor: C.divider }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft size={24} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Bell size={20} color={C.red} style={{ marginRight: 8 }} />
          <Text style={[styles.title, { color: C.text }]}>Health Reminders</Text>
        </View>
        <TouchableOpacity onPress={openCreateEditor} style={[styles.addBtn, { backgroundColor: C.redBg }]}>
          <Plus size={20} color={C.red} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={[styles.introText, { color: C.textSm }]}>
            Stay on top of your management plan with scheduled alerts for measurements, medication, and meals.
          </Text>
          {storageError ? (
            <Text style={[styles.storageErrorText, { color: C.red }]}>{storageError}</Text>
          ) : null}
        </View>

        <View style={styles.remindersList}>
          {reminders.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: C.white, borderColor: C.divider }]}>
              <View style={[styles.emptyIconBox, { backgroundColor: C.redBg }]}>
                <Bell size={24} color={C.red} />
              </View>
              <Text style={[styles.emptyTitle, { color: C.text }]}>No reminders yet</Text>
              <Text style={[styles.emptyText, { color: C.textSm }]}>
                Create a reminder for glucose checks, medication, or meals.
              </Text>
            </View>
          ) : (
            reminders.map((reminder) => (
              <View
                key={reminder.id}
                style={[
                  styles.reminderCard,
                  { backgroundColor: C.white, borderColor: C.divider },
                  !reminder.enabled && { opacity: 0.6 },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, { backgroundColor: getTypeColor(reminder.type) + '15' }]}>
                    {getTypeIcon(reminder.type)}
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => openEditEditor(reminder)}
                    style={styles.reminderInfo}
                  >
                    <Text style={[styles.reminderTime, { color: C.text }]}>{reminder.time}</Text>
                    <Text style={[styles.reminderType, { color: C.textSm }]}>
                      {reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1)} • {reminder.notes || 'No notes'}
                    </Text>
                  </TouchableOpacity>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={() => toggleReminder(reminder.id)}
                    trackColor={{ false: '#DDD', true: C.red }}
                    thumbColor="#FFF"
                  />
                </View>

                <View style={[styles.cardDivider, { backgroundColor: C.divider }]} />

                <View style={styles.cardBottom}>
                  <View style={styles.daysRow}>
                    {DAYS.map((day) => {
                      const isSelected = reminder.days.includes(day);
                      return (
                        <View
                          key={day}
                          style={[
                            styles.dayPill,
                            isSelected
                              ? { backgroundColor: C.redBg, borderColor: C.red }
                              : { backgroundColor: isDark ? '#211D1D' : '#F5F5F5', borderColor: C.divider },
                          ]}
                        >
                          <Text style={[styles.dayText, { color: isSelected ? C.red : C.textXs }]}>
                            {day.charAt(0)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => openEditEditor(reminder)} style={styles.iconActionBtn}>
                      <Pencil size={17} color={C.textSm} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteReminder(reminder)} style={styles.iconActionBtn}>
                      <Trash2 size={18} color={C.textSm} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity onPress={openCreateEditor} style={[styles.createBtn, { backgroundColor: C.red }]}>
          <Plus size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.createBtnText}>Create New Reminder</Text>
        </TouchableOpacity>

        <View style={[styles.infoBox, { backgroundColor: isDark ? '#1E1418' : '#FFF9F9', borderColor: C.redBorder }]}>
          <Calendar size={18} color={C.red} style={{ marginRight: 12, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: C.text }]}>Smart Suggestions</Text>
            <Text style={[styles.infoDesc, { color: C.textSm }]}>
              A glucose check 2 hours after your largest meal can help catch post-meal spikes.
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isEditorOpen}
        transparent
        animationType="slide"
        onRequestClose={closeEditor}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={closeEditor} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.editorSheet, { backgroundColor: C.white }]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.editorHeader}>
              <View style={[styles.editorIconBox, { backgroundColor: C.redBg }]}>
                {getTypeIcon(draft.type)}
              </View>
              <View style={styles.editorTitleWrap}>
                <Text style={[styles.editorTitle, { color: C.text }]}>
                  {editingId ? 'Edit Reminder' : 'New Reminder'}
                </Text>
                <Text style={[styles.editorSubtitle, { color: C.textSm }]}>
                  Glucose, medication, or meal schedule
                </Text>
              </View>
              <TouchableOpacity onPress={closeEditor} style={styles.closeBtn}>
                <X size={20} color={C.textSm} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editorScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: C.textSm }]}>Reminder Type</Text>
              <View style={styles.typeGrid}>
                {REMINDER_TYPES.map(item => {
                  const selected = draft.type === item.type;
                  return (
                    <TouchableOpacity
                      key={item.type}
                      onPress={() => setDraft(prev => ({ ...prev, type: item.type }))}
                      style={[
                        styles.typeOption,
                        {
                          borderColor: selected ? getTypeColor(item.type) : C.divider,
                          backgroundColor: selected ? getTypeColor(item.type) + '12' : (isDark ? '#211D1D' : '#FAFAFA'),
                        },
                      ]}
                    >
                      {getTypeIcon(item.type, 18)}
                      <Text style={[styles.typeOptionText, { color: selected ? getTypeColor(item.type) : C.text }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: C.textSm, marginTop: 20 }]}>Time</Text>
              <View style={[styles.timeInputWrap, { backgroundColor: C.redBg, borderColor: formError ? C.red : C.redBorder }]}>
                <Clock size={18} color={C.redMuted} />
                <TextInput
                  style={[styles.timeInput, { color: C.text }]}
                  value={draft.time}
                  onChangeText={(value) => {
                    setDraft(prev => ({ ...prev, time: value }));
                    if (formError) setFormError('');
                  }}
                  placeholder="08:00 AM"
                  placeholderTextColor={C.textXs}
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.quickTimesRow}>
                {QUICK_TIMES.map(time => (
                  <TouchableOpacity
                    key={time}
                    onPress={() => {
                      setDraft(prev => ({ ...prev, time }));
                      setFormError('');
                    }}
                    style={[styles.quickTimeBtn, { borderColor: C.divider }]}
                  >
                    <Text style={[styles.quickTimeText, { color: C.textSm }]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: C.textSm, marginTop: 20 }]}>Repeat Days</Text>
              <View style={styles.editorDaysRow}>
                {DAYS.map(day => {
                  const selected = draft.days.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => toggleDraftDay(day)}
                      style={[
                        styles.editorDayPill,
                        selected
                          ? { backgroundColor: C.red, borderColor: C.red }
                          : { backgroundColor: isDark ? '#211D1D' : '#FAFAFA', borderColor: C.divider },
                      ]}
                    >
                      <Text style={[styles.editorDayText, { color: selected ? '#FFF' : C.textSm }]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity onPress={toggleAllDraftDays} style={styles.allDaysBtn}>
                <View style={[styles.allDaysCheck, { backgroundColor: draft.days.length === DAYS.length ? C.red : 'transparent', borderColor: C.red }]}>
                  {draft.days.length === DAYS.length ? <Check size={11} color="#FFF" strokeWidth={3} /> : null}
                </View>
                <Text style={[styles.allDaysText, { color: C.text }]}>Repeat every day</Text>
              </TouchableOpacity>

              <Text style={[styles.fieldLabel, { color: C.textSm, marginTop: 20 }]}>Notes</Text>
              <TextInput
                style={[styles.notesInput, { backgroundColor: C.redBg, borderColor: C.redBorder, color: C.text }]}
                value={draft.notes}
                onChangeText={(value) => setDraft(prev => ({ ...prev, notes: value }))}
                placeholder="Morning fasting, after lunch, medication name..."
                placeholderTextColor={C.textXs}
                multiline
              />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setDraft(prev => ({ ...prev, enabled: !prev.enabled }))}
                style={[styles.enabledRow, { borderColor: C.divider }]}
              >
                <View>
                  <Text style={[styles.enabledTitle, { color: C.text }]}>Enabled</Text>
                  <Text style={[styles.enabledSubtitle, { color: C.textSm }]}>
                    Show this reminder in your active schedule
                  </Text>
                </View>
                <Switch
                  value={draft.enabled}
                  onValueChange={() => setDraft(prev => ({ ...prev, enabled: !prev.enabled }))}
                  trackColor={{ false: '#DDD', true: C.red }}
                  thumbColor="#FFF"
                />
              </TouchableOpacity>

              {formError ? <Text style={[styles.formErrorText, { color: C.red }]}>{formError}</Text> : null}

              <TouchableOpacity onPress={saveDraft} style={[styles.saveBtn, { backgroundColor: C.red }]}>
                <Text style={styles.saveBtnText}>{editingId ? 'Save Changes' : 'Create Reminder'}</Text>
              </TouchableOpacity>
              <View style={{ height: 36 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introSection: {
    marginBottom: 24,
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  storageErrorText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  remindersList: {
    gap: 16,
    marginBottom: 24,
  },
  reminderCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTime: {
    fontSize: 20,
    fontWeight: '900',
  },
  reminderType: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    marginVertical: 16,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  dayPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#C41E26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  createBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  emptyIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  editorSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginTop: 12,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  editorIconBox: {
    width: 42,
    height: 42,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorTitleWrap: {
    flex: 1,
  },
  editorTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  editorSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorScroll: {
    maxHeight: '100%',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  timeInputWrap: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    paddingVertical: 0,
  },
  quickTimesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  quickTimeBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickTimeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  editorDaysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  editorDayPill: {
    minWidth: 48,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  editorDayText: {
    fontSize: 12,
    fontWeight: '900',
  },
  allDaysBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    gap: 8,
  },
  allDaysCheck: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allDaysText: {
    fontSize: 13,
    fontWeight: '700',
  },
  notesInput: {
    minHeight: 82,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    textAlignVertical: 'top',
    fontSize: 14,
    fontWeight: '600',
  },
  enabledRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  enabledTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  enabledSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  formErrorText: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12,
  },
  saveBtn: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
});

export default RemindersScreen;
