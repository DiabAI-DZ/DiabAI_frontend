import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import type { UserProfile } from '../../../services/types';
import type { ModalKey } from '../hooks/useSettingsModals';
import type { UseSettingsPrefsResult } from '../hooks/useSettingsPrefs';
import type { SettingBadge } from './SettingRow';
import { AccountSection } from './sections/AccountSection';
import { HealthSection } from './sections/HealthSection';
import { DataReportsSection } from './sections/DataReportsSection';
import { NotificationsSection } from './sections/NotificationsSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { AppPreferencesSection } from './sections/AppPreferencesSection';
import { PaymentSection } from './sections/PaymentSection';
import { LegalSupportSection } from './sections/LegalSupportSection';

interface SettingsBodyProps {
  profile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void> | void;
  prefs: UseSettingsPrefsResult;
  billing: { planSubtitle: string; planBadge: SettingBadge; defaultCard: string | null };
  apiBaseUrl: string;
  openModal: (key: ModalKey) => void;
  actions: {
    onProfile?: () => void;
    onChangePassword: () => void;
    onDemographics: () => void;
    onSignOut: () => void;
    onNavigatePayment?: (planId: string) => void;
  };
}

export const SettingsBody: React.FC<SettingsBodyProps> = ({ profile, updateProfile, prefs, billing, apiBaseUrl, openModal, actions }) => {
  const { C } = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <AccountSection profile={profile} onProfile={actions.onProfile} onChangePassword={actions.onChangePassword} onSignOut={actions.onSignOut} />
      <HealthSection profile={profile} targetMin={prefs.targetMin} targetMax={prefs.targetMax} openModal={openModal} onDemographics={actions.onDemographics} />
      <DataReportsSection apiBaseUrl={apiBaseUrl} />
      <NotificationsSection profile={profile} updateProfile={updateProfile} />
      <AppearanceSection />
      <AppPreferencesSection language={prefs.language} textSize={prefs.textSize} currentThemeLabel={prefs.currentThemeLabel} openModal={openModal} />
      <PaymentSection profile={profile} planSubtitle={billing.planSubtitle} planBadge={billing.planBadge} defaultCard={billing.defaultCard} openModal={openModal} onNavigatePayment={actions.onNavigatePayment} />
      <LegalSupportSection />
      <Text style={[styles.version, { color: C.textSm }]}>DiabAI Native v1.1.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: 60 },
  version: { textAlign: 'center', fontSize: 11, fontWeight: '600', marginTop: spacing.lg, marginBottom: spacing.sm },
});
