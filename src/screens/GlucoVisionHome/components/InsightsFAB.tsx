import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { X, Scan, Utensils, Syringe, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ScanIcon } from '../../../components/icons/NavIcons';
import { useTheme } from '../../../context/ThemeContext';

export type FabAction = 'glucose_scan' | 'meal_scan' | 'injection' | 'activity';

interface InsightsFABProps {
  /** Primary accent colour (the app red) — used by the action buttons. */
  color: string;
  /** Gradient stops for the FAB texture (light → dark red). Defaults to [color, color]. */
  gradient?: [string, string];
  /** Fired when an action is chosen; the menu auto-closes first. */
  onAction: (type: FabAction) => void;
  /** Distance of the FAB centre from the bottom of the screen (over the tab bar). */
  bottomInset?: number;
  /** Height of the tab bar to keep undimmed at the bottom. */
  tabBarHeight?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Arc targets (px) relative to the FAB centre — the 4 actions fan out above it.
const TARGETS = [
  { x: -94, y: -60 }, // glucose scan (far left)
  { x: -34, y: -104 }, // meal scan (inner left)
  { x: 34, y: -104 }, // injection (inner right)
  { x: 94, y: -60 }, // activity (far right)
];

const ACTIONS: { type: FabAction; Icon: any; label: string }[] = [
  { type: 'glucose_scan', Icon: Scan, label: 'Scan' },
  { type: 'meal_scan', Icon: Utensils, label: 'Meal' },
  { type: 'injection', Icon: Syringe, label: 'Insulin' },
  { type: 'activity', Icon: Activity, label: 'Activity' },
];

/**
 * Floating action button that expands into a small arc of actions ABOVE the tab bar.
 * The rest of the screen dims (but the tab bar / FAB stay bright and interactive), and the
 * "+" rotates into an "×". No full-page modal — just an absolute layer over the content.
 */
const InsightsFAB: React.FC<InsightsFABProps> = ({
  color,
  gradient,
  onAction,
  bottomInset = 56,
  tabBarHeight = 90,
}) => {
  const { colors } = useTheme();
  const fabGradient = gradient ?? [color, color];
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(open ? 1 : 0, { damping: 14, stiffness: 120 });
  }, [open, progress]);

  const toggle = useCallback(() => setOpen(o => !o), []);
  const close = useCallback(() => setOpen(false), []);

  const press = useCallback(
    (type: FabAction) => {
      setOpen(false);
      onAction(type);
    },
    [onAction]
  );

  const dimStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.45,
  }));

  // Cross-fade the scan icon (closed) into an × (open).
  const scanIconStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const closeIconStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  // One animated style per action (hooks can't go in a loop, and there are exactly 4).
  const a0 = useAnimatedStyle(() => actionTransform(progress.value, 0));
  const a1 = useAnimatedStyle(() => actionTransform(progress.value, 1));
  const a2 = useAnimatedStyle(() => actionTransform(progress.value, 2));
  const a3 = useAnimatedStyle(() => actionTransform(progress.value, 3));
  const actionStyles = [a0, a1, a2, a3];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dim overlay — covers everything ABOVE the tab bar; tap to close. */}
      <AnimatedPressable
        onPress={close}
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.dim,
          { bottom: tabBarHeight, backgroundColor: '#000' },
          dimStyle,
        ]}
      />

      {/* Anchor at bottom-centre holding the FAB + the arc of actions. */}
      <View style={[styles.anchor, { bottom: bottomInset }]} pointerEvents="box-none">
        {ACTIONS.map((action, i) => {
          const { Icon } = action;
          return (
            <Animated.View
              key={action.type}
              style={[styles.actionWrap, actionStyles[i]]}
              pointerEvents={open ? 'auto' : 'none'}
            >
              <Pressable onPress={() => press(action.type)}>
                <LinearGradient
                  colors={fabGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.actionBtn, { shadowColor: colors.shadow }]}
                >
                  <Icon size={19} color="#FFF" />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Central FAB — gradient texture + scan icon (crossfades to × when open) */}
        <Pressable onPress={toggle}>
          <LinearGradient
            colors={fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.fab, { shadowColor: colors.shadow }]}
          >
            <Animated.View style={[styles.fabIcon, scanIconStyle]}>
              <ScanIcon size={30} color="#FFFFFF" />
            </Animated.View>
            <Animated.View style={[styles.fabIcon, closeIconStyle]}>
              <X size={30} color="#FFFFFF" strokeWidth={2.5} />
            </Animated.View>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
};

// Computed on the UI thread inside useAnimatedStyle.
function actionTransform(p: number, i: number) {
  'worklet';
  const t = TARGETS[i];
  return {
    opacity: p,
    transform: [
      { translateX: p * t.x },
      { translateY: p * t.y },
      { scale: 0.4 + p * 0.6 },
    ],
  };
}

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  fabIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default InsightsFAB;
