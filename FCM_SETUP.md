# Push Notifications (FCM) — Setup & Activation

The **client code is fully implemented** (token registration, refresh, logout cleanup,
foreground/background/quit handlers, deep-linking, in-app banner). But push is a **native**
feature: it does nothing until you (1) install the native packages, (2) add the Firebase
client config files from project **`diabai-c2fb6`**, and (3) make a new dev build. Everything
below is the manual, environment-specific part the code can't do for you.

Until these steps are done, the app runs normally — all push entry points self-guard and no-op
(you'll see `[push] @react-native-firebase/messaging unavailable — push disabled in this build.`).

---

## 1. Install the native packages

```bash
npx expo install @react-native-firebase/app @react-native-firebase/messaging expo-build-properties
```

(Using `expo install` picks versions compatible with Expo SDK 54 / RN 0.81.)

`app.json` is already configured with the plugins and iOS `useFrameworks: static`:

```jsonc
"plugins": [
  "expo-router",
  "react-native-fast-tflite",
  "@react-native-firebase/app",
  "@react-native-firebase/messaging",
  ["expo-build-properties", { "ios": { "useFrameworks": "static" } }]
]
```

## 2. Add the Firebase CLIENT config files (project `diabai-c2fb6`)

The backend repo only has the **server** service-account key — that is NOT what the app needs.
From the **Firebase console → project `diabai-c2fb6` → Project settings → Your apps**:

- **Android app** with package name **`com.anonymous.DiabAI_Native`** → download
  `google-services.json` → place it at the **project root** (`./google-services.json`).
- **iOS app** with bundle id **`com.anonymous.DiabAI_Native`** → download
  `GoogleService-Info.plist` → place it at the **project root** (`./GoogleService-Info.plist`).

If those apps don't exist in the console yet, click **Add app**, register them with the exact
package/bundle id above (must match `app.json`), then download.

`app.json` already points at these paths:

```jsonc
"ios":     { "bundleIdentifier": "com.anonymous.DiabAI_Native", "googleServicesFile": "./GoogleService-Info.plist" },
"android": { "package": "com.anonymous.DiabAI_Native",          "googleServicesFile": "./google-services.json" }
```

> Don't commit these files if the repo is public — add them to `.gitignore`.

## 3. Rebuild the dev client (required — not Expo Go)

```bash
npx expo prebuild --clean      # regenerate native projects with the Firebase plugins
npx expo run:android           # or: npx expo run:ios
```

RNFirebase **cannot** run in Expo Go. You need the custom dev build produced above (the project
already uses `expo-dev-client`).

## 4. Backend networking (device can't reach `localhost`)

### 4.1 Base URL + common port mismatch (fix for “Cannot reach server”)

The client builds `AUTH_BASE_URL` from your Expo `hostUri`:
[`src/services/authApi.ts`](src/services/authApi.ts) via `Constants.expoConfig.hostUri`.

**Important:** your current `DiabAI_frontend/app.json` has an example `hostUri` like:
`http://192.168.1.13:19000`

But the Laravel backend API is exposed on **`:8000`** (per your Docker Compose / backend docs).
If the port doesn’t match, you’ll see client errors like:
**“Cannot reach server / Network request failed / check API base URL”**.

✅ Fix:
- Update `DiabAI_frontend/app.json` to use the backend port:
  - `hostUri: "http://<your-computer-ip>:8000"`
- Rebuild/run the dev client so `Constants.expoConfig.hostUri` reflects the new value.

### 4.2 Emulator vs device mapping

- **Android Emulator:** the default mapping is `http://10.0.2.2:8000`
- **iOS Simulator:** `http://localhost:8000`
- **Physical device (Expo dev build):** must use your computer’s LAN IP + `:8000` (same Wi‑Fi)

You can also override the base URL at runtime via Settings (it calls `setApiBaseUrl`), which helps if your network/IP changes.

### 4.3 Optional workaround: adb reverse (Android)

If you prefer to keep `localhost`, run:
- `adb reverse tcp:8000 tcp:8000`

Then `localhost:8000` on the device emulator will forward to the host machine.


---

## What the client does (already implemented)

| Concern | Where |
|---|---|
| Permission (incl. Android 13 `POST_NOTIFICATIONS`), get token, `POST /api/devices` | `src/services/pushNotifications.ts` → `registerDeviceToken()` |
| Re-register on login + cold start (already authenticated) | `src/context/UserContext.tsx` |
| Token refresh → re-register | `pushNotifications.ts` → `onTokenRefresh` in `initPushNotifications()` |
| Logout → `DELETE /api/devices/{token}` then `deleteToken()` (before clearing JWT) | `UserContext.signOut()` → `unregisterDeviceToken()` |
| Foreground message → in-app banner | `MainNavigation.tsx` (`onForegroundMessage`) |
| Background/quit tap → deep-link | `MainNavigation.tsx` (`onNotificationOpenedApp` + `getInitialNotification`) |
| Top-level background handler | `index.ts` (`setBackgroundMessageHandler`) |
| Deep-link to the right entry via `related_*_id`, mark read | `MainNavigation.handlePushDeepLink` + `apiService.fetchEntryByRef` |
| Unread badge count (403-safe for free users) | `apiService.fetchUnreadNotificationCount()` |

## Verifying the acceptance criteria

1. **Token row appears** — log in on the dev build; check the backend `device_tokens` table.
   Watch for `[push] device token registered with backend.` in the logs.
2. **Receive in all 3 states** — trigger a backend push (log + analyze a measurement/meal/
   injection/activity). Foreground → in-app banner; background/quit → system tray notification.
3. **Tap deep-links** — tapping opens the referenced entry's DetailScreen (falls back to the
   notifications list if the entry can't be loaded).
4. **Logout removes token** — sign out; the `device_tokens` row is deleted and pushes stop.
   Watch for `[push] device token unregistered.`.

## Notes / caveats

- **`fetchEntryByRef` is best-effort.** It calls `/api/{measurements|meals|injections|activities}/{id}`
  and normalises the row (forces `entry_type`, coalesces the timestamp field) before reusing the
  logbook row mapper. If a per-resource show endpoint's shape differs from what `mapLogRow`
  expects, the deep-link falls back to the notifications list instead of opening a broken screen.
  Confirm those endpoints' response shapes against the backend and adjust `mapLogRow`/normalisation
  if needed.
- **Could not be run/verified here** — no device, no Firebase config files, native module not
  installed. The above is the checklist to validate it on a real dev build.
