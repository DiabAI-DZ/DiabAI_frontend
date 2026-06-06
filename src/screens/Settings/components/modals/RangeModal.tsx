import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { spacing } from '../../../../theme/spacing';
import { borderRadius } from '../../../../theme/borderRadius';
import { CenterPopup } from '../CenterPopup';
import { TargetGlucoseSlider } from '../TargetGlucoseSlider';

interface RangeModalProps {
  open: boolean;
  onClose: () => void;
  targetMin: number;
  targetMax: number;
  onChange: (min: number, max: number) => void;
  onConfirm: () => void;
}

export const RangeModal: React.FC<RangeModalProps> = ({ open, onClose, targetMin, targetMax, onChange, onConfirm }) => {
  const { C, colors } = useTheme();
  return (
    <CenterPopup open={open} onClose={onClose} title="Set Target Range">
      <TargetGlucoseSlider min={40} max={250} minVal={targetMin} maxVal={targetMax} onChange={onChange} />
      <TouchableOpacity onPress={onConfirm} style={[styles.saveBtn, { backgroundColor: C.red }]}>
        <Text style={[styles.saveBtnText, { color: colors.textOnPrimary }]}>Confirm Range</Text>
      </TouchableOpacity>
    </CenterPopup>
  );
};

const styles = StyleSheet.create({
  saveBtn: { borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, marginBottom: spacing.sm },
  saveBtnText: { fontSize: 13.5, fontWeight: 'bold' },
});
