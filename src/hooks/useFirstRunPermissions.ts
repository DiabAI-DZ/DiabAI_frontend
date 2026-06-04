import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCameraPermissions } from 'expo-camera';
import { requestPushPermission } from '../services/pushNotifications';

const FIRST_RUN_KEY = 'permissions.firstRunDone';

/**
 * First-authenticated-session permission flow: prompt once for notifications, then camera, via
 * the native OS dialogs. Guarded by a persisted flag so later logins never re-prompt.
 *
 * `enabled` should become true once the user is authenticated (e.g. `!!profile`). The flow runs a
 * single time per install; if the user denies, we don't nag them again (they can enable later in
 * the OS settings).
 *
 * Notifications go through requestPushPermission (idempotent — it checks the current status first,
 * so this never double-prompts alongside the login-time token registration). Camera uses
 * expo-camera's permission hook, the same one ScanFlow relies on.
 */
export function useFirstRunPermissions(enabled: boolean): void {
  const [, requestCameraPermission] = useCameraPermissions();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const done = await AsyncStorage.getItem(FIRST_RUN_KEY);
        if (done === 'true') return;

        // 1) Notifications — native dialog (also lets the FCM token register if granted).
        await requestPushPermission();
        // 2) Camera — native dialog (sequential, so the two prompts don't overlap).
        await requestCameraPermission();

        await AsyncStorage.setItem(FIRST_RUN_KEY, 'true');
      } catch {
        // Best-effort: never block the app on the permission flow.
      }
    })();
  }, [enabled, requestCameraPermission]);
}
