import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../../../context/DataContext';
import { useUser } from '../../../context/UserContext';
import { insightsService, DEFAULT_WINDOW_DAYS, type InsightsBundle } from '../../../services/insightsService';
import type { DateRange } from '../components/DateStrip';
import type { Pattern, Recommendation, InsulinEstimate } from '../../../types/insights';
import { formatDateStr } from '../insightsVisuals';
import { resolveSections } from '../insightsOffline';

// Model is fixed to the backend default now that the in-app selector is gone (see design).
const SELECTED_MODEL = 'kaggle';
const DAY_MS = 24 * 60 * 60 * 1000;

export interface InsightsDataResult {
  range: { from: Date; to: Date } | null;
  defaultRange: { from: Date; to: Date };
  datesWithData: Set<string>;
  onRangeSelected: (r: DateRange) => void;
  patterns: Pattern[];
  recommendations: Recommendation[];
  insulinEstimate: InsulinEstimate | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
}

/**
 * Owns the heavy AI insights bundle (patterns / recommendations / insulin) with stale-while-
 * revalidate. Requests are de-duped + persisted by insightsService and only ever aborted on
 * logout (never on unmount / tab switch), so a login prefetch is never cancelled.
 */
export function useInsightsData(isActive: boolean): InsightsDataResult {
  const { logs, setSelectedDate } = useData();
  const { profile } = useUser();

  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [insulinEstimate, setInsulinEstimate] = useState<InsulinEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Insights window driven by the DateStrip range. Defaults to the 11-day window ending YESTERDAY
  // (yesterday + the 10 days before it) so the strip opens pre-selected on that range.
  const [range, setRange] = useState<{ from: Date; to: Date } | null>(() => {
    const to = new Date();
    to.setHours(0, 0, 0, 0);
    to.setDate(to.getDate() - 1); // yesterday
    const from = new Date(to);
    from.setDate(from.getDate() - 10); // 10 days before yesterday
    return { from, to };
  });
  // Ignore late async results WITHOUT cancelling the request (a prefetch must keep running).
  const mountedRef = useRef(true);

  const patientId = useMemo(() => String(profile?.email ?? 'anon'), [profile]);
  const defaultRange = useMemo(() => {
    const to = new Date();
    return { from: new Date(to.getTime() - DEFAULT_WINDOW_DAYS * DAY_MS), to };
  }, []);

  // Stable trigger — only changes once a COMPLETE range is chosen, so the slow request doesn't
  // fire on the first tap, only once both ends are picked.
  const rangeKey = range ? `${formatDateStr(range.from)}_${formatDateStr(range.to)}` : 'default';

  // Days with at least one measurement — shown as a dot under the date in the strip.
  const datesWithData = useMemo(() => {
    const s = new Set<string>();
    for (const l of logs) {
      if (l.type === 'measurement') s.add(formatDateStr(new Date(l.date)));
    }
    return s;
  }, [logs]);

  const onRangeSelected = useCallback(({ dateFrom, dateTo }: DateRange) => {
    if (dateFrom && dateTo) {
      setRange({ from: dateFrom, to: dateTo });
      setSelectedDate(dateTo); // header + local day stats follow the range end
    } else if (dateFrom) {
      setSelectedDate(dateFrom); // only the first end picked — move the header, don't refetch
    } else {
      setRange(null);
    }
  }, [setSelectedDate]);

  const applyBundle = useCallback((bundle: InsightsBundle) => {
    const sections = resolveSections(bundle);
    setPatterns(sections.patterns);
    setRecommendations(sections.recommendations);
    setInsulinEstimate(sections.insulinEstimate);
  }, []);

  const loadInsights = useCallback(async (force = false) => {
    const params = insightsService.buildInsightsParams({
      patientId,
      dateFrom: range?.from,
      dateTo: range?.to,
      model: SELECTED_MODEL,
    });
    await insightsService.hydrate();
    const cached = insightsService.getCached(params);

    if (cached && !force) {
      applyBundle(cached);
      setError(false);
      setLoading(false);
      if (insightsService.isStale(cached)) {
        insightsService
          .fetchInsightsBundle(params)
          .then((fresh) => { if (mountedRef.current) applyBundle(fresh); })
          .catch(() => {});
      }
      return;
    }

    // No cache / forced retry → clear stale data so skeletons show, then await the long call.
    setRecommendations([]);
    setPatterns([]);
    setInsulinEstimate(null);
    setError(false);
    setLoading(true);
    try {
      const bundle = await insightsService.fetchInsightsBundle(params);
      if (!mountedRef.current) return;
      applyBundle(bundle);
    } catch (e) {
      if (!mountedRef.current) return;
      if (e instanceof Error && e.name === 'AbortError') return; // logout-triggered cancel
      console.error('[AIInsights] Failed to fetch backend insights:', e);
      setError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // `range` is read above but tracked via the stable `rangeKey` string.
  }, [patientId, rangeKey, applyBundle]); // eslint-disable-line react-hooks/exhaustive-deps

  const lastRangeKeyRef = useRef<string | null>(null); // tells an initial load apart from a date change

  useEffect(() => {
    mountedRef.current = true;
    if (isActive) {
      const dateChanged = lastRangeKeyRef.current !== null && lastRangeKeyRef.current !== rangeKey;
      lastRangeKeyRef.current = rangeKey;
      if (dateChanged) {
        // New window → drop the cache so stale data is never shown, then force-fetch.
        insightsService.clearCache().finally(() => { if (mountedRef.current) loadInsights(true); });
      } else {
        loadInsights();
      }
    }
    return () => { mountedRef.current = false; };
  }, [loadInsights, isActive, rangeKey]);
  const retry = useCallback(() => { loadInsights(true); }, [loadInsights]);

  return {
    range, defaultRange, datesWithData, onRangeSelected,
    patterns, recommendations, insulinEstimate, loading, error, retry,
  };
}
