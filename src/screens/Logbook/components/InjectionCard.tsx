import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../../theme/ThemeContext';
import { DefaultImageService } from '../../../services/DefaultImageService';
import type { InsulinInjectionEntry } from '../../../types';
import { cardStyles as s, INJECTION_GRADIENT } from './logbookCardStyles';

/** Logbook grid card for an insulin injection entry. */
const InjectionCard: React.FC<{ entry: InsulinInjectionEntry; onSelect: () => void }> = ({ entry, onSelect }) => {
  const { C, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onSelect} style={[s.gridCardWrapper, { borderColor: C.redBorder, backgroundColor: colors.backgroundCard, shadowColor: colors.shadow }]}>
      <View style={[s.gridCardTopGlucometer, { backgroundColor: C.redBg }]}>
        <Image source={entry.image ? { uri: entry.image } : DefaultImageService.getDefaultImage('injection')} style={s.cardImage} resizeMode="cover" />
        <View style={[s.statusBadgeFloating, { borderColor: C.redBorder }]}>
          <Text style={[s.statusBadgeText, { color: C.red, textTransform: 'capitalize' }]}>{entry.site}</Text>
        </View>
      </View>

      <LinearGradient colors={INJECTION_GRADIENT} style={s.cardHeaderBand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={s.cardHeaderCategoryText}>{entry.insulinType.replace('_', ' ').toUpperCase()}</Text>
        <View style={s.cardHeaderMainValueRow}>
          <Text style={[s.cardHeaderValueText, { color: colors.textOnPrimary }]}>{entry.dose}</Text>
          <Text style={s.cardHeaderUnitText}>Units</Text>
        </View>
      </LinearGradient>

      <View style={s.gridCardBottomInfo}>
        <View style={[s.trendBadge, { backgroundColor: C.redBg }]}>
          <Zap size={9} color={C.red} />
          <Text style={[s.trendBadgeText, { color: C.red }]}>{entry.reason.replace('_', ' ')}</Text>
        </View>
        <View style={s.cardTimeRow}>
          <Text style={[s.cardTimeText, { color: C.textSm }]}>{entry.time} · {format(parseISO(entry.date), 'MMM d')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default InjectionCard;
