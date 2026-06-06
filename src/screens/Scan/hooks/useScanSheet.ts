import { useEffect, useRef } from 'react';
import { Animated, Dimensions, PanResponder, type PanResponderInstance } from 'react-native';
import type { ScanMode, ScanState } from '../scanTypes';

const TOP_MARGIN = 60;

export interface UseScanSheetResult {
  translateY: Animated.Value;
  backdropAnim: Animated.Value;
  panHandlers: PanResponderInstance['panHandlers'];
  slideOutSheet: (callback: () => void) => void;
  sheetHeight: number;
}

/** Owns the confirm bottom-sheet: drag gesture, open/close springs and the backdrop fade. */
export function useScanSheet(mode: ScanMode, state: ScanState, onRequestDiscard: () => void): UseScanSheetResult {
  const { height: screenHeight } = Dimensions.get('window');
  const sheetHeight = screenHeight - TOP_MARGIN;
  const posFull = 0;
  const stockPos = sheetHeight * (mode === 'meal' ? 0.2 : 0.3);

  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const backdropAnim = useRef(new Animated.Value(1)).current;
  const lastTranslateY = useRef(sheetHeight);
  const dragStartY = useRef(sheetHeight);
  const sheetMode = useRef<'stock' | 'full'>('stock');

  useEffect(() => {
    const id = translateY.addListener(({ value }) => { lastTranslateY.current = value; });
    return () => translateY.removeListener(id);
  }, [translateY]);

  const slideOutSheet = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: sheetHeight, duration: 300, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(() => callback());
  };

  const springTo = (pos: number) => Animated.spring(translateY, { toValue: pos, useNativeDriver: true, tension: 40, friction: 8 }).start();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { dragStartY.current = lastTranslateY.current; },
      onPanResponderMove: (_e, g) => { translateY.setValue(dragStartY.current + g.dy); },
      onPanResponderRelease: (_e, g) => {
        const isTap = Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5;
        if (isTap) {
          const next = sheetMode.current === 'stock' ? 'full' : 'stock';
          sheetMode.current = next;
          springTo(next === 'full' ? posFull : stockPos);
          return;
        }
        let targetPos = stockPos;
        let next: 'stock' | 'full' = 'stock';
        if (sheetMode.current === 'stock') {
          if (g.dy < -60) { targetPos = posFull; next = 'full'; }
          else if (g.dy > 80) { onRequestDiscard(); }
        } else if (g.dy <= 60) {
          targetPos = posFull; next = 'full';
        }
        sheetMode.current = next;
        springTo(targetPos);
      },
    }),
  ).current;

  // Slide the sheet in when entering the confirm state.
  useEffect(() => {
    if (state !== 'confirm') return;
    sheetMode.current = 'stock';
    backdropAnim.setValue(0);
    translateY.setValue(sheetHeight);
    Animated.parallel([
      Animated.spring(translateY, { toValue: stockPos, useNativeDriver: true, tension: 40, friction: 8 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [state, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  return { translateY, backdropAnim, panHandlers: panResponder.panHandlers, slideOutSheet, sheetHeight };
}
