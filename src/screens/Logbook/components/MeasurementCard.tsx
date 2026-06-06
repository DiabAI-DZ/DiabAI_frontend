import React, { useMemo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../../theme/ThemeContext';
import { useUser } from '../../../context/UserContext';
import { convertGlucose } from '../../../services/apiService';
import { DefaultImageService } from '../../../services/DefaultImageService';
import type { MeasurementEntry } from '../../../types';
import { cardStyles as s } from './logbookCardStyles';

/** Logbook grid card for a glucose measurement entry. */
const MeasurementCard: React.FC<{ entry: MeasurementEntry; onSelect: () => void }> = ({ entry, onSelect }) => {
  const { C, colors } = useTheme();
  const { profile } = useUser();

  const sc = useMemo(() => {
    switch (entry.status) {
      case 'High': return { color: C.amber, bg: C.amberBg, border: C.amberBorder };
      case 'Low': return { color: C.red, bg: C.redBg, border: C.redBorder };
      default: return { color: C.green, bg: C.greenBg, border: C.greenBorder };
    }
  }, [entry.status, C]);

  const TrendIcon = entry.trend === 'up' ? TrendingUp : entry.trend === 'down' ? TrendingDown : Minus;
  const trendColor = entry.trend === 'up' ? C.amber : entry.trend === 'down' ? C.green : C.textXs;
  const trendLabel = entry.trend === 'up' ? 'Rising' : entry.trend === 'down' ? 'Falling' : 'Stable';

  const userUnit = profile?.glucoseUnit || 'mg/dL';
  const displayValue =
    entry.unit === userUnit
      ? entry.value
      : convertGlucose(entry.value, userUnit, entry.unit || 'mg/dL').toFixed(userUnit === 'mmol/L' ? 2 : 0);

  return (
    <TouchableOpacity onPress={onSelect} style={[s.gridCardWrapper, { borderColor: C.redBorder, backgroundColor: colors.backgroundCard, shadowColor: colors.shadow }]}>
      <View style={s.gridCardTopGlucometer}>
        <Image source={entry.image ? { uri: entry.image } : DefaultImageService.getDefaultImage('measurement')} style={s.cardImage} resizeMode="cover" />
        <View style={[s.statusBadgeFloating, { borderColor: sc.border }]}>
          <View style={[s.statusBadgeDot, { backgroundColor: sc.color }]} />
          <Text style={[s.statusBadgeText, { color: sc.color }]}>{entry.status}</Text>
        </View>
      </View>

      <LinearGradient colors={[C.red, C.redDark]} style={s.cardHeaderBand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={s.cardHeaderCategoryText}>Glucose Scan</Text>
        <View style={s.cardHeaderMainValueRow}>
          <Text style={[s.cardHeaderValueText, { color: colors.textOnPrimary }]}>{displayValue}</Text>
          <Text style={s.cardHeaderUnitText}>{userUnit}</Text>
        </View>
      </LinearGradient>

      <View style={s.gridCardBottomInfo}>
        <View style={[s.trendBadge, { backgroundColor: trendColor + '12' }]}>
          <TrendIcon size={9} color={trendColor} />
          <Text style={[s.trendBadgeText, { color: trendColor }]}>{trendLabel}</Text>
        </View>
        <View style={s.cardTimeRow}>
          <Text style={[s.cardTimeText, { color: C.textSm }]}>{entry.time} · {format(parseISO(entry.date), 'MMM d')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MeasurementCard;
