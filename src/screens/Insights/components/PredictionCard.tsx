import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDownRight, ArrowUpRight, Check, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import { BRAND_RED_GRADIENT } from '../../../theme/colors';
import { cardStyles } from './insightsStyles';

// Brand-red decorative constants for the prediction card (Figma). These are intentional design
// constants for the dark-red icon + banner text, NOT themeable tokens, so they live here as the
// single source of truth. The banner gradient is shared app-wide via BRAND_RED_GRADIENT.
const PREDICTION = {
  iconBg: '#8B0000',
  bannerGradient: BRAND_RED_GRADIENT,
  bannerText: '#FFFFFF',
  /** Muted white for the secondary first-line text (label + status + icon). */
  bannerTextMuted: 'rgba(255,255,255,0.65)',
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

const StatusIcon: React.FC<{ status: PredictionStatus; size?: number }> = ({ status, size = 16 }) => {
  const color = PREDICTION.bannerTextMuted;
  if (status === 'above_target') return <ArrowUpRight size={size} color={color} strokeWidth={2.5} />;
  if (status === 'below_target') return <ArrowDownRight size={size} color={color} strokeWidth={2.5} />;
  return <Check size={size} color={color} strokeWidth={2.5} />;
};

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction, targetMin, targetMax, loading, error,
}) => {
  const { C, colors } = useTheme();

  const Header = (
    <View style={cardStyles.sectionTitleRow}>
      <View style={[styles.headerIcon, { backgroundColor: PREDICTION.iconBg }]}>
        <TrendingUp size={20} color={PREDICTION.bannerText} strokeWidth={2.2} />
      </View>
      <View style={styles.flex1}>
        <Text allowFontScaling={false} style={[styles.title, { color: colors.textPrimary }]}>Prediction</Text>
        <Text allowFontScaling={false} style={[cardStyles.sectionSubtitle, { color: C.textSm }]}>AI-powered glucose forecast</Text>
      </View>
    </View>
  );

  // Loading skeleton — gray header circle + gray banner block.
  if (loading) {
    return (
      <View style={[cardStyles.card, cardStyles.cardPad, { backgroundColor: colors.backgroundCard, borderColor: C.redBorder, shadowColor: colors.shadow }]}>
        <View style={cardStyles.sectionTitleRow}>
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
    <View style={[cardStyles.card, cardStyles.cardPad, { backgroundColor: colors.backgroundCard, borderColor: C.redBorder, shadowColor: colors.shadow }]}>
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
              <View style={styles.topRow}>
                <Text allowFontScaling={false} numberOfLines={1} style={[styles.bannerLabel, { color: PREDICTION.bannerTextMuted }]}>
                  EXPECTED AT {formatTime(prediction.prediction_time)}
                </Text>
                <View style={styles.statusRow}>
                  <StatusIcon status={status} size={16} />
                  <Text allowFontScaling={false} numberOfLines={1} style={[styles.statusText, { color: PREDICTION.bannerTextMuted }]}>
                    {STATUS_TEXT[status]}
                  </Text>
                </View>
              </View>
              <View style={styles.valueRow}>
                <Text allowFontScaling={false} numberOfLines={1} style={[styles.value, { color: PREDICTION.bannerText }]}>
                  {prediction.predicted_value}
                </Text>
                <Text allowFontScaling={false} style={styles.unit}>{unit}</Text>
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

  // Header (matches Patterns / What-You-Should-Do cards)
  headerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },

  // Banner — first line: label + status (small) · second line: value (a little big)
  banner: { borderRadius: borderRadius.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  bannerCentered: { alignItems: 'center', justifyContent: 'center', minHeight: 96 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  bannerLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', flexShrink: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  statusText: { fontSize: 14, fontWeight: '600' },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.sm },
  value: { fontSize: 40, fontWeight: '800', lineHeight: 44 },
  unit: { fontSize: 18, fontWeight: '400', color: 'rgba(255,255,255,0.85)', marginLeft: 6, marginBottom: 4 },
  bannerEmptyText: { fontSize: 18, fontWeight: '600' },

  // Skeleton
  bannerSkeleton: { minHeight: 112 },
  skelLine: { borderRadius: borderRadius.sm },
  skelTitle: { width: '55%', height: 20 },
  skelSubtitle: { width: '75%', height: 14, marginTop: spacing.sm },
});
