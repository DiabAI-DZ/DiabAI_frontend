import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera as CameraIcon, Check } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useUser } from '../../../context/UserContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { SCAN_OVERLAY } from '../scanOverlayColors';
import { getStatus } from '../scanLogic';
import type { ScanResultState } from '../scanTypes';

const PREVIEW_SCRIM = ['transparent', 'rgba(0,0,0,0.45)'] as const;
const TAGS = ['Fasting', 'Before meal', 'After meal'];

interface GlucoseConfirmProps {
  scanResult: ScanResultState | null;
  setScanResult: React.Dispatch<React.SetStateAction<ScanResultState | null>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  notes: string;
  setNotes: (v: string) => void;
  photo: string | null;
  onSave: () => void;
}

export const GlucoseConfirm: React.FC<GlucoseConfirmProps> = ({ scanResult, setScanResult, isEditing, setIsEditing, notes, setNotes, photo, onSave }) => {
  const { C, colors, isDark } = useTheme();
  const { profile } = useUser();
  if (!scanResult) return null;
  const update = (patch: Partial<ScanResultState>) => setScanResult((prev) => (prev ? { ...prev, ...patch } : prev));
  const cardBg = isDark ? colors.backgroundInput : C.redBg;
  const cardBorder = isDark ? colors.border : C.redBorder;
  const status = getStatus(scanResult.value ?? 0, scanResult.unit || 'mg/dL', profile?.goals?.min, profile?.goals?.max);
  const statusColor = status === 'Normal' ? C.green : C.red;

  return (
    <>
      <View style={[styles.photoBox, { backgroundColor: C.redBg }]}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoFallback}>
            <CameraIcon size={40} color={C.textXs} />
            <Text style={[styles.photoFallbackText, { color: C.textXs }]}>No photo available</Text>
          </View>
        )}
        <LinearGradient colors={PREVIEW_SCRIM} style={styles.photoScrim} />
        {scanResult.confidence !== undefined && scanResult.confidence !== null && (
          <View style={styles.confChip}>
            <Text style={styles.confChipText}>{Math.round(scanResult.confidence * 100)}% Confidence</Text>
          </View>
        )}
      </View>

      <View style={[styles.detectedCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.detectedHead}>
          <Text style={[styles.detectedLabel, { color: C.textSm }]}>DETECTED VALUE</Text>
          {scanResult.confidence !== undefined && scanResult.confidence !== null && (
            <Text style={[styles.modelConf, { color: scanResult.confidence > 0.8 ? C.green : C.red }]}>
              Model Confidence: {(scanResult.confidence * 100).toFixed(1)}%
            </Text>
          )}
        </View>
        <View style={styles.detectedRow}>
          {isEditing ? (
            <TextInput
              style={[styles.detectedValue, styles.detectedValueEdit, { color: colors.inputText, borderBottomColor: colors.inputBorder }]}
              value={scanResult.value?.toString()}
              onChangeText={(v) => update({ value: parseFloat(v) || 0 })}
              keyboardType="numeric"
              autoFocus
            />
          ) : (
            <Text style={[styles.detectedValue, { color: C.text }]}>
              {scanResult.unit === 'mmol/L' ? scanResult.value?.toFixed(2) : scanResult.value}
            </Text>
          )}
          {isEditing ? (
            <TouchableOpacity onPress={() => update({ unit: scanResult.unit === 'mg/dL' ? 'mmol/L' : 'mg/dL' })} style={[styles.unitToggle, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.detectedUnit, styles.unitToggleText, { color: C.red }]}>{scanResult.unit || 'mg/dL'}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.detectedUnit, { color: C.textSm }]}>{scanResult.unit || 'mg/dL'}</Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.subLabel, { color: C.text }]}>Measurement Type</Text>
      <View style={styles.tagsRow}>
        {TAGS.map((t) => (
          <TouchableOpacity key={t} onPress={() => update({ tag: t })} style={[styles.tagBtn, { backgroundColor: colors.backgroundMuted }, scanResult.tag === t && { backgroundColor: C.red }]}>
            <Text style={[styles.tagText, { color: scanResult.tag === t ? colors.textOnPrimary : C.textSm }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.subLabel, styles.notesLabel, { color: C.text }]}>Notes</Text>
      <TextInput
        style={[styles.notesInput, { color: colors.inputText, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
        placeholder="Add a note about this reading..."
        placeholderTextColor={colors.inputText}
        value={notes}
        onChangeText={setNotes}
        multiline
        maxLength={200}
      />
      <Text style={[styles.charCount, { color: C.textXs }]}>{notes.length}/200</Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onSave} style={[styles.confirmBtn, { backgroundColor: C.red }]}>
          <Check size={17} color={colors.textOnPrimary} />
          <Text style={[styles.confirmText, { color: colors.textOnPrimary }]}>Confirm & Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsEditing((e) => !e)} style={[styles.editBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.editBtnText, { color: C.red }]}>{isEditing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  photoBox: { width: '100%', height: 160, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: '100%' },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  photoFallbackText: { fontSize: 11, marginTop: 6 },
  photoScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  confChip: { position: 'absolute', bottom: spacing.sm, right: spacing.sm, backgroundColor: SCAN_OVERLAY.scrimStrong, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  confChipText: { color: SCAN_OVERLAY.white, fontSize: 10, fontWeight: '700' },
  detectedCard: { padding: spacing.xl, borderRadius: borderRadius.xl, borderWidth: 1, marginBottom: spacing.xxl },
  detectedHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  detectedLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.sm },
  modelConf: { fontSize: 10, fontWeight: '700' },
  detectedRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  detectedValue: { fontSize: 48, fontWeight: '900' },
  detectedValueEdit: { borderBottomWidth: 2, minWidth: 80 },
  detectedUnit: { fontSize: 16, fontWeight: '600' },
  unitToggle: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, borderWidth: 1, marginLeft: spacing.xs },
  unitToggleText: { fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.md, marginLeft: 'auto' },
  statusText: { fontSize: 12, fontWeight: '800' },
  subLabel: { fontSize: 16, fontWeight: '800', marginBottom: spacing.md },
  notesLabel: { marginTop: spacing.lg },
  tagsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl },
  tagBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.xl },
  tagText: { fontSize: 14, fontWeight: '700' },
  notesInput: { height: 100, borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.lg, fontSize: 14, textAlignVertical: 'top' },
  charCount: { fontSize: 10, alignSelf: 'flex-end', marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.md, paddingBottom: spacing.xxxxl, marginTop: spacing.lg },
  confirmBtn: { flex: 3, height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  confirmText: { fontSize: 16, fontWeight: '800' },
  editBtn: { flex: 1, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontSize: 13, fontWeight: '800' },
});
