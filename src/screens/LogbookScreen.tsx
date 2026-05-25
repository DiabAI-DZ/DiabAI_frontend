import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Modal,
  PanResponder,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { 
  Search, 
  SlidersHorizontal, 
  Droplets, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Utensils, 
  Zap, 
  CalendarDays, 
  X, 
  Activity, 
  Flame, 
  Check, 
  RotateCcw, 
  Coffee, 
  Sun, 
  Moon, 
  Cookie,
  ChevronRight,
  SmilePlus,
  Syringe
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isSameDay, isAfter, isBefore, subDays, parseISO } from 'date-fns';

const { width, height } = Dimensions.get('window');

type GlucoseStatus = "Normal" | "High" | "Low";
type FilterType = "all" | "measurements" | "meals" | "injections" | "activities";
type DatePreset = "today" | "7days" | "30days" | "custom";
type MealTypeFilter = "breakfast" | "lunch" | "dinner" | "snack";
type GlucosePreset = "low" | "normal" | "high" | null;

interface Filters {
  typeFilter: FilterType;
  datePreset: DatePreset;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  glucosePreset: GlucosePreset;
  glucoseMin: number;
  glucoseMax: number;
  mealTypes: MealTypeFilter[];
}

const defaultFilters: Filters = {
  typeFilter: "all",
  datePreset: "30days",
  rangeStart: null,
  rangeEnd: null,
  glucosePreset: null,
  glucoseMin: 40,
  glucoseMax: 300,
  mealTypes: [],
};

// Sub-Component: Horizontal Date Strip
const DateStrip: React.FC<{
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}> = ({ selectedDate, onSelect }) => {
  const { C } = useTheme();
  const today = useMemo(() => new Date(), []);
  
  // Generate 14 days: 7 past + today + 6 future (future disabled)
  const days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => subDays(today, 7 - i));
  }, [today]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dateStripScrollContent}
      style={styles.dateStripFrame}
    >
      {days.map((day) => {
        const isActive = selectedDate ? isSameDay(day, selectedDate) : isSameDay(day, today);
        const isToday_ = isSameDay(day, today);
        const isFuture = isAfter(day, today);
        const dayName = format(day, "EEE").toUpperCase();
        const dayNum = format(day, "d");

        return (
          <TouchableOpacity
            key={day.toISOString()}
            onPress={() => !isFuture && onSelect(day)}
            disabled={isFuture}
            style={[
              styles.dateCardBtn,
              {
                borderColor: isActive ? C.red : (isToday_ ? C.redBorder : "#F0EDED"),
                backgroundColor: isActive ? 'transparent' : "#FAFAFA",
                opacity: isFuture ? 0.35 : 1,
              }
            ]}
          >
            {isActive ? (
              <LinearGradient
                colors={[C.red, C.redDark]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            ) : null}
            <Text
              style={[
                styles.dateCardDayName,
                { color: isActive ? "rgba(255,255,255,0.8)" : C.redMuted }
              ]}
            >
              {dayName}
            </Text>
            <Text
              style={[
                styles.dateCardDayNum,
                { color: isActive ? "#FFF" : C.textDark }
              ]}
            >
              {dayNum}
            </Text>
            {isToday_ && (
              <View style={[styles.todayIndicatorDot, { backgroundColor: isActive ? 'rgba(255,255,255,0.7)' : C.red }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// Sub-Component: Custom Range Slider (Interactive React Native touch-based track)
const GlucoseTrackSlider: React.FC<{
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (low: number, high: number) => void;
}> = ({ min, max, valueMin, valueMax, onChange }) => {
  const { C } = useTheme();
  
  const pctMin = ((valueMin - min) / (max - min)) * 100;
  const pctMax = ((valueMax - min) / (max - min)) * 100;
  
  const { profile } = useUser();
  const lowPct = (((profile?.goals?.min || 70) - min) / (max - min)) * 100;
  const highPct = (((profile?.goals?.max || 140) - min) / (max - min)) * 100;

  // Track layout values
  const trackWidth = width - 80;

  const handleTrackTouch = (event: any) => {
    const touchX = event.nativeEvent.locationX;
    const touchedPct = (touchX / trackWidth) * 100;
    const value = Math.round(min + (touchedPct / 100) * (max - min));
    
    // Determine which handle is closer
    const distToMin = Math.abs(value - valueMin);
    const distToMax = Math.abs(value - valueMax);
    
    if (distToMin < distToMax) {
      onChange(Math.min(Math.max(min, value), valueMax - 5), valueMax);
    } else {
      onChange(valueMin, Math.max(Math.min(max, value), valueMin + 5));
    }
  };

  return (
    <View style={styles.sliderWrap}>
      <View style={styles.sliderValuesRow}>
        <View style={styles.sliderValBox}>
          <Text style={[styles.sliderValText, { color: C.red }]}>{valueMin}</Text>
          <Text style={[styles.sliderValSub, { color: C.textXs }]}>mg/dL</Text>
        </View>
        <Text style={[styles.sliderValDivider, { color: C.textXs }]}>—</Text>
        <View style={styles.sliderValBox}>
          <Text style={[styles.sliderValText, { color: C.red }]}>{valueMax}</Text>
          <Text style={[styles.sliderValSub, { color: C.textXs }]}>mg/dL</Text>
        </View>
      </View>

      <View 
        style={[styles.sliderTrackContainer, { width: trackWidth }]}
        onStartShouldSetResponder={() => true}
        onResponderRelease={handleTrackTouch}
      >
        <View style={styles.sliderBgTrack}>
          <View style={[styles.sliderTrackSegment, { left: 0, width: `${lowPct}%`, backgroundColor: C.red + '20' }]} />
          <View style={[styles.sliderTrackSegment, { left: `${lowPct}%`, width: `${highPct - lowPct}%`, backgroundColor: C.green + '20' }]} />
          <View style={[styles.sliderTrackSegment, { left: `${highPct}%`, right: 0, backgroundColor: C.amber + '20' }]} />
        </View>

        <LinearGradient
          colors={[C.red, C.redLight]}
          style={[styles.sliderActiveTrack, { left: `${pctMin}%`, width: `${pctMax - pctMin}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />

        <View style={[styles.sliderHandle, { left: `${pctMin}%`, borderColor: C.red }]} />
        <View style={[styles.sliderHandle, { left: `${pctMax}%`, borderColor: C.red }]} />
      </View>

      <View style={styles.sliderLabelsRow}>
        <Text style={[styles.sliderLabelText, { color: C.red }]}>Low &lt;{profile?.goals?.min || 70}</Text>
        <Text style={[styles.sliderLabelText, { color: C.green }]}>Normal {profile?.goals?.min || 70}-{profile?.goals?.max || 140}</Text>
        <Text style={[styles.sliderLabelText, { color: C.amber }]}>High &gt;{profile?.goals?.max || 140}</Text>
      </View>
    </View>
  );
};

// Sub-Component: Summary Stats
const SummaryStats: React.FC<{ entries: any[]; profile: any }> = ({ entries, profile }) => {
  const { C } = useTheme();
  
  const statsData = useMemo(() => {
    const measurements = entries.filter((e) => e.type === "measurement");
    const meals = entries.filter((e) => e.type === "meal");
    const injections = entries.filter((e) => e.type === "injection");
    const activities = entries.filter((e) => e.type === "activity");
    
    return [
      { label: "Scans", value: String(measurements.length), icon: Activity, color: C.red, sub: "" },
      { label: "Meals", value: String(meals.length), icon: Utensils, color: C.amber, sub: "" },
      { label: "Doses", value: String(injections.length), icon: Syringe, color: C.blue, sub: "" },
      { label: "Active", value: String(activities.length), icon: Zap, color: C.green, sub: "" },
    ];
  }, [entries, C]);

  return (
    <View style={styles.statsRowGrid}>
      {statsData.map((s) => {
        const IconComponent = s.icon;
        return (
          <View
            key={s.label}
            style={[styles.statBoxCard, { borderColor: C.redBorder }]}
          >
            <View style={[styles.statIconBox, { backgroundColor: `${s.color}12` }]}>
              <IconComponent size={13} color={s.color} />
            </View>
            <View style={styles.statValContainer}>
              <Text style={[styles.statValText, { color: C.text }]}>{s.value}</Text>
              {s.sub && <Text style={[styles.statValSubText, { color: C.textXs }]}>{s.sub}</Text>}
            </View>
            <Text style={[styles.statLabelText, { color: C.textSm }]}>{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

// Sub-Component: Measurement Grid Card
const MeasurementCard: React.FC<{ entry: any; onSelect: () => void }> = ({ entry, onSelect }) => {
  const { C } = useTheme();
  
  const sc = useMemo(() => {
    switch (entry.status) {
      case 'High': return { color: C.amber, bg: C.amberBg, border: C.amberBorder };
      case 'Low': return { color: C.red, bg: C.redBg, border: C.redBorder };
      default: return { color: C.green, bg: C.greenBg, border: C.greenBorder };
    }
  }, [entry.status, C]);

  const TrendIcon = entry.trend === "up" ? TrendingUp : (entry.trend === "down" ? TrendingDown : Minus);
  const trendColor = entry.trend === "up" ? C.amber : (entry.trend === "down" ? C.green : C.textXs);
  const trendLabel = entry.trend === "up" ? "Rising" : (entry.trend === "down" ? "Falling" : "Stable");

  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[styles.gridCardWrapper, { borderColor: C.redBorder }]}
    >
      <View style={styles.gridCardTopGlucometer}>
        <Activity size={48} color={C.red} strokeWidth={1} style={{ opacity: 0.15 }} />
        <View style={[styles.statusBadgeFloating, { backgroundColor: 'rgba(255,255,255,0.93)', borderColor: sc.border }]}>
          <View style={[styles.statusBadgeDot, { backgroundColor: sc.color }]} />
          <Text style={[styles.statusBadgeText, { color: sc.color }]}>{entry.status}</Text>
        </View>
      </View>

      <LinearGradient
        colors={[C.red, C.redDark]}
        style={styles.cardHeaderBand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.cardHeaderCategoryText}>Glucose Scan</Text>
        <View style={styles.cardHeaderMainValueRow}>
          <Text style={styles.cardHeaderValueText}>{entry.value}</Text>
          <Text style={styles.cardHeaderUnitText}>{entry.unit}</Text>
        </View>
      </LinearGradient>

      <View style={styles.gridCardBottomInfo}>
        <View style={[styles.trendBadge, { backgroundColor: trendColor + '12' }]}>
          <TrendIcon size={9} color={trendColor} />
          <Text style={[styles.trendBadgeText, { color: trendColor }]}>{trendLabel}</Text>
        </View>
        
        <View style={styles.cardTimeRow}>
          <Text style={[styles.cardTimeText, { color: C.textSm }]}>
            {entry.time} · {format(parseISO(entry.date), "MMM d")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Sub-Component: Meal Grid Card
const MealCard: React.FC<{ entry: any; onSelect: () => void }> = ({ entry, onSelect }) => {
  const { C } = useTheme();
  
  const ic = useMemo(() => {
    switch (entry.impactLevel) {
      case 'high': return { color: C.red, bg: C.redBg, label: "High impact" };
      case 'medium': return { color: C.amber, bg: C.amberBg, label: "Moderate" };
      default: return { color: C.green, bg: C.greenBg, label: "Low impact" };
    }
  }, [entry.impactLevel, C]);

  const mealTypeColor = entry.mealType === 'breakfast' ? C.amber : (entry.mealType === 'lunch' ? C.blue : C.purple);

  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[styles.gridCardWrapper, { borderColor: C.redBorder }]}
    >
      <View style={styles.gridCardTopMeal}>
        {entry.image ? (
          <Image source={{ uri: entry.image }} style={StyleSheet.absoluteFillObject} />
        ) : (
          <Utensils size={40} color={C.amber} style={{ opacity: 0.2 }} />
        )}
        <View style={[styles.statusBadgeFloatingLeft, { backgroundColor: 'rgba(255,255,255,0.93)', borderColor: ic.color + '30' }]}>
          <Text style={[styles.statusBadgeText, { color: ic.color }]}>{ic.label}</Text>
        </View>
        <View style={[styles.statusBadgeFloatingRight, { backgroundColor: 'rgba(255,255,255,0.93)' }]}>
          <Text style={[styles.statusBadgeText, { color: mealTypeColor, textTransform: 'capitalize' }]}>{entry.mealType}</Text>
        </View>
      </View>

      <LinearGradient
        colors={[C.red, C.redDark]}
        style={styles.cardHeaderBand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.cardHeaderCategoryText}>{entry.mealType.toUpperCase()}</Text>
        <Text style={styles.cardHeaderMealName} numberOfLines={2}>{entry.name}</Text>
      </LinearGradient>

      <View style={styles.gridCardBottomInfo}>
        <View style={styles.mealMetricsRow}>
          <View style={styles.mealMetricBox}>
            <Flame size={9} color={C.amber} />
            <Text style={[styles.mealMetricVal, { color: C.textMd }]}>{entry.calories} kcal</Text>
          </View>
          <View style={[styles.mealMetricBox, { backgroundColor: ic.color + '10' }]}>
            <TrendingUp size={9} color={ic.color} />
            <Text style={[styles.mealMetricVal, { color: ic.color }]}>{entry.impact || entry.glucoseImpact}</Text>
          </View>
        </View>
        
        <View style={styles.cardTimeRow}>
          <Text style={[styles.cardTimeText, { color: C.textSm }]}>
            {entry.time} · {format(parseISO(entry.date), "MMM d")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Sub-Component: Injection Grid Card
const InjectionCard: React.FC<{ entry: any; onSelect: () => void }> = ({ entry, onSelect }) => {
  const { C, isDark } = useTheme();
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[styles.gridCardWrapper, { borderColor: C.redBorder }]}
    >
      <View style={[styles.gridCardTopGlucometer, { backgroundColor: C.redBg }]}>
        <Syringe size={48} color={C.red} strokeWidth={1} style={{ opacity: 0.15 }} />
        <View style={[styles.statusBadgeFloating, { backgroundColor: 'rgba(255,255,255,0.93)', borderColor: C.redBorder }]}>
          <Text style={[styles.statusBadgeText, { color: C.red, textTransform: 'capitalize' }]}>{entry.site}</Text>
        </View>
      </View>

      <LinearGradient
        colors={['#4B5563', '#1F2937']}
        style={styles.cardHeaderBand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.cardHeaderCategoryText}>{entry.insulinType.replace('_', ' ').toUpperCase()}</Text>
        <View style={styles.cardHeaderMainValueRow}>
          <Text style={styles.cardHeaderValueText}>{entry.dose}</Text>
          <Text style={styles.cardHeaderUnitText}>Units</Text>
        </View>
      </LinearGradient>

      <View style={styles.gridCardBottomInfo}>
        <View style={[styles.trendBadge, { backgroundColor: C.redBg }]}>
          <Zap size={9} color={C.red} />
          <Text style={[styles.trendBadgeText, { color: C.red }]}>{entry.reason.replace('_', ' ')}</Text>
        </View>
        <View style={styles.cardTimeRow}>
          <Text style={[styles.cardTimeText, { color: C.textSm }]}>
            {entry.time} · {format(parseISO(entry.date), "MMM d")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Sub-Component: Activity Grid Card
const ActivityCard: React.FC<{ entry: any; onSelect: () => void }> = ({ entry, onSelect }) => {
  const { C, isDark } = useTheme();
  const intensityColor = entry.intensity === 'high' ? C.red : (entry.intensity === 'moderate' ? C.amber : C.green);
  
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[styles.gridCardWrapper, { borderColor: C.redBorder }]}
    >
      <View style={[styles.gridCardTopGlucometer, { backgroundColor: intensityColor + '10' }]}>
        <Activity size={48} color={intensityColor} strokeWidth={1} style={{ opacity: 0.15 }} />
        <View style={[styles.statusBadgeFloating, { backgroundColor: 'rgba(255,255,255,0.93)', borderColor: intensityColor + '30' }]}>
          <Text style={[styles.statusBadgeText, { color: intensityColor, textTransform: 'capitalize' }]}>{entry.intensity}</Text>
        </View>
      </View>

      <LinearGradient
        colors={[intensityColor, intensityColor + 'CC']}
        style={styles.cardHeaderBand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.cardHeaderCategoryText}>{entry.activityType.toUpperCase()}</Text>
        <View style={styles.cardHeaderMainValueRow}>
          <Text style={styles.cardHeaderValueText}>{entry.duration}</Text>
          <Text style={styles.cardHeaderUnitText}>Min</Text>
        </View>
      </LinearGradient>

      <View style={styles.gridCardBottomInfo}>
        <View style={styles.mealMetricsRow}>
          {entry.distance > 0 && (
            <View style={styles.mealMetricBox}>
              <TrendingUp size={9} color={C.textSm} />
              <Text style={[styles.mealMetricVal, { color: C.textMd }]}>{entry.distance} km</Text>
            </View>
          )}
          {entry.calories > 0 && (
            <View style={styles.mealMetricBox}>
              <Flame size={9} color={C.amber} />
              <Text style={[styles.mealMetricVal, { color: C.textMd }]}>{entry.calories} kcal</Text>
            </View>
          )}
        </View>
        <View style={styles.cardTimeRow}>
          <Text style={[styles.cardTimeText, { color: C.textSm }]}>
            {entry.time} · {format(parseISO(entry.date), "MMM d")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Sub-Component: Group Listing Container
const EntryGroup: React.FC<{
  label: string;
  sublabel: string;
  entries: any[];
  onSelectEntry: (entry: any) => void;
}> = ({ label, sublabel, entries, onSelectEntry }) => {
  const { C } = useTheme();
  if (entries.length === 0) return null;

  const measurements = entries.filter((e) => e.type === "measurement");
  const meals = entries.filter((e) => e.type === "meal");
  const injections = entries.filter((e) => e.type === "injection");
  const activities = entries.filter((e) => e.type === "activity");

  return (
    <View style={styles.groupFrame}>
      <View style={styles.groupTitleRow}>
        <View style={styles.groupLabelWrapper}>
          <Text style={[styles.groupLabelText, { color: C.textDark }]}>{label}</Text>
          <View style={[styles.groupCountBadge, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <Text style={[styles.groupCountText, { color: C.red }]}>{entries.length}</Text>
          </View>
        </View>
        <Text style={[styles.groupSubLabelText, { color: C.textXs }]}>{sublabel}</Text>
      </View>

      <View style={styles.gridContainer}>
        {measurements.map((entry) => (
          <MeasurementCard 
            key={entry.id || `m-${entry.date}`} 
            entry={entry} 
            onSelect={() => onSelectEntry(entry)} 
          />
        ))}
        {meals.map((entry) => (
          <MealCard 
            key={entry.id || `meal-${entry.date}`} 
            entry={entry} 
            onSelect={() => onSelectEntry(entry)} 
          />
        ))}
        {injections.map((entry) => (
          <InjectionCard 
            key={entry.id || `inj-${entry.date}`} 
            entry={entry} 
            onSelect={() => onSelectEntry(entry)} 
          />
        ))}
        {activities.map((entry) => (
          <ActivityCard 
            key={entry.id || `act-${entry.date}`} 
            entry={entry} 
            onSelect={() => onSelectEntry(entry)} 
          />
        ))}
      </View>
    </View>
  );
};

interface LogbookScreenProps {
  onNavigateDetail: (entry: any) => void;
  initialTypeFilter?: 'all' | 'measurements' | 'meals' | 'injections' | 'activities';
}

const LogbookScreen: React.FC<LogbookScreenProps> = ({ onNavigateDetail, initialTypeFilter }) => {
  const { C, isDark } = useTheme();
  const { logs, refreshData } = useData();
  const { profile } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    typeFilter: initialTypeFilter || "all"
  }));

  useEffect(() => {
    if (initialTypeFilter) {
      setFilters(prev => ({
        ...prev,
        typeFilter: initialTypeFilter
      }));
    }
  }, [initialTypeFilter]);

  const mockToday = useMemo(() => new Date(), []);

  const activeFilterCount = useMemo(() => {
    return [
      filters.typeFilter !== "all",
      filters.datePreset !== "30days",
      filters.glucosePreset !== null || filters.glucoseMin !== 40 || filters.glucoseMax !== 300,
      filters.mealTypes.length > 0,
    ].filter(Boolean).length;
  }, [filters]);

  const filteredEntries = useMemo(() => {
    let result = logs;

    if (filters.typeFilter === "measurements") {
      result = result.filter((e) => e.type === "measurement");
    } else if (filters.typeFilter === "meals") {
      result = result.filter((e) => e.type === "meal");
    } else if (filters.typeFilter === "injections") {
      result = result.filter((e) => e.type === "injection");
    } else if (filters.typeFilter === "activities") {
      result = result.filter((e) => e.type === "activity");
    }

    // Date filter
    if (filters.rangeStart && filters.rangeEnd) {
      const s = isBefore(filters.rangeStart, filters.rangeEnd) ? filters.rangeStart : filters.rangeEnd;
      const e = isAfter(filters.rangeStart, filters.rangeEnd) ? filters.rangeStart : filters.rangeEnd;
      result = result.filter((entry) => {
        const d = parseISO(entry.date);
        return (isSameDay(d, s) || isAfter(d, s)) && (isSameDay(d, e) || isBefore(d, e));
      });
    }

    // Glucose range (only measurements)
    if (filters.glucoseMin !== 40 || filters.glucoseMax !== 300) {
      result = result.filter((e) => {
        if (e.type !== "measurement") return true;
        return e.value >= filters.glucoseMin && e.value <= filters.glucoseMax;
      });
    }

    // Meal type filter
    if (filters.mealTypes.length > 0) {
      result = result.filter((e) => {
        if (e.type !== "meal") return true;
        return filters.mealTypes.includes(e.mealType as MealTypeFilter);
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => {
        if (e.type === "meal") {
          return e.name.toLowerCase().includes(q) || e.mealType.toLowerCase().includes(q);
        }
        if (e.type === "injection") {
          return (e.insulinType?.toLowerCase().includes(q) || false) || 
                 (e.reason?.toLowerCase().includes(q) || false) || 
                 (e.site?.toLowerCase().includes(q) || false);
        }
        if (e.type === "activity") {
          return e.activityType.toLowerCase().includes(q) || e.intensity.toLowerCase().includes(q);
        }
        return String(e.value).includes(q) || e.status.toLowerCase().includes(q) || (e.tag && e.tag.toLowerCase().includes(q));
      });
    }

    return result;
  }, [logs, filters, searchQuery]);

  const groupedEntries = useMemo(() => {
    const todayGroup: any[] = [];
    const yesterdayGroup: any[] = [];
    const earlierGroup: any[] = [];

    const yesterday = subDays(mockToday, 1);

    filteredEntries.forEach((e) => {
      const d = parseISO(e.date);
      if (isSameDay(d, mockToday)) {
        todayGroup.push(e);
      } else if (isSameDay(d, yesterday)) {
        yesterdayGroup.push(e);
      } else {
        earlierGroup.push(e);
      }
    });

    return {
      today: todayGroup,
      yesterday: yesterdayGroup,
      earlier: earlierGroup,
    };
  }, [filteredEntries, mockToday]);

  const handleApplyFilters = (applied: Filters) => {
    setFilters(applied);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const quickChips: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "measurements", label: "Scans" },
    { id: "meals", label: "Meals" },
    { id: "injections", label: "Injections" },
    { id: "activities", label: "Activities" },
  ];

  // Advanced Filters Bottom Sheet Component (Rendered inside standard RN Modal for sliding sheets)
  const renderFilterSheet = () => {
    const datePresets: { id: DatePreset; label: string }[] = [
      { id: "today", label: "Today" },
      { id: "7days", label: "Last 7 Days" },
      { id: "30days", label: "Last 30 Days" },
      { id: "custom", label: "Custom" },
    ];

    const typeOptions: { id: FilterType; label: string; icon: any }[] = [
      { id: "all", label: "All", icon: Activity },
      { id: "measurements", label: "Scans", icon: Droplets },
      { id: "meals", label: "Meals", icon: Utensils },
    ];

    const glucosePresets: { id: GlucosePreset; label: string; range: string; color: string }[] = [
      { id: "low", label: "Low", range: `<${profile?.goals?.min || 70}`, color: C.red },
      { id: "normal", label: "Normal", range: `${profile?.goals?.min || 70}-${profile?.goals?.max || 140}`, color: C.green },
      { id: "high", label: "High", range: `>${profile?.goals?.max || 140}`, color: C.amber },
    ];

    const mealTypes: { id: MealTypeFilter; label: string; icon: any }[] = [
      { id: "breakfast", label: "Breakfast", icon: Coffee },
      { id: "lunch", label: "Lunch", icon: Sun },
      { id: "dinner", label: "Dinner", icon: Moon },
      { id: "snack", label: "Snack", icon: Cookie },
    ];

    return (
      <Modal
        visible={showFilterSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterSheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity 
            style={styles.sheetDismissArea} 
            activeOpacity={1} 
            onPress={() => setShowFilterSheet(false)} 
          />
          <View style={[styles.sheetContent, { backgroundColor: C.white }]}>
            
            {/* Sheet Handle */}
            <View style={styles.sheetHandleRow}>
              <View style={[styles.sheetDragHandle, { backgroundColor: C.redBorder }]} />
            </View>

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitleText, { color: C.textDark }]}>Advanced Filters</Text>
                <Text style={[styles.sheetSubtitleText, { color: C.textSm }]}>Refine your logbook search</Text>
              </View>
              <View style={styles.sheetActionRow}>
                <TouchableOpacity onPress={handleResetFilters} style={styles.sheetResetBtn}>
                  <RotateCcw size={12} color={C.textSm} />
                  <Text style={[styles.sheetResetText, { color: C.textSm }]}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFilterSheet(false)} style={styles.sheetCloseBtn}>
                  <X size={16} color={C.red} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Scroll Body */}
            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              
              {/* Date Range Section */}
              <View style={styles.sheetSection}>
                <View style={styles.sheetSectionTitleRow}>
                  <View style={[styles.sheetSectionIconBox, { backgroundColor: C.blueBg }]}>
                    <CalendarDays size={13} color={C.blue} />
                  </View>
                  <Text style={[styles.sheetSectionLabel, { color: C.textDark }]}>DATE RANGE</Text>
                </View>

                <View style={styles.sheetPresetsGrid}>
                  {datePresets.map((p) => {
                    const active = filters.datePreset === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => {
                          if (p.id !== 'custom') {
                            const rangeStart = p.id === 'today' ? mockToday : subDays(mockToday, p.id === '7days' ? 6 : 29);
                            setFilters(f => ({ ...f, datePreset: p.id, rangeStart, rangeEnd: mockToday }));
                          } else {
                            setFilters(f => ({ ...f, datePreset: 'custom', rangeStart: null, rangeEnd: null }));
                          }
                        }}
                        style={[
                          styles.presetChip,
                          {
                            backgroundColor: active ? C.red : "#FAFAFA",
                            borderColor: active ? C.red : "#F0EDED"
                          }
                        ]}
                      >
                        <Text style={[styles.presetChipText, { color: active ? '#FFF' : C.textSm }]}>{p.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Day Cards Selection Strip */}
                <DateStrip 
                  selectedDate={filters.rangeStart} 
                  onSelect={(day) => {
                    setFilters(f => ({ ...f, datePreset: 'custom', rangeStart: day, rangeEnd: day }));
                  }} 
                />
              </View>

              {/* Data Type Section */}
              <View style={styles.sheetSection}>
                <View style={styles.sheetSectionTitleRow}>
                  <View style={[styles.sheetSectionIconBox, { backgroundColor: C.purpleBg }]}>
                    <Activity size={13} color={C.purple} />
                  </View>
                  <Text style={[styles.sheetSectionLabel, { color: C.textDark }]}>DATA TYPE</Text>
                </View>

                <View style={styles.sheetTypeTabsRow}>
                  {typeOptions.map((t) => {
                    const active = filters.typeFilter === t.id;
                    const TIcon = t.icon;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => setFilters(f => ({ ...f, typeFilter: t.id }))}
                        style={[
                          styles.typeTabBtn,
                          {
                            backgroundColor: active ? C.red : "#FAFAFA",
                            borderColor: active ? C.red : "#F0EDED"
                          }
                        ]}
                      >
                        <TIcon size={12} color={active ? '#FFF' : C.redMuted} />
                        <Text style={[styles.typeTabText, { color: active ? '#FFF' : C.textSm }]}>{t.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Glucose Range Section */}
              <View style={styles.sheetSection}>
                <View style={styles.sheetSectionTitleRow}>
                  <View style={[styles.sheetSectionIconBox, { backgroundColor: C.greenBg }]}>
                    <Droplets size={13} color={C.green} />
                  </View>
                  <Text style={[styles.sheetSectionLabel, { color: C.textDark }]}>GLUCOSE RANGE</Text>
                </View>

                <View style={styles.sheetPresetsGrid}>
                  {glucosePresets.map((g) => {
                    const active = filters.glucosePreset === g.id;
                    return (
                      <TouchableOpacity
                        key={g.id}
                        onPress={() => {
                          const minVal = g.id === 'low' ? 40 : (g.id === 'normal' ? (profile?.goals?.min || 70) : (profile?.goals?.max || 140) + 1);
                          const maxVal = g.id === 'low' ? (profile?.goals?.min || 70) - 1 : (g.id === 'normal' ? (profile?.goals?.max || 140) : 300);
                          setFilters(f => ({ ...f, glucosePreset: active ? null : g.id, glucoseMin: active ? 40 : minVal, glucoseMax: active ? 300 : maxVal }));
                        }}
                        style={[
                          styles.glucosePresetCard,
                          {
                            backgroundColor: active ? g.color + '15' : "#FAFAFA",
                            borderColor: active ? g.color : "#F0EDED"
                          }
                        ]}
                      >
                        <Text style={[styles.glucosePresetLabel, { color: active ? g.color : C.textSm }]}>{g.label}</Text>
                        <Text style={[styles.glucosePresetRange, { color: active ? g.color : C.textXs }]}>{g.range} mg/dL</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Range Slider Track */}
                <GlucoseTrackSlider
                  min={40}
                  max={300}
                  valueMin={filters.glucoseMin}
                  valueMax={filters.glucoseMax}
                  onChange={(low, high) => setFilters(f => ({ ...f, glucoseMin: low, glucoseMax: high, glucosePreset: null }))}
                />
              </View>

              {/* Meal Type Section */}
              {(filters.typeFilter === "all" || filters.typeFilter === "meals") && (
                <View style={styles.sheetSection}>
                  <View style={styles.sheetSectionTitleRow}>
                    <View style={[styles.sheetSectionIconBox, { backgroundColor: C.amberBg }]}>
                      <Utensils size={13} color={C.amber} />
                    </View>
                    <Text style={[styles.sheetSectionLabel, { color: C.textDark }]}>MEAL TYPE</Text>
                  </View>

                  <View style={styles.mealGridContainer}>
                    {mealTypes.map((m) => {
                      const active = filters.mealTypes.includes(m.id);
                      const MIcon = m.icon;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          onPress={() => {
                            const newTypes = active ? filters.mealTypes.filter(x => x !== m.id) : [...filters.mealTypes, m.id];
                            setFilters(f => ({ ...f, mealTypes: newTypes }));
                          }}
                          style={[
                            styles.mealGridItemCard,
                            {
                              backgroundColor: active ? C.amber + '12' : "#FAFAFA",
                              borderColor: active ? C.amber : "#F0EDED"
                            }
                          ]}
                        >
                          {active ? (
                            <View style={[styles.checkboxCheck, { backgroundColor: C.amber }]}>
                              <Check size={10} color="#FFF" />
                            </View>
                          ) : (
                            <MIcon size={12} color={C.textXs} />
                          )}
                          <Text style={[styles.mealGridItemLabel, { color: active ? C.amber : C.textSm }]}>{m.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

            </ScrollView>

            {/* Sticky Actions Footer */}
            <View style={[styles.sheetFooter, { borderTopColor: C.redBorder }]}>
              <TouchableOpacity onPress={handleResetFilters} style={styles.footerCancelBtn}>
                <Text style={[styles.footerCancelText, { color: C.textMd }]}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setShowFilterSheet(false)} 
                style={styles.footerApplyBtn}
              >
                <LinearGradient
                  colors={[C.red, C.redDark]}
                  style={styles.footerApplyGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.footerApplyText}>Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    );
  };

  const hasResults = filteredEntries.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      
      {/* Top Header */}
      <View style={[styles.headerStrip, { backgroundColor: C.white, borderBottomColor: C.redBorder }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerCategoryText, { color: C.redMuted }]}>TRACK YOUR GLUCOSE WITH CONFIDENCE</Text>
          <Text style={[styles.headerTitleText, { color: C.textDark }]}>Logbook</Text>
          <Text style={[styles.headerSubtitleText, { color: C.textSm }]}>Track your history of glucose and meals</Text>
        </View>

        {/* Search & Sliders Filter Row */}
        <View style={styles.searchBarRow}>
          <View style={[styles.searchBoxFrame, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <Search size={16} color={C.redMuted} />
            <TextInput
              style={[styles.searchInputField, { color: C.text }]}
              placeholder="Search meals or measurements..."
              placeholderTextColor="#D4A0A0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={14} color={C.textXs} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setShowFilterSheet(true)}
            style={[
              styles.filterSheetBtn,
              {
                backgroundColor: activeFilterCount > 0 ? C.red : C.redBg,
                borderColor: activeFilterCount > 0 ? C.red : C.redBorder
              }
            ]}
          >
            <SlidersHorizontal size={17} color={activeFilterCount > 0 ? '#FFF' : C.red} />
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadgeIndicator, { borderColor: C.red }]}>
                <Text style={[styles.filterBadgeIndicatorText, { color: C.red }]}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Horizontal Chips bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickChipsContent}
          style={styles.quickChipsScroll}
        >
          {quickChips.map((c) => {
            const isActive = filters.typeFilter === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setFilters(f => ({ ...f, typeFilter: c.id }))}
                style={[
                  styles.quickChipBtn,
                  {
                    backgroundColor: isActive ? C.red : "#FAFAFA",
                    borderColor: isActive ? C.red : "#F0EDED"
                  }
                ]}
              >
                <Text style={[styles.quickChipText, { color: isActive ? '#FFF' : C.textMd }]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Active Preset indicator tags */}
          {filters.glucosePreset && (
            <TouchableOpacity
              onPress={() => setFilters(f => ({ ...f, glucosePreset: null, glucoseMin: 40, glucoseMax: 300 }))}
              style={[styles.activeTagPill, { backgroundColor: C.greenBg, borderColor: C.greenBorder }]}
            >
              <Droplets size={11} color={C.green} />
              <Text style={[styles.activeTagText, { color: C.green, textTransform: 'capitalize' }]}>{filters.glucosePreset}</Text>
              <X size={10} color={C.green} />
            </TouchableOpacity>
          )}

          {filters.datePreset !== "30days" && (
            <TouchableOpacity
              onPress={() => setFilters(f => ({ ...f, datePreset: '30days', rangeStart: null, rangeEnd: null }))}
              style={[styles.activeTagPill, { backgroundColor: C.blueBg, borderColor: C.blueBorder }]}
            >
              <CalendarDays size={11} color={C.blue} />
              <Text style={[styles.activeTagText, { color: C.blue }]}>
                {filters.datePreset === 'today' ? 'Today' : (filters.datePreset === '7days' ? '7 Days' : 'Custom')}
              </Text>
              <X size={10} color={C.blue} />
            </TouchableOpacity>
          )}

          {filters.mealTypes.length > 0 && (
            <TouchableOpacity
              onPress={() => setFilters(f => ({ ...f, mealTypes: [] }))}
              style={[styles.activeTagPill, { backgroundColor: C.amberBg, borderColor: C.amberBorder }]}
            >
              <Utensils size={11} color={C.amber} />
              <Text style={[styles.activeTagText, { color: C.amber }]}>{filters.mealTypes.length} types</Text>
              <X size={10} color={C.amber} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Summary Stats Row Grid */}
      <View style={styles.summaryStatsArea}>
        {/* Stats Grid */}
        <SummaryStats entries={filteredEntries} profile={profile} />
      </View>

      {/* Results Count Line */}
      <View style={styles.resultsCountLine}>
        <Text style={[styles.resultsCountText, { color: C.textSm }]}>
          {filteredEntries.length} result{filteredEntries.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Timeline listings */}
      <ScrollView 
        contentContainerStyle={styles.scrollListContainer}
        showsVerticalScrollIndicator={false}
      >
        {hasResults ? (
          <View style={styles.groupsTimelineWrap}>
            <EntryGroup 
              label="Today" 
              sublabel="March 31, 2026" 
              entries={groupedEntries.today} 
              onSelectEntry={onNavigateDetail} 
            />
            <EntryGroup 
              label="Yesterday" 
              sublabel="March 30" 
              entries={groupedEntries.yesterday} 
              onSelectEntry={onNavigateDetail} 
            />
            <EntryGroup 
              label="Earlier" 
              sublabel="Older entries" 
              entries={groupedEntries.earlier} 
              onSelectEntry={onNavigateDetail} 
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconFrame, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
              <SmilePlus size={28} color={C.redMuted} />
            </View>
            <Text style={[styles.emptyText, { color: C.textDark }]}>No records found</Text>
            <Text style={[styles.emptySubtext, { color: C.textSm }]}>
              {searchQuery
                ? `No results for "${searchQuery}". Try adjusting your filters.`
                : "Start by scanning your glucose or logging a meal."}
            </Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity
                onPress={handleResetFilters}
                style={[styles.emptyClearBtn, { backgroundColor: C.red }]}
              >
                <Text style={styles.emptyClearBtnText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Advanced Filter Modal sheet */}
      {renderFilterSheet()}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerStrip: {
    paddingTop: 56,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerCategoryText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
    marginTop: 2,
  },
  headerSubtitleText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 10,
  },
  searchBoxFrame: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInputField: {
    flex: 1,
    fontSize: 12,
    padding: 0,
    fontWeight: '500',
  },
  filterSheetBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadgeIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFF',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeIndicatorText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  quickChipsScroll: {
    maxHeight: 38,
  },
  quickChipsContent: {
    paddingHorizontal: 20,
    gap: 6,
    alignItems: 'center',
  },
  quickChipBtn: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quickChipText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  activeTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  summaryStatsArea: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  statsRowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  statBoxCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  statValText: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  statValSubText: {
    fontSize: 7.5,
    fontWeight: '600',
  },
  statLabelText: {
    fontSize: 8.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  resultsCountLine: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  resultsCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollListContainer: {
    paddingBottom: 40,
  },
  groupsTimelineWrap: {
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 20,
  },
  groupFrame: {
    flex: 1,
  },
  groupTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupLabelText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  groupCountBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  groupCountText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  groupSubLabelText: {
    fontSize: 10,
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCardWrapper: {
    width: (width - 50) / 2,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  gridCardTopGlucometer: {
    height: 120,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gridCardTopMeal: {
    height: 120,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  statusBadgeFloating: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  statusBadgeFloatingLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeFloatingRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  statusBadgeText: {
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  cardHeaderBand: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cardHeaderCategoryText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardHeaderMainValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
    gap: 2,
  },
  cardHeaderValueText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
  },
  cardHeaderUnitText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '600',
  },
  cardHeaderMealName: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 14,
    marginTop: 2,
    height: 28,
  },
  gridCardBottomInfo: {
    padding: 8,
    gap: 6,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  trendBadgeText: {
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  cardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTimeText: {
    fontSize: 9,
    fontWeight: '500',
  },
  mealMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  mealMetricBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F0EDED',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 3,
  },
  mealMetricVal: {
    fontSize: 8.5,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIconFrame: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 6,
  },
  emptyClearBtn: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
  },
  emptyClearBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // --- FILTERS SHEET STYLE ---
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetDismissArea: {
    flex: 1,
  },
  sheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '76%',
    paddingBottom: 24,
  },
  sheetHandleRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  sheetDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetTitleText: {
    fontSize: 17,
    fontWeight: '900',
  },
  sheetSubtitleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sheetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F0EDED',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  sheetResetText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  sheetCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FDF1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    paddingHorizontal: 20,
  },
  sheetSection: {
    marginBottom: 20,
  },
  sheetSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sheetSectionIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sheetPresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  presetChipText: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  dateStripFrame: {
    marginTop: 6,
  },
  dateStripScrollContent: {
    gap: 8,
    paddingBottom: 4,
  },
  dateCardBtn: {
    width: 50,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  dateCardDayName: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dateCardDayNum: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
    marginTop: 2,
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
  sheetTypeTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 8,
    gap: 6,
  },
  typeTabText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  glucosePresetCard: {
    flex: 1,
    minWidth: 80,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 6,
    alignItems: 'center',
  },
  glucosePresetLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  glucosePresetRange: {
    fontSize: 8.5,
    fontWeight: '600',
    marginTop: 1,
  },
  sliderWrap: {
    marginTop: 10,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F0EDED',
    borderRadius: 16,
    padding: 12,
  },
  sliderValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sliderValBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF1F1',
    borderWidth: 1,
    borderColor: '#F2D0D0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 3,
  },
  sliderValText: {
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  sliderValSub: {
    fontSize: 8.5,
    fontWeight: '500',
  },
  sliderValDivider: {
    fontSize: 12,
  },
  sliderTrackContainer: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderBgTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F0EDED',
    position: 'relative',
    overflow: 'hidden',
  },
  sliderTrackSegment: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  sliderActiveTrack: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
  },
  sliderHandle: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    backgroundColor: '#FFF',
    top: '50%',
    marginTop: -9,
    marginLeft: -9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sliderLabelText: {
    fontSize: 8,
    fontWeight: '700',
  },
  mealGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealGridItemCard: {
    width: (width - 48) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  checkboxCheck: {
    width: 14,
    height: 14,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealGridItemLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  sheetFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  footerCancelBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F0EDED',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  footerCancelText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footerApplyBtn: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    height: 44,
  },
  footerApplyGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerApplyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default LogbookScreen;
