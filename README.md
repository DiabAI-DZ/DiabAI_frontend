# DiabAI — AI-Powered Diabetes Management (Mobile)

DiabAI is a cross-platform (iOS / Android) diabetes companion app built with **Expo** and **React Native**. It lets people with diabetes scan their glucometer and meals with the camera, keep a rich glucose logbook, and get AI-driven insights — glucose forecasts, detected patterns, personalized recommendations, and insulin-need estimates — alongside a conversational health assistant.

> This repository is the **mobile frontend**. It talks to a separate backend API (authentication, logs, AI/ML endpoints, Stripe billing).

---

## ✨ Features

- **📷 Glucometer OCR scanning** — point the camera at a glucometer; the reading is extracted via either an **on-device TFLite** model or a **cloud YOLO + TrOCR** pipeline (switchable in the UI), with Hi/Lo/Err handling and automatic mg/dL ↔ mmol/L detection.
- **🍽️ Meal photo scanning** — recognize meals from a photo, auto-fill calories / carbs / glycemic impact from a local nutrient database, and confirm/correct before logging.
- **📒 Logbook** — server-paginated, filterable feed of measurements, meals, injections, and activities, grouped by day with summary stats.
- **🧠 AI Insights** — glucose prediction forecast, detected patterns, "what you should do" recommendations, estimated insulin need, and an **Ask DiabAI** chat assistant. Uses a stale-while-revalidate cache so the screen renders instantly and revalidates in the background.
- **🔔 Alerts & notifications** — out-of-range and hypoglycemia alerts, with push notifications via **Firebase Cloud Messaging**.
- **💳 Premium subscriptions** — plan management, payment history, and saved cards via **Stripe**.
- **🎨 Theming** — light / dark / system modes with a centralized design-token system.

---

## 🧱 Tech Stack

| Area | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 54, React Native 0.81, React 19 |
| Language | TypeScript 5.9 (strict) |
| Navigation | Custom state-machine navigator (`MainNavigation`) |
| Animation / Gestures | Reanimated, Gesture Handler, Animated + PanResponder |
| Graphics | `react-native-svg`, `expo-linear-gradient` |
| On-device ML | `react-native-fast-tflite`, `react-native-fast-opencv`, ML Kit text recognition |
| Camera / Media | `expo-camera`, `expo-image-picker`, `expo-image-manipulator` |
| Payments | `@stripe/stripe-react-native` |
| Push | `@react-native-firebase/messaging` |
| Storage | `@react-native-async-storage/async-storage` |
| Icons | `lucide-react-native` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js ≥ 20.19.4**
- An iOS Simulator (Xcode) and/or Android Emulator (Android Studio), or a physical device with **Expo Dev Client**
- A running instance of the DiabAI **backend API**

> This app uses native modules (camera, TFLite, OpenCV, Firebase, Stripe), so it requires a **development build** — it does **not** run in Expo Go. Use `expo run:ios` / `expo run:android` or build a dev client with EAS.

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the backend URL & secrets

- **API base URL** — set `extra.apiBaseUrl` in [`app.json`](app.json) (resolution logic lives in [`src/services/apiBaseUrl.ts`](src/services/apiBaseUrl.ts)).
- **Stripe** — provide a publishable key via the `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` environment variable (the backend returns one per setup-intent as well).
- **Firebase** — drop in your own `google-services.json` (Android) and `GoogleService-Info.plist` (iOS).

### 3. Run

```bash
npm run ios       # build & launch on iOS
npm run android   # build & launch on Android
npm start         # start the Metro dev server (for an existing dev client)
npm run web       # run in the browser (limited: native modules degrade gracefully)
```

---

## 📜 Scripts

| Script | Description |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run ios` | Build & run on iOS |
| `npm run android` | Build & run on Android |
| `npm run web` | Run on web |
| `npx tsc --noEmit` | Type-check the whole project (kept at **0 errors**) |

---

## 🏛️ Architecture

The codebase follows a strict **coordinator pattern**, organized by feature.

- **Screens are coordinators** — they wire hooks to components and contain no fetch/business logic or themed `StyleSheet`s (target < 150 lines).
- **Hooks own the logic** — data fetching, form state, pagination, derived view-models (target < 150 lines).
- **Components are presentational** — typed props, theme colors applied inline, geometry in `StyleSheet.create` (target < 200 lines).
- **No file exceeds 300 lines**, no `any` / `@ts-ignore`, and **no hardcoded colors** — everything comes from the theme tokens (with a few documented decorative/brand constants).

### Layered design

```
App.tsx                       Providers: GestureHandler → SafeArea → Theme → User → Data → MainNavigation
└─ src/
   ├─ screens/                One folder per feature (coordinator + hooks/ + components/)
   │  ├─ GlucoVisionHome/     Bottom-tab shell (Home · Insights · Logbook · Settings + scan FAB)
   │  ├─ Home/                Dashboard (latest reading, trend chart, recommendations)
   │  ├─ Insights/            AI dashboard + Ask-DiabAI chat
   │  ├─ Logbook/             Filterable, paginated entry feed
   │  ├─ Scan/                Camera → OCR/meal recognition → confirm flow
   │  ├─ Details/             Per-entry detail screens (measurement / meal / injection / activity)
   │  ├─ Settings/            Settings + account + subscription/billing
   │  ├─ Auth/                Sign in / sign up / forgot / reset password
   │  ├─ Checkout/            Stripe payment / plan selection
   │  ├─ Notifications/       Alerts feed
   │  └─ MainNavigation.tsx   Hand-rolled state-machine router
   ├─ context/                ThemeContext · UserContext · DataContext
   ├─ services/               fetch-based API layer + AI/OCR/subscription/push services
   ├─ theme/                  Design tokens: colors · spacing · typography · borderRadius
   ├─ hooks/                  Generic primitives (useAsync, usePagination)
   ├─ types/                  Shared API & domain types
   └─ components/             Genuinely shared infra only — ui/, layout/, icons/
```

### State & data flow

- **`ThemeContext`** — `colors` (token API) + `C` (legacy palette) + `isDark`, with persistence and system-default detection.
- **`UserContext`** — auth session, profile, sign-in/up/out.
- **`DataContext`** — logs, alerts, selected date, and the log/scan/AI actions.
- **Service layer** ([`src/services/`](src/services/)) — a wrapped `fetch` client (Bearer auth, 401 → session-expired, timeouts). Notable: [`insightsService`](src/services/insightsService.ts) (stale-while-revalidate AI cache), [`tfliteService`](src/services/tfliteService.ts) / [`CVService`](src/services/CVService.ts) (on-device OCR), [`subscriptionService`](src/services/subscriptionService.ts) (Stripe/billing).

---

## 🤝 Contributing

When adding to the codebase, follow the existing conventions:

1. Put feature work in its **own folder** under `src/screens/<Feature>/` with `hooks/` and `components/` subfolders.
2. Keep **screens thin**, **logic in hooks**, **rendering in components**.
3. Use **theme tokens** — no hardcoded colors, spacing, or radii in components.
4. Strict TypeScript — no `any`, every prop has an interface, every API response is typed in `src/types/`.
5. Run `npx tsc --noEmit` before committing — the project is kept at **0 type errors**.

---

## 📄 License

Private / proprietary — © DiabAI. All rights reserved.
