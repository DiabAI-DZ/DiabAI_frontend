import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera as CameraIcon, Check, Flame, Zap, TrendingUp, AlertCircle, FileText } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { SCAN_OVERLAY } from '../scanOverlayColors';
import { applyMealSelection, isValidMealName, mealSuggestions } from '../scanLogic';
import type { ScanResultState } from '../scanTypes';

const IMG_SCRIM = ['transparent', 'rgba(0,0,0,0.55)'] as const;
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

interface MealConfirmProps {
  scanResult: ScanResultState | null;
  setScanResult: React.Dispatch<React.SetStateAction<ScanResultState | null>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  notes: string;
  setNotes: (v: string) => void;
  photo: string | null;
  onSelectMeal: (name: string) => void;
  onSave: () => void;
}

export const MealConfirm: React.FC<MealConfirmProps> = ({ scanResult, setScanResult, isEditing, setIsEditing, notes, setNotes, photo, onSelectMeal, onSave }) => {
  const { C, colors, isDark } = useTheme();
  if (!scanResult) return null;
  const update = (patch: Partial<ScanResultState>) => setScanResult((prev) => (prev ? { ...prev, ...patch } : prev));
  const cardBg = isDark ? colors.backgroundInput : C.redBg;
  const cardBorder = isDark ? colors.border : C.redBorder;
  const title = scanResult.title || '';
  const suggestions = isEditing ? mealSuggestions(title) : [];
  const isValid = isValidMealName(title);
  const impact = scanResult.impact || 0;
  const impactColor = impact > 20 ? C.red : C.green;

  return (
    <>
      <View style={styles.imageBox}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback, { backgroundColor: C.redBg }]}>
            <CameraIcon size={40} color={C.textXs} />
            <Text style={[styles.fallbackText, { color: C.textXs }]}>No photo available</Text>
          </View>
        )}
        <LinearGradient colors={IMG_SCRIM} style={StyleSheet.absoluteFill} />
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>{Math.round((scanResult.confidence || 0.85) * 100)}% Match</Text>
        </View>
      </View>

      <View style={styles.titleSection}>
        {isEditing ? (
          <View style={styles.full}>
            <TextInput
              style={[styles.titleInput, { color: colors.inputText, borderBottomColor: colors.inputBorder }]}
              value={title}
              onChangeText={(val) => setScanResult((prev) => applyMealSelection(prev || {}, val))}
              autoFocus
            />
            {suggestions.length > 0 && (
              <View style={[styles.dropdown, { backgroundColor: C.white, borderColor: C.redBorder }]}>
                {suggestions.map((item) => (
                  <TouchableOpacity key={item} style={[styles.dropdownItem, { borderBottomColor: C.redBg }]} onPress={() => onSelectMeal(item)}>
                    <Text style={[styles.dropdownText, { color: C.text }]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text style={[styles.titleMain, { color: C.text }]}>{title}</Text>
        )}
      </View>

      <View style={styles.macroRow}>
        <View style={[styles.macroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Flame size={20} color={C.red} />
          <Text style={[styles.macroValue, { color: C.red }]}>{scanResult.calories || 0}</Text>
          <Text style={[styles.macroLabel, { color: C.textSm }]}>Calories</Text>
        </View>
        <View style={[styles.macroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Zap size={20} color={C.red} />
          <Text style={[styles.macroValue, { color: C.red }]}>{scanResult.carbs || 0}g</Text>
          <Text style={[styles.macroLabel, { color: C.textSm }]}>Carbs</Text>
        </View>
        <View style={[styles.macroCard, { backgroundColor: impactColor + '18', borderColor: impactColor }]}>
          <TrendingUp size={20} color={impactColor} />
          <Text style={[styles.macroValue, { color: impactColor }]}>+{impact}</Text>
          <Text style={[styles.macroLabel, { color: C.textSm }]}>mg/dL</Text>
        </View>
      </View>

      <View style={[styles.notice, { backgroundColor: (isValid ? C.green : C.red) + '15', borderColor: isValid ? C.green : C.red }]}>
        <AlertCircle size={18} color={isValid ? C.green : C.red} />
        <Text style={[styles.noticeText, { color: isValid ? C.green : C.red }]}>
          {isValid ? '✓ Meal matches database entry. Macros loaded.' : '✗ Invalid meal name. Type to select from list or use exact name to commit.'}
        </Text>
      </View>

      <View style={[styles.infoNotice, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
        <TrendingUp size={16} color={C.textSm} />
        <Text style={[styles.infoText, { color: C.textSm }]}>
          By confirming or correcting this prediction, you help train and improve the DiabAI image recognition model.
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={[styles.subLabel, { color: C.text }]}>Meal Type</Text>
        <View style={styles.typesRow}>
          {MEAL_TYPES.map((t) => {
            const sel = scanResult.meal_type === t;
            return (
              <TouchableOpacity key={t} onPress={() => update({ meal_type: t })} style={[styles.typeBtn, { backgroundColor: colors.backgroundMuted, borderColor: colors.border }, sel && { backgroundColor: C.red, borderColor: C.red }]}>
                <Text style={[styles.typeText, { color: sel ? colors.textOnPrimary : C.textSm }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.notesHead}>
          <FileText size={16} color={C.textSm} />
          <Text style={[styles.subLabel, styles.notesLabel, { color: C.text }]}>Add Notes <Text style={[styles.optional, { color: C.red + 'AA' }]}>(optional)</Text></Text>
        </View>
        <TextInput
          style={[styles.notesInput, { color: colors.inputText, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
          placeholder="How are you feeling? Any specific details about this meal?"
          placeholderTextColor={colors.inputText}
          multiline
          value={notes}
          onChangeText={setNotes}
        />
        <View style={[styles.charCountBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.charCount, { color: C.textSm }]}>{notes.length}/200</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onSave} disabled={!isValid} style={[styles.confirmBtn, { backgroundColor: C.red, opacity: isValid ? 1 : 0.6 }]}>
          <Check size={17} color={colors.textOnPrimary} />
          <Text style={[styles.confirmText, { color: colors.textOnPrimary }]}>Confirm Meal</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsEditing((e) => !e)} style={[styles.editBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.editBtnText, { color: C.red }]}>{isEditing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  full: { width: '100%' },
  imageBox: { height: 200, borderRadius: borderRadius.xxl, overflow: 'hidden', marginBottom: spacing.xl },
  image: { width: '100%', height: '100%' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  fallbackText: { fontSize: 11, marginTop: 6 },
  matchBadge: { position: 'absolute', bottom: spacing.md, left: spacing.md, backgroundColor: SCAN_OVERLAY.scrimStrong, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.md },
  matchText: { color: SCAN_OVERLAY.white, fontSize: 12, fontWeight: '700' },
  titleSection: { marginBottom: spacing.xl },
  titleInput: { fontSize: 20, fontWeight: '800', borderBottomWidth: 2, paddingBottom: spacing.xs },
  titleMain: { fontSize: 24, fontWeight: '900' },
  dropdown: { borderWidth: 1.5, borderRadius: borderRadius.md, marginTop: spacing.xs, maxHeight: 180, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  dropdownText: { fontSize: 14, fontWeight: '600' },
  macroRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  macroCard: { flex: 1, borderWidth: 1.5, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', gap: spacing.xs },
  macroValue: { fontSize: 18, fontWeight: '900' },
  macroLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  notice: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: borderRadius.lg, padding: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  noticeText: { fontSize: 11, fontWeight: '800', flex: 1 },
  infoNotice: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1.5, borderRadius: borderRadius.lg, padding: spacing.md, gap: spacing.sm, marginBottom: spacing.xl },
  infoText: { fontSize: 11, flex: 1, lineHeight: 17 },
  block: { marginBottom: spacing.xl },
  subLabel: { fontSize: 16, fontWeight: '800', marginBottom: spacing.md },
  typesRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  typeBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  typeText: { fontSize: 12, fontWeight: '700' },
  notesHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  notesLabel: { marginBottom: 0 },
  optional: { fontSize: 11, fontWeight: '400' },
  notesInput: { height: 80, borderWidth: 1.5, borderRadius: borderRadius.lg, padding: spacing.lg, fontSize: 13, textAlignVertical: 'top' },
  charCountBox: { borderWidth: 1.5, borderTopWidth: 0, borderBottomLeftRadius: borderRadius.lg, borderBottomRightRadius: borderRadius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  charCount: { fontSize: 10, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: spacing.md, paddingBottom: spacing.xxxxl },
  confirmBtn: { flex: 3, height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  confirmText: { fontSize: 16, fontWeight: '800' },
  editBtn: { flex: 1, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontSize: 13, fontWeight: '800' },
});
