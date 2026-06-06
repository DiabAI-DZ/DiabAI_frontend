import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Check, X, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import type { ToastItem } from '../scanTypes';

export const ToastStack: React.FC<{ toasts: ToastItem[] }> = ({ toasts }) => {
  const { C, colors } = useTheme();
  if (toasts.length === 0) return null;
  return (
    <View style={styles.area} pointerEvents="none">
      {toasts.map((t, index) => {
        const bg = t.type === 'success' ? C.green : t.type === 'error' ? C.red : colors.textSecondary;
        const translateY = t.anim.interpolate({ inputRange: [0, 1], outputRange: [-25, 0] });
        const scale = t.anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
        return (
          <Animated.View
            key={t.id}
            style={[
              styles.toast,
              { backgroundColor: bg, borderColor: bg + '50', shadowColor: colors.shadow, opacity: t.anim, transform: [{ translateY }, { scale }], marginTop: index > 0 ? spacing.sm : 0 },
            ]}
          >
            {t.type === 'success'
              ? <Check size={18} color={colors.textOnPrimary} />
              : t.type === 'error'
                ? <X size={18} color={colors.textOnPrimary} />
                : <AlertCircle size={18} color={colors.textOnPrimary} />}
            <Text style={[styles.text, { color: colors.textOnPrimary }]}>{t.message}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  area: { position: 'absolute', top: 50, left: spacing.xl, right: spacing.xl, zIndex: 9999 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1.5, borderRadius: borderRadius.lg, padding: 14, elevation: 10, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10 },
  text: { fontSize: 13, fontWeight: '700', flex: 1 },
});
