import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { X, Syringe, Activity, Calendar, Clock, ChevronDown, Check } from 'lucide-react-native';

interface ActionPopupProps {
  visible: boolean;
  onClose: () => void;
  type: 'injection' | 'activity';
  onSave: (data: any) => void;
}

const ActionForms: React.FC<ActionPopupProps> = ({ visible, onClose, type, onSave }) => {
  const { C, isDark } = useTheme();
  
  // Injection States
  const [insulinType, setInsulinType] = useState('rapid_acting');
  const [dose, setDose] = useState('');
  const [site, setSite] = useState('abdomen');
  const [reason, setReason] = useState('meal_coverage');
  
  // Activity States
  const [activityType, setActivityType] = useState('walking');
  const [duration, setDuration] = useState('30');
  const [distance, setDistance] = useState('0');
  const [intensity, setIntensity] = useState('moderate');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (type === 'injection') {
      const doseVal = parseFloat(dose) || 0;
      onSave({
        type: 'injection',
        insulinType,
        dose: Math.max(0.5, doseVal),
        site,
        reason,
        date: new Date().toISOString(),
        notes
      });
    } else {
      const durVal = parseInt(duration) || 30;
      const distVal = parseFloat(distance) || 0;

      // Ensure distance is at least a small positive value for trackable activities
      // to avoid 'requiredIf' backend validation errors (422)
      let finalDistance = distVal;
      if (['walking', 'running', 'cycling'].includes(activityType) && distVal <= 0) {
        finalDistance = 0.1; // Default minimum if user left it at 0
      }

      onSave({
        type: 'activity',
        activityType,
        duration: Math.max(1, durVal),
        distance: finalDistance,
        intensity,
        date: new Date().toISOString(),
        notes
      });
    }
    onClose();
  };

  const renderInjectionForm = () => (
    <View style={styles.formContent}>
      <Text style={[styles.label, { color: C.textSm }]}>Insulin Type</Text>
      <View style={styles.optionsRow}>
        {['rapid_acting', 'long_acting', 'mixed'].map(t => (
          <TouchableOpacity 
            key={t} 
            onPress={() => setInsulinType(t)}
            style={[styles.smallTag, insulinType === t && { backgroundColor: C.red }]}
          >
            <Text style={[styles.tagText, insulinType === t ? { color: '#FFF' } : { color: C.text }]}>
              {t.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: C.textSm, marginTop: 20 }]}>Dose Units</Text>
      <View style={[styles.inputBox, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
        <TextInput
          style={[styles.input, { color: C.text }]}
          placeholder="0.0"
          value={dose}
          onChangeText={setDose}
          keyboardType="numeric"
        />
        <Text style={[styles.unitText, { color: C.textSm }]}>units</Text>
      </View>

      <Text style={[styles.label, { color: C.textSm, marginTop: 20 }]}>Injection Site</Text>
      <View style={styles.optionsRow}>
        {['abdomen', 'thigh', 'arm'].map(s => (
          <TouchableOpacity 
            key={s} 
            onPress={() => setSite(s)}
            style={[styles.smallTag, site === s && { backgroundColor: C.red }]}
          >
            <Text style={[styles.tagText, site === s ? { color: '#FFF' } : { color: C.text }]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderActivityForm = () => (
    <View style={styles.formContent}>
      <Text style={[styles.label, { color: C.textSm }]}>Activity Type</Text>
      <View style={styles.optionsRow}>
        {[
          'walking', 'running', 'cycling', 'swimming', 
          'gym', 'yoga', 'football', 'basketball', 'other'
        ].map(t => (
          <TouchableOpacity 
            key={t} 
            onPress={() => setActivityType(t)}
            style={[styles.smallTag, activityType === t && { backgroundColor: C.red }]}
          >
            <Text style={[styles.tagText, activityType === t ? { color: '#FFF' } : { color: C.text }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: C.textSm, marginTop: 20 }]}>Duration (minutes)</Text>
      <View style={[styles.inputBox, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
        <TextInput
          style={[styles.input, { color: C.text }]}
          placeholder="30"
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
        />
        <Text style={[styles.unitText, { color: C.textSm }]}>min</Text>
      </View>

      {(activityType === 'walking' || activityType === 'running' || activityType === 'cycling') && (
        <>
          <Text style={[styles.label, { color: C.textSm, marginTop: 20 }]}>Distance (km)</Text>
          <View style={[styles.inputBox, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <TextInput
              style={[styles.input, { color: C.text }]}
              placeholder="0.0"
              value={distance}
              onChangeText={setDistance}
              keyboardType="numeric"
            />
            <Text style={[styles.unitText, { color: C.textSm }]}>km</Text>
          </View>
        </>
      )}

      <Text style={[styles.label, { color: C.textSm, marginTop: 20 }]}>Intensity</Text>
      <View style={styles.optionsRow}>
        {['low', 'moderate', 'high'].map(i => (
          <TouchableOpacity 
            key={i} 
            onPress={() => setIntensity(i)}
            style={[styles.smallTag, intensity === i && { backgroundColor: C.red }]}
          >
            <Text style={[styles.tagText, intensity === i ? { color: '#FFF' } : { color: C.text }]}>{i}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.sheet, { backgroundColor: C.white }]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: C.redBg }]}>
              {type === 'injection' ? (
                <Syringe size={20} color={C.red} />
              ) : (
                <Activity size={20} color={C.red} />
              )}
            </View>
            <Text style={[styles.title, { color: C.text }]}>
              {type === 'injection' ? 'Add Injection' : 'Add Activity'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={C.textSm} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {type === 'injection' ? renderInjectionForm() : renderActivityForm()}
            
            <Text style={[styles.label, { color: C.textSm, marginTop: 20 }]}>Notes</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: C.redBg, borderColor: C.redBorder, color: C.text }]}
              placeholder="Add details..."
              placeholderTextColor={C.textXs}
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: C.red }]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Save Entry</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    flexGrow: 0,
  },
  formContent: {},
  label: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  smallTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesInput: {
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  saveBtn: {
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
});

export default ActionForms;
