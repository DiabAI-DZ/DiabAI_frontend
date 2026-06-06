import React, { Dispatch, SetStateAction } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Search, SlidersHorizontal, Droplets, CalendarDays, Utensils, X } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import type { FilterType, Filters } from '../../../types/logbook';

interface LogbookHeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  activeFilterCount: number;
  onOpenFilters: () => void;
}

const QUICK_CHIPS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'measurements', label: 'Scans' },
  { id: 'meals', label: 'Meals' },
  { id: 'injections', label: 'Injections' },
  { id: 'activities', label: 'Activities' },
];

/** Logbook top bar: title, search box, filter button, quick type chips + active-filter tags. */
const LogbookHeader: React.FC<LogbookHeaderProps> = ({ searchQuery, setSearchQuery, filters, setFilters, activeFilterCount, onOpenFilters }) => {
  const { C, colors } = useTheme();

  return (
    <View style={[styles.headerStrip, { backgroundColor: C.white, borderBottomColor: C.redBorder }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.category, { color: C.redMuted }]}>TRACK YOUR GLUCOSE WITH CONFIDENCE</Text>
        <Text style={[styles.title, { color: C.textDark }]}>Logbook</Text>
        <Text style={[styles.subtitle, { color: C.textSm }]}>Track your history of glucose and meals</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
          <Search size={16} color={C.redMuted} />
          <TextInput
            style={[styles.searchInput, { color: C.text }]}
            placeholder="Search meals or measurements..."
            placeholderTextColor={C.redMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color={C.textXs} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={onOpenFilters}
          style={[styles.filterBtn, { backgroundColor: activeFilterCount > 0 ? C.red : C.redBg, borderColor: activeFilterCount > 0 ? C.red : C.redBorder }]}
        >
          <SlidersHorizontal size={17} color={activeFilterCount > 0 ? colors.textOnPrimary : C.red} />
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { borderColor: C.red, backgroundColor: colors.backgroundCard }]}>
              <Text style={[styles.filterBadgeText, { color: C.red }]}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent} style={styles.chipsScroll}>
        {QUICK_CHIPS.map((c) => {
          const active = filters.typeFilter === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => setFilters((s) => ({ ...s, typeFilter: c.id }))}
              style={[styles.chip, { backgroundColor: active ? C.red : colors.backgroundMuted, borderColor: active ? C.red : colors.border }]}
            >
              <Text style={[styles.chipText, { color: active ? colors.textOnPrimary : C.textMd }]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}

        {filters.glucosePreset && (
          <TouchableOpacity onPress={() => setFilters((s) => ({ ...s, glucosePreset: null, glucoseMin: 40, glucoseMax: 300 }))} style={[styles.tagPill, { backgroundColor: C.greenBg, borderColor: C.greenBorder }]}>
            <Droplets size={11} color={C.green} />
            <Text style={[styles.tagText, { color: C.green, textTransform: 'capitalize' }]}>{filters.glucosePreset}</Text>
            <X size={10} color={C.green} />
          </TouchableOpacity>
        )}
        {filters.datePreset !== '30days' && (
          <TouchableOpacity onPress={() => setFilters((s) => ({ ...s, datePreset: '30days', rangeStart: null, rangeEnd: null }))} style={[styles.tagPill, { backgroundColor: C.blueBg, borderColor: C.blueBorder }]}>
            <CalendarDays size={11} color={C.blue} />
            <Text style={[styles.tagText, { color: C.blue }]}>{filters.datePreset === 'today' ? 'Today' : filters.datePreset === '7days' ? '7 Days' : 'Custom'}</Text>
            <X size={10} color={C.blue} />
          </TouchableOpacity>
        )}
        {filters.mealTypes.length > 0 && (
          <TouchableOpacity onPress={() => setFilters((s) => ({ ...s, mealTypes: [] }))} style={[styles.tagPill, { backgroundColor: C.amberBg, borderColor: C.amberBorder }]}>
            <Utensils size={11} color={C.amber} />
            <Text style={[styles.tagText, { color: C.amber }]}>{filters.mealTypes.length} types</Text>
            <X size={10} color={C.amber} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerStrip: { paddingTop: 56, paddingBottom: spacing.sm, borderBottomWidth: 1 },
  titleRow: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  category: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '900', lineHeight: 26, marginTop: 2 },
  subtitle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.sm },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, height: 44, gap: spacing.sm },
  searchInput: { flex: 1, fontSize: 12, padding: 0, fontWeight: '500' },
  filterBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { fontSize: 9, fontWeight: 'bold' },
  chipsScroll: { maxHeight: 38 },
  chipsContent: { paddingHorizontal: spacing.xl, gap: spacing.xs, alignItems: 'center' },
  chip: { borderRadius: borderRadius.sm, borderWidth: 1.5, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  chipText: { fontSize: 10.5, fontWeight: '700' },
  tagPill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, gap: spacing.xs },
  tagText: { fontSize: 10, fontWeight: '700' },
});

export default LogbookHeader;
