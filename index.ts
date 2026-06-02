import { registerRootComponent } from 'expo';

import App from './App';

// FCM background/quit-state messages must be handled at the JS entry point, before the app
// mounts. Guarded so a missing native module (Expo Go / pre-dev-build) never breaks startup.
// The OS renders the tray notification from the `notification` payload automatically; a tap is
// handled in-app via onNotificationOpenedApp / getInitialNotification (see pushNotifications.ts).
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const messaging = require('@react-native-firebase/messaging').default;
  messaging().setBackgroundMessageHandler(async () => {
    // No extra data-only work needed; presentation + tap routing are handled elsewhere.
  });
} catch {
  // @react-native-firebase/messaging not present in this build yet — ignore.
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
