import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

interface GlucoseRangeBarProps {
  value: number;
  // Target window edges (defaults to the standard 70–140 mg/dL band).
  min?: number;
  max?: number;
}

// Fixed visual proportions of the three coloured segments (matches the reference screenshot:
// a small red Low band, a wide green Normal band, and a medium orange High band).
const LOW_W = 0.22;
const NORMAL_W = 0.48;
// HIGH_W is the remainder (0.30).

// Maps a glucose value onto a 0..1 position along the bar using a piecewise mapping so the
// handle always lands inside the zone that matches the value (and so its colour is correct),
// regardless of how wide each coloured segment is drawn.
function positionFor(value: number, min: number, max: number): number {
  const lo = 40;   // absolute floor of the scale
  const hi = 400;  // absolute ceiling of the scale
  const v = Math.min(hi, Math.max(lo, value));

  if (v <= min) {
    // Within the red (Low) segment.
    const t = (v - lo) / Math.max(1, min - lo);
    return Math.max(0, Math.min(1, t)) * LOW_W;
  }
  if (v <= max) {
    // Within the green (Normal) segment.
    const t = (v - min) / Math.max(1, max - min);
    return LOW_W + Math.max(0, Math.min(1, t)) * NORMAL_W;
  }
  // Within the orange (High) segment.
  const t = (v - max) / Math.max(1, hi - max);
  return LOW_W + NORMAL_W + Math.max(0, Math.min(1, t)) * (1 - LOW_W - NORMAL_W);
}

// Full-width gradient-style bar (red / green / orange segments) with a circular position
// indicator showing where the reading falls, plus zone labels underneath.
const GlucoseRangeBar: React.FC<GlucoseRangeBarProps> = ({ value, min = 70, max = 140 }) => {
  const { C, colors } = useTheme();

  const low = colors.criticalText;
  const norm = colors.success;
  const high = colors.warningText;

  const zoneColor = value < min ? low : value > max ? high : norm;
  const leftPct = positionFor(value, min, max) * 100;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: colors.textSecondary }]}>GLUCOSE RANGE POSITION</Text>

      <View style={[styles.track, { backgroundColor: colors.divider }]}>
        <View style={[styles.segment, styles.segLeft, { width: `${LOW_W * 100}%`, backgroundColor: low }]} />
        <View style={[styles.segment, { left: `${LOW_W * 100}%`, width: `${NORMAL_W * 100}%`, backgroundColor: norm }]} />
        <View style={[styles.segment, styles.segRight, { left: `${(LOW_W + NORMAL_W) * 100}%`, width: `${(1 - LOW_W - NORMAL_W) * 100}%`, backgroundColor: high }]} />

        <View
          style={[
            styles.handle,
            { left: `${leftPct}%`, borderColor: zoneColor, shadowColor: zoneColor, backgroundColor: colors.backgroundCard },
          ]}
        />
      </View>

      <View style={styles.labels}>
        <Text style={[styles.labelText, { color: low, textAlign: 'left' }]}>{`Low <${min}`}</Text>
        <Text style={[styles.labelText, { color: norm, textAlign: 'center' }]}>{`Normal ${min}—${max}`}</Text>
        <Text style={[styles.labelText, { color: high, textAlign: 'right' }]}>{`High >${max}`}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  track: {
    height: 12,
    borderRadius: 6,
    position: 'relative',
    overflow: 'visible',
  },
  segment: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    height: '100%',
  },
  segLeft: {
    left: 0,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  segRight: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  handle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 4,
    top: '50%',
    transform: [{ translateY: -10 }, { translateX: -10 }],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  labels: {
    flexDirection: 'row',
    marginTop: 10,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
});

export default GlucoseRangeBar;
