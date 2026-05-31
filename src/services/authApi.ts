import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getDevHostIp = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return Platform.select({
      android: '10.0.2.2',
      default: 'localhost',
    }) || 'localhost';
  }
  return hostUri.split(':')[0];
};

// Fixed IP address discovered on your hotspot network (10.64.129.160)
export const AUTH_BASE_URL = `http://10.64.129.160:8000`;

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

const timeoutFetch = (url: string, options: RequestInit, timeoutMs = 12000): Promise<Response> => {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new AuthApiException('Request timed out. Check backend connection.')), timeoutMs)
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

  setBaseUrl(newUrl: string) {
    this.baseUrl = normalizeBaseUrl(newUrl);
  },

  setToken(newToken: string | null) {
    this.token = newToken;
  },

  getToken(): string | null {
    return this.token;
  },

  async login(email: string, password: string) {
    const url = `${this.baseUrl}/api/auth/login`;

    let response: Response;
    try {
      response = await timeoutFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
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

    const message = body.error || body.message || `Login failed (status ${response.status}).`;
    throw new AuthApiException(message, response.status, body, rawText);
  },

  async register(name: string, email: string, password: string) {
    const url = `${this.baseUrl}/api/auth/register`;

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
    const url = `${this.baseUrl}/api/auth/send-reset-otp`;

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
    const url = `${this.baseUrl}/api/auth/change-password`;

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
};
