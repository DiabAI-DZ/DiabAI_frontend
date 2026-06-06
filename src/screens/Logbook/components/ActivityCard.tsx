import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, TrendingUp } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../../theme/ThemeContext';
import { DefaultImageService } from '../../../services/DefaultImageService';
import type { ActivityEntry } from '../../../types';
import { cardStyles as s } from './logbookCardStyles';

/** Logbook grid card for a physical-activity entry. */
const ActivityCard: React.FC<{ entry: ActivityEntry; onSelect: () => void }> = ({ entry, onSelect }) => {
  const { C, colors } = useTheme();
  const intensityColor = entry.intensity === 'high' ? C.red : entry.intensity === 'moderate' ? C.amber : C.green;

  return (
    <TouchableOpacity onPress={onSelect} style={[s.gridCardWrapper, { borderColor: C.redBorder, backgroundColor: colors.backgroundCard, shadowColor: colors.shadow }]}>
      <View style={[s.gridCardTopGlucometer, { backgroundColor: intensityColor + '10' }]}>
        <Image source={entry.image ? { uri: entry.image } : DefaultImageService.getDefaultImage('activity', entry.activityType)} style={s.cardImage} resizeMode="cover" />
        <View style={[s.statusBadgeFloating, { borderColor: intensityColor + '30' }]}>
          <Text style={[s.statusBadgeText, { color: intensityColor, textTransform: 'capitalize' }]}>{entry.intensity}</Text>
        </View>
      </View>

      <LinearGradient colors={[intensityColor, intensityColor + 'CC']} style={s.cardHeaderBand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={s.cardHeaderCategoryText}>{entry.activityType.toUpperCase()}</Text>
        <View style={s.cardHeaderMainValueRow}>
          <Text style={[s.cardHeaderValueText, { color: colors.textOnPrimary }]}>{entry.duration}</Text>
          <Text style={s.cardHeaderUnitText}>Min</Text>
        </View>
      </LinearGradient>

      <View style={s.gridCardBottomInfo}>
        <View style={s.mealMetricsRow}>
          {!!entry.distance && entry.distance > 0 && (
            <View style={[s.mealMetricBox, { backgroundColor: colors.backgroundMuted, borderColor: colors.border }]}>
              <TrendingUp size={9} color={C.textSm} />
              <Text style={[s.mealMetricVal, { color: C.textMd }]}>{entry.distance} km</Text>
            </View>
          )}
          {!!entry.calories && entry.calories > 0 && (
            <View style={[s.mealMetricBox, { backgroundColor: colors.backgroundMuted, borderColor: colors.border }]}>
              <Flame size={9} color={C.amber} />
              <Text style={[s.mealMetricVal, { color: C.textMd }]}>{entry.calories} kcal</Text>
            </View>
          )}
        </View>
        <View style={s.cardTimeRow}>
          <Text style={[s.cardTimeText, { color: C.textSm }]}>{entry.time} · {format(parseISO(entry.date), 'MMM d')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ActivityCard;
