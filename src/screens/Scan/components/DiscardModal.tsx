import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { SCAN_OVERLAY } from '../scanOverlayColors';
import type { ScanMode } from '../scanTypes';

interface DiscardModalProps {
  visible: boolean;
  mode: ScanMode;
  onKeep: () => void;
  onDiscard: () => void;
}

export const DiscardModal: React.FC<DiscardModalProps> = ({ visible, mode, onKeep, onDiscard }) => {
  const { C, colors } = useTheme();
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onKeep} />
      <View style={[styles.content, { backgroundColor: C.bg, shadowColor: colors.shadow }]}>
        <View style={[styles.iconBadge, { backgroundColor: C.red + '18', borderColor: C.red }]}>
          <X size={28} color={C.red} />
        </View>
        <Text style={[styles.title, { color: C.text }]}>Discard Scan?</Text>
        <Text style={[styles.message, { color: C.textSm }]}>
          Are you sure? All {mode === 'meal' ? 'nutrition data and predictions' : 'measurement data'} will be permanently lost.
        </Text>
        <View style={styles.buttons}>
          <TouchableOpacity onPress={onKeep} style={[styles.cancelBtn, { borderColor: C.redBorder, backgroundColor: C.redBg }]}>
            <Text style={[styles.cancelText, { color: C.red }]}>Keep It</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDiscard} style={[styles.confirmBtn, { backgroundColor: C.red }]}>
            <Text style={[styles.confirmText, { color: colors.textOnPrimary }]}>Discard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: SCAN_OVERLAY.black, justifyContent: 'center', alignItems: 'center', padding: 28, zIndex: 9999, elevation: 50 },
  content: { width: '100%', maxWidth: 320, borderRadius: borderRadius.xxl, padding: spacing.xxl, alignItems: 'center', elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16 },
  iconBadge: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  title: { fontSize: 20, fontWeight: '800', marginBottom: spacing.sm, textAlign: 'center' },
  message: { fontSize: 13, lineHeight: 18, textAlign: 'center', marginBottom: spacing.xl },
  buttons: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  cancelBtn: { flex: 1, height: 48, borderRadius: borderRadius.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontWeight: '700', fontSize: 15 },
  confirmBtn: { flex: 1, height: 48, borderRadius: borderRadius.pill, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontWeight: '700', fontSize: 15 },
});
