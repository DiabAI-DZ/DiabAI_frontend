import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X, Zap } from 'lucide-react-native';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { SCAN_OVERLAY } from '../scanOverlayColors';
import type { OcrModel, ScanMode } from '../scanTypes';

interface ScanHeaderProps {
  mode: ScanMode;
  ocrModel: OcrModel;
  onBack: () => void;
  onToggleModel: () => void;
}

export const ScanHeader: React.FC<ScanHeaderProps> = ({ mode, ocrModel, onBack, onToggleModel }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.closeBtn}>
      <X color={SCAN_OVERLAY.white} size={24} />
    </TouchableOpacity>
    <View style={styles.center}>
      <Text style={styles.title}>{mode === 'glucose' ? 'Glucose Measurement' : 'Meal Scan'}</Text>
      {mode === 'glucose' && (
        <TouchableOpacity style={styles.modelChip} onPress={onToggleModel}>
          <Zap color={ocrModel === 'tflite' ? SCAN_OVERLAY.flashOn : SCAN_OVERLAY.modelCloud} size={12} style={styles.modelIcon} />
          <Text style={styles.modelText}>
            {ocrModel === 'tflite' ? 'Model: TFLite (Local)' : 'Model: YOLO+TrOCR (Cloud)'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
    <View style={styles.spacer} />
  </View>
);

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, zIndex: 10 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: SCAN_OVERLAY.scrim, justifyContent: 'center', alignItems: 'center' },
  center: { alignItems: 'center' },
  title: { color: SCAN_OVERLAY.white, fontSize: 18, fontWeight: '800' },
  modelChip: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, backgroundColor: SCAN_OVERLAY.chipBg, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  modelIcon: { marginRight: spacing.xs },
  modelText: { color: SCAN_OVERLAY.white, fontSize: 10, fontWeight: '700' },
  spacer: { width: 40 },
});
