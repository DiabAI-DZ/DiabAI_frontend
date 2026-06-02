import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Utensils } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { HomeRecommendation } from '../services/types';

interface RecommendedMealsProps {
  recommendations: HomeRecommendation[];
  loading?: boolean;
  onSeeAll?: () => void;
}

// Badge colour + default text by impact_level. impact_label wins as the text when present.
const IMPACT_MAP: Record<string, { bg: string; text: string }> = {
  low: { bg: '#2ECC71', text: 'Low impact' },
  excellent: { bg: '#14B8A6', text: 'Excellent' },
  moderate: { bg: '#F39C12', text: 'Moderate' },
  high: { bg: '#E74C3C', text: 'High impact' },
};

const impactStyle = (rec: HomeRecommendation) => {
  const level = String(rec.impact_level || '').toLowerCase();
  const mapped = IMPACT_MAP[level] || IMPACT_MAP.low;
  const label = String(rec.impact_label || '').trim();
  return { bg: mapped.bg, text: label.length > 0 ? rec.impact_label : mapped.text };
};

/** "Recommended for You" — horizontally scrolling food cards with glycemic-impact badges. */
const RecommendedMeals: React.FC<RecommendedMealsProps> = ({ recommendations, loading }) => {
  const { C } = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: C.text }]}>Recommended for You</Text>
          <Text style={[styles.subtitle, { color: C.textSm }]}>AI-powered suggestions</Text>
        </View>
      </View>

      {loading && recommendations.length === 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.card, { backgroundColor: C.white, borderColor: C.redBorder }]}>
              <View style={[styles.image, { backgroundColor: C.redBg }]} />
              <View style={styles.cardBody}>
                <View style={[styles.skeletonLine, { backgroundColor: C.redBorder }]} />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : recommendations.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
          <Utensils size={22} color={C.redMuted} />
          <Text style={[styles.emptyText, { color: C.textSm }]}>
            Recommendations coming soon — log more meals to get suggestions.
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {recommendations.map(rec => {
            const impact = impactStyle(rec);
            return (
              <View key={rec.id} style={[styles.card, { backgroundColor: C.white, borderColor: C.redBorder }]}>
                <View style={styles.imageWrap}>
                  {rec.image_url ? (
                    <Image source={{ uri: rec.image_url }} style={styles.image} resizeMode="cover" />
                  ) : (
                    <View style={[styles.image, styles.imageFallback, { backgroundColor: C.redBg }]}>
                      <Utensils size={26} color={C.redMuted} />
                    </View>
                  )}
                  <View style={[styles.impactBadge, { backgroundColor: impact.bg }]}>
                    <Text style={styles.impactText} numberOfLines={1}>{impact.text}</Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.foodName, { color: C.text }]} numberOfLines={2}>{rec.title}</Text>
                  {rec.calories > 0 && (
                    <Text style={[styles.foodMeta, { color: C.textSm }]}>{rec.calories} cal</Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 4,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 1 },
  scrollContent: { paddingHorizontal: 24, gap: 14 },
  card: {
    width: 160,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: {
    width: '100%',
    height: 108,
  },
  image: {
    width: '100%',
    height: 108,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 120,
  },
  impactText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cardBody: {
    padding: 12,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  foodMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    opacity: 0.5,
  },
  empty: {
    marginHorizontal: 24,
    height: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default RecommendedMeals;
