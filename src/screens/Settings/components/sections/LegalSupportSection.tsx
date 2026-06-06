import React from 'react';
import { Shield, FileText, HelpCircle, Info } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { SectionCard } from '../SectionCard';
import { SettingRow } from '../SettingRow';

export const LegalSupportSection: React.FC = () => {
  const { C, colors } = useTheme();
  const ip = { size: 18, color: C.redMuted, strokeWidth: 1.8 };
  return (
    <SectionCard title="Legal & Support" icon={<Shield size={11} color={colors.textOnPrimary} />}>
      <SettingRow icon={<FileText {...ip} />} label="Terms & Privacy Policy" />
      <SettingRow icon={<HelpCircle {...ip} />} label="Contact & Support" />
      <SettingRow icon={<Info {...ip} />} label="About App" />
    </SectionCard>
  );
};
