import React from 'react';
import {
  ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { X, SmilePlus } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import type { LogEntry } from '../../../types';
import type { LogbookSection } from '../../../types/logbook';
import LogbookDayGroup from './LogbookDayGroup';

interface LogbookListProps {
  sections: LogbookSection[];
  loadingInitial: boolean;
  loadingMore: boolean;
  loadError: string | null;
  hasMore: boolean;
  total: number;
  refreshing: boolean;
  searchQuery: string;
  activeFilterCount: number;
  onRefresh: () => void;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onSelectEntry: (entry: LogEntry) => void;
  onResetFilters: () => void;
}

/** Scrollable logbook timeline with loading / error / empty / content states + infinite scroll. */
const LogbookList: React.FC<LogbookListProps> = ({
  sections, loadingInitial, loadingMore, loadError, hasMore, total, refreshing, searchQuery, activeFilterCount, onRefresh, onScroll, onSelectEntry, onResetFilters,
}) => {
  const { C, colors } = useTheme();
  const hasResults = sections.length > 0;

  return (
    <ScrollView
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.red} colors={[C.red]} />}
    >
      {loadingInitial ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={C.red} />
          <Text style={[styles.emptySubtext, styles.loadingText, { color: C.textSm }]}>Loading your logbook…</Text>
        </View>
      ) : loadError && !hasResults ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconFrame, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <X size={28} color={C.red} />
          </View>
          <Text style={[styles.emptyText, { color: C.textDark }]}>Couldn't load logbook</Text>
          <Text style={[styles.emptySubtext, { color: C.textSm }]}>{loadError}</Text>
          <TouchableOpacity onPress={onRefresh} style={[styles.clearBtn, { backgroundColor: C.red }]}>
            <Text style={[styles.clearBtnText, { color: colors.textOnPrimary }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : hasResults ? (
        <View style={styles.timeline}>
          {sections.map((sec) => (
            <LogbookDayGroup key={sec.key} section={sec} onSelectEntry={onSelectEntry} />
          ))}
          {loadingMore && (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color={C.red} />
            </View>
          )}
          {!loadingMore && !hasMore && total > 0 && (
            <Text style={[styles.footerEnd, { color: C.textXs }]}>You've reached the end · {total} total</Text>
          )}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconFrame, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <SmilePlus size={28} color={C.redMuted} />
          </View>
          <Text style={[styles.emptyText, { color: C.textDark }]}>No records found</Text>
          <Text style={[styles.emptySubtext, { color: C.textSm }]}>
            {searchQuery ? `No results for "${searchQuery}". Try adjusting your filters.` : 'Start by scanning your glucose or logging a meal.'}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={onResetFilters} style={[styles.clearBtn, { backgroundColor: C.red }]}>
              <Text style={[styles.clearBtnText, { color: colors.textOnPrimary }]}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  listContainer: { paddingBottom: spacing.xxxxl },
  timeline: { paddingHorizontal: spacing.xl, marginTop: spacing.md, gap: spacing.xl },
  centeredState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  loadingText: { marginTop: spacing.md },
  footerLoading: { paddingVertical: spacing.xl, alignItems: 'center' },
  footerEnd: { textAlign: 'center', fontSize: 10.5, fontWeight: '600', paddingVertical: spacing.lg },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxxxl, paddingTop: 80 },
  emptyIconFrame: { width: 60, height: 60, borderRadius: borderRadius.lg, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyText: { fontSize: 16, fontWeight: '800' },
  emptySubtext: { fontSize: 12, textAlign: 'center', lineHeight: 16, marginTop: spacing.xs },
  clearBtn: { borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginTop: spacing.lg },
  clearBtnText: { fontSize: 12, fontWeight: 'bold' },
});

export default LogbookList;
