import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDownRight, ArrowUpRight, Check, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { BRAND_RED_GRADIENT } from '../../../theme/colors';

// Brand-red decorative constants for the prediction card (Figma). These are intentional design
// constants for the dark-red icon + banner text, NOT themeable tokens, so they live here as the
// single source of truth. The banner gradient is shared app-wide via BRAND_RED_GRADIENT.
const PREDICTION = {
  iconBg: '#8B0000',
  bannerGradient: BRAND_RED_GRADIENT,
  bannerText: '#FFFFFF',
} as const;

type PredictionStatus = 'above_target' | 'in_range' | 'below_target';

interface PredictionCardProps {
  prediction: {
    predicted_value: number;
    prediction_time: string;
    status?: PredictionStatus;
    unit?: string;
  } | null;
  targetMin: number;
  targetMax: number;
  loading: boolean;
  /** When true, the banner renders the muted "Forecast unavailable" error state. */
  error?: boolean;
}

/** Format an ISO timestamp to "HH:MM" (24h). Falls back to the raw string if it isn't a date. */
function formatTime(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Resolve the banner status from an explicit string, or derive it from the value vs target range. */
function resolveStatus(value: number, targetMin: number, targetMax: number, explicit?: PredictionStatus): PredictionStatus {
  if (explicit) return explicit;
  if (value > targetMax) return 'above_target';
  if (value < targetMin) return 'below_target';
  return 'in_range';
}

const STATUS_TEXT: Record<PredictionStatus, string> = {
  above_target: 'Above target',
  in_range: 'In range',
  below_target: 'Below target',
};

const StatusIcon: React.FC<{ status: PredictionStatus }> = ({ status }) => {
  const color = PREDICTION.bannerText;
  if (status === 'above_target') return <ArrowUpRight size={22} color={color} strokeWidth={2.5} />;
  if (status === 'below_target') return <ArrowDownRight size={22} color={color} strokeWidth={2.5} />;
  return <Check size={22} color={color} strokeWidth={2.5} />;
};

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction, targetMin, targetMax, loading, error,
}) => {
  const { colors } = useTheme();

  const Header = (
    <View style={styles.headerRow}>
      <View style={[styles.headerIcon, { backgroundColor: PREDICTION.iconBg }]}>
        <TrendingUp size={26} color={PREDICTION.bannerText} strokeWidth={2.5} />
      </View>
      <View style={styles.flex1}>
        <Text allowFontScaling={false} style={[styles.title, { color: colors.textPrimary }]}>Prediction</Text>
        <Text allowFontScaling={false} style={[styles.subtitle, { color: colors.textSecondary }]}>AI-powered glucose forecast</Text>
      </View>
    </View>
  );

  // Loading skeleton — gray header circle + gray banner block.
  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.backgroundCard, shadowColor: colors.shadow }]}>
        <View style={styles.headerRow}>
          <View style={[styles.headerIcon, { backgroundColor: colors.backgroundMuted }]} />
          <View style={styles.flex1}>
            <View style={[styles.skelLine, styles.skelTitle, { backgroundColor: colors.backgroundMuted }]} />
            <View style={[styles.skelLine, styles.skelSubtitle, { backgroundColor: colors.backgroundMuted }]} />
          </View>
        </View>
        <View style={[styles.banner, styles.bannerSkeleton, { backgroundColor: colors.backgroundMuted }]} />
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundCard, shadowColor: colors.shadow }]}>
      {Header}

      {error ? (
        <View style={[styles.banner, styles.bannerCentered, { backgroundColor: colors.backgroundMuted }]}>
          <Text allowFontScaling={false} style={[styles.bannerEmptyText, { color: colors.textSecondary }]}>Forecast unavailable</Text>
        </View>
      ) : !prediction ? (
        <LinearGradient
          colors={PREDICTION.bannerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.banner, styles.bannerCentered]}
        >
          <Text allowFontScaling={false} style={[styles.bannerEmptyText, { color: PREDICTION.bannerText }]}>Not enough data yet</Text>
        </LinearGradient>
      ) : (
        (() => {
          const status = resolveStatus(prediction.predicted_value, targetMin, targetMax, prediction.status);
          const unit = prediction.unit ?? 'mg/dL';
          return (
            <LinearGradient
              colors={PREDICTION.bannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}
            >
              <Text allowFontScaling={false} numberOfLines={1} style={[styles.bannerLabel, { color: PREDICTION.bannerText }]}>
                EXPECTED AT {formatTime(prediction.prediction_time)}
              </Text>
              <View style={styles.valueRow}>
                <Text allowFontScaling={false} numberOfLines={1} style={[styles.value, { color: PREDICTION.bannerText }]}>
                  {prediction.predicted_value}
                </Text>
                <Text allowFontScaling={false} style={styles.unit}>{unit}</Text>
              </View>
              <View style={styles.statusRow}>
                <StatusIcon status={status} />
                <Text allowFontScaling={false} numberOfLines={1} style={[styles.statusText, { color: PREDICTION.bannerText }]}>
                  {STATUS_TEXT[status]}
                </Text>
              </View>
            </LinearGradient>
          );
        })()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  // Header
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 15, fontWeight: '400', marginTop: 2 },

  // Banner — compact, vertically stacked: label · value+unit · status
  banner: { borderRadius: borderRadius.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, marginTop: spacing.lg },
  bannerCentered: { alignItems: 'center', justifyContent: 'center', minHeight: 112 },
  bannerLabel: { fontSize: 14, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.sm },
  value: { fontSize: 56, fontWeight: '800', lineHeight: 58 },
  unit: { fontSize: 22, fontWeight: '400', color: 'rgba(255,255,255,0.85)', marginLeft: 8, marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  statusText: { fontSize: 20, fontWeight: '600' },
  bannerEmptyText: { fontSize: 18, fontWeight: '600' },

  // Skeleton
  bannerSkeleton: { minHeight: 112 },
  skelLine: { borderRadius: borderRadius.sm },
  skelTitle: { width: '55%', height: 20 },
  skelSubtitle: { width: '75%', height: 14, marginTop: spacing.sm },
});
