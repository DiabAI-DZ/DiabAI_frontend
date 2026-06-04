import React from 'react';
// Ensure Firebase is initialized.
try {
  const firebase = require('@react-native-firebase/app').default;
  if (firebase && !firebase.apps.length) {
    firebase.initializeApp({
      apiKey: "AIzaSyAN7F_RyLeb7puBnon97qlHK9_ev-YfxcQ",
      appId: "1:681286713860:android:e71b3f7909d54ea8a8eb51",
      projectId: "diabai-c2fb6",
      messagingSenderId: "681286713860",
      storageBucket: "diabai-c2fb6.firebasestorage.app"
    });
    console.log('[Firebase] Manual initialization successful (App.tsx)');
  }
} catch (e) {
  console.warn('[Firebase] Initialization error (App.tsx):', e);
}

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { UserProvider } from './src/context/UserContext';
import { DataProvider } from './src/context/DataContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainNavigation from './src/screens/MainNavigation';

export default function App() {
  // NOTE: The custom "Enable device alerts" pre-permission modal was removed. Push permission is
  // now requested via the standard OS dialog directly (pushNotifications.requestPushPermission
  // proceeds without a prompt handler), so no in-app overlay appears on Home/after login.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <UserProvider>
            <DataProvider>
              <MainNavigation />
              <StatusBar style="auto" />
            </DataProvider>
          </UserProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
