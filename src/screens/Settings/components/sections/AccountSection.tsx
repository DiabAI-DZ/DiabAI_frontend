import React from 'react';
import { Settings, User, Lock, LogOut } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import type { UserProfile } from '../../../../services/types';
import { SectionCard } from '../SectionCard';
import { SettingRow } from '../SettingRow';

interface AccountSectionProps {
  profile: UserProfile | null;
  onProfile?: () => void;
  onChangePassword: () => void;
  onSignOut: () => void;
}

export const AccountSection: React.FC<AccountSectionProps> = ({ profile, onProfile, onChangePassword, onSignOut }) => {
  const { C, colors } = useTheme();
  const ip = { size: 18, color: C.redMuted, strokeWidth: 1.8 };
  return (
    <SectionCard title="Account Settings" icon={<Settings size={11} color={colors.textOnPrimary} />}>
      <SettingRow icon={<User {...ip} />} label="Profile Information" subtitle={profile?.name || profile?.email} onClick={onProfile} />
      <SettingRow icon={<Lock {...ip} />} label="Change Password" onClick={onChangePassword} />
      <SettingRow icon={<LogOut {...ip} />} label="Sign Out" onClick={onSignOut} />
    </SectionCard>
  );
};
