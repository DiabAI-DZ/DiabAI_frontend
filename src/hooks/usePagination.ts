import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../services/api';

export interface PageResult<T> {
  items: T[];
  hasMore: boolean;
}

/**
 * Fetches one page given a page number + the current filters. Return the page's items and
 * whether more pages exist. The hook stays transport-agnostic: derive `hasMore` from server
 * `meta` (current_page < last_page) or from a client-side slice — the hook doesn't care.
 */
export type PageFetcher<T, F> = (page: number, filters: F) => Promise<PageResult<T>>;

interface UsePaginationResult<T> {
  items: T[];
  /** First-page load (initial or filter change). */
  loading: boolean;
  /** Subsequent-page load (infinite scroll). */
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: () => Promise<void>;
}

/**
 * Generic infinite-scroll / pagination hook. Resets and refetches page 1 whenever `filters`
 * change (compared by value). Pass a STABLE `fetchPage` (wrap in useCallback). Cancellation
 * uses a monotonic request token so stale pages and post-unmount responses never commit.
 */
export function usePagination<T, F = void>(
  fetchPage: PageFetcher<T, F>,
  filters: F,
): UsePaginationResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);
  const pageRef = useRef(1);

  // Latest filters are read through a ref so the fetch callback stays stable (identity-safe)
  // while always seeing current values.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  // Value-compare key drives the reset effect without depending on filters' object identity.
  const filtersKey = JSON.stringify(filters ?? null);

  const fetchPageInternal = useCallback(
    async (pageNum: number, replace: boolean) => {
      const reqId = ++reqIdRef.current;
      if (replace) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const result = await fetchPage(pageNum, filtersRef.current);
        if (reqId !== reqIdRef.current) return;
        setItems((prev) => (replace ? result.items : [...prev, ...result.items]));
        setHasMore(result.hasMore);
        pageRef.current = pageNum;
      } catch (e) {
        if (reqId === reqIdRef.current) {
          setError(e instanceof ApiError ? e.message : 'Failed to load. Please try again.');
        }
      } finally {
        if (reqId === reqIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [fetchPage],
  );

  // Reset to page 1 on first mount and whenever filters change by value.
  useEffect(() => {
    pageRef.current = 1;
    setItems([]);
    setHasMore(true);
    fetchPageInternal(1, true);
    return () => {
      reqIdRef.current++;
    };
  }, [filtersKey, fetchPageInternal]);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      fetchPageInternal(pageRef.current + 1, false);
    }
  }, [hasMore, loadingMore, loading, fetchPageInternal]);

  const refresh = useCallback(() => fetchPageInternal(1, true), [fetchPageInternal]);

  return { items, loading, loadingMore, hasMore, error, loadMore, refresh };
}
