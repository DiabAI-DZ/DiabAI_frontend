import React from 'react';
import { BellRing, Bell, AlertTriangle, Clock } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import type { UserProfile } from '../../../../services/types';
import { SectionCard } from '../SectionCard';
import { SettingRow } from '../SettingRow';

interface NotificationsSectionProps {
  profile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void> | void;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({ profile, updateProfile }) => {
  const { C, colors } = useTheme();
  const ip = { size: 18, color: C.redMuted, strokeWidth: 1.8 };
  const glucose = profile?.glucoseAlertsEnabled ?? true;
  const hypo = profile?.hypoAlertsEnabled ?? true;
  const reminders = profile?.remindersEnabled ?? false;
  return (
    <SectionCard title="Notifications" icon={<BellRing size={11} color={colors.textOnPrimary} />}>
      <SettingRow icon={<Bell {...ip} />} label="Glucose Alerts" subtitle="Alert when out of range" toggle toggleValue={glucose} onToggle={() => updateProfile({ glucoseAlertsEnabled: !glucose })} />
      <SettingRow icon={<AlertTriangle {...ip} />} label="Hypoglycemia Alerts" subtitle="Critical low warnings" toggle toggleValue={hypo} onToggle={() => updateProfile({ hypoAlertsEnabled: !hypo })} />
      <SettingRow icon={<Clock {...ip} />} label="Reminders" subtitle="Measurement reminders" toggle toggleValue={reminders} onToggle={() => updateProfile({ remindersEnabled: !reminders })} />
    </SectionCard>
  );
};
