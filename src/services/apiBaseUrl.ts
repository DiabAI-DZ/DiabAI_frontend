import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OVERRIDE_KEY = 'api.baseUrl';

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

const mapLocalhostForPlatform = (baseUrl: string): string => {
  try {
    const u = new URL(baseUrl);
    const isLocalhost =
      u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '0.0.0.0';

    if (!isLocalhost) return baseUrl;

    // Android emulator: 10.0.2.2 points to the host machine.
    if (Platform.OS === 'android') {
      u.hostname = '10.0.2.2';
      return u.toString().replace(/\/$/, '');
    }

    // iOS simulator: localhost should work when app runs on same Mac.
    return baseUrl;
  } catch {
    return baseUrl;
  }
};

const forceBackendPort8000 = (baseUrl: string): string => {
  try {
    // baseUrl is expected to include protocol
    const u = new URL(baseUrl);
    // Always point to Laravel API port 8000 for local mobile networking.
    // This avoids accidentally using expo web/dev ports (e.g. :19000) or other tooling ports.
    u.port = '8000';
    return u.toString().replace(/\/$/, '');
  } catch {
    return baseUrl;
  }
};

const defaultEmulatorHost = (): string => {
  // Android emulator loopback:
  // - 10.0.2.2 maps to host machine
  // iOS simulator can generally reach localhost on the same machine.
  return Platform.select({
    android: '10.0.2.2',
    default: 'localhost',
  }) as string;
};

const isLoopbackHost = (host: string): boolean => {
  const h = host.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0';
};

/**
 * Prefer a dedicated expo config value for API base URL.
 * Some Expo Go environments override/ignore hostUri and set it to 127.0.0.1,
 * which breaks physical devices. The `extra.apiBaseUrl` field gives us a stable host.
 */
export const getDefaultBaseUrl = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  const extraApiBaseUrl: string | undefined = (Constants.expoConfig as any)?.extra?.apiBaseUrl;

  console.log('[API][baseUrl] Debug - manifest.hostUri:', hostUri);
  console.log('[API][baseUrl] Debug - extra.apiBaseUrl:', extraApiBaseUrl);

  // 1. Dynamic Discovery from Expo Manifest (Metro Bundler Host)
  // We prioritize THIS because it's set by Metro/Expo at runtime based on the Network IP.
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (!isLoopbackHost(host)) {
      // If hostUri gives a LAN IP, that is almost certainly where the developer is.
      return `http://${host}:8000`;
    }
  }

  // 2. Clear known stale IPs from extra config
  const STALE_IPS = ['192.168.1.7'];
  if (extraApiBaseUrl) {
    const isStale = STALE_IPS.some(ip => extraApiBaseUrl.includes(ip));
    if (!isStale) {
      return forceBackendPort8000(normalizeBaseUrl(extraApiBaseUrl));
    } else {
      console.warn('[API][baseUrl] Skipping STALE extraApiBaseUrl:', extraApiBaseUrl);
    }
  }

  // 3. Fallback to current verified machine IP
  const knownStableHost = '10.240.90.160';
  if (Platform.OS !== 'web') {
    return `http://${knownStableHost}:8000`;
  }

  // 4. Ultimate Fallbacks (Emulators)
  const base = `http://${defaultEmulatorHost()}:8000`;
  return mapLocalhostForPlatform(base);
};

export const initApiBaseUrl = async (): Promise<string> => {
  const resolved = getDefaultBaseUrl();
  console.log('[API][baseUrl] initApiBaseUrl resolved:', resolved);
  return resolved;
};

export const setApiBaseUrlOverride = async (url: string): Promise<void> => {
  await AsyncStorage.setItem(OVERRIDE_KEY, normalizeBaseUrl(url));
};

export const clearApiBaseUrlOverride = async (): Promise<void> => {
  await AsyncStorage.removeItem(OVERRIDE_KEY);
};
