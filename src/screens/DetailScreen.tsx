import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Heart, Target, Zap, Activity, Flame, Brain, Sparkles, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface DetailScreenProps {
  entry: any;
  onBack: () => void;
}

const DetailScreen: React.FC<DetailScreenProps> = ({ entry, onBack }) => {
  const { C, isDark } = useTheme();

  const isMeasurement = entry.type === 'measurement';

  const renderMeasurementDetail = () => {
    const iconColor = entry.status === 'Normal' ? C.green : (entry.status === 'High' ? C.amber : C.red);
    const TrendIcon = entry.trend === 'up' ? TrendingUp : (entry.trend === 'down' ? TrendingDown : Minus);

    return (
      <View style={styles.detailContainer}>
        <View style={styles.heroSection}>
           <LinearGradient
            colors={[C.redBg, C.white]}
            style={styles.heroGradient}
           >
             <Activity size={120} color={C.red} strokeWidth={1} style={{ opacity: 0.2 }} />
             <View style={[styles.heroValueContainer, { borderColor: iconColor }]}>
                <Text style={[styles.heroValue, { color: C.text }]}>{entry.value}</Text>
                <Text style={[styles.heroUnit, { color: C.textSm }]}>{entry.unit}</Text>
             </View>
           </LinearGradient>
        </View>

        <View style={styles.statsStrip}>
           <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: C.textSm }]}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: iconColor + '15', borderColor: iconColor }]}>
                 <Text style={[styles.statusText, { color: iconColor }]}>{entry.status}</Text>
              </View>
           </View>
           <View style={styles.statDivider} />
           <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: C.textSm }]}>Trend</Text>
              <View style={styles.trendRow}>
                 <TrendIcon size={16} color={iconColor} />
                 <Text style={[styles.trendText, { color: iconColor }]}>{entry.trend.toUpperCase()}</Text>
              </View>
           </View>
        </View>

        <View style={styles.infoSection}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>Reading Insights</Text>
           <View style={[styles.insightCard, { backgroundColor: C.white, borderColor: C.redBorder }]}>
              <View style={[styles.insightIcon, { backgroundColor: C.redBg }]}>
                 <Sparkles size={20} color={C.red} />
              </View>
              <View style={styles.insightContent}>
                 <Text style={[styles.insightTitle, { color: C.text }]}>AI Analysis</Text>
                 <Text style={[styles.insightDesc, { color: C.textSm }]}>
                    Your reading of {entry.value} is {entry.status.toLowerCase()}. 
                    {entry.trend === 'up' ? " It seems like your levels are rising after your last activity." : " Your levels are currently stable."}
                 </Text>
              </View>
           </View>
        </View>

        {entry.previousValue && (
           <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Comparison</Text>
              <View style={[styles.comparisonCard, { backgroundColor: C.white }]}>
                 <View>
                    <Text style={[styles.compLabel, { color: C.textSm }]}>Previous Reading</Text>
                    <Text style={[styles.compValue, { color: C.text }]}>{entry.previousValue} {entry.unit}</Text>
                 </View>
                 <View style={[styles.diffBadge, { backgroundColor: entry.value > entry.previousValue ? C.amber + '15' : C.green + '15' }]}>
                    <Text style={[styles.diffText, { color: entry.value > entry.previousValue ? C.amber : C.green }]}>
                       {entry.value > entry.previousValue ? '+' : ''}{entry.value - entry.previousValue}
                    </Text>
                 </View>
              </View>
           </View>
        )}
      </View>
    );
  };

  const renderMealDetail = () => {
    return (
      <View style={styles.detailContainer}>
        <Image source={{ uri: entry.image }} style={styles.mealHero} />
        <View style={styles.mealHeader}>
           <View style={[styles.mealTypeBadge, { backgroundColor: C.amber }]}>
              <Text style={styles.mealTypeText}>{entry.mealType.toUpperCase()}</Text>
           </View>
           <Text style={[styles.mealName, { color: C.text }]}>{entry.name}</Text>
           <Text style={[styles.mealTime, { color: C.textSm }]}>{entry.time} · {entry.date}</Text>
        </View>

        <View style={styles.nutritionGrid}>
           <View style={[styles.nutriBox, { backgroundColor: C.white }]}>
              <Text style={[styles.nutriValue, { color: C.amber }]}>{entry.carbs}g</Text>
              <Text style={[styles.nutriLabel, { color: C.textSm }]}>Carbs</Text>
           </View>
           <View style={[styles.nutriBox, { backgroundColor: C.white }]}>
              <Text style={[styles.nutriValue, { color: C.blue }]}>{entry.protein || 0}g</Text>
              <Text style={[styles.nutriLabel, { color: C.textSm }]}>Protein</Text>
           </View>
           <View style={[styles.nutriBox, { backgroundColor: C.white }]}>
              <Text style={[styles.nutriValue, { color: C.purple }]}>{entry.fat || 0}g</Text>
              <Text style={[styles.nutriLabel, { color: C.textSm }]}>Fat</Text>
           </View>
           <View style={[styles.nutriBox, { backgroundColor: C.white }]}>
              <Text style={[styles.nutriValue, { color: C.red }]}>{entry.calories}</Text>
              <Text style={[styles.nutriLabel, { color: C.textSm }]}>Kcal</Text>
           </View>
        </View>

        <View style={styles.infoSection}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>Glucose Impact</Text>
           <View style={[styles.impactCard, { backgroundColor: C.white }]}>
              <TrendingUp size={24} color={entry.impactLevel === 'low' ? C.green : C.amber} />
              <View>
                 <Text style={[styles.impactValue, { color: entry.impactLevel === 'low' ? C.green : C.amber }]}>{entry.impact}</Text>
                 <Text style={[styles.impactLabel, { color: C.textSm }]}>{entry.impactLevel.toUpperCase()} IMPACT</Text>
              </View>
           </View>
        </View>

        {entry.tags && (
           <View style={styles.tagSection}>
              {entry.tags.map((tag: string) => (
                 <View key={tag} style={[styles.detailTag, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
                    <Text style={[styles.detailTagText, { color: C.redMuted }]}>{tag}</Text>
                 </View>
              ))}
           </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <ChevronLeft size={32} color={C.text} />
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isMeasurement ? renderMeasurementDetail() : renderMealDetail()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  detailContainer: {
    flex: 1,
  },
  heroSection: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroValueContainer: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  heroValue: {
    fontSize: 56,
    fontWeight: '900',
  },
  heroUnit: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsStrip: {
    flexDirection: 'row',
    padding: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EEE',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '800',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '800',
  },
  infoSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  comparisonCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  compLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  compValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  diffBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  diffText: {
    fontSize: 14,
    fontWeight: '800',
  },
  mealHero: {
    width: '100%',
    height: 300,
  },
  mealHeader: {
    padding: 24,
  },
  mealTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  mealTypeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  mealName: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  mealTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  nutriBox: {
    width: (width - 64) / 2,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  nutriValue: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  nutriLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  impactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  impactValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  impactLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  tagSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 8,
  },
  detailTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default DetailScreen;
