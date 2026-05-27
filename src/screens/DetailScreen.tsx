import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { apiService } from '../services/apiService';
import { 
  AlertTriangle,
  Zap, 
  Activity, 
  Flame, 
  Brain, 
  Sparkles, 
  ChevronLeft,
  CalendarDays,
  Clock,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Target,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type GlucoseStatus = "Normal" | "High" | "Low";

interface DetailScreenProps {
  entry: any;
  onBack: () => void;
}

// Nutrition Ring inside detail
const NutritionRingDetail: React.FC<{ label: string; value: number; unit: string; color: string; percent: number }> = ({
  label,
  value,
  unit,
  color,
  percent,
}) => {
  const { C } = useTheme();
  const size = 56;
  const strokeWidth = 5;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const strokeDashoffset = circ - (Math.min(100, Math.max(0, percent)) / 100) * circ;

  return (
    <View style={styles.nutriCol}>
      <View style={styles.ringFrame}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#F0EDED"
            strokeWidth={strokeWidth}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.ringValueCenter}>
          <Text style={[styles.ringValueText, { color: C.text }]}>{value}</Text>
        </View>
      </View>
      <Text style={[styles.nutriLabel, { color: color }]}>{label}</Text>
      <Text style={[styles.nutriSub, { color: C.textXs }]}>{unit}</Text>
    </View>
  );
};

const DetailScreen: React.FC<DetailScreenProps> = ({ entry, onBack }) => {
  const { C, isDark } = useTheme();
  const { profile } = useUser();

  const isMeasurement = entry.type === 'measurement';

  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadDetails = async () => {
      try {
        setLoading(true);
        let res;
        if (isMeasurement) {
          res = await apiService.fetchMeasurementDetail(entry.id);
        } else if (entry.type === 'meal') {
          res = await apiService.fetchMealDetail(entry.id);
        }
        if (active && res) {
          setDetails(res);
        }
      } catch (err) {
        console.error("Failed to load details:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadDetails();
    return () => {
      active = false;
    };
  }, [entry.id, entry.type]);

  const mapIconComponent = (iconName: string) => {
    const name = iconName ? iconName.toLowerCase() : '';
    if (name.includes('heart')) return Heart;
    if (name.includes('target')) return Target;
    if (name.includes('alert') || name.includes('triangle') || name.includes('warn')) return AlertTriangle;
    if (name.includes('zap') || name.includes('bolt') || name.includes('flash')) return Zap;
    if (name.includes('activity') || name.includes('chart')) return Activity;
    if (name.includes('flame') || name.includes('fire') || name.includes('burn')) return Flame;
    if (name.includes('brain') || name.includes('intel') || name.includes('mind')) return Brain;
    if (name.includes('spark') || name.includes('star') || name.includes('magic')) return Sparkles;
    return Sparkles; // fallback
  };

  const mapIconColor = (iconName: string, themeColors: any) => {
    const name = iconName ? iconName.toLowerCase() : '';
    if (name.includes('heart') || name.includes('green') || name.includes('recommend')) return { color: themeColors.green || '#16A34A', bg: themeColors.greenBg || '#F0FDF4' };
    if (name.includes('target') || name.includes('blue') || name.includes('globe')) return { color: themeColors.blue || '#2563EB', bg: themeColors.blueBg || '#EFF6FF' };
    if (name.includes('alert') || name.includes('red') || name.includes('low') || name.includes('high')) return { color: themeColors.red || '#DC2626', bg: themeColors.redBg || '#FEF2F2' };
    if (name.includes('zap') || name.includes('amber') || name.includes('orange') || name.includes('warn')) return { color: themeColors.amber || '#D97706', bg: themeColors.amberBg || '#FFFBEB' };
    if (name.includes('brain') || name.includes('purple') || name.includes('intel') || name.includes('pattern')) return { color: themeColors.purple || '#7C3AED', bg: themeColors.purpleBg || '#F5F3FF' };
    return { color: themeColors.purple || '#7C3AED', bg: themeColors.purpleBg || '#F5F3FF' }; // default
  };

  const statusCfg = (s: GlucoseStatus) => {
    switch (s) {
      case 'High':
        return { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'High' };
      case 'Low':
        return { color: '#C41E26', bg: '#FDF1F1', border: '#F2D0D0', label: 'Low' };
      default:
        return { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', label: 'Normal' };
    }
  };

  const impactCfg = (level: "low" | "medium" | "high") => {
    switch (level) {
      case 'high':
        return { color: '#C41E26', bg: '#FDF1F1', border: '#F2D0D0', label: 'High Impact' };
      case 'medium':
        return { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Moderate Impact' };
      default:
        return { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', label: 'Low Impact' };
    }
  };

  const renderMeasurementDetail = () => {
    const sc = statusCfg(entry.status);
    const TrendIcon = entry.trend === 'up' ? TrendingUp : (entry.trend === 'down' ? TrendingDown : Minus);
    const trendLabel = entry.trend === 'up' ? 'Rising' : (entry.trend === 'down' ? 'Falling' : 'Stable');
    const trendColor = entry.trend === 'up' ? C.amber : (entry.trend === 'down' ? C.green : C.textXs);

    // Glucose gauge slider values
    const minVal = 40;
    const maxVal = 300;
    const pct = Math.min(100, Math.max(0, ((entry.value - minVal) / (maxVal - minVal)) * 100));

    const minGoal = profile?.goals?.min || 70;
    const maxGoal = profile?.goals?.max || 140;

    const insights = entry.value >= minGoal && entry.value <= maxGoal ? [
      { icon: Heart, iconBg: C.greenBg, iconColor: C.green, title: "Great Reading!", desc: `This glucose reading is within your target range (${minGoal}–${maxGoal} mg/dL). Keep up the healthy routine.` },
      { icon: Target, iconBg: C.blueBg, iconColor: C.blue, title: "On Track", desc: "Your fasting glucose is well-controlled. Consistency with meal timing supports stable levels." }
    ] : entry.value > maxGoal ? [
      { icon: AlertTriangle, iconBg: C.amberBg, iconColor: C.amber, title: "Above Target Range", desc: `This reading exceeds ${maxGoal} mg/dL. Consider reviewing recent meals and physical activity levels.` },
      { icon: Brain, iconBg: C.purpleBg, iconColor: C.purple, title: "Pattern Detected", desc: "Post-meal spikes have been more common this week. A short walk after meals may help reduce peaks." }
    ] : [
      { icon: AlertTriangle, iconBg: C.redBg, iconColor: C.red, title: "Below Target Range", desc: `This reading is below the safe threshold of ${minGoal} mg/dL. Ensure you're eating regular meals.` },
      { icon: Zap, iconBg: C.amberBg, iconColor: C.amber, title: "Action Recommended", desc: "Consider consuming 15g of fast-acting carbohydrates and recheck in 15 minutes." }
    ];

    return (
      <View style={styles.detailWrapper}>
        
        {/* Glow Hero Circular Visual */}
        <View style={[styles.heroArea, { backgroundColor: isDark ? '#1C1C1E' : '#FAFAFA', borderBottomColor: C.divider }]}>
          <LinearGradient
            colors={[C.redBg, C.white]}
            style={styles.heroBackgroundGradient}
          />
          <View style={[styles.glowingRing, { borderColor: sc.color, shadowColor: sc.color }]}>
            <Text style={[styles.glowingVal, { color: C.text }]}>{entry.value}</Text>
            <Text style={[styles.glowingUnit, { color: C.textSm }]}>{entry.unit}</Text>
          </View>
          <View style={[styles.statusTagFloating, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <View style={[styles.floatingDot, { backgroundColor: sc.color }]} />
            <Text style={[styles.floatingTagText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        {/* Primary Value strip info */}
        <View style={[styles.stripRow, { backgroundColor: C.white, borderBottomColor: C.divider }]}>
          <View>
            <Text style={[styles.stripLabel, { color: C.textSm }]}>Measurement Value</Text>
            <View style={styles.stripFlexRow}>
              <Text style={[styles.stripVal, { color: C.text }]}>{entry.value}</Text>
              <Text style={[styles.stripUnit, { color: C.textXs }]}>{entry.unit}</Text>
            </View>
          </View>
          
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={[styles.badgePill, { backgroundColor: trendColor + '15', borderColor: trendColor }]}>
              <TrendIcon size={12} color={trendColor} />
              <Text style={[styles.badgeText, { color: trendColor }]}>{trendLabel}</Text>
            </View>
            <Text style={[styles.unitConversion, { color: C.textSm }]}>{(entry.value * 0.0056).toFixed(2)} g/L</Text>
          </View>
        </View>

        {/* Range gauge visual slider */}
        <View style={[styles.gaugeContainer, { backgroundColor: C.white, borderBottomColor: C.divider }]}>
          <Text style={[styles.gaugeTitle, { color: C.textSm }]}>Glucose Range Position</Text>
          <View style={styles.gaugeTrack}>
            <View style={[styles.gaugeSegment, { left: 0, width: '22%', backgroundColor: C.red + '35' }]} />
            <View style={[styles.gaugeSegment, { left: '22%', width: '48%', backgroundColor: C.green + '35' }]} />
            <View style={[styles.gaugeSegment, { left: '70%', width: '30%', backgroundColor: C.amber + '35' }]} />
            
            {/* Position indicator slider handle */}
            <View 
              style={[
                styles.gaugeHandle, 
                { 
                  left: `${pct}%`,
                  borderColor: sc.color,
                  shadowColor: sc.color
                }
              ]} 
            />
          </View>
          <View style={styles.gaugeLabels}>
            <Text style={[styles.gaugeLabelText, { color: C.red }]}>Low &lt;{profile?.goals?.min || 70}</Text>
            <Text style={[styles.gaugeLabelText, { color: C.green }]}>Normal {profile?.goals?.min || 70}-{profile?.goals?.max || 140}</Text>
            <Text style={[styles.gaugeLabelText, { color: C.amber }]}>High &gt;{profile?.goals?.max || 140}</Text>
          </View>
        </View>

        {/* Info Rows */}
        <View style={[styles.infoRowsCard, { backgroundColor: C.white }]}>
          <View style={[styles.infoRow, { borderBottomColor: C.divider }]}>
            <Text style={[styles.infoLabel, { color: C.text }]}>Title</Text>
            <Text style={[styles.infoValue, { color: C.textSm }]}>Glucose Measurement</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: C.divider }]}>
            <Text style={[styles.infoLabel, { color: C.text }]}>Measurement</Text>
            <Text style={[styles.infoValue, { color: C.textSm }]}>{(entry.value * 0.0056).toFixed(1)} g/L</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: C.divider }]}>
            <Text style={[styles.infoLabel, { color: C.text }]}>Day</Text>
            <Text style={[styles.infoValue, { color: C.textSm }]}>{entry.date}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: C.divider }]}>
            <Text style={[styles.infoLabel, { color: C.text }]}>Hour</Text>
            <Text style={[styles.infoValue, { color: C.textSm }]}>{entry.time}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: C.divider }]}>
            <Text style={[styles.infoLabel, { color: C.text }]}>Measurement Type</Text>
            <Text style={[styles.infoValue, { color: C.textSm }]}>{entry.tag || "General"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: C.text }]}>Health Insights</Text>
            <Text style={[styles.infoValue, { color: sc.color, fontWeight: 'bold' }]}>{sc.label}</Text>
          </View>
        </View>

        {/* Comparison card (vs previous / daily average) */}
        {(entry.previousValue || entry.dailyAvg || details?.comparison) && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Comparison</Text>
              <View style={[styles.compareBadge, { backgroundColor: C.amberBg, borderColor: C.amberBorder }]}>
                <Text style={[styles.compareBadgeText, { color: C.amber }]}>vs average</Text>
              </View>
            </View>

            <View style={styles.comparisonColumn}>
              {entry.previousValue && (
                <View style={[styles.compareBarCard, { backgroundColor: C.white, borderColor: C.divider }]}>
                  <View>
                    <Text style={[styles.compareBarLabel, { color: C.textSm }]}>Previous Measurement</Text>
                    <Text style={[styles.compareBarValue, { color: C.text }]}>
                      {entry.previousValue} <Text style={styles.compareBarUnit}>mg/dL</Text>
                    </Text>
                  </View>
                  <View style={[
                    styles.compareDeltaBox, 
                    { 
                      backgroundColor: entry.value >= entry.previousValue ? C.amberBg : C.greenBg, 
                      borderColor: entry.value >= entry.previousValue ? C.amberBorder : C.greenBorder 
                    }
                  ]}>
                    {entry.value >= entry.previousValue ? <ArrowUpRight size={14} color={C.amber} /> : <ArrowDownRight size={14} color={C.green} />}
                    <Text style={[styles.compareDeltaText, { color: entry.value >= entry.previousValue ? C.amber : C.green }]}>
                      {entry.value >= entry.previousValue ? '+' : ''}{entry.value - entry.previousValue} mg/dL
                    </Text>
                  </View>
                </View>
              )}

              {(details?.comparison?.daily_average_mg_dl !== undefined || entry.dailyAvg) && (
                <View style={[styles.compareBarCard, { backgroundColor: C.white, borderColor: C.divider }]}>
                  <View>
                    <Text style={[styles.compareBarLabel, { color: C.textSm }]}>Daily Average</Text>
                    <Text style={[styles.compareBarValue, { color: C.text }]}>
                      {details?.comparison?.daily_average_mg_dl ?? entry.dailyAvg} <Text style={styles.compareBarUnit}>mg/dL</Text>
                    </Text>
                  </View>
                  <View style={[
                    styles.compareDeltaBox, 
                    { 
                      backgroundColor: (details?.comparison?.delta_mg_dl ?? (entry.value - entry.dailyAvg)) >= 0 ? C.amberBg : C.greenBg, 
                      borderColor: (details?.comparison?.delta_mg_dl ?? (entry.value - entry.dailyAvg)) >= 0 ? C.amberBorder : C.greenBorder 
                    }
                  ]}>
                    {(details?.comparison?.delta_mg_dl ?? (entry.value - entry.dailyAvg)) >= 0 ? <ArrowUpRight size={14} color={C.amber} /> : <ArrowDownRight size={14} color={C.green} />}
                    <Text style={[styles.compareDeltaText, { color: (details?.comparison?.delta_mg_dl ?? (entry.value - entry.dailyAvg)) >= 0 ? C.amber : C.green }]}>
                      {(details?.comparison?.delta_mg_dl ?? (entry.value - entry.dailyAvg)) >= 0 ? '+' : ''}{details?.comparison?.delta_mg_dl ?? (entry.value - entry.dailyAvg)} mg/dL
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Health insights list */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Health Insights</Text>
            <View style={[styles.compareBadge, { backgroundColor: C.purpleBg, borderColor: C.divider }]}>
              <Text style={[styles.compareBadgeText, { color: C.purple }]}>AI Powered</Text>
            </View>
          </View>

          <View style={styles.insightWrapperList}>
            {(details?.health_insights ? details.health_insights.map((ins: any) => {
              const colors = mapIconColor(ins.icon, C);
              return {
                icon: mapIconComponent(ins.icon),
                iconBg: colors.bg,
                iconColor: colors.color,
                title: ins.title,
                desc: ins.body
              };
            }) : insights).map((ins: any, idx: number) => {
              const InsIcon = ins.icon;
              return (
                <View key={idx} style={[styles.insightRowCard, { backgroundColor: C.white, borderColor: C.divider }]}>
                  <View style={[styles.insightIconWrapper, { backgroundColor: ins.iconBg }]}>
                    <InsIcon size={16} color={ins.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.insightRowTitle, { color: C.text }]}>{ins.title}</Text>
                    <Text style={[styles.insightRowDesc, { color: C.textSm }]}>{ins.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

      </View>
    );
  };

  const renderMealDetail = () => {
    const ic = impactCfg(entry.impactLevel);
    const mealTypeLabel = entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1);

    return (
      <View style={styles.detailWrapper}>
        
        {/* Hero image with labels overlay */}
        <View style={styles.mealHeroContainer}>
          <Image source={{ uri: entry.image }} style={styles.mealHeroImg} />
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.65)']}
            style={styles.mealGradientOverlay}
          />
          
          <View style={styles.mealBadgesFloating}>
            <View style={styles.mealFloatingBadge}>
              <Text style={[styles.mealFloatingBadgeText, { color: C.amber }]}>{mealTypeLabel}</Text>
            </View>
            <View style={[styles.mealFloatingBadge, { borderColor: ic.color + '40' }]}>
              <Text style={[styles.mealFloatingBadgeText, { color: ic.color }]}>{ic.label}</Text>
            </View>
          </View>

          <View style={styles.mealTitleBlock}>
            <Text style={styles.mealHeroTitle}>{entry.name}</Text>
            <View style={styles.mealTimeWrapper}>
              <Clock size={12} color="rgba(255,255,255,0.75)" />
              <Text style={styles.mealHeroTime}>{entry.time} · {entry.date}</Text>
            </View>
          </View>
        </View>

        {/* Estimated Glucose impact */}
        <View style={[styles.stripRow, { backgroundColor: C.white, borderBottomColor: C.divider }]}>
          <View>
            <Text style={[styles.stripLabel, { color: C.textSm }]}>ESTIMATED GLUCOSE IMPACT</Text>
            <Text style={[styles.impactValText, { color: ic.color }]}>{entry.glucoseImpact || entry.impact}</Text>
          </View>
          <View style={[styles.impactCircleIcon, { backgroundColor: ic.bg, borderColor: ic.border }]}>
            <TrendingUp size={24} color={ic.color} />
          </View>
        </View>

        {/* Nutrition Rings breakdown section */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: C.text, marginBottom: 12 }]}>Nutrition Breakdown</Text>
          <View style={[styles.nutritionRingsCard, { backgroundColor: C.white, borderColor: C.divider }]}>
            <View style={styles.ringsRow}>
              <NutritionRingDetail 
                label="Carbs" 
                value={details?.nutrition?.carbohydrates_g !== undefined && details?.nutrition?.carbohydrates_g !== null ? details.nutrition.carbohydrates_g : entry.carbs} 
                unit="g" 
                color={C.amber} 
                percent={Math.min(100, ((details?.nutrition?.carbohydrates_g !== undefined && details?.nutrition?.carbohydrates_g !== null ? details.nutrition.carbohydrates_g : entry.carbs) / 80) * 100)} 
              />
              <NutritionRingDetail 
                label="Protein" 
                value={details?.nutrition?.protein_g !== undefined && details?.nutrition?.protein_g !== null ? details.nutrition.protein_g : (entry.protein || 0)} 
                unit="g" 
                color={C.blue} 
                percent={Math.min(100, ((details?.nutrition?.protein_g !== undefined && details?.nutrition?.protein_g !== null ? details.nutrition.protein_g : (entry.protein || 0)) / 60) * 100)} 
              />
              <NutritionRingDetail 
                label="Fat" 
                value={details?.nutrition?.fat_g !== undefined && details?.nutrition?.fat_g !== null ? details.nutrition.fat_g : (entry.fat || 0)} 
                unit="g" 
                color={C.purple} 
                percent={Math.min(100, ((details?.nutrition?.fat_g !== undefined && details?.nutrition?.fat_g !== null ? details.nutrition.fat_g : (entry.fat || 0)) / 50) * 100)} 
              />
              <NutritionRingDetail 
                label="Fiber" 
                value={details?.nutrition?.fiber_g !== undefined && details?.nutrition?.fiber_g !== null ? details.nutrition.fiber_g : (entry.fiber || 0)} 
                unit="g" 
                color={C.green} 
                percent={Math.min(100, ((details?.nutrition?.fiber_g !== undefined && details?.nutrition?.fiber_g !== null ? details.nutrition.fiber_g : (entry.fiber || 0)) / 30) * 100)} 
              />
            </View>

            <View style={[styles.calorieBarRow, { backgroundColor: '#FAFAFA', borderColor: C.divider }]}>
              <View style={styles.caloriesLabelWrap}>
                <Flame size={15} color={C.amber} />
                <Text style={[styles.caloriesLabel, { color: C.text }]}>Total Calories</Text>
              </View>
              <Text style={[styles.caloriesValText, { color: C.amber }]}>{entry.calories} kcal</Text>
            </View>
          </View>
        </View>

        {/* Info list */}
        <View style={[styles.infoRowsCard, { backgroundColor: C.white, marginTop: 16 }]}>
          <View style={[styles.infoRow, { borderBottomColor: C.divider }]}>
            <Text style={[styles.infoLabel, { color: C.text }]}>Meal</Text>
            <Text style={[styles.infoValue, { color: C.textSm }]}>{entry.name}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: C.divider }]}>
            <Text style={[styles.infoLabel, { color: C.text }]}>Type</Text>
            <Text style={[styles.infoValue, { color: C.textSm }]}>{mealTypeLabel}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: C.divider }]}>
            <Text style={[styles.infoLabel, { color: C.text }]}>Day</Text>
            <Text style={[styles.infoValue, { color: C.textSm }]}>{entry.date}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: C.divider }]}>
            <Text style={[styles.infoLabel, { color: C.text }]}>Hour</Text>
            <Text style={[styles.infoValue, { color: C.textSm }]}>{entry.time}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: C.divider }]}>
            <Text style={[styles.infoLabel, { color: C.text }]}>Carbohydrates</Text>
            <Text style={[styles.infoValue, { color: C.textSm }]}>{details?.nutrition?.carbohydrates_g !== undefined && details?.nutrition?.carbohydrates_g !== null ? details.nutrition.carbohydrates_g : entry.carbs}g</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: C.text }]}>Impact Level</Text>
            <Text style={[styles.infoValue, { color: ic.color, fontWeight: 'bold' }]}>{ic.label}</Text>
          </View>
        </View>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionTitle, { color: C.text, marginBottom: 12 }]}>Tags</Text>
            <View style={styles.tagsContainer}>
              {entry.tags.map((tag: string) => (
                <View key={tag} style={[styles.tagBadgePill, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
                  <Text style={[styles.tagBadgeText, { color: C.redMuted }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Health Insights */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Health Insights</Text>
            <View style={[styles.compareBadge, { backgroundColor: C.purpleBg, borderColor: C.divider }]}>
              <Text style={[styles.compareBadgeText, { color: C.purple }]}>AI Powered</Text>
            </View>
          </View>

          <View style={styles.insightWrapperList}>
            {(details?.health_insights ? details.health_insights.map((ins: any) => {
              const colors = mapIconColor(ins.icon, C);
              return {
                icon: mapIconComponent(ins.icon),
                iconBg: colors.bg,
                iconColor: colors.color,
                title: ins.title,
                desc: ins.body
              };
            }) : [
              {
                icon: Brain,
                iconBg: C.amberBg,
                iconColor: C.amber,
                title: `${entry.impactLevel ? entry.impactLevel.charAt(0).toUpperCase() + entry.impactLevel.slice(1) : 'Moderate'} Glucose Impact`,
                desc: `This meal is estimated to raise your glucose by ${entry.glucoseImpact || entry.impact || 'moderate amount'}. The ${entry.carbs}g of carbs are the primary contributor.`
              },
              {
                icon: Sparkles,
                iconBg: C.greenBg,
                iconColor: C.green,
                title: "Recommendation",
                desc: "Pairing high-carb meals with a 15-minute walk can reduce post-meal glucose spikes by up to 30%."
              }
            ]).map((ins: any, idx: number) => {
              const InsIcon = ins.icon;
              return (
                <View key={idx} style={[styles.insightRowCard, { backgroundColor: C.white, borderColor: C.divider }]}>
                  <View style={[styles.insightIconWrapper, { backgroundColor: ins.iconBg }]}>
                    <InsIcon size={16} color={ins.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.insightRowTitle, { color: C.text }]}>{ins.title}</Text>
                    <Text style={[styles.insightRowDesc, { color: C.textSm }]}>{ins.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <ChevronLeft size={24} color={C.text} />
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  detailWrapper: {
    flex: 1,
  },
  heroArea: {
    height: 340,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
  },
  heroBackgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  glowingRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  glowingVal: {
    fontSize: 54,
    fontWeight: '900',
  },
  glowingUnit: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: -2,
  },
  statusTagFloating: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  floatingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  floatingTagText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  stripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  stripLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  stripFlexRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  stripVal: {
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 38,
  },
  stripUnit: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  unitConversion: {
    fontSize: 12,
    fontWeight: '500',
  },
  gaugeContainer: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  gaugeTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  gaugeTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F0EDED',
    position: 'relative',
    overflow: 'visible',
  },
  gaugeSegment: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    height: '100%',
  },
  gaugeHandle: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    backgroundColor: '#FFF',
    top: '50%',
    transform: [{ translateY: -9 }, { translateX: -9 }],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  gaugeLabelText: {
    fontSize: 9,
    fontWeight: '700',
  },
  infoRowsCard: {
    marginHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0EDED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13.5,
  },
  sectionWrap: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  compareBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  compareBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  comparisonColumn: {
    gap: 10,
  },
  compareBarCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compareBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  compareBarValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  compareBarUnit: {
    fontSize: 10,
    fontWeight: 'normal',
  },
  compareDeltaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  compareDeltaText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  insightWrapperList: {
    gap: 10,
  },
  insightRowCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  insightIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  insightRowTitle: {
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  insightRowDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },

  // --- MEAL DETAILS STYLING ---
  mealHeroContainer: {
    height: 280,
    position: 'relative',
  },
  mealHeroImg: {
    width: '100%',
    height: '100%',
  },
  mealGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  mealBadgesFloating: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    gap: 8,
  },
  mealFloatingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mealFloatingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  mealTitleBlock: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
  },
  mealHeroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  mealTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  mealHeroTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  impactValText: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 32,
    marginTop: 2,
  },
  impactCircleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionRingsCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  nutriCol: {
    alignItems: 'center',
  },
  ringFrame: {
    width: 56,
    height: 56,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValueCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringValueText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  nutriLabel: {
    fontSize: 10.5,
    fontWeight: 'bold',
    marginTop: 6,
  },
  nutriSub: {
    fontSize: 8.5,
    marginTop: 1,
  },
  calorieBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  caloriesLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  caloriesLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  caloriesValText: {
    fontSize: 16,
    fontWeight: '800',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadgePill: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default DetailScreen;
