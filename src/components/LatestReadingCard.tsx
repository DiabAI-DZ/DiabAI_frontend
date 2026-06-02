import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export interface LatestReading {
  value: number | null;
  unit: string;
  status: 'Normal' | 'High' | 'Low' | string;
  time: string;
  delta: number;
  trend: 'up' | 'down' | 'stable';
  targetMin: number;
  targetMax: number;
}

interface LatestReadingCardProps {
  reading: LatestReading;
  loading?: boolean;
  onPress?: () => void;
}

/** Dark-red "Latest Reading" hero card: big glucose value, delta, status pill, measured-at + target. */
const LatestReadingCard: React.FC<LatestReadingCardProps> = ({ reading, loading, onPress }) => {
  const { C } = useTheme();

  const hasReading = reading.value != null && reading.value > 0;

  const dotColor =
    reading.status === 'High' ? '#F39C12' : reading.status === 'Low' ? '#E74C3C' : '#2ECC71';

  const displayValue = !hasReading
    ? '--'
    : reading.unit === 'mmol/L'
      ? reading.value!.toFixed(1)
      : Math.round(reading.value!);

  const TrendIcon = reading.trend === 'up' ? TrendingUp : reading.trend === 'down' ? TrendingDown : Minus;
  const deltaColor = reading.trend === 'down' ? '#4ADE80' : '#FCD34D';

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} disabled={!onPress || !hasReading}>
      <LinearGradient
        colors={[C.red, C.redDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.label}>LATEST READING</Text>

        {loading && !hasReading ? (
          <View style={styles.skeletonBlock}>
            <View style={styles.skeletonValue} />
            <View style={styles.skeletonPill} />
          </View>
        ) : !hasReading ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No readings yet</Text>
          </View>
        ) : (
          <>
            <View style={styles.mainRow}>
              <View style={styles.valueWrap}>
                <Text style={styles.value}>{displayValue}</Text>
                <View style={styles.unitCol}>
                  <Text style={styles.unit}>{reading.unit}</Text>
                  {reading.delta !== 0 && (
                    <View style={styles.deltaRow}>
                      <TrendIcon size={13} color={deltaColor} />
                      <Text style={[styles.deltaText, { color: deltaColor }]}>
                        {reading.delta > 0 ? '+' : ''}
                        {reading.delta} since last
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                <Text style={styles.statusText}>{reading.status}</Text>
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.footerItem}>
                <Clock size={13} color="rgba(255,255,255,0.7)" />
                <Text style={styles.footerText}>Measured at {reading.time}</Text>
              </View>
              <View style={styles.footerItem}>
                <Target size={13} color="rgba(255,255,255,0.7)" />
                <Text style={styles.footerText}>
                  Target: {reading.targetMin}—{reading.targetMax} {reading.unit}
                </Text>
              </View>
            </View>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#C41E26',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 52,
    lineHeight: 54,
    fontWeight: '900',
    color: '#FFF',
  },
  unitCol: {
    marginLeft: 8,
    paddingBottom: 6,
  },
  unit: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  statusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    paddingTop: 14,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyWrap: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '700',
  },
  skeletonBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 100,
  },
  skeletonValue: {
    width: 120,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skeletonPill: {
    width: 90,
    height: 34,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

export default LatestReadingCard;
