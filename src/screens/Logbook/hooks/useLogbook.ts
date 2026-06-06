import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { apiService } from '../../../services/apiService';
import type { LogEntry } from '../../../types';
import {
  defaultFilters,
  type Filters,
  type FilterType,
  type LogbookSection,
  type LogbookStats,
} from '../../../types/logbook';
import { buildParams, groupByDay } from '../logbookQuery';

interface UseLogbookResult {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filters: Filters;
  applyFilters: Dispatch<SetStateAction<Filters>>;
  resetFilters: () => void;
  activeFilterCount: number;
  sections: LogbookSection[];
  stats: LogbookStats | null;
  total: number;
  hasMore: boolean;
  loadingInitial: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  loadError: string | null;
  loadMore: () => void;
  onRefresh: () => void;
  handleScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

/** Owns the Logbook feed: filters, debounced search, server pagination, stats, day-grouping. */
export function useLogbook(initialTypeFilter: FilterType | undefined, isActive: boolean | undefined): UseLogbookResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(() => ({ ...defaultFilters, typeFilter: initialTypeFilter || 'all' }));

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogbookStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const requestIdRef = useRef(0); // guards against out-of-order responses
  const fetchingRef = useRef(false); // synchronous in-flight guard for rapid scroll events

  useEffect(() => {
    if (initialTypeFilter) setFilters((prev) => ({ ...prev, typeFilter: initialTypeFilter }));
  }, [initialTypeFilter]);

  // Debounce free-text search so each keystroke doesn't fire a request.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const activeFilterCount = useMemo(
    () =>
      [
        filters.typeFilter !== 'all',
        filters.datePreset !== '30days',
        filters.glucosePreset !== null || filters.glucoseMin !== 40 || filters.glucoseMax !== 300,
        filters.mealTypes.length > 0,
      ].filter(Boolean).length,
    [filters],
  );

  const baseParams = useMemo(() => buildParams(filters, debouncedSearch), [filters, debouncedSearch]);
  const paramsKey = useMemo(() => JSON.stringify(baseParams), [baseParams]);

  const loadPage = useCallback(
    async (pageNum: number, mode: 'replace' | 'append') => {
      const reqId = ++requestIdRef.current;
      fetchingRef.current = true;
      if (mode === 'append') setLoadingMore(true);
      setLoadError(null);
      try {
        const res = await apiService.fetchLogbookPage({ ...baseParams, page: pageNum });
        if (reqId !== requestIdRef.current) return;
        setCurrentPage(res.meta.currentPage);
        setLastPage(res.meta.lastPage);
        setTotal(res.meta.total);
        setStats(res.stats);
        setEntries((prev) => (mode === 'append' ? [...prev, ...res.entries] : res.entries));
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        setLoadError(e instanceof Error ? e.message : 'Failed to load logbook');
        if (mode === 'replace') setEntries([]);
      } finally {
        if (reqId === requestIdRef.current) {
          setLoadingInitial(false);
          setLoadingMore(false);
          setRefreshing(false);
          fetchingRef.current = false;
        }
      }
    },
    [baseParams],
  );

  // Reload from page 1 whenever the effective query changes.
  useEffect(() => {
    setLoadingInitial(true);
    loadPage(1, 'replace');
  }, [paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // The tab host keeps this screen mounted; re-fetch page 1 when it becomes active.
  useEffect(() => {
    if (isActive) loadPage(1, 'replace');
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (fetchingRef.current || currentPage >= lastPage) return;
    loadPage(currentPage + 1, 'append');
  }, [currentPage, lastPage, loadPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPage(1, 'replace');
  }, [loadPage]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
      if (distanceFromBottom < 400) loadMore();
    },
    [loadMore],
  );

  const sections = useMemo(() => groupByDay(entries), [entries]);

  const resetFilters = useCallback(() => setFilters(defaultFilters), []);

  return {
    searchQuery, setSearchQuery, filters, applyFilters: setFilters, resetFilters, activeFilterCount,
    sections, stats, total, hasMore: currentPage < lastPage,
    loadingInitial, loadingMore, refreshing, loadError, loadMore, onRefresh, handleScroll,
  };
}
