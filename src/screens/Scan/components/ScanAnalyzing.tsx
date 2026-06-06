import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { SCAN_OVERLAY } from '../scanOverlayColors';
import type { ScanMode } from '../scanTypes';

const SHIMMER_COLORS = ['transparent', 'rgba(255,255,255,0.3)', 'transparent'] as const;

export const ScanAnalyzing: React.FC<{ photo: string | null; mode: ScanMode }> = ({ photo, mode }) => {
  const { C } = useTheme();
  return (
    <View style={styles.container}>
      {photo && <Image source={{ uri: photo }} style={styles.preview} />}
      <View style={styles.overlay}>
        <View style={styles.shimmerContainer}>
          <ActivityIndicator size="large" color={C.red} />
          <View style={styles.shimmerBar}>
            <LinearGradient colors={SHIMMER_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.shimmerGradient} />
          </View>
        </View>
        <Text style={styles.text}>AI is analyzing {mode}...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  preview: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: SCAN_OVERLAY.scrimHeavy, justifyContent: 'center', alignItems: 'center' },
  shimmerContainer: { alignItems: 'center', gap: spacing.xl },
  shimmerBar: { width: 200, height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: SCAN_OVERLAY.shimmer },
  shimmerGradient: { width: '100%', height: '100%' },
  text: { color: SCAN_OVERLAY.white, marginTop: spacing.lg, fontSize: 16, fontWeight: '700' },
});
