import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../services/api';

interface UseAsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseAsyncOptions {
  /** Run the fetcher on mount. Defaults to true. */
  immediate?: boolean;
}

/**
 * Generic data-fetch hook — the reusable embodiment of the spec's hook pattern
 * (mount-guarded loading/error/refetch). A feature hook becomes a one-liner over this:
 *
 *   export function useHome() { return useAsync(() => homeService.getHome()); }
 *
 * Cancellation uses a monotonic request token (matching the existing detail hooks): only the
 * latest call may commit state, so a stale or post-unmount response can never write in.
 * Pass a STABLE `fetcher` (wrap it in useCallback) — it's a dependency of refetch.
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  options: UseAsyncOptions = {},
): UseAsyncResult<T> {
  const { immediate = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  const refetch = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (reqId === reqIdRef.current) setData(result);
    } catch (e) {
      if (reqId === reqIdRef.current) {
        setError(e instanceof ApiError ? e.message : 'Failed to load. Please try again.');
      }
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (immediate) refetch();
    return () => {
      // Invalidate any in-flight request on unmount / fetcher change.
      reqIdRef.current++;
    };
  }, [immediate, refetch]);

  return { data, loading, error, refetch };
}
