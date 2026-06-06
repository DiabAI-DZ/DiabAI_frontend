import { useCallback, useState } from 'react';
import { Animated } from 'react-native';
import type { ToastItem, ToastType } from '../scanTypes';

export interface UseToastsResult {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType) => void;
}

/** Stacking, auto-dismissing toast queue with enter/exit animations. */
export function useToasts(): UseToastsResult {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString();
    const anim = new Animated.Value(0);
    setToasts((prev) => [...prev, { id, message, type, anim }]);
    Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      });
    }, 3000);
  }, []);

  return { toasts, showToast };
}
