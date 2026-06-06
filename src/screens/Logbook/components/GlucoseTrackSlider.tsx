import React from 'react';
import { Dimensions, GestureResponderEvent, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme/ThemeContext';
import { useUser } from '../../../context/UserContext';
import { convertGlucose } from '../../../services/apiService';

const { width } = Dimensions.get('window');

interface GlucoseTrackSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (low: number, high: number) => void;
}

/** Touch-based dual-handle glucose range slider (values stored in mg/dL, displayed in user unit). */
const GlucoseTrackSlider: React.FC<GlucoseTrackSliderProps> = ({ min, max, valueMin, valueMax, onChange }) => {
  const { C, colors } = useTheme();
  const { profile } = useUser();
  const unit = profile?.glucoseUnit || 'mg/dL';
  const fmt = (v: number): string => convertGlucose(v, unit, 'mg/dL').toFixed(unit === 'mmol/L' ? 2 : 0);

  const pctMin = ((valueMin - min) / (max - min)) * 100;
  const pctMax = ((valueMax - min) / (max - min)) * 100;
  const lowPct = (((profile?.goals?.min || 70) - min) / (max - min)) * 100;
  const highPct = (((profile?.goals?.max || 140) - min) / (max - min)) * 100;
  const trackWidth = width - 80;

  const handleTrackTouch = (event: GestureResponderEvent): void => {
    const touchX = event.nativeEvent.locationX;
    const value = Math.round(min + (touchX / trackWidth) * (max - min));
    if (Math.abs(value - valueMin) < Math.abs(value - valueMax)) {
      onChange(Math.min(Math.max(min, value), valueMax - 5), valueMax);
    } else {
      onChange(valueMin, Math.max(Math.min(max, value), valueMin + 5));
    }
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.backgroundMuted, borderColor: colors.border }]}>
      <View style={styles.valuesRow}>
        <View style={[styles.valBox, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
          <Text style={[styles.valText, { color: C.red }]}>{fmt(valueMin)}</Text>
          <Text style={[styles.valSub, { color: C.textXs }]}>{unit}</Text>
        </View>
        <Text style={[styles.valDivider, { color: C.textXs }]}>—</Text>
        <View style={[styles.valBox, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
          <Text style={[styles.valText, { color: C.red }]}>{fmt(valueMax)}</Text>
          <Text style={[styles.valSub, { color: C.textXs }]}>{unit}</Text>
        </View>
      </View>

      <View style={[styles.trackContainer, { width: trackWidth }]} onStartShouldSetResponder={() => true} onResponderRelease={handleTrackTouch}>
        <View style={[styles.bgTrack, { backgroundColor: colors.divider }]}>
          <View style={[styles.trackSegment, { left: 0, width: `${lowPct}%`, backgroundColor: C.red + '20' }]} />
          <View style={[styles.trackSegment, { left: `${lowPct}%`, width: `${highPct - lowPct}%`, backgroundColor: C.green + '20' }]} />
          <View style={[styles.trackSegment, { left: `${highPct}%`, right: 0, backgroundColor: C.amber + '20' }]} />
        </View>
        <LinearGradient colors={[C.red, C.redLight]} style={[styles.activeTrack, { left: `${pctMin}%`, width: `${pctMax - pctMin}%` }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={[styles.handle, { left: `${pctMin}%`, borderColor: C.red, backgroundColor: colors.backgroundCard, shadowColor: colors.shadow }]} />
        <View style={[styles.handle, { left: `${pctMax}%`, borderColor: C.red, backgroundColor: colors.backgroundCard, shadowColor: colors.shadow }]} />
      </View>

      <View style={styles.labelsRow}>
        <Text style={[styles.labelText, { color: C.red }]}>Low &lt;{fmt(profile?.goals?.min || 70)}</Text>
        <Text style={[styles.labelText, { color: C.green }]}>Normal {fmt(profile?.goals?.min || 70)}-{fmt(profile?.goals?.max || 140)}</Text>
        <Text style={[styles.labelText, { color: C.amber }]}>High &gt;{fmt(profile?.goals?.max || 140)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: 10, borderWidth: 1, borderRadius: 16, padding: 12 },
  valuesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  valBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, gap: 3 },
  valText: { fontSize: 11.5, fontWeight: 'bold' },
  valSub: { fontSize: 8.5, fontWeight: '500' },
  valDivider: { fontSize: 12 },
  trackContainer: { height: 24, justifyContent: 'center', position: 'relative' },
  bgTrack: { height: 6, borderRadius: 3, position: 'relative', overflow: 'hidden' },
  trackSegment: { position: 'absolute', top: 0, bottom: 0 },
  activeTrack: { height: 6, borderRadius: 3, position: 'absolute' },
  handle: { position: 'absolute', width: 18, height: 18, borderRadius: 9, borderWidth: 3, top: '50%', marginTop: -9, marginLeft: -9, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  labelText: { fontSize: 8, fontWeight: '700' },
});

export default GlucoseTrackSlider;
