import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

interface CenterPopupProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** A centered, dismissable modal card with a titled header and scrollable body. */
export const CenterPopup: React.FC<CenterPopupProps> = ({ open, onClose, title, children }) => {
  const { C, colors } = useTheme();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: C.white, borderColor: C.redBorder, shadowColor: colors.shadow }]}>
          <View style={[styles.header, { borderBottomColor: C.divider }]}>
            <Text style={[styles.title, { color: C.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: C.redBg }]}>
              <X size={15} color={C.redMuted} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  dismissArea: { ...StyleSheet.absoluteFillObject },
  card: {
    width: '100%', borderRadius: borderRadius.xxl, borderWidth: 1, overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8, maxHeight: '75%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  title: { fontSize: 16, fontWeight: '800' },
  closeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.lg },
  scrollContent: { paddingVertical: spacing.md },
});
