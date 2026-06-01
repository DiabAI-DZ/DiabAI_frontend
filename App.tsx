import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { UserProvider } from './src/context/UserContext';
import { DataProvider } from './src/context/DataContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainNavigation from './src/screens/MainNavigation';

export default function App() {
  React.useEffect(() => {
    // Notifications temporarily disabled for stability
  }, []);

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
