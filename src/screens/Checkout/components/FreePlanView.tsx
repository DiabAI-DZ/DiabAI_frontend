import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { CHECKOUT_PRIMARY_DISABLED, type PlanType } from '../plans';
import CheckoutHeader from './CheckoutHeader';
import PlanCard from './PlanCard';

interface FreePlanViewProps {
  plan: PlanType;
  processing: boolean;
  error: string | null;
  onBack: () => void;
  onActivate: () => void;
}

/** Free-plan branch of checkout: features list + "Activate Free Plan" action. */
const FreePlanView: React.FC<FreePlanViewProps> = ({ plan, processing, error, onBack, onActivate }) => {
  const { colors } = useTheme();
  return (
    <>
      <CheckoutHeader onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <PlanCard plan={plan} />
        <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>What's included in the Free Plan:</Text>
          {plan.features.map((f, i) => (
            <View key={i} style={styles.row}>
              <CheckCircle size={16} color={colors.primary} strokeWidth={2.5} />
              <Text style={[styles.text, { color: colors.textPrimary }]}>{f}</Text>
            </View>
          ))}
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.criticalBg, borderColor: colors.border }]}>
              <AlertTriangle size={14} color={colors.criticalText} />
              <Text style={[styles.errorBannerText, { color: colors.criticalText }]}>{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={onActivate}
          disabled={processing}
          activeOpacity={0.85}
          style={[styles.payBtn, { backgroundColor: processing ? CHECKOUT_PRIMARY_DISABLED : colors.primary, shadowColor: colors.shadow }]}
        >
          {processing ? (
            <View style={styles.payRow}>
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
              <Text style={[styles.payBtnText, { color: colors.textOnPrimary }]}>Processing…</Text>
            </View>
          ) : (
            <Text style={[styles.payBtnText, { color: colors.textOnPrimary }]}>Activate Free Plan</Text>
          )}
        </TouchableOpacity>
        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>No credit card required for the Free plan.</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.xl },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  text: { fontSize: 13 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md,
    borderRadius: borderRadius.md, borderWidth: 1, marginTop: spacing.md,
  },
  errorBannerText: { flex: 1, fontSize: 12, lineHeight: 16 },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  payBtn: {
    height: 54, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 3,
  },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  payBtnText: { fontSize: 17, fontWeight: 'bold' },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: spacing.sm },
});

export default FreePlanView;
