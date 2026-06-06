import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, type GestureResponderHandlers } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Check, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { SCAN_OVERLAY } from '../scanOverlayColors';

interface ConfirmSheetProps {
  title: string;
  isMock: boolean;
  canSave: boolean;
  onCheck: () => void;
  scrollPaddingBottom: number;
  sheetHeight: number;
  translateY: Animated.Value;
  backdropAnim: Animated.Value;
  panHandlers: GestureResponderHandlers;
  onBackdropPress: () => void;
  backdropDisabled: boolean;
  children: React.ReactNode;
}

/** Shared confirm bottom-sheet chrome: backdrop, draggable handle, title + check, scroll body. */
export const ConfirmSheet: React.FC<ConfirmSheetProps> = ({
  title, isMock, canSave, onCheck, scrollPaddingBottom, sheetHeight, translateY, backdropAnim, panHandlers, onBackdropPress, backdropDisabled, children,
}) => {
  const { C, colors } = useTheme();
  return (
    <View style={styles.sheetContainer}>
      <Animated.View style={[styles.backdrop, { backgroundColor: SCAN_OVERLAY.sheetScrim, opacity: backdropAnim }]} pointerEvents="none" />
      <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onBackdropPress} disabled={backdropDisabled} />

      <Animated.View style={[styles.sheetContent, { backgroundColor: C.bg, shadowColor: colors.shadow, height: sheetHeight, transform: [{ translateY }] }]}>
        <View style={styles.sheetHeader}>
          <View {...panHandlers} style={styles.handleArea}>
            <View style={[styles.handle, { backgroundColor: C.red }]} />
          </View>
          <View style={styles.headerTop}>
            <View style={styles.flex1}>
              <Text style={[styles.sheetTitle, { color: C.text }]}>{title}</Text>
              {isMock && (
                <View style={[styles.mockBadge, { backgroundColor: C.amberBg, borderColor: C.amberBorder }]}>
                  <AlertTriangle size={10} color={C.amber} />
                  <Text style={[styles.mockText, { color: C.amber }]}>SIMULATED RESULT</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={onCheck}
              disabled={!canSave}
              style={[styles.checkBtn, { backgroundColor: canSave ? C.red : C.redBg, borderColor: C.red, opacity: canSave ? 1 : 0.4 }]}
            >
              <Check size={18} color={canSave ? colors.textOnPrimary : C.red} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  sheetContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheetContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingHorizontal: spacing.xxl, elevation: 16, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxxxl },
  sheetHeader: { marginBottom: spacing.sm },
  handleArea: { paddingVertical: spacing.md, alignItems: 'center', width: '100%' },
  handle: { width: 48, height: 5, borderRadius: 2.5, alignSelf: 'center', marginVertical: 14 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontSize: 22, fontWeight: '900' },
  mockBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 2, gap: spacing.xs },
  mockText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
  checkBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
