import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Linking, Modal } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { UserProvider } from './src/context/UserContext';
import { DataProvider } from './src/context/DataContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { setPermissionPromptHandler } from './src/services/pushNotifications';
import NotificationPermissionModal from './src/components/NotificationPermissionModal';
import MainNavigation from './src/screens/MainNavigation';
import PremiumOverlay from './src/screens/PremiumOverlay';
import { onPremiumRequired, emitNavigate } from './src/services/uiEvents';

export default function App() {
  const [permissionVisible, setPermissionVisible] = useState(false);
  const [permissionPhase, setPermissionPhase] = useState<'pre-permission' | 'blocked'>('pre-permission');
  const [permissionResolver, setPermissionResolver] = useState<((allowed: boolean) => void) | null>(null);

  useEffect(() => {
    setPermissionPromptHandler((phase) => {
      setPermissionPhase(phase);
      setPermissionVisible(true);

      return new Promise<boolean>((resolve) => {
        setPermissionResolver(() => resolve);
      });
    });

    return () => {
      setPermissionPromptHandler(null);
    };
  }, []);

  const handleAllow = () => {
    permissionResolver?.(true);
    setPermissionResolver(null);
    setPermissionVisible(false);
  };

  const handleCancel = () => {
    permissionResolver?.(false);
    setPermissionResolver(null);
    setPermissionVisible(false);
  };

  const handleOpenSettings = () => {
    permissionResolver?.(false);
    setPermissionResolver(null);
    setPermissionVisible(false);
    void Linking.openSettings();
  };

  const [premiumVisible, setPremiumVisible] = useState(false);

  useEffect(() => {
    const unsub = onPremiumRequired(() => {
      setPremiumVisible(true);
    });
    return () => { if (unsub) unsub(); };
  }, []);

  const handleUpgrade = () => {
    // Close overlay and navigate to Account -> Payment
    setPremiumVisible(false);
    // Ask MainNavigation to navigate to accountSettings
    emitNavigate('accountSettings');
  };

  const handleDismissPremium = () => setPremiumVisible(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <UserProvider>
            <DataProvider>
              <MainNavigation />
              <NotificationPermissionModal
                visible={permissionVisible}
                phase={permissionPhase}
                onAllow={handleAllow}
                onCancel={handleCancel}
                onOpenSettings={handleOpenSettings}
              />
              <Modal
                visible={premiumVisible}
                transparent
                animationType="fade"
                onRequestClose={handleDismissPremium}
              >
                <PremiumOverlay
                  onUpgrade={handleUpgrade}
                  onDismiss={handleDismissPremium}
                >
                  <></>
                </PremiumOverlay>
              </Modal>
              <StatusBar style="auto" />
            </DataProvider>
          </UserProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
