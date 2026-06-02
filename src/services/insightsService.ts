import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './apiService';

/**
 * Client-side cache + request layer for the slow AI insights endpoints.
 *
 * The backend can take up to ~4 minutes on a cold (uncached) call, then caches in Redis so
 * repeat calls are instant. This mirrors that on the client so the Insights screen renders
 * instantly from cache and only revalidates in the background ("stale-while-revalidate").
 *
 * It is the react-query-equivalent for this app (which uses plain fetch):
 *  - in-memory Map cache + AsyncStorage persistence (survives app restart)
 *  - in-flight de-duplication (login prefetch + screen open share ONE network call)
 *  - a single session AbortController: the ONLY thing that cancels in-flight requests is
 *    resetSession() on logout. Re-renders, tab switches and screen unmounts do NOT abort,
 *    so a background prefetch keeps running while the user is elsewhere.
 */

export interface InsightsParams {
  patientId: string;
  dateFrom: string;
  dateTo: string;
  selectedDate: string;
  model: string;
}

export interface InsightsBundle {
  recommendations: any | null;
  patterns: any | null;
  prediction: any | null;
  insulin: any | null;
  model: string;
  fetchedAt: number; // epoch ms
}

const KEY_PREFIX = 'insights:';
const STALE_MS = 5 * 60 * 1000;       // 5 min — older than this triggers background revalidation
const GC_MS = 60 * 60 * 1000;         // 1 h — persisted entries older than this are pruned

const memCache = new Map<string, InsightsBundle>();
const inflight = new Map<string, Promise<InsightsBundle>>();

// Aborted only on logout (resetSession). All requests share this signal.
let sessionController = new AbortController();

let hydratePromise: Promise<void> | null = null;

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Number of days in the default insights window (today minus this many → today). */
export const DEFAULT_WINDOW_DAYS = 10;

/**
 * Build the request/cache params for a given patient + selected day + model, using the same
 * default window the Insights screen uses. Centralised so the login prefetch and the
 * screen produce identical cache keys (otherwise the prefetch would never hit).
 */
export function buildInsightsParams(opts: {
  patientId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  selectedDate?: Date | null;
  model?: string;
}): InsightsParams {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Default window when no explicit range is given: the last DEFAULT_WINDOW_DAYS days.
  // When the user picks a range in the calendar (DateStrip), that range wins.
  const defaultStart = new Date(today.getTime() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  defaultStart.setHours(0, 0, 0, 0);

  const from = opts.dateFrom ? new Date(opts.dateFrom) : defaultStart;
  from.setHours(0, 0, 0, 0);
  const to = opts.dateTo ? new Date(opts.dateTo) : new Date(today);
  to.setHours(23, 59, 59, 999);

  // selected_date defaults to the window end; always clamped inside [from, to].
  let sel = opts.selectedDate ? new Date(opts.selectedDate) : new Date(to);
  if (sel > to) sel = new Date(to);
  else if (sel < from) sel = new Date(from);

  return {
    patientId: opts.patientId || 'anon',
    dateFrom: fmtDate(from),
    dateTo: fmtDate(to),
    selectedDate: fmtDate(sel),
    model: opts.model || 'kaggle',
  };
}

const keyOf = (p: InsightsParams): string =>
  `${KEY_PREFIX}${p.patientId}|${p.dateFrom}|${p.dateTo}|${p.selectedDate}|${p.model}`;

/** Load persisted cache into memory once per session. Idempotent. */
export function hydrate(): Promise<void> {
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter(k => k.startsWith(KEY_PREFIX));
      if (keys.length === 0) return;
      const entries = await AsyncStorage.multiGet(keys);
      const now = Date.now();
      const expired: string[] = [];
      for (const [k, v] of entries) {
        if (!v) continue;
        try {
          const bundle = JSON.parse(v) as InsightsBundle;
          if (!bundle?.fetchedAt || now - bundle.fetchedAt > GC_MS) {
            expired.push(k);
            continue;
          }
          memCache.set(k, bundle);
        } catch {
          expired.push(k);
        }
      }
      if (expired.length) AsyncStorage.multiRemove(expired).catch(() => {});
    } catch {
      // Storage unavailable — operate as an in-memory-only cache.
    }
  })();
  return hydratePromise;
}

/** Synchronous cache read. Only meaningful after hydrate() has resolved. */
export function getCached(params: InsightsParams): InsightsBundle | null {
  return memCache.get(keyOf(params)) ?? null;
}

export function isStale(bundle: InsightsBundle): boolean {
  return Date.now() - bundle.fetchedAt > STALE_MS;
}

/**
 * Fetch the four AI endpoints as one bundle. De-duplicates concurrent calls for the same key,
 * caches + persists the result. Throws only when ALL four fail with a genuine (non-403) error,
 * so partial/premium-gated results still render via the screen's mock fallbacks.
 */
export function fetchInsightsBundle(params: InsightsParams): Promise<InsightsBundle> {
  const key = keyOf(params);
  const existing = inflight.get(key);
  if (existing) return existing;

  const { dateFrom, dateTo, selectedDate, model } = params;
  const signal = sessionController.signal;

  const run = (async (): Promise<InsightsBundle> => {
    // ONE aggregate call (not four parallel) — see apiService.fetchInsights for why.
    let agg: any = null;
    try {
      agg = await apiService.fetchInsights(dateFrom, dateTo, selectedDate, model, signal);
    } catch (e: any) {
      // A 403 (premium-gated) is an expected "offline" state → return an empty bundle so the
      // screen shows its mock/demo fallback. Any other failure is genuine → propagate so the
      // screen surfaces a retryable error instead of caching junk.
      if (e?.message !== 'PREMIUM_REQUIRED') throw e;
    }

    // Map the aggregate /api/insights response into the per-section shape the screen consumes.
    // Shapes verified against the live endpoint:
    //   calendar           → top-level { days[], selected_date, ... }
    //   recommendations    → flat array [{ id, title, category, priority, ... }]
    //   patterns           → nested  { patterns: [...], model_used, from_cache }
    //   prediction         → object  { expected_at, expected_mg_dl, ... }
    //   insulin_estimate   → object  { units, basis, ... }
    //   model_used         → only at patterns.model_used (no top-level field)
    const calendar = agg?.calendar ?? null;
    const modelUsed = agg?.patterns?.model_used ?? agg?.model_used ?? null;
    // recommendations is normally a flat array; tolerate a { recommendations: [...] } wrapper too.
    const recsArray = Array.isArray(agg?.recommendations)
      ? agg.recommendations
      : agg?.recommendations?.recommendations ?? null;
    // patterns is normally { patterns: [...] }; tolerate a bare array too.
    const patternsArray = Array.isArray(agg?.patterns)
      ? agg.patterns
      : agg?.patterns?.patterns ?? null;
    const predictionObj =
      agg?.prediction ?? (Array.isArray(agg?.predictions) ? agg.predictions[0] : null);

    const bundle: InsightsBundle = {
      recommendations: agg
        ? { recommendations: recsArray, calendar, model_used: modelUsed }
        : null,
      patterns: agg
        ? { patterns: patternsArray, model_used: modelUsed }
        : null,
      prediction: { prediction: predictionObj },
      insulin: { insulin_estimate: agg?.insulin_estimate ?? agg?.insulin ?? null, calendar },
      model,
      fetchedAt: Date.now(),
    };
    memCache.set(key, bundle);
    AsyncStorage.setItem(key, JSON.stringify(bundle)).catch(() => {});
    return bundle;
  })();

  inflight.set(key, run);
  return run.finally(() => {
    if (inflight.get(key) === run) inflight.delete(key);
  });
}

/** Fire-and-forget background warm-up (used right after login / app entry). */
export function prefetchInsights(params: InsightsParams): void {
  hydrate().then(() => {
    const cached = getCached(params);
    if (cached && !isStale(cached)) return; // already fresh — nothing to do
    fetchInsightsBundle(params).catch(() => {});
  });
}

/**
 * Logout: abort any in-flight requests and drop the in-memory cache. Persisted entries are
 * kept (keyed by patient) so they survive to the next login / restart; the next hydrate()
 * re-reads them.
 */
export function resetInsightsSession(): void {
  try {
    sessionController.abort();
  } catch {}
  sessionController = new AbortController();
  inflight.clear();
  memCache.clear();
  hydratePromise = null;
}

export const insightsService = {
  buildInsightsParams,
  hydrate,
  getCached,
  isStale,
  fetchInsightsBundle,
  prefetchInsights,
  resetInsightsSession,
};
