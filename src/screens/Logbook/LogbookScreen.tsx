import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import type { LogEntry } from '../../types';
import type { FilterType } from '../../types/logbook';
import { useLogbook } from './hooks/useLogbook';
import LogbookHeader from './components/LogbookHeader';
import SummaryStats from './components/SummaryStats';
import LogbookList from './components/LogbookList';
import LogbookFilters from './components/LogbookFilters';

interface LogbookScreenProps {
  onNavigateDetail: (entry: LogEntry) => void;
  initialTypeFilter?: FilterType;
  isActive?: boolean;
}

/** Logbook coordinator: wires useLogbook to the header, stats, paginated list and filter sheet. */
const LogbookScreen: React.FC<LogbookScreenProps> = ({ onNavigateDetail, initialTypeFilter, isActive }) => {
  const { C } = useTheme();
  const [showFilters, setShowFilters] = useState(false);
  const lb = useLogbook(initialTypeFilter, isActive);

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <LogbookHeader
        searchQuery={lb.searchQuery}
        setSearchQuery={lb.setSearchQuery}
        filters={lb.filters}
        setFilters={lb.applyFilters}
        activeFilterCount={lb.activeFilterCount}
        onOpenFilters={() => setShowFilters(true)}
      />

      <View style={styles.statsArea}>
        <SummaryStats stats={lb.stats} />
      </View>

      <View style={styles.resultsLine}>
        <Text style={[styles.resultsText, { color: C.textSm }]}>
          {lb.total} result{lb.total !== 1 ? 's' : ''} found
        </Text>
      </View>

      <LogbookList
        sections={lb.sections}
        loadingInitial={lb.loadingInitial}
        loadingMore={lb.loadingMore}
        loadError={lb.loadError}
        hasMore={lb.hasMore}
        total={lb.total}
        refreshing={lb.refreshing}
        searchQuery={lb.searchQuery}
        activeFilterCount={lb.activeFilterCount}
        onRefresh={lb.onRefresh}
        onScroll={lb.handleScroll}
        onSelectEntry={onNavigateDetail}
        onResetFilters={lb.resetFilters}
      />

      <LogbookFilters
        visible={showFilters}
        filters={lb.filters}
        setFilters={lb.applyFilters}
        onReset={lb.resetFilters}
        onClose={() => setShowFilters(false)}
        activeFilterCount={lb.activeFilterCount}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsArea: { paddingHorizontal: spacing.xl, marginTop: spacing.md },
  resultsLine: { paddingHorizontal: spacing.xl, marginTop: spacing.sm },
  resultsText: { fontSize: 11, fontWeight: '600' },
});

export default LogbookScreen;
