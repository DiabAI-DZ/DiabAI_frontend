import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { spacing } from '../../theme/spacing';
import { SettingsBody } from './components/SettingsBody';
import { SettingsModals } from './components/modals/SettingsModals';
import { useSettingsModals } from './hooks/useSettingsModals';
import { useSettingsPrefs } from './hooks/useSettingsPrefs';
import { useBillingSummary } from './hooks/useBillingSummary';
import { usePasswordChange } from './hooks/usePasswordChange';
import { useDemographics } from './hooks/useDemographics';

interface SettingsScreenProps {
  onNavigateAccountSettings?: () => void;
  onNavigatePayment?: (planId: string) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigateAccountSettings, onNavigatePayment }) => {
  const { C } = useTheme();
  const { profile, updateProfile, signOut, apiBaseUrl } = useUser();

  const modals = useSettingsModals();
  const prefs = useSettingsPrefs();
  const billing = useBillingSummary();
  const password = usePasswordChange(() => modals.closeModal('password'));
  const demographics = useDemographics(() => modals.closeModal('demographics'));

  const onChangePassword = useCallback(() => { password.reset(); modals.openModal('password'); }, [password, modals]);
  const onDemographics = useCallback(() => { demographics.reseed(); modals.openModal('demographics'); }, [demographics, modals]);

  const onSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { signOut(); } },
    ]);
  }, [signOut]);

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <View style={[styles.headerStrip, { backgroundColor: C.white, borderBottomColor: C.redBorder }]}>
        <Text style={[styles.headerTitle, { color: C.textDark }]}>Settings</Text>
        <Text style={[styles.headerSubtitle, { color: C.textSm }]}>Manage your account and health preferences</Text>
      </View>

      <SettingsBody
        profile={profile}
        updateProfile={updateProfile}
        prefs={prefs}
        billing={billing}
        apiBaseUrl={apiBaseUrl}
        openModal={modals.openModal}
        actions={{ onProfile: onNavigateAccountSettings, onChangePassword, onDemographics, onSignOut, onNavigatePayment }}
      />

      <SettingsModals
        modals={modals}
        profile={profile}
        updateProfile={updateProfile}
        prefs={prefs}
        password={password}
        demographics={demographics}
        reloadBilling={billing.reload}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerStrip: { paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
});

export default SettingsScreen;
