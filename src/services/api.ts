// Centralized HTTP client for DiabAI.
//
// The spec calls for an axios instance + interceptors. This app has never used axios and
// already centralizes networking on `fetch`; per the agreed plan we KEEP fetch and wrap it
// so the "interceptor" behavior (Bearer attach, 401 handling, timeout, friendly errors) lives
// in exactly one place. New screen hooks/services should call `api.get/post/...` instead of
// hand-rolling fetch.
//
// Difference from the axios template: axios returns `{ data }`; this wrapper returns the parsed
// body directly. So a service reads `return api.get<HomeResponse>('/api/home')` (no `.data`).
import { authApi } from './authApi';
import { emit } from './uiEvents';

/** Emitted when a request returns 401. The app shell listens and routes to sign-in. */
export const SESSION_EXPIRED_EVENT = 'sessionExpired';

const DEFAULT_TIMEOUT_MS = 15000;

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export interface RequestOptions {
  params?: QueryParams;
  headers?: Record<string, string>;
  /** Per-request timeout override (ms). Defaults to 15000. */
  timeout?: number;
  /** Caller-owned abort signal; composed with the internal timeout signal. */
  signal?: AbortSignal;
}

/** Thrown for every non-2xx response and for network/timeout failures (status 0). */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const resolveBaseUrl = async (): Promise<string> => {
  // authApi owns base-URL resolution (Expo manifest host → port 8000, with fallbacks).
  await authApi.initBaseUrl();
  return authApi.baseUrl;
};

const buildUrl = (baseUrl: string, path: string, params?: QueryParams): string => {
  const base = baseUrl.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  let url = `${base}${suffix}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }
  return url;
};

const extractMessage = (body: unknown, fallback: string): string => {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.error === 'string') return record.error;
  }
  return fallback;
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const baseUrl = await resolveBaseUrl();
  const url = buildUrl(baseUrl, path, options.params);

  // --- request "interceptor": attach auth + standard headers ---
  const token = authApi.getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // --- timeout + caller-cancellation, composed onto one AbortController ---
  const controller = new AbortController();
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onExternalAbort);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    // Distinguish a timeout/cancel from a real network failure for a clearer message.
    if (controller.signal.aborted && !options.signal?.aborted) {
      throw new ApiError('Request timed out. Please try again.', 0);
    }
    throw new ApiError('Network error. Please check your connection.', 0, e);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }

  // --- response "interceptor" ---
  const rawText = await response.text();
  let parsed: unknown = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }
  }

  if (response.status === 401) {
    authApi.setToken(null);
    emit(SESSION_EXPIRED_EVENT);
    throw new ApiError('Your session has expired. Please sign in again.', 401, parsed);
  }

  if (response.status >= 500) {
    throw new ApiError('Server error, please try again.', response.status, parsed);
  }

  if (!response.ok) {
    throw new ApiError(extractMessage(parsed, 'Request failed. Please try again.'), response.status, parsed);
  }

  return parsed as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>('DELETE', path, undefined, options),
};
