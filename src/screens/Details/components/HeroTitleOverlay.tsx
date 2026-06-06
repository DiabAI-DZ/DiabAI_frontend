import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';

interface HeroTitleOverlayProps {
  title: string;
  hourLabel: string;
  dayLabel: string;
}

const GRADIENT = ['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)'] as const;
const TITLE_SHADOW = 'rgba(0,0,0,0.35)';
const META_OVERLAY = 'rgba(255,255,255,0.85)';

/** Bottom gradient scrim + white title + time row, drawn over a detail hero image. */
const HeroTitleOverlay: React.FC<HeroTitleOverlayProps> = ({ title, hourLabel, dayLabel }) => {
  const { colors } = useTheme();
  return (
    <>
      <LinearGradient colors={GRADIENT} style={styles.gradient} />
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.textOnPrimary, textShadowColor: TITLE_SHADOW }]}>{title}</Text>
        <View style={styles.metaRow}>
          <Clock size={12} color={META_OVERLAY} />
          <Text style={[styles.metaText, { color: META_OVERLAY }]}>{hourLabel}  ·  {dayLabel}</Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  titleBlock: { position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 18 },
  title: {
    fontSize: 24, fontWeight: '900',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  metaText: { fontSize: 13, fontWeight: '500' },
});

export default HeroTitleOverlay;
