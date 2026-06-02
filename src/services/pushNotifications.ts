import { Platform, PermissionsAndroid } from 'react-native';
import Constants from 'expo-constants';
import { apiService } from './apiService';

/**
 * Firebase Cloud Messaging (FCM) client integration for the DiabAI backend.
 *
 * IMPORTANT — native module: `@react-native-firebase/messaging` is a NATIVE module. It only
 * exists in a custom dev build that includes the @react-native-firebase config plugins (see
 * app.json) — NOT in Expo Go, and NOT until the app is rebuilt after installing the packages
 * and adding the Firebase client config files (google-services.json / GoogleService-Info.plist
 * from the `diabai-c2fb6` project). Until then every entry point here no-ops gracefully so the
 * rest of the app keeps working. See FCM_SETUP.md.
 */

// Lazy, guarded access to the native messaging module.
let _messaging: any | null | undefined;
function getMessaging(): any | null {
  if (_messaging !== undefined) return _messaging;
  try {
    // Loaded lazily so a missing native module never crashes JS startup.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _messaging = require('@react-native-firebase/messaging').default;
  } catch {
    _messaging = null;
    console.warn('[push] @react-native-firebase/messaging unavailable — push disabled in this build.');
  }
  return _messaging;
}

export type PushPlatform = 'android' | 'ios';
const currentPlatform = (): PushPlatform => (Platform.OS === 'ios' ? 'ios' : 'android');

const buildDeviceName = (): string => {
  const named = (Constants as any)?.deviceName as string | undefined;
  const fallback = currentPlatform() === 'ios' ? 'iOS device' : 'Android device';
  return String(named || fallback).slice(0, 100);
};

export interface DeepLinkTarget {
  notificationId: number | null;
  entryType: 'measurement' | 'meal' | 'injection' | 'activity' | null;
  entryId: number | null;
}

/** Parse an FCM message's string `data` map into a deep-link target. */
export function parseDeepLink(data: Record<string, string> | undefined | null): DeepLinkTarget {
  const target: DeepLinkTarget = { notificationId: null, entryType: null, entryId: null };
  if (!data) return target;

  if (data.notification_id) {
    const n = parseInt(data.notification_id, 10);
    if (!Number.isNaN(n)) target.notificationId = n;
  }

  // Exactly one related_*_id is present — it identifies the entry that triggered the push.
  const refs: Array<[DeepLinkTarget['entryType'], string | undefined]> = [
    ['measurement', data.related_measurement_id],
    ['meal', data.related_meal_id],
    ['injection', data.related_injection_id],
    ['activity', data.related_activity_id],
  ];
  for (const [type, raw] of refs) {
    if (raw) {
      const id = parseInt(raw, 10);
      if (!Number.isNaN(id)) {
        target.entryType = type;
        target.entryId = id;
      }
      break;
    }
  }
  return target;
}

export type PermissionPromptPhase = 'pre-permission' | 'blocked';
export type PermissionPromptHandler = (phase: PermissionPromptPhase) => Promise<boolean>;

let permissionPromptHandler: PermissionPromptHandler | null = null;

export function setPermissionPromptHandler(handler: PermissionPromptHandler | null): void {
  permissionPromptHandler = handler;
}

/**
 * Request notification permission. On Android 13+ also requests the runtime POST_NOTIFICATIONS
 * permission. Returns true if push is allowed.
 */
export async function requestPushPermission(): Promise<boolean> {
  const messaging = getMessaging();
  if (!messaging) return false;
  try {
    // 1. Check if permission is already granted
    let hasPermission = false;
    if (Platform.OS === 'android') {
      if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
        hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
      } else {
        hasPermission = true; // Android < 13 has notifications enabled by default
      }
    } else {
      const status = await messaging().hasPermission();
      hasPermission =
        status === messaging.AuthorizationStatus.AUTHORIZED ||
        status === messaging.AuthorizationStatus.PROVISIONAL;
    }

    // 2. If not granted, trigger the custom pre-permission check
    if (!hasPermission) {
      const proceed = permissionPromptHandler
        ? await permissionPromptHandler('pre-permission')
        : true;
      if (!proceed) return false;

      // 3. Request native permission
      if (Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 33) {
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (res !== PermissionsAndroid.RESULTS.GRANTED) {
          if (permissionPromptHandler) {
            await permissionPromptHandler('blocked');
          }
          return false;
        }
      }

      const status = await messaging().requestPermission();
      hasPermission =
        status === messaging.AuthorizationStatus.AUTHORIZED ||
        status === messaging.AuthorizationStatus.PROVISIONAL;

      if (!hasPermission) {
        if (permissionPromptHandler) {
          await permissionPromptHandler('blocked');
        }
        return false;
      }
    }

    return true;
  } catch (error: any) {
    console.warn('[push] requestPushPermission error:', error?.message);
    return false;
  }
}

/** Current FCM registration token, or null if unavailable. */
export async function getFcmToken(): Promise<string | null> {
  const messaging = getMessaging();
  if (!messaging) return null;
  try {
    return await messaging().getToken();
  } catch (error: any) {
    console.warn('[push] getToken error:', error?.message);
    return null;
  }
}

/**
 * Request permission, get the FCM token, and register it with the backend.
 * Safe to call on every app open / successful login (idempotent server-side).
 */
export async function registerDeviceToken(): Promise<void> {
  const granted = await requestPushPermission();
  if (!granted) {
    console.log('[push] notification permission not granted — skipping registration.');
    return;
  }
  const token = await getFcmToken();
  if (!token) return;
  try {
    await apiService.registerDevice(token, currentPlatform(), buildDeviceName());
    console.log('[push] device token registered with backend.');
  } catch (error: any) {
    console.warn('[push] registerDevice failed:', error?.message);
  }
}

/**
 * Unregister this device's token on logout. Must be called BEFORE the JWT is cleared
 * (the DELETE is authenticated). Also drops the local token so a new one is minted next login.
 */
export async function unregisterDeviceToken(): Promise<void> {
  const messaging = getMessaging();
  if (!messaging) return;
  try {
    const token = await messaging().getToken();
    if (token) await apiService.unregisterDevice(token);
    await messaging().deleteToken();
    console.log('[push] device token unregistered.');
  } catch (error: any) {
    console.warn('[push] unregisterDeviceToken failed:', error?.message);
  }
}

export interface InitPushOptions {
  /** Called when a notification is tapped (background or quit) — navigate from the target. */
  onDeepLink: (target: DeepLinkTarget) => void;
  /** Called for foreground messages (FCM shows no tray notification in foreground). */
  onForegroundMessage?: (message: { title?: string; body?: string; data?: Record<string, string> }) => void;
}

/**
 * Wire up foreground + tap handlers and token-refresh re-registration.
 * Returns an unsubscribe function. No-ops (returns a noop) when the native module is absent.
 */
export function initPushNotifications(opts: InitPushOptions): () => void {
  const messaging = getMessaging();
  if (!messaging) return () => {};

  const unsubscribers: Array<() => void> = [];

  // Foreground messages: surface an in-app banner (FCM won't show a system notification here).
  unsubscribers.push(
    messaging().onMessage(async (message: any) => {
      opts.onForegroundMessage?.({
        title: message?.notification?.title,
        body: message?.notification?.body,
        data: message?.data,
      });
    })
  );

  // Rotated token → re-register with the backend.
  unsubscribers.push(
    messaging().onTokenRefresh(async (token: string) => {
      try {
        await apiService.registerDevice(token, currentPlatform(), buildDeviceName());
        console.log('[push] refreshed token re-registered.');
      } catch (error: any) {
        console.warn('[push] token-refresh re-register failed:', error?.message);
      }
    })
  );

  // Tapped while the app was backgrounded.
  unsubscribers.push(
    messaging().onNotificationOpenedApp((message: any) => {
      if (message?.data) opts.onDeepLink(parseDeepLink(message.data));
    })
  );

  // Tapped while the app was fully quit (delivered once on cold start).
  messaging()
    .getInitialNotification()
    .then((message: any) => {
      if (message?.data) opts.onDeepLink(parseDeepLink(message.data));
    })
    .catch(() => {});

  return () => {
    unsubscribers.forEach((u) => {
      try { u(); } catch { /* ignore */ }
    });
  };
}
