import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

interface NutritionRingsProps {
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
}

// Exact macro ring colours + reference maxima (per the Meal Details spec).
const MACROS = [
  { key: 'carbs', label: 'Carbs', color: '#F39C12', max: 100 },
  { key: 'protein', label: 'Protein', color: '#3498DB', max: 50 },
  { key: 'fat', label: 'Fat', color: '#9B59B6', max: 50 },
  { key: 'fiber', label: 'Fiber', color: '#2ECC71', max: 30 },
] as const;

interface RingProps {
  label: string;
  value: number;
  color: string;
  max: number;
}

// A dashed/segmented ring: a faded full-circle track in the macro colour, with a solid
// progress arc proportional to the value drawn on top. At value 0 only the faded dashed
// track shows, matching the reference.
const Ring: React.FC<RingProps> = ({ label, value, color, max }) => {
  const { C } = useTheme();
  const size = 58;
  const strokeWidth = 5;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const dashOffset = circ - (pct / 100) * circ;

  return (
    <View style={styles.col}>
      <View style={styles.ringFrame}>
        <Svg width={size} height={size}>
          {/* Faded dashed track (full circle, macro colour) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeOpacity={0.25}
            strokeWidth={strokeWidth}
            strokeDasharray="2 4"
            strokeLinecap="round"
          />
          {/* Solid progress arc */}
          {value > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circ} ${circ}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          )}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={[styles.valueText, { color }]}>{Math.round(value)}</Text>
        </View>
      </View>
      <Text style={[styles.label, { color: C.textSm }]}>{label}</Text>
      <Text style={[styles.unit, { color: C.textXs }]}>g</Text>
    </View>
  );
};

// Row of four macro rings: Carbs (orange), Protein (blue), Fat (purple), Fiber (green).
const NutritionRings: React.FC<NutritionRingsProps> = ({ carbs, protein, fat, fiber }) => {
  const values: Record<string, number> = { carbs: carbs || 0, protein: protein || 0, fat: fat || 0, fiber: fiber || 0 };
  return (
    <View style={styles.row}>
      {MACROS.map((m) => (
        <Ring key={m.key} label={m.label} value={values[m.key]} color={m.color} max={m.max} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  col: {
    alignItems: 'center',
  },
  ringFrame: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },
  unit: {
    fontSize: 9,
    marginTop: 1,
  },
});

export default NutritionRings;
