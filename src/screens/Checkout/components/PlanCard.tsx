import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Shield, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { CHECKOUT_PRIMARY_DARK, type PlanType } from '../plans';

// Translucent whites on the gradient hero (not theme palette colors).
const ON_GRADIENT_FILL = 'rgba(255,255,255,0.18)';
const ON_GRADIENT_SUB = 'rgba(255,255,255,0.8)';
const ON_GRADIENT_PERIOD = 'rgba(255,255,255,0.7)';

/** Selected-plan summary as a brand-red gradient card. */
const PlanCard: React.FC<{ plan: PlanType }> = ({ plan }) => {
  const { colors } = useTheme();
  const PlanIcon = plan.id === 'annual' ? Zap : plan.id === 'free' ? Shield : Sparkles;

  return (
    <LinearGradient
      colors={[colors.primary, CHECKOUT_PRIMARY_DARK]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { shadowColor: colors.shadow }]}
    >
      <View style={styles.left}>
        <View style={[styles.icon, { backgroundColor: ON_GRADIENT_FILL }]}>
          <PlanIcon size={18} color={colors.textOnPrimary} />
        </View>
        <View style={styles.nameCol}>
          <Text style={[styles.name, { color: colors.textOnPrimary }]}>{plan.label} Plan</Text>
          <Text style={[styles.sub, { color: ON_GRADIENT_SUB }]}>{plan.sub.split('·')[0].trim()}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.price, { color: colors.textOnPrimary }]}>{plan.price}</Text>
        {plan.period !== '' && <Text style={[styles.period, { color: ON_GRADIENT_PERIOD }]}>{plan.period}</Text>}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1 },
  icon: { width: 38, height: 38, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  nameCol: { flexShrink: 1 },
  name: { fontSize: 16, fontWeight: 'bold' },
  sub: { fontSize: 13, marginTop: 1 },
  right: { alignItems: 'flex-end' },
  price: { fontSize: 22, fontWeight: '900' },
  period: { fontSize: 12 },
});

export default PlanCard;
