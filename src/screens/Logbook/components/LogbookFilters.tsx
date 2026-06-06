import React, { Dispatch, SetStateAction, useMemo } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Activity, Droplets, Utensils, Coffee, Sun, Moon, Cookie, CalendarDays, X, RotateCcw, Check, type LucideIcon,
} from 'lucide-react-native';
import { subDays } from 'date-fns';
import { useTheme } from '../../../theme/ThemeContext';
import { useUser } from '../../../context/UserContext';
import type { DatePreset, FilterType, Filters, GlucosePreset, MealTypeFilter } from '../../../types/logbook';
import { filterStyles as f } from './logbookFilterStyles';
import FilterSection from './FilterSection';
import FilterDateStrip from './FilterDateStrip';
import GlucoseTrackSlider from './GlucoseTrackSlider';

interface LogbookFiltersProps {
  visible: boolean;
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  onReset: () => void;
  onClose: () => void;
  activeFilterCount: number;
}

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7days', label: 'Last 7 Days' },
  { id: '30days', label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom' },
];

const TYPE_OPTIONS: { id: FilterType; label: string; icon: LucideIcon }[] = [
  { id: 'all', label: 'All', icon: Activity },
  { id: 'measurements', label: 'Scans', icon: Droplets },
  { id: 'meals', label: 'Meals', icon: Utensils },
];

const MEAL_TYPES: { id: MealTypeFilter; label: string; icon: LucideIcon }[] = [
  { id: 'breakfast', label: 'Breakfast', icon: Coffee },
  { id: 'lunch', label: 'Lunch', icon: Sun },
  { id: 'dinner', label: 'Dinner', icon: Moon },
  { id: 'snack', label: 'Snack', icon: Cookie },
];

/** Advanced-filters bottom sheet. Mutates the live filter state (the feed reloads reactively). */
const LogbookFilters: React.FC<LogbookFiltersProps> = ({ visible, filters, setFilters, onReset, onClose, activeFilterCount }) => {
  const { C, colors } = useTheme();
  const { profile } = useUser();
  const today = useMemo(() => new Date(), []);
  const goalMin = profile?.goals?.min || 70;
  const goalMax = profile?.goals?.max || 140;

  const glucosePresets: { id: Exclude<GlucosePreset, null>; label: string; range: string; color: string }[] = [
    { id: 'low', label: 'Low', range: `<${goalMin}`, color: C.red },
    { id: 'normal', label: 'Normal', range: `${goalMin}-${goalMax}`, color: C.green },
    { id: 'high', label: 'High', range: `>${goalMax}`, color: C.amber },
  ];
  const showMealTypes = filters.typeFilter === 'all' || filters.typeFilter === 'meals';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={f.overlay}>
        <TouchableOpacity style={f.dismissArea} activeOpacity={1} onPress={onClose} />
        <View style={[f.content, { backgroundColor: C.white }]}>
          <View style={f.handleRow}>
            <View style={[f.dragHandle, { backgroundColor: C.redBorder }]} />
          </View>

          <View style={f.header}>
            <View>
              <Text style={[f.titleText, { color: C.textDark }]}>Advanced Filters</Text>
              <Text style={[f.subtitleText, { color: C.textSm }]}>Refine your logbook search</Text>
            </View>
            <View style={f.actionRow}>
              <TouchableOpacity onPress={onReset} style={[f.resetBtn, { backgroundColor: colors.backgroundMuted, borderColor: colors.border }]}>
                <RotateCcw size={12} color={C.textSm} />
                <Text style={[f.resetText, { color: C.textSm }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={[f.closeBtn, { backgroundColor: colors.primaryLight }]}>
                <X size={16} color={C.red} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={f.scroll} showsVerticalScrollIndicator={false}>
            <FilterSection icon={CalendarDays} iconColor={C.blue} iconBg={C.blueBg} label="DATE RANGE">
              <View style={f.presetsGrid}>
                {DATE_PRESETS.map((p) => {
                  const active = filters.datePreset === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() =>
                        p.id !== 'custom'
                          ? setFilters((s) => ({ ...s, datePreset: p.id, rangeStart: p.id === 'today' ? today : subDays(today, p.id === '7days' ? 6 : 29), rangeEnd: today }))
                          : setFilters((s) => ({ ...s, datePreset: 'custom', rangeStart: null, rangeEnd: null }))
                      }
                      style={[f.presetChip, { backgroundColor: active ? C.red : colors.backgroundMuted, borderColor: active ? C.red : colors.border }]}
                    >
                      <Text style={[f.presetChipText, { color: active ? colors.textOnPrimary : C.textSm }]}>{p.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <FilterDateStrip selectedDate={filters.rangeStart} onSelect={(day) => setFilters((s) => ({ ...s, datePreset: 'custom', rangeStart: day, rangeEnd: day }))} />
            </FilterSection>

            <FilterSection icon={Activity} iconColor={C.purple} iconBg={C.purpleBg} label="DATA TYPE">
              <View style={f.typeTabsRow}>
                {TYPE_OPTIONS.map((t) => {
                  const active = filters.typeFilter === t.id;
                  const TIcon = t.icon;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setFilters((s) => ({ ...s, typeFilter: t.id }))}
                      style={[f.typeTabBtn, { backgroundColor: active ? C.red : colors.backgroundMuted, borderColor: active ? C.red : colors.border }]}
                    >
                      <TIcon size={12} color={active ? colors.textOnPrimary : C.redMuted} />
                      <Text style={[f.typeTabText, { color: active ? colors.textOnPrimary : C.textSm }]}>{t.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </FilterSection>

            <FilterSection icon={Droplets} iconColor={C.green} iconBg={C.greenBg} label="GLUCOSE RANGE">
              <View style={f.presetsGrid}>
                {glucosePresets.map((g) => {
                  const active = filters.glucosePreset === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => {
                        const minVal = g.id === 'low' ? 40 : g.id === 'normal' ? goalMin : goalMax + 1;
                        const maxVal = g.id === 'low' ? goalMin - 1 : g.id === 'normal' ? goalMax : 300;
                        setFilters((s) => ({ ...s, glucosePreset: active ? null : g.id, glucoseMin: active ? 40 : minVal, glucoseMax: active ? 300 : maxVal }));
                      }}
                      style={[f.glucosePresetCard, { backgroundColor: active ? g.color + '15' : colors.backgroundMuted, borderColor: active ? g.color : colors.border }]}
                    >
                      <Text style={[f.glucosePresetLabel, { color: active ? g.color : C.textSm }]}>{g.label}</Text>
                      <Text style={[f.glucosePresetRange, { color: active ? g.color : C.textXs }]}>{g.range} mg/dL</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <GlucoseTrackSlider
                min={40}
                max={300}
                valueMin={filters.glucoseMin}
                valueMax={filters.glucoseMax}
                onChange={(low, high) => setFilters((s) => ({ ...s, glucoseMin: low, glucoseMax: high, glucosePreset: null }))}
              />
            </FilterSection>

            {showMealTypes && (
              <FilterSection icon={Utensils} iconColor={C.amber} iconBg={C.amberBg} label="MEAL TYPE">
                <View style={f.mealGrid}>
                  {MEAL_TYPES.map((m) => {
                    const active = filters.mealTypes.includes(m.id);
                    const MIcon = m.icon;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() =>
                          setFilters((s) => ({ ...s, mealTypes: active ? s.mealTypes.filter((x) => x !== m.id) : [...s.mealTypes, m.id] }))
                        }
                        style={[f.mealItem, { backgroundColor: active ? C.amber + '12' : colors.backgroundMuted, borderColor: active ? C.amber : colors.border }]}
                      >
                        {active ? (
                          <View style={[f.checkbox, { backgroundColor: C.amber }]}>
                            <Check size={10} color={colors.textOnPrimary} />
                          </View>
                        ) : (
                          <MIcon size={12} color={C.textXs} />
                        )}
                        <Text style={[f.mealItemLabel, { color: active ? C.amber : C.textSm }]}>{m.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>
            )}
          </ScrollView>

          <View style={[f.footer, { borderTopColor: C.redBorder }]}>
            <TouchableOpacity onPress={onReset} style={[f.cancelBtn, { borderColor: colors.border, backgroundColor: colors.backgroundMuted }]}>
              <Text style={[f.cancelText, { color: C.textMd }]}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={f.applyBtn}>
              <LinearGradient colors={[C.red, C.redDark]} style={f.applyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={[f.applyText, { color: colors.textOnPrimary }]}>Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LogbookFilters;
