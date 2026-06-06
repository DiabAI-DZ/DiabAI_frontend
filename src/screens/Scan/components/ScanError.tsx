import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, RotateCcw } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

interface ScanErrorProps {
  errorMsg: string;
  onRetry: () => void;
  onManual: () => void;
}

export const ScanError: React.FC<ScanErrorProps> = ({ errorMsg, onRetry, onManual }) => {
  const { C, colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <AlertCircle size={64} color={C.red} />
      <Text style={[styles.title, { color: C.text }]}>Scan Failed</Text>
      <Text style={[styles.desc, { color: C.textSm }]}>{errorMsg}</Text>
      <TouchableOpacity onPress={onRetry} style={[styles.retryBtn, { backgroundColor: C.red }]}>
        <RotateCcw size={20} color={colors.textOnPrimary} />
        <Text style={[styles.retryText, { color: colors.textOnPrimary }]}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onManual} style={styles.manualBtn}>
        <Text style={[styles.manualText, { color: C.textXs }]}>Enter Reading Manually</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xxl, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', marginTop: spacing.xl, marginBottom: spacing.md },
  desc: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: spacing.xxxxl },
  retryBtn: { width: '100%', height: 60, borderRadius: borderRadius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.lg },
  retryText: { fontSize: 18, fontWeight: '800' },
  manualBtn: { padding: spacing.md },
  manualText: { fontWeight: '700' },
});
