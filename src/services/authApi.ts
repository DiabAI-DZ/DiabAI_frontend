import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDefaultBaseUrl, initApiBaseUrl } from './apiBaseUrl';

const TOKEN_STORAGE_KEY = 'auth.accessToken';

// Export kept for compatibility; use the same sync resolver as the rest of the app.
export const AUTH_BASE_URL = getDefaultBaseUrl();

export class AuthApiException extends Error {
  statusCode?: number;
  body?: any;
  rawBody?: string | null;

  constructor(message: string, statusCode?: number, body?: any, rawBody?: string | null) {
    super(message);
    this.name = 'AuthApiException';
    this.statusCode = statusCode;
    this.body = body;
    this.rawBody = rawBody;
  }
}

const timeoutFetch = (url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> => {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => {
        console.warn('[API][auth] timeoutFetch timed out after', timeoutMs, 'ms for url:', url);
        reject(new AuthApiException(`Request timed out after ${timeoutMs}ms. Check backend connection / endpoint responsiveness.`));
      }, timeoutMs)
    ),
  ]);
};

const normalizeBaseUrl = (value: string): string => {
  let url = value.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `http://${url}`;
  }
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }
  return url;
};

export const authApi = {
  baseUrl: AUTH_BASE_URL,
  token: null as string | null,
  _initInFlight: null as Promise<void> | null,

  async initBaseUrl(): Promise<void> {
    if (!this._initInFlight) {
      this._initInFlight = (async () => {
        try {
          const resolved = await initApiBaseUrl();
          this.baseUrl = normalizeBaseUrl(resolved);
        } catch {
          // keep existing baseUrl
        }
      })();
    }
    return this._initInFlight;
  },

  setBaseUrl(newUrl: string) {
    this.baseUrl = normalizeBaseUrl(newUrl);
  },

  setToken(newToken: string | null) {
    this.token = newToken;
    // Persist so the session (and the post-login insights prefetch) survives an app restart.
    if (newToken) {
      AsyncStorage.setItem(TOKEN_STORAGE_KEY, newToken).catch(() => {});
    } else {
      AsyncStorage.removeItem(TOKEN_STORAGE_KEY).catch(() => {});
    }
  },

  getToken(): string | null {
    return this.token;
  },

  /** Restore a persisted token into memory on app start. Returns the token (or null). */
  async restoreToken(): Promise<string | null> {
    try {
      const stored = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) this.token = stored;
      return stored;
    } catch {
      return null;
    }
  },

  async login(email: string, password: string) {
    await this.initBaseUrl();
    const url = `${this.baseUrl}/api/auth/login`;
    console.log('[API][auth] login using baseUrl:', this.baseUrl, 'url:', url);

    const payload = { email, password };
    console.log('[API][auth] login payload keys:', Object.keys(payload));

    let response: Response;
    try {
      response = await timeoutFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (e: any) {
      if (e instanceof AuthApiException) {
        throw e;
      }
      throw new AuthApiException(`Cannot reach server. Check API base URL: ${e.message}`);
    }

    const rawText = await response.text();
    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch (_) {}

    if (!response.ok) {
      console.warn('[API][auth] login failed status:', response.status, 'content-type:', response.headers.get('content-type'));
      console.warn('[API][auth] login failed first200:', rawText.slice(0, 200));
    }

    if (response.status >= 200 && response.status < 300) {
      return body;
    }

    const message = body.error || body.message || `Login failed (status ${response.status}).`;
    throw new AuthApiException(message, response.status, body, rawText);
  },

  async register(name: string, email: string, password: string) {
    await this.initBaseUrl();
    const url = `${this.baseUrl}/api/auth/register`;
    console.log('[API][auth] register using baseUrl:', this.baseUrl, 'url:', url);

    let response: Response;
    try {
      response = await timeoutFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
    } catch (e: any) {
      if (e instanceof AuthApiException) {
        throw e;
      }
      throw new AuthApiException(`Cannot reach server. Check API base URL: ${e.message}`);
    }

    const rawText = await response.text();
    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch (_) {}

    if (response.status >= 200 && response.status < 300) {
      return body;
    }

    const message = body.error || body.message || `Register failed (status ${response.status}).`;
    throw new AuthApiException(message, response.status, body, rawText);
  },

  async sendResetOtp(email: string) {
    await this.initBaseUrl();
    const url = `${this.baseUrl}/api/auth/send-reset-otp`;
    console.log('[API][auth] sendResetOtp using baseUrl:', this.baseUrl, 'url:', url);

    let response: Response;
    try {
      response = await timeoutFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
    } catch (e: any) {
      if (e instanceof AuthApiException) {
        throw e;
      }
      throw new AuthApiException(`Cannot reach server. Check API base URL: ${e.message}`);
    }

    const rawText = await response.text();
    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch (_) {}

    if (response.status >= 200 && response.status < 300) {
      return body;
    }

    const message = body.error || body.message || `Failed to send OTP (status ${response.status}).`;
    throw new AuthApiException(message, response.status, body, rawText);
  },

  async resetPassword(email: string, otp: string, password: string, passwordConfirmation: string) {
    await this.initBaseUrl();
    const url = `${this.baseUrl}/api/auth/reset-password`;

    let response: Response;
    try {
      response = await timeoutFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
    } catch (e: any) {
      if (e instanceof AuthApiException) {
        throw e;
      }
      throw new AuthApiException(`Cannot reach server. Check API base URL: ${e.message}`);
    }

    const rawText = await response.text();
    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch (_) {}

    if (response.status >= 200 && response.status < 300) {
      return body;
    }

    const message = body.error || body.message || `Password reset failed (status ${response.status}).`;
    throw new AuthApiException(message, response.status, body, rawText);
  },

  async changePassword(currentPassword: string, password: string, passwordConfirmation: string) {
    await this.initBaseUrl();
    // Settings-scoped change-password route: verifies current_password, rotates the JWT
    // (bumps token_version to drop other sessions), and returns a fresh access_token.
    const url = `${this.baseUrl}/api/settings/change-password`;

    let response: Response;
    try {
      response = await timeoutFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
    } catch (e: any) {
      if (e instanceof AuthApiException) {
        throw e;
      }
      throw new AuthApiException(`Cannot reach server. Check API base URL: ${e.message}`);
    }

    const rawText = await response.text();
    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch (_) {}

    if (response.status >= 200 && response.status < 300) {
      if (body.access_token) {
        this.setToken(body.access_token);
      }
      return body;
    }

    const message = body.error || body.message || `Change password failed (status ${response.status}).`;
    throw new AuthApiException(message, response.status, body, rawText);
  },

  async logout(deviceToken?: string) {
    await this.initBaseUrl();
    const token = this.token;
    if (!token) {
      return null;
    }

    const url = `${this.baseUrl}/api/auth/logout`;

    let response: Response;
    try {
      response = await timeoutFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(deviceToken ? { device_token: deviceToken } : {}),
      });
    } catch (e: any) {
      if (e instanceof AuthApiException) {
        throw e;
      }
      throw new AuthApiException(`Cannot reach server. Check API base URL: ${e.message}`);
    }

    const rawText = await response.text();
    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch (_) {}

    if (response.status >= 200 && response.status < 300) {
      return body;
    }

    const message = body.error || body.message || `Logout failed (status ${response.status}).`;
    throw new AuthApiException(message, response.status, body, rawText);
  },
};
