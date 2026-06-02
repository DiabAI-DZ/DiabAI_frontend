/**
 * In-memory cache for /api/insights payloads so tab switches do not refetch.
 * Invalidates when date range, selected day, or model changes.
 */

export type InsightsCacheEntry = {
  cacheKey: string;
  core: Record<string, unknown> | null;
  full: Record<string, unknown> | null;
  aiComplete: boolean;
  fetchedAt: number;
  /** Wall time for the last successful AI (full) fetch, in seconds. */
  aiElapsedSec: number | null;
};

/** Same calendar window can reuse AI results for 30 minutes. */
const CACHE_TTL_MS = 30 * 60 * 1000;

const store = new Map<string, InsightsCacheEntry>();

export function buildInsightsCacheKey(
  dateFrom: string,
  dateTo: string,
  selectedDate: string,
  model: string,
): string {
  return `${dateFrom}|${dateTo}|${selectedDate}|${model}`;
}

export function getInsightsCache(cacheKey: string): InsightsCacheEntry | null {
  const entry = store.get(cacheKey);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    store.delete(cacheKey);
    return null;
  }
  return entry;
}

export function patchInsightsCache(
  cacheKey: string,
  patch: Partial<Omit<InsightsCacheEntry, 'cacheKey'>>,
): InsightsCacheEntry {
  const prev = store.get(cacheKey);
  const next: InsightsCacheEntry = {
    cacheKey,
    core: patch.core ?? prev?.core ?? null,
    full: patch.full ?? prev?.full ?? null,
    aiComplete: patch.aiComplete ?? prev?.aiComplete ?? false,
    fetchedAt: Date.now(),
    aiElapsedSec: patch.aiElapsedSec ?? prev?.aiElapsedSec ?? null,
  };
  store.set(cacheKey, next);
  return next;
}

export function clearInsightsCache(): void {
  store.clear();
}
