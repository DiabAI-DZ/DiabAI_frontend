import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import { AlertCircle, Zap, Plus, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { SCAN_OVERLAY } from '../scanOverlayColors';
import type { ScanMode } from '../scanTypes';
import type { UseScanCameraResult } from '../hooks/useScanCamera';

interface ScanCameraViewProps {
  mode: ScanMode;
  camera: UseScanCameraResult;
  onManual: () => void;
}

export const ScanCameraView: React.FC<ScanCameraViewProps> = ({ mode, camera, onManual }) => {
  const { C } = useTheme();
  const { permission, requestPermission, flash, setFlash, cameraRef, takePicture, pickImage } = camera;

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={C.red} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, styles.permissionPad]}>
        <AlertCircle size={48} color={C.red} style={styles.permissionIcon} />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionDesc}>We need camera access to scan your glucometer and meals.</Text>
        <TouchableOpacity onPress={requestPermission} style={[styles.permissionBtn, { backgroundColor: C.red }]}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} enableTorch={flash === 'on'} />
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.flashBtn} onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}>
          <Zap color={flash === 'on' ? SCAN_OVERLAY.flashOn : SCAN_OVERLAY.white} size={24} />
        </TouchableOpacity>
        <View style={styles.frameContainer}>
          <View style={[styles.frame, mode === 'meal' && styles.frameMeal]} />
        </View>
        <Text style={styles.hint}>
          {mode === 'glucose' ? 'Align glucometer screen within the box' : 'Position your meal within the frame'}
        </Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.sideBtn} onPress={onManual}>
          <Plus color={SCAN_OVERLAY.white} size={24} />
          <Text style={styles.sideText}>Manual</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
          <View style={styles.captureInner} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideBtn} onPress={pickImage}>
          <ImageIcon color={SCAN_OVERLAY.white} size={24} />
          <Text style={styles.sideText}>Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: SCAN_OVERLAY.black },
  permissionPad: { padding: spacing.xxl },
  permissionIcon: { marginBottom: spacing.lg },
  permissionTitle: { color: SCAN_OVERLAY.white, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: spacing.sm },
  permissionDesc: { color: SCAN_OVERLAY.muted, fontSize: 14, textAlign: 'center', marginBottom: spacing.xxl },
  permissionBtn: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: borderRadius.pill },
  permissionBtnText: { color: SCAN_OVERLAY.white, fontSize: 16, fontWeight: '800' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: SCAN_OVERLAY.scrimSoft, justifyContent: 'center', alignItems: 'center' },
  flashBtn: { position: 'absolute', top: spacing.xl, right: spacing.xl, width: 44, height: 44, borderRadius: 22, backgroundColor: SCAN_OVERLAY.scrim, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  frameContainer: { justifyContent: 'center', alignItems: 'center', width: '100%', height: '60%' },
  frame: { width: 240, height: 160, borderWidth: 2, borderColor: SCAN_OVERLAY.white, borderRadius: borderRadius.lg, borderStyle: 'dashed' },
  frameMeal: { width: 300, height: 300, borderRadius: 32 },
  hint: { color: SCAN_OVERLAY.white, marginTop: spacing.sm, fontSize: 14, fontWeight: '600', backgroundColor: SCAN_OVERLAY.scrimStrong, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.xl },
  controls: { position: 'absolute', bottom: spacing.xxxxl, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: spacing.xl },
  sideBtn: { alignItems: 'center', gap: spacing.xs, width: 80 },
  sideText: { color: SCAN_OVERLAY.white, fontSize: 12, fontWeight: '700' },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: SCAN_OVERLAY.captureRing, justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: SCAN_OVERLAY.white },
});
