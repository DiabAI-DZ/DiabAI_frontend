import {
  LogEntry, AlertItem, UserProfile, GlucoseStatus, GlucoseTrend,
  ImpactLevel, MeasurementEntry, MealEntry, InsulinInjectionEntry,
  ActivityEntry, HomeData
} from './types';
import { authApi } from './authApi';
import { Platform } from 'react-native';

// --- HELPERS ---

export const mapStatus = (status?: string): GlucoseStatus => {
  if (!status) return "Normal";
  const lower = status.toLowerCase();
  if (lower === 'high') return "High";
  if (lower === 'low') return "Low";
  return "Normal";
};

const mapTag = (type?: string): string => {
  if (!type) return "Fasting";
  if (type === 'fasting') return "Fasting";
  if (type === 'before_meal') return "Before Meal";
  if (type === 'after_meal') return "After Meal";
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const unmapTag = (tag?: string): string => {
  if (!tag) return 'fasting';
  const lower = tag.toLowerCase();
  if (lower.includes('fasting')) return 'fasting';
  if (lower.includes('before')) return 'before_meal';
  if (lower.includes('after')) return 'after_meal';
  return 'fasting';
};

export const mapTrend = (trend?: string): GlucoseTrend => {
  if (trend === 'rising' || trend === 'up') return "up";
  if (trend === 'falling' || trend === 'down') return "down";
  return "stable";
};

const mapImpactLevel = (level?: string): ImpactLevel => {
  if (!level) return "low";
  const lower = level.toLowerCase();
  if (lower === 'high') return "high";
  if (lower === 'moderate' || lower === 'medium') return "medium";
  return "low";
};

export const formatTime = (isoString?: string): string => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  } catch (e) {
    return "";
  }
};

const mapDiabetesType = (type?: string): "Type 1" | "Type 2" | "Gestational" | "Prediabetic" => {
  if (type === 'type_1') return 'Type 1';
  if (type === 'type_2') return 'Type 2';
  if (type === 'gestational') return 'Gestational';
  return 'Type 2';
};

const unmapDiabetesType = (type?: string): string => {
  if (type === 'Type 1') return 'type_1';
  if (type === 'Type 2') return 'type_2';
  if (type === 'Gestational') return 'gestational';
  return 'type_2';
};

const mapGlucoseUnit = (unit?: string): "mg/dL" | "mmol/L" => {
  if (unit === 'mmol_l') return 'mmol/L';
  return 'mg/dL';
};

const unmapGlucoseUnit = (unit?: string): string => {
  if (unit === 'mmol/L') return 'mmol_l';
  return 'mg_dl';
};

export const convertGlucose = (value: number, toUnit: string, fromUnit: string): number => {
  if (!value || toUnit === fromUnit) return value;
  let converted: number;
  if (toUnit === 'mmol/L') {
    converted = value / 18.0182;
  } else {
    converted = value * 18.0182;
  }
  return parseFloat(converted.toFixed(2));
};

// The API returns asset URLs that aren't always reachable as-is from a device/emulator:
//  - relative paths like "/storage/placeholder/meal_placeholder.jpg", or
//  - absolute URLs built from the backend's APP_URL (e.g. http://localhost:8000/storage/...),
//    whose host the device can't reach (it talks to the dev-host IP instead).
// Normalise anything from "/storage/" onward onto the current API origin so <Image> can load it.
// URLs without a "/storage/" segment (e.g. the Unsplash default avatar) pass through untouched.
export const resolveStorageUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('/storage/')) return `${authApi.baseUrl}${url}`;
  const idx = url.indexOf('/storage/');
  if (idx >= 0 && /^https?:\/\//i.test(url)) {
    return `${authApi.baseUrl}${url.slice(idx)}`;
  }
  return url;
};

// Slow AI endpoints (glucose patterns + recommendations + insulin estimate) legitimately
// run for up to ~4 minutes on a cold (uncached) call; the backend caches results in Redis so
// repeat calls return in milliseconds. Give the client a generous ceiling so it never cancels
// a cold call early. NOTE: a free trycloudflare tunnel enforces its own ~100s edge limit, so
// over such a tunnel the effective ceiling is the tunnel, not this value.
export const AI_TIMEOUT_MS = 240000;

interface FetchConfig {
  // When set, the request is aborted after this many ms (via AbortController).
  // Omitted for fast endpoints so their behaviour is unchanged (no timeout, no abort).
  timeoutMs?: number;
  // External signal so callers can cancel a request on unmount / supersession.
  signal?: AbortSignal;
  // Controls whether a 403 premium-gating should emit a UI event (Premium overlay).
  // Used to prevent background prefetch from popping the overlay.
  emitPremiumUi?: boolean;
}

// Maps a single raw /api/logbook row (discriminated by entry_type) into the client LogEntry
// union. Shared by fetchLogs (recent feed) and fetchLogbookPage (paginated, filtered feed).
const mapLogRow = (row: any): LogEntry | null => {
  if (row.entry_type === 'measurement') {
    return {
      id: row.id,
      type: 'measurement',
      value: parseFloat(row.value_mg_dl) || 0,
      unit: 'mg/dL',
      status: mapStatus(row.health_status),
      time: formatTime(row.recorded_at),
      date: row.recorded_at,
      tag: mapTag(row.measurement_type),
      trend: mapTrend(row.trend),
      image: resolveStorageUrl(row.image_url),
    };
  } else if (row.entry_type === 'meal') {
    return {
      id: row.id,
      type: 'meal',
      name: row.title || 'Logged Meal',
      mealType: row.meal_type || 'snack',
      time: formatTime(row.recorded_at),
      date: row.recorded_at,
      carbs: row.carbohydrates_g || 0,
      calories: row.calories || 0,
      protein: row.protein_g,
      fat: row.fat_g,
      fiber: row.fiber_g,
      impact: row.glucose_impact_mg_dl ? `+${Math.round(row.glucose_impact_mg_dl)} mg/dL` : '',
      impactLevel: mapImpactLevel(row.impact_level),
      image: resolveStorageUrl(row.image_url),
      tags: row.tags || [],
    };
  } else if (row.entry_type === 'injection') {
    return {
      id: row.id,
      type: 'injection',
      insulinType: row.insulin_type,
      dose: row.dose_units,
      site: row.injection_site,
      reason: row.reason,
      time: formatTime(row.recorded_at),
      date: row.recorded_at,
      notes: row.notes,
      image: resolveStorageUrl(row.image_url),
    };
  } else if (row.entry_type === 'activity') {
    return {
      id: row.id,
      type: 'activity',
      activityType: row.activity_type,
      duration: row.duration_minutes,
      intensity: row.intensity,
      calories: row.calories_burned,
      distance: row.distance_km,
      steps: row.steps,
      heartRate: row.heart_rate_avg,
      impact: row.glucose_impact,
      time: formatTime(row.recorded_at),
      date: row.recorded_at,
      notes: row.notes,
      image: resolveStorageUrl(row.image_url),
    };
  }
  return null;
};

// Query parameters for the unified /api/logbook feed, mirroring the documented API contract.
export interface LogbookQueryParams {
  entryTypes?: Array<'measurement' | 'meal' | 'activity' | 'injection'>;
  search?: string;
  // date_preset is mutually exclusive with date_from/date_to (date range wins when both given).
  datePreset?: 'today' | 'last_7_days' | 'last_30_days';
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
  healthStatus?: 'low' | 'normal' | 'high';
  valueMinMgDl?: number;
  valueMaxMgDl?: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  impactLevel?: 'low' | 'moderate' | 'high';
  activityType?: string;
  insulinType?: string;
  page?: number;
  perPage?: number;
}

export interface LogbookMeta {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
}

// Aggregate counts for the whole (filtered) result set, returned alongside every page.
export interface LogbookStats {
  totalScans: number;
  averageMgDl: number;
  inRangePercentage: number;
  totalMeals: number;
  totalActivities: number;
  totalInjections: number;
}

// A helper for doing authenticated requests
const authenticatedFetch = async (
  path: string,
  options: RequestInit = {},
  config: FetchConfig = {}
): Promise<Response> => {
  const token = authApi.getToken();
  const baseUrl = authApi.baseUrl;
  const url = `${baseUrl}${path}`;

  const headers: any = {
    'Accept': 'application/json',
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const { timeoutMs, signal: externalSignal } = config;

  // Only spin up a timeout-driven controller when a timeout is requested. Fast endpoints
  // pass no config and keep their original behaviour (no timeout, no abort).
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  let fetchSignal = externalSignal;

  if (timeoutMs) {
    const controller = new AbortController();
    fetchSignal = controller.signal;
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    // Chain the caller's signal so an unmount/supersession also aborts the live fetch.
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: fetchSignal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      // Distinguish our own timeout from a caller-initiated cancel so the UI can react.
      if (timedOut) throw new Error(`AI_TIMEOUT: ${path} exceeded ${timeoutMs}ms`);
      throw err; // caller cancelled (unmount / cancel-previous) — propagate the AbortError
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  if (response.status === 401) {
    console.warn("[API] Request unauthorized (401).");
  }

let premiumRequiredLastEmitAt = 0;

  if (response.status === 403) {
    console.warn("[API] Premium feature required (403).");
    // IMPORTANT: This endpoint-level gating must be restricted.
    // Otherwise, free users can trigger the overlay during background prefetch
    // (randomly) on unrelated 403s.
    //
    // Only emit for:
    //  - Alerts: /api/notifications and /api/notifications/*
    //  - Insights: /api/insights and /api/insights/*
    //
    // `path` is the route path passed into authenticatedFetch, usually like:
    //   '/api/notifications/read-all'
    //   '/api/insights?date_from=...'
    const shouldGatePremiumUI =
      path.startsWith('/api/notifications') ||
      path.startsWith('/api/insights') ||
      path.includes('/api/notifications') ||
      path.includes('/api/insights');

    // Default: emit premium overlay events.
    // Background prefetch can pass { emitPremiumUi: false } to prevent "random" overlay pops.
    const shouldEmitPremiumUI = config.emitPremiumUi !== false;

    if (shouldGatePremiumUI && shouldEmitPremiumUI) {
      try {
        // small guard to avoid rapid repeated emits from multiple quick prefetch calls
        const now = Date.now();
        if (!premiumRequiredLastEmitAt || now - premiumRequiredLastEmitAt > 750) {
          premiumRequiredLastEmitAt = now;
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { emitPremiumRequired } = require('./uiEvents');
          emitPremiumRequired();
        }
      } catch (e) {
        // ignore emitter failures
      }
    }

    throw new Error("PREMIUM_REQUIRED");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error [${response.status}] for ${path}: ${errorText}`);
  }

  return response;
};

// --- SERVICE FUNCTIONS ---

export const apiService = {
  // Logs
  async fetchLogs(): Promise<LogEntry[]> {
    console.log(`[API] Fetching logs from ${authApi.baseUrl}/api/logbook`);
    try {
      const response = await authenticatedFetch('/api/logbook?per_page=50');
      const result = await response.json();
      console.log(`[API] Logbook response:`, JSON.stringify(result?.meta), `entries: ${result?.data?.length}`);

      if (!result || !Array.isArray(result.data)) {
        console.warn('[API] Logbook returned unexpected shape:', result);
        return [];
      }

      return result.data
        .map(mapLogRow)
        .filter((entry: LogEntry | null): entry is LogEntry => entry !== null);
    } catch (error) {
      console.error("fetchLogs failed:", error);
      throw error;
    }
  },

  // Paginated + server-filtered logbook feed. Builds the query string per the documented
  // /api/logbook contract (entry_types[], search, date_preset|date_from/date_to, health_status,
  // value_min/max_mg_dl, meal_type, impact_level, activity_type, insulin_type, page, per_page)
  // and returns the mapped entries alongside normalized pagination meta.
  async fetchLogbookPage(
    params: LogbookQueryParams = {}
  ): Promise<{ entries: LogEntry[]; meta: LogbookMeta; stats: LogbookStats }> {
    const parts: string[] = [];
    const add = (key: string, value: string | number) =>
      parts.push(`${key}=${encodeURIComponent(String(value))}`);

    (params.entryTypes ?? []).forEach((t) => parts.push(`entry_types[]=${encodeURIComponent(t)}`));
    if (params.search) add('search', params.search);

    // date_preset is mutually exclusive with date_from/date_to — prefer an explicit range.
    if (params.dateFrom || params.dateTo) {
      if (params.dateFrom) add('date_from', params.dateFrom);
      if (params.dateTo) add('date_to', params.dateTo);
    } else if (params.datePreset) {
      add('date_preset', params.datePreset);
    }

    if (params.healthStatus) add('health_status', params.healthStatus);
    if (params.valueMinMgDl != null) add('value_min_mg_dl', params.valueMinMgDl);
    if (params.valueMaxMgDl != null) add('value_max_mg_dl', params.valueMaxMgDl);
    if (params.mealType) add('meal_type', params.mealType);
    if (params.impactLevel) add('impact_level', params.impactLevel);
    if (params.activityType) add('activity_type', params.activityType);
    if (params.insulinType) add('insulin_type', params.insulinType);

    const perPage = params.perPage ?? 20;
    const page = params.page ?? 1;
    add('per_page', perPage);
    add('page', page);

    const query = parts.join('&');
    console.log(`[API] Fetching logbook page: /api/logbook?${query}`);

    const response = await authenticatedFetch(`/api/logbook?${query}`);
    const result = await response.json();

    const entries = Array.isArray(result?.data)
      ? result.data.map(mapLogRow).filter((e: LogEntry | null): e is LogEntry => e !== null)
      : [];

    const m = result?.meta ?? {};
    const meta: LogbookMeta = {
      currentPage: m.current_page ?? page,
      lastPage: m.last_page ?? 1,
      total: m.total ?? entries.length,
      perPage: m.per_page ?? perPage,
    };

    const s = result?.stats ?? {};
    const stats: LogbookStats = {
      totalScans: s.total_scans ?? 0,
      averageMgDl: s.average_mg_dl ?? 0,
      inRangePercentage: s.in_range_percentage ?? 0,
      totalMeals: s.total_meals ?? 0,
      totalActivities: s.total_activities ?? 0,
      totalInjections: s.total_injections ?? 0,
    };

    return { entries, meta, stats };
  },

  async createLog(log: Omit<LogEntry, "id">): Promise<LogEntry> {
    console.log(`[API] Creating log`, log);
    try {
      if (log.type === 'measurement') {
        const mLog = log as Omit<MeasurementEntry, "id">;
        const payload: any = {
          title: mLog.tag ? `${mLog.tag} check` : "Glucose Measurement",
          value_mg_dl: mLog.value,
          measurement_type: unmapTag(mLog.tag),
          measured_at: mLog.date,
          notes: mLog.notes || "",
          tags: []
        };
        if (mLog.imagePath) {
          payload.image_path = mLog.imagePath;
        }
        console.log(`[API] Measurement payload:`, JSON.stringify(payload));
        const response = await authenticatedFetch('/api/measurements', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        console.log(`[API] Measurement created:`, JSON.stringify(result));
        const row = result.data;
        return {
          id: row.id,
          type: 'measurement',
          value: parseFloat(row.value_mg_dl) || 0,
          unit: 'mg/dL',
          status: mapStatus(row.health_status),
          time: formatTime(row.measured_at),
          date: row.measured_at,
          tag: mapTag(row.measurement_type),
          trend: mapTrend(row.trend),
        };
      } else if (log.type === 'injection') {
        const iLog = log as Omit<InsulinInjectionEntry, "id">;
        const payload = {
          insulin_type: iLog.insulinType,
          dose_units: iLog.dose,
          injection_site: iLog.site,
          reason: iLog.reason,
          injected_at: iLog.date,
          notes: iLog.notes || ""
        };
        const response = await authenticatedFetch('/api/injections', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        const row = result.data;
        return {
          id: row.id,
          type: 'injection',
          insulinType: row.insulin_type,
          dose: row.dose_units,
          site: row.injection_site,
          reason: row.reason,
          time: formatTime(row.injected_at),
          date: row.injected_at,
          notes: row.notes
        };
      } else if (log.type === 'activity') {
        const aLog = log as Omit<ActivityEntry, "id">;
        const payload = {
          activity_type: aLog.activityType,
          duration_minutes: Math.max(1, aLog.duration || 0),
          intensity: aLog.intensity || 'moderate',
          started_at: aLog.date,
          notes: aLog.notes || "",
          calories_burned: (aLog.calories && aLog.calories > 0) ? aLog.calories : null,
          distance_km: aLog.distance || 0,
          steps: (aLog.steps && aLog.steps > 0) ? aLog.steps : null,
          heart_rate_avg: aLog.heartRate || null,
          glucose_impact: aLog.impact || 'stable'
        };
        const response = await authenticatedFetch('/api/activities', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        const row = result.data;
        return {
          id: row.id,
          type: 'activity',
          activityType: row.activity_type,
          duration: row.duration_minutes,
          intensity: row.intensity,
          calories: row.calories_burned,
          distance: row.distance_km,
          steps: row.steps,
          heartRate: row.heart_rate_avg,
          impact: row.glucose_impact,
          time: formatTime(row.started_at),
          date: row.started_at,
          notes: row.notes
        };
      } else {
        const mLog = log as any;
        const payload = {
          title: mLog.name,
          meal_type: mLog.mealType,
          eaten_at: mLog.date,
          calories: mLog.calories,
          carbohydrates_g: mLog.carbs,
          protein_g: mLog.protein || 0,
          fat_g: mLog.fat || 0,
          fiber_g: mLog.fiber || 0,
          glucose_impact_mg_dl: typeof mLog.impact === 'number' ? mLog.impact : (mLog.impact ? parseInt(mLog.impact.replace(/[^0-9-]/g, '')) : 15),
          food_items: mLog.food_items || [
            { name: mLog.name, carbs_g: mLog.carbs, calories: mLog.calories }
          ],
          notes: mLog.notes || "",
          tags: mLog.tags || [],
          image_path: mLog.imagePath || null,
          predicted_label: mLog.predicted_label || null,
          corrected_label: mLog.corrected_label || null,
          model_version: mLog.model_version || null,
          confidence: mLog.confidence !== undefined ? mLog.confidence : null
        };
        const response = await authenticatedFetch('/api/meals', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        const row = result.data;
        return {
          id: row.id,
          type: 'meal',
          name: row.title || 'Logged Meal',
          mealType: row.meal_type || 'snack',
          time: formatTime(row.eaten_at),
          date: row.eaten_at,
          carbs: row.carbohydrates_g || 0,
          calories: row.calories || 0,
          protein: row.protein_g,
          fat: row.fat_g,
          fiber: row.fiber_g,
          impact: row.glucose_impact_mg_dl ? `+${Math.round(row.glucose_impact_mg_dl)} mg/dL` : '',
          impactLevel: mapImpactLevel(row.impact_level),
          image: row.image_url || '',
          tags: row.tags || [],
        };
      }
    } catch (error) {
      console.error("createLog failed:", error);
      throw error;
    }
  },

  async deleteLog(id: number, type?: "measurement" | "meal" | "activity" | "injection"): Promise<void> {
    console.log(`[API] Deleting log ${id} (type: ${type})`);
    try {
      if (type === 'meal') {
        await authenticatedFetch(`/api/meals/${id}`, {
          method: 'DELETE'
        });
      } else if (type === 'measurement') {
        await authenticatedFetch(`/api/measurements/${id}`, {
          method: 'DELETE'
        });
      } else if (type === 'injection') {
        await authenticatedFetch(`/api/injections/${id}`, {
          method: 'DELETE'
        });
      } else if (type === 'activity') {
        await authenticatedFetch(`/api/activities/${id}`, {
          method: 'DELETE'
        });
      } else {
        // Fallback or generic delete if type is unknown
        try { await authenticatedFetch(`/api/measurements/${id}`, { method: 'DELETE' }); } catch(e) {
          try { await authenticatedFetch(`/api/meals/${id}`, { method: 'DELETE' }); } catch(e) {
            try { await authenticatedFetch(`/api/injections/${id}`, { method: 'DELETE' }); } catch(e) {
              await authenticatedFetch(`/api/activities/${id}`, { method: 'DELETE' });
            }
          }
        }
      }
    } catch (error) {
      console.error("deleteLog failed:", error);
      throw error;
    }
  },

  // Alerts
  async fetchAlerts(): Promise<AlertItem[]> {
    console.log(`[API] Fetching alerts from ${authApi.baseUrl}/api/notifications`);
    try {
      const response = await authenticatedFetch('/api/notifications');
      const result = await response.json();
      if (!result || !Array.isArray(result.data)) {
        return [];
      }
      return result.data.map((row: any): AlertItem => {
        return {
          id: row.id,
          severity: row.type || 'info',
          title: row.title || 'Notification',
          desc: row.body || '',
          time: formatTime(row.created_at),
          date: row.created_at,
          tag: ['ai', 'ai_detected'].includes(row.source) ? 'AI Detected' : 'System',
          read: !!row.is_read
        };
      });
    } catch (error: any) {
      // Premium-gated (expected for free users): don't spam the console/error boundary.
      if (error?.message === 'PREMIUM_REQUIRED') return [];
      console.error("fetchAlerts failed:", error);
      return [];
    }
  },

  async markAlertRead(id: number): Promise<void> {
    console.log(`[API] Marking alert ${id} as read`);
    try {
      await authenticatedFetch(`/api/notifications/${id}/read`, {
        method: 'PATCH'
      });
    } catch (error) {
      console.error("markAlertRead failed:", error);
    }
  },

  async markAllAlertsRead(): Promise<number> {
    console.log(`[API] Marking all alerts as read`);
    try {
      const response = await authenticatedFetch('/api/notifications/read-all', {
        method: 'POST'
      });
      const result = await response.json();
      // API returns { marked_count: N }
      return result.marked_count || 0;
    } catch (error) {
      console.error("markAllAlertsRead failed:", error);
      return 0;
    }
  },

  // Unread in-app notification count, for a badge. fetchAlerts already swallows the 403 that
  // free (non-premium) users get from /api/notifications and returns [], so this is 403-safe.
  async fetchUnreadNotificationCount(): Promise<number> {
    const alerts = await this.fetchAlerts();
    return alerts.filter((a) => !a.read).length;
  },

  // --- Push notification device tokens (FCM) ---

  // Register/refresh this device's FCM token. Idempotent on the backend (re-sending the same
  // token just updates it), so it's safe to call on every app open / login / token refresh.
  async registerDevice(token: string, platform: 'android' | 'ios', deviceName?: string): Promise<void> {
    await authenticatedFetch('/api/devices', {
      method: 'POST',
      body: JSON.stringify({ token, platform, device_name: deviceName }),
    });
  },

  // Remove this device's token on logout so the device stops receiving pushes. The backend
  // returns 204 on success and 404 if the token isn't found/owned — neither should block logout.
  async unregisterDevice(token: string): Promise<void> {
    try {
      await authenticatedFetch(`/api/devices/${encodeURIComponent(token)}`, { method: 'DELETE' });
    } catch (error: any) {
      console.warn('[API] unregisterDevice (non-fatal):', error?.message);
    }
  },

  // Best-effort fetch of a single logbook entry by type + id, used to deep-link from a tapped
  // push to its DetailScreen. The per-resource show endpoints may omit the entry_type
  // discriminator and use a resource-specific timestamp field, so we normalise both before
  // reusing mapLogRow. Returns null if the entry can't be loaded/mapped.
  async fetchEntryByRef(
    entryType: 'measurement' | 'meal' | 'injection' | 'activity',
    id: number
  ): Promise<LogEntry | null> {
    const path =
      entryType === 'measurement' ? `/api/measurements/${id}`
      : entryType === 'meal' ? `/api/meals/${id}`
      : entryType === 'injection' ? `/api/injections/${id}`
      : `/api/activities/${id}`;
    try {
      const response = await authenticatedFetch(path);
      const result = await response.json();
      const row = result?.data ?? result;
      if (!row) return null;
      const normalized = {
        ...row,
        entry_type: entryType,
        recorded_at:
          row.recorded_at ?? row.measured_at ?? row.injected_at ?? row.started_at ?? row.created_at,
      };
      return mapLogRow(normalized);
    } catch (error: any) {
      console.warn('[API] fetchEntryByRef failed:', error?.message);
      return null;
    }
  },

  // Home & Insights
  async fetchHomeData(trend_period: "7d" | "30d" = "7d"): Promise<HomeData> {
    console.log(`[API] Fetching home data from ${authApi.baseUrl}/api/home?trend_period=${trend_period}`);
    const response = await authenticatedFetch(`/api/home?trend_period=${trend_period}`);
    const result = await response.json();
    return result.data || result;
  },

  // Single aggregate insights call — one LLM pass, hits the backend Redis cache. Preferred over
  // the four split endpoints below (which, fired in parallel against a single-threaded dev
  // server, serialize and overload the LLM, inflating latency and forcing heuristic fallbacks).
  async fetchInsights(
    dateFrom?: string,
    dateTo?: string,
    selectedDate?: string,
    model?: string,
    signal?: AbortSignal,
    fetchConfig: FetchConfig = {}
  ): Promise<any> {
    const params = new URLSearchParams();
    const today = new Date().toISOString().split('T')[0];
    params.append('date_from', dateFrom || today);
    params.append('date_to', dateTo || today);
    if (selectedDate) params.append('selected_date', selectedDate);
    if (model) params.append('model', model);

    console.log(`[API] Fetching aggregate insights (model: ${model})`);
    const response = await authenticatedFetch(
      `/api/insights?${params.toString()}`,
      {},
      { timeoutMs: AI_TIMEOUT_MS, signal, ...fetchConfig }
    );
    const result = await response.json();
    return result?.data ?? result;
  },

  async fetchRecommendations(dateFrom?: string, dateTo?: string, selectedDate?: string, model?: string, signal?: AbortSignal): Promise<any> {
    const params = new URLSearchParams();
    const today = new Date().toISOString().split('T')[0];
    params.append('date_from', dateFrom || today);
    params.append('date_to', dateTo || today);
    if (selectedDate) params.append('selected_date', selectedDate);
    if (model) params.append('model', model);

    console.log(`[API] Fetching recommendations with model: ${model}`);
    const response = await authenticatedFetch(`/api/insights/recommendations?${params.toString()}`, {}, { timeoutMs: AI_TIMEOUT_MS, signal });
    const result = await response.json();
    return result;
  },

  async fetchAISummary(): Promise<any> {
    console.log(`[API] Fetching AI summary`);
    const response = await authenticatedFetch('/api/insights/summary');
    const result = await response.json();
    return result.data || result;
  },

  async fetchPatterns(dateFrom?: string, dateTo?: string, selectedDate?: string, model?: string, signal?: AbortSignal): Promise<any> {
    const params = new URLSearchParams();
    const today = new Date().toISOString().split('T')[0];
    params.append('date_from', dateFrom || today);
    params.append('date_to', dateTo || today);
    if (selectedDate) params.append('selected_date', selectedDate);
    if (model) params.append('model', model);

    console.log(`[API] Fetching patterns with model: ${model}`);
    const response = await authenticatedFetch(`/api/insights/patterns?${params.toString()}`, {}, { timeoutMs: AI_TIMEOUT_MS, signal });
    const result = await response.json();
    return result;
  },

  async fetchPredictions(dateFrom?: string, dateTo?: string, selectedDate?: string, model?: string, signal?: AbortSignal): Promise<any> {
    const params = new URLSearchParams();
    const today = new Date().toISOString().split('T')[0];
    params.append('date_from', dateFrom || today);
    params.append('date_to', dateTo || today);
    if (selectedDate) params.append('selected_date', selectedDate);
    if (model) params.append('model', model);

    console.log(`[API] Fetching predictions with model: ${model}`);
    const response = await authenticatedFetch(`/api/insights/prediction?${params.toString()}`, {}, { timeoutMs: AI_TIMEOUT_MS, signal });
    const result = await response.json();
    return result;
  },

  async fetchInsulinEstimate(dateFrom?: string, dateTo?: string, selectedDate?: string, model?: string, signal?: AbortSignal): Promise<any> {
    const params = new URLSearchParams();
    const today = new Date().toISOString().split('T')[0];
    params.append('date_from', dateFrom || today);
    params.append('date_to', dateTo || today);
    if (selectedDate) params.append('selected_date', selectedDate);
    if (model) params.append('model', model);

    console.log(`[API] Fetching insulin estimate with model: ${model}`);
    const response = await authenticatedFetch(`/api/insights/insulin-estimate?${params.toString()}`, {}, { timeoutMs: AI_TIMEOUT_MS, signal });
    const result = await response.json();
    return result;
  },

  async fetchMeasurementDetail(id: number): Promise<any> {
    console.log(`[API] Fetching measurement detail for ${id}`);
    const response = await authenticatedFetch(`/api/measurements/${id}`);
    const result = await response.json();
    return result.data || result;
  },

  async fetchMealDetail(id: number): Promise<any> {
    console.log(`[API] Fetching meal detail for ${id}`);
    const response = await authenticatedFetch(`/api/meals/${id}`);
    const result = await response.json();
    return result.data || result;
  },

  async fetchInjectionDetail(id: number): Promise<any> {
    console.log(`[API] Fetching injection detail for ${id}`);
    const response = await authenticatedFetch(`/api/injections/${id}`);
    const result = await response.json();
    return result.data || result;
  },

  async fetchActivityDetail(id: number): Promise<any> {
    console.log(`[API] Fetching activity detail for ${id}`);
    const response = await authenticatedFetch(`/api/activities/${id}`);
    const result = await response.json();
    return result.data || result;
  },

  // Partial update of a measurement (used by the detail screen's inline notes editor).
  // Backed by Laravel's apiResource update route (PATCH /api/measurements/{id}).
  async updateMeasurement(id: number, payload: Record<string, any>): Promise<any> {
    console.log(`[API] Updating measurement ${id}`, payload);
    const response = await authenticatedFetch(`/api/measurements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    return result?.data || result;
  },

  // Partial update of a meal (used by the meal detail screen's inline notes editor).
  // Backed by Laravel's apiResource update route (PATCH /api/meals/{id}).
  async updateMeal(id: number, payload: Record<string, any>): Promise<any> {
    console.log(`[API] Updating meal ${id}`, payload);
    const response = await authenticatedFetch(`/api/meals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    return result?.data || result;
  },

  // Partial update of an injection (inline notes editor). PATCH /api/injections/{id}.
  async updateInjection(id: number, payload: Record<string, any>): Promise<any> {
    console.log(`[API] Updating injection ${id}`, payload);
    const response = await authenticatedFetch(`/api/injections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    return result?.data || result;
  },

  // Partial update of an activity (inline notes editor). PATCH /api/activities/{id}.
  async updateActivity(id: number, payload: Record<string, any>): Promise<any> {
    console.log(`[API] Updating activity ${id}`, payload);
    const response = await authenticatedFetch(`/api/activities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    return result?.data || result;
  },

  async fetchProfile(): Promise<UserProfile> {
    console.log(`[API] Fetching settings from ${authApi.baseUrl}/api/settings`);
    const response = await authenticatedFetch('/api/settings');
    const settings = await response.json();

    const p = settings.profile || {};
    const h = settings.health || {};

    return {
      name: p.name || '',
      email: p.email || '',
      diabetesType: mapDiabetesType(h.diabetes_type),
      glucoseUnit: mapGlucoseUnit(h.glucose_unit),
      goals: {
        min: h.glucose_target_min || 70,
        max: h.glucose_target_max || 140
      },
      phone_number: p.phone_number || undefined,
      address: p.address || undefined,
      weight: p.weight !== null && p.weight !== undefined ? parseFloat(p.weight) : undefined,
      height: p.height !== null && p.height !== undefined ? parseInt(p.height) : undefined,
      age: p.age !== null && p.age !== undefined ? parseInt(p.age) : undefined,
      sex: p.sex || undefined,
      isPremium: !!settings.subscription?.is_premium || !!settings.user?.is_premium || !!p.is_premium,
      // avatar_url may be a relative /storage/ path — resolve it to an absolute URL so <Image> loads it.
      avatar_url: p.avatar_url ? resolveStorageUrl(p.avatar_url) : null,
    };
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    console.log(`[API] Updating profile`, updates);
    const profileUpdates: any = {};
    const healthUpdates: any = {};

    if (updates.name !== undefined) profileUpdates.name = updates.name;
    if (updates.email !== undefined) profileUpdates.email = updates.email;
    if (updates.phone_number !== undefined) profileUpdates.phone_number = updates.phone_number;
    if (updates.address !== undefined) profileUpdates.address = updates.address;

    // Explicit casting for demographics to ensure backend compatibility
    if (updates.weight !== undefined) {
      profileUpdates.weight = updates.weight !== null ? parseFloat(String(updates.weight)) : null;
    }
    if (updates.height !== undefined) {
      profileUpdates.height = updates.height !== null ? parseInt(String(updates.height), 10) : null;
    }
    if (updates.age !== undefined) {
      profileUpdates.age = updates.age !== null ? parseInt(String(updates.age), 10) : null;
    }
    if (updates.sex !== undefined) profileUpdates.sex = updates.sex || null;

    if (updates.diabetesType !== undefined) {
      healthUpdates.diabetes_type = unmapDiabetesType(updates.diabetesType);
    }
    if (updates.glucoseUnit !== undefined) {
      healthUpdates.glucose_unit = unmapGlucoseUnit(updates.glucoseUnit);
    }
    if (updates.goals !== undefined) {
      if (updates.goals.min !== undefined) healthUpdates.glucose_target_min = updates.goals.min;
      if (updates.goals.max !== undefined) healthUpdates.glucose_target_max = updates.goals.max;
    }

    try {
      if (Object.keys(profileUpdates).length > 0) {
        console.log(`[API] sending profileUpdates to /api/profile:`, JSON.stringify(profileUpdates));
        const pResponse = await authenticatedFetch('/api/profile', {
          method: 'PATCH',
          body: JSON.stringify(profileUpdates)
        });
        const pResult = await pResponse.json();
        console.log(`[API] /api/profile response:`, JSON.stringify(pResult));
      }

      if (Object.keys(healthUpdates).length > 0) {
        console.log(`[API] sending healthUpdates to /api/settings/health:`, JSON.stringify(healthUpdates));
        const hResponse = await authenticatedFetch('/api/settings/health', {
          method: 'PATCH',
          body: JSON.stringify(healthUpdates)
        });
        const hResult = await hResponse.json();
        console.log(`[API] /api/settings/health response:`, JSON.stringify(hResult));
      }

      return await this.fetchProfile();
    } catch (error) {
      console.error("updateProfile failed:", error);
      throw error;
    }
  },

  async uploadAvatar(imageUri: string): Promise<UserProfile> {
    console.log(`[API] Uploading avatar:`, imageUri);

    const formData = new FormData();
    const rawFilename = imageUri.split('/').pop() || 'avatar.jpg';
    const filename = /\.(jpg|jpeg|png)$/i.test(rawFilename) ? rawFilename : `${rawFilename}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : `image/jpeg`;

    formData.append('avatar', {
      uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
      name: filename,
      type: type,
    } as any);
    // Laravel method spoofing: PHP only populates uploaded files on POST, so the
    // PATCH /api/profile route must be reached via POST + _method=PATCH.
    formData.append('_method', 'PATCH');

    try {
      const response = await authenticatedFetch('/api/profile', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      console.log(`[API] avatar upload response:`, JSON.stringify(result));

      // Pull the fresh avatar_url straight from the ProfileResource response, then
      // merge it over a full profile refresh so the rest of the profile stays in sync
      // even if /api/settings doesn't surface avatar_url.
      const rawAvatarUrl =
        result?.data?.avatar_url ?? result?.avatar_url ?? result?.profile?.avatar_url ?? null;
      const avatarUrl = rawAvatarUrl ? resolveStorageUrl(rawAvatarUrl) : null;
      const profile = await this.fetchProfile();
      return avatarUrl ? { ...profile, avatar_url: avatarUrl } : profile;
    } catch (error) {
      console.error("uploadAvatar failed:", error);
      throw error;
    }
  },

  async upgradeAccount(planId: string = 'premium_monthly', stripePaymentMethodId?: string): Promise<UserProfile> {
    console.log(`[API] Upgrading account to plan: ${planId}`);
    try {
      // Step 1: Check if user already has a subscription we can change
      let currentSub: any = null;
      try {
        const subResponse = await authenticatedFetch('/api/subscription', { method: 'GET' });
        currentSub = await subResponse.json();
        console.log(`[API] Current subscription state:`, JSON.stringify(currentSub));
      } catch (e) {
        console.log(`[API] No existing subscription found, will create new one`);
      }

      const hasActiveStripeSub = currentSub?.data?.stripe_subscription_id &&
                                  currentSub?.data?.status !== 'inactive';

      if (hasActiveStripeSub) {
        // User already has a Stripe subscription — use change-plan
        console.log(`[API] User has active Stripe subscription, calling change-plan`);
        await authenticatedFetch('/api/subscription/change-plan', {
          method: 'POST',
          body: JSON.stringify({ plan: planId })
        });
      } else if (stripePaymentMethodId) {
        // New subscription with a payment method from Stripe SDK
        console.log(`[API] Creating new subscription with payment method`);
        await authenticatedFetch('/api/subscription/subscribe', {
          method: 'POST',
          body: JSON.stringify({ plan: planId, stripe_payment_method_id: stripePaymentMethodId })
        });
      } else {
        // No Stripe payment method available — use subscribe with a test token
        // This works in Stripe test mode; in production, the Stripe SDK must be used
        console.log(`[API] Creating new subscription with test payment method`);
        await authenticatedFetch('/api/subscription/subscribe', {
          method: 'POST',
          body: JSON.stringify({ plan: planId, stripe_payment_method_id: 'pm_card_visa' })
        });
      }

      return await this.fetchProfile();
    } catch (error) {
      console.error("upgradeAccount failed:", error);
      throw error;
    }
  },

  // NOTE: /api/recommendations and /api/predict/glucose are NOT registered on the backend (404).
  // They previously spammed the logs with full 404 stack traces on every refresh and always
  // returned []. The equivalent data now comes from the aggregate /api/insights endpoint
  // (its `recommendations` array and `prediction`), so these are short-circuited to avoid the
  // dead round-trips. Re-wire to the real route if/when the backend adds it.
  async fetchPremiumRecommendations(): Promise<any[]> {
    return [];
  },

  async fetchGlucoseForecast(): Promise<any[]> {
    return [];
  },

  async scanMeasurementImage(imageUri: string): Promise<{ detected_value: number; confidence: number; preliminary_health_status: string; image_path: string; detected_unit?: string; is_fallback?: boolean }> {
    console.log(`[API] Uploading measurement image for scan:`, imageUri);

    const formData = new FormData();
    const rawFilename = imageUri.split('/').pop() || 'scan.jpg';
    const filename = /\.(jpg|jpeg|png)$/i.test(rawFilename) ? rawFilename : `${rawFilename}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('image', {
      uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
      name: filename,
      type: type
    } as any);

    const response = await authenticatedFetch('/api/measurements/scan', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return result;
  },

  async scanMealImage(imageUri: string): Promise<{
    image_path: string;
    predicted_label?: string;
    confidence?: number | null;
    model_version?: string;
    food_items: Array<{ name: string; carbs_g: number; calories: number }>;
    totals: {
      calories: number;
      carbohydrates_g: number;
      protein_g: number;
      fat_g: number;
      fiber_g: number;
      estimated_glucose_impact_mg_dl: number;
    };
  }> {
    console.log(`[API] Uploading meal image for food classification scan:`, imageUri);

    const formData = new FormData();
    const rawFilename = imageUri.split('/').pop() || 'scan.jpg';
    const filename = /\.(jpg|jpeg|png)$/i.test(rawFilename) ? rawFilename : `${rawFilename}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('image', {
      uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
      name: filename,
      type: type
    } as any);

    const response = await authenticatedFetch('/api/meals/scan', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return result;
  }
};
