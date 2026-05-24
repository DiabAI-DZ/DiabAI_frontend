# DiabAI Architecture Notes (Mobile Conversion)

This document summarizes the architectural changes, logic corrections, and optimization suggestions made during the conversion of the DiabAI web prototype to a native React Native (Expo) application.

## Architectural Changes

- **Web to Native UI**: All HTML elements (`<div>`, `<button>`, `<span>`) were replaced with native equivalents (`<View>`, `<TouchableOpacity>`, `<Text>`).
- **Styling Overhaul**: CSS/Tailwind classes were converted to a centralized `ThemeContext` using React Native `StyleSheet` and dynamic token mapping for Light/Dark modes.
- **Service Layer**: Introduced a decoupled `/services/api.ts` file to handle data fetching. This completely separates the UI from the data source, making it ready for a live REST/GraphQL backend.
- **State Management**: Implemented a `DataContext` using React Context to handle global application state (logs, loading states, and AI interaction history).
- **Native Camera Integration**: Replaced the web scanner placeholder with a functional `expo-camera` implementation in `ScanFlow.tsx`, including permission handling and mock AI scanning flow.

## Logic Corrections & UI Improvements

- **Navigation Flow**: Added a structured `MainNavigation` component that handles the transition from `SplashScreen` ➔ `Onboarding` ➔ `HomeDashboard` with persistence readiness.
- **Data Persistence Strategy**: The original web logic used scattered `localStorage`. The new architecture is designed to integrate easily with `AsyncStorage` or a secure keychain for sensitive health data.
- **Improved Scoping**: Logic for calculating average glucose and "Time in Range" was centralized in the `DataContext` rather than being recalculated on every screen.
- **AI Simulation**: Enhanced the AI insights interaction to follow a chat-based model, which is more intuitive for mobile users than static "Insights" cards.

## Optimization Suggestions for Gemini Integration

1. **Image Pre-processing**: Before sending glucometer photos to Gemini, implement client-side cropping and contrast enhancement to improve OCR accuracy.
2. **Streaming Responses**: Modify the `getAIInsights` service to support streaming responses (Server-Sent Events) for a more responsive "thinking" feel during long AI completions.
3. **Contextual Memory**: When calling Gemini, include the user's last 24-48 hours of glucose logs as context in the prompt to provide truly personalized medical-grade insights.
4. **Offline Queueing**: Implement a background sync service that queues scans/logs if the user is offline and processes them via the AI once a connection is restored.
5. **Security**: Ensure all biometric and health data sent to the backend is encrypted in transit and at rest, following HIPAA/GDPR health data standards.
