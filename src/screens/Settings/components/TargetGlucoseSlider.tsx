import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, type GestureResponderEvent } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { RANGE_PRESETS } from '../settingsOptions';

const { width } = Dimensions.get('window');
const TRACK_WIDTH = width - 80;
const MIN_GAP = 10;

interface TargetGlucoseSliderProps {
  min: number;
  max: number;
  minVal: number;
  maxVal: number;
  onChange: (min: number, max: number) => void;
}

/** Dual-handle target-range slider with quick presets. Tapping the track moves the nearer handle. */
export const TargetGlucoseSlider: React.FC<TargetGlucoseSliderProps> = ({ min, max, minVal, maxVal, onChange }) => {
  const { C, colors } = useTheme();
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  const handleTrackTouch = (event: GestureResponderEvent) => {
    const touchX = event.nativeEvent.locationX;
    const value = Math.round(min + (touchX / TRACK_WIDTH) * (max - min));
    if (Math.abs(value - minVal) < Math.abs(value - maxVal)) {
      onChange(Math.min(Math.max(min, value), maxVal - MIN_GAP), maxVal);
    } else {
      onChange(minVal, Math.max(Math.min(max, value), minVal + MIN_GAP));
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.valuesRow}>
        <View style={styles.valBox}>
          <Text style={[styles.valSub, { color: C.textSm }]}>Minimum</Text>
          <Text style={[styles.valText, { color: C.red }]}>{minVal}</Text>
          <Text style={[styles.valUnit, { color: C.textSm }]}>mg/dL</Text>
        </View>
        <View style={[styles.valDivider, { backgroundColor: C.divider }]} />
        <View style={styles.valBox}>
          <Text style={[styles.valSub, { color: C.textSm }]}>Maximum</Text>
          <Text style={[styles.valText, { color: C.red }]}>{maxVal}</Text>
          <Text style={[styles.valUnit, { color: C.textSm }]}>mg/dL</Text>
        </View>
      </View>

      <View
        style={[styles.trackContainer, { width: TRACK_WIDTH }]}
        onStartShouldSetResponder={() => true}
        onResponderRelease={handleTrackTouch}
      >
        <View style={[styles.bgTrack, { backgroundColor: colors.backgroundInput }]} />
        <View style={[styles.activeTrack, { backgroundColor: C.red, left: `${pct(minVal)}%`, width: `${pct(maxVal) - pct(minVal)}%` }]} />
        <View style={[styles.handle, { left: `${pct(minVal)}%`, borderColor: C.red, backgroundColor: colors.backgroundCard }]} />
        <View style={[styles.handle, { left: `${pct(maxVal)}%`, borderColor: C.red, backgroundColor: colors.backgroundCard }]} />
      </View>

      <View style={styles.presetsRow}>
        {RANGE_PRESETS.map((p) => {
          const active = minVal === p.mn && maxVal === p.mx;
          return (
            <TouchableOpacity
              key={p.label}
              onPress={() => onChange(p.mn, p.mx)}
              style={[styles.presetBtn, { backgroundColor: active ? C.redBg : 'transparent', borderColor: active ? C.red : C.divider }]}
            >
              <Text style={[styles.presetText, { color: active ? C.red : C.textSm }]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { padding: spacing.sm },
  valuesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  valBox: { flex: 1, alignItems: 'center' },
  valSub: { fontSize: 10, fontWeight: '500', marginBottom: 2 },
  valText: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
  valUnit: { fontSize: 9, fontWeight: '600' },
  valDivider: { width: spacing.lg, height: 2, marginHorizontal: spacing.sm },
  trackContainer: { height: 24, justifyContent: 'center', position: 'relative', alignSelf: 'center', marginBottom: spacing.xl },
  bgTrack: { height: 6, borderRadius: 3, position: 'absolute', left: 0, right: 0 },
  activeTrack: { height: 6, borderRadius: 3, position: 'absolute' },
  handle: {
    position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 3, top: '50%', marginTop: -10, marginLeft: -10,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  presetsRow: { flexDirection: 'row', gap: spacing.sm },
  presetBtn: { flex: 1, borderRadius: borderRadius.md, borderWidth: 1.5, paddingVertical: spacing.sm, alignItems: 'center' },
  presetText: { fontSize: 11.5, fontWeight: 'bold' },
});
