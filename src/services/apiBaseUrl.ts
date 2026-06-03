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
  console.log('[API][baseUrl] Debug - expoConfig:', JSON.stringify(Constants.expoConfig?.extra));
  console.log('[API][baseUrl] Debug - hostUri:', Constants.expoConfig?.hostUri);

  // 1. Check for manual override in AsyncStorage (Dev Menu usage)
  // (Note: This is handled in initApiBaseUrl to keep this sync)

  // 2. Check for hardcoded app.json config (extra.apiBaseUrl)
  const extraApiBaseUrl: string | undefined = (Constants.expoConfig as any)?.extra?.apiBaseUrl;
  if (extraApiBaseUrl) {
    return forceBackendPort8000(normalizeBaseUrl(extraApiBaseUrl));
  }

  // 3. Dynamic Discovery from Expo Manifest (Metro Bundler Host)
  // This is the "Magic" way: Expo knows which IP it's serving from.
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (!isLoopbackHost(host)) {
      // If we see the old stale IP, we can force the new one here as a temporary fix
      // but let's try to be generic. 192.168.1.7 seems stale.
      if (host === '192.168.1.7') {
        return 'http://10.240.90.160:8000';
      }
      return `http://${host}:8000`;
    }
  }

  // 4. Known Environment Fallback (User's Current Machine IP)
  // If we are on physical device and hostUri was loopback/missing
  if (Platform.OS !== 'web' && !__DEV__) {
     // prod logic
  }
  
  const knownStableHost = '10.240.90.160';
  if (Platform.OS !== 'web') {
    return `http://${knownStableHost}:8000`;
  }

  // 5. Ultimate Fallback
  return 'http://localhost:8000';
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
