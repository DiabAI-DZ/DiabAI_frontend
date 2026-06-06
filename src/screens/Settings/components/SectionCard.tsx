import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

/** A titled card with a red gradient header band and divider-separated rows. */
export const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children }) => {
  const { C, colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.frame, { backgroundColor: colors.backgroundCard, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <LinearGradient colors={[C.red, C.redDark]} style={styles.headerBand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <View style={styles.headerIconBox}>{icon}</View>
          <Text style={styles.headerTitle}>{title}</Text>
        </LinearGradient>
        <View style={styles.body}>
          {React.Children.map(children, (child, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={[styles.rowDivider, { backgroundColor: C.divider }]} />}
              {child}
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  frame: { borderRadius: borderRadius.xl, borderWidth: 1, overflow: 'hidden', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  headerBand: { flexDirection: 'row', alignItems: 'center', height: 30, paddingHorizontal: spacing.md, gap: 6 },
  headerIconBox: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  body: { paddingVertical: spacing.xs },
  rowDivider: { height: 1 },
});
