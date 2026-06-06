import React, { useMemo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, TrendingUp } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../../theme/ThemeContext';
import { DefaultImageService } from '../../../services/DefaultImageService';
import type { MealEntry } from '../../../types';
import { cardStyles as s } from './logbookCardStyles';

/** Logbook grid card for a meal entry. */
const MealCard: React.FC<{ entry: MealEntry; onSelect: () => void }> = ({ entry, onSelect }) => {
  const { C, colors } = useTheme();

  const ic = useMemo(() => {
    switch (entry.impactLevel) {
      case 'high': return { color: C.red, bg: C.redBg, label: 'High impact' };
      case 'medium': return { color: C.amber, bg: C.amberBg, label: 'Moderate' };
      default: return { color: C.green, bg: C.greenBg, label: 'Low impact' };
    }
  }, [entry.impactLevel, C]);

  const mealTypeColor = entry.mealType === 'breakfast' ? C.amber : entry.mealType === 'lunch' ? C.blue : C.purple;

  return (
    <TouchableOpacity onPress={onSelect} style={[s.gridCardWrapper, { borderColor: C.redBorder, backgroundColor: colors.backgroundCard, shadowColor: colors.shadow }]}>
      <View style={[s.gridCardTopMeal, { backgroundColor: colors.backgroundMuted }]}>
        <Image source={entry.image ? { uri: entry.image } : DefaultImageService.getDefaultImage('meal')} style={s.cardImage} resizeMode="cover" />
        <View style={[s.statusBadgeFloatingLeft, { borderColor: ic.color + '30' }]}>
          <Text style={[s.statusBadgeText, { color: ic.color }]}>{ic.label}</Text>
        </View>
        <View style={s.statusBadgeFloatingRight}>
          <Text style={[s.statusBadgeText, { color: mealTypeColor, textTransform: 'capitalize' }]}>{entry.mealType}</Text>
        </View>
      </View>

      <LinearGradient colors={[C.red, C.redDark]} style={s.cardHeaderBand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={s.cardHeaderCategoryText}>{entry.mealType.toUpperCase()}</Text>
        <Text style={[s.cardHeaderMealName, { color: colors.textOnPrimary }]} numberOfLines={2}>{entry.name}</Text>
      </LinearGradient>

      <View style={s.gridCardBottomInfo}>
        <View style={s.mealMetricsRow}>
          <View style={[s.mealMetricBox, { backgroundColor: colors.backgroundMuted, borderColor: colors.border }]}>
            <Flame size={9} color={C.amber} />
            <Text style={[s.mealMetricVal, { color: C.textMd }]}>{entry.calories} kcal</Text>
          </View>
          <View style={[s.mealMetricBox, { backgroundColor: ic.color + '10', borderColor: colors.border }]}>
            <TrendingUp size={9} color={ic.color} />
            <Text style={[s.mealMetricVal, { color: ic.color }]}>{entry.impact}</Text>
          </View>
        </View>
        <View style={s.cardTimeRow}>
          <Text style={[s.cardTimeText, { color: C.textSm }]}>{entry.time} · {format(parseISO(entry.date), 'MMM d')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MealCard;
