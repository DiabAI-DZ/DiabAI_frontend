import React from 'react';
import { BarChart3, FileDown, Share2, Cloud } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { SectionCard } from '../SectionCard';
import { SettingRow } from '../SettingRow';

export const DataReportsSection: React.FC<{ apiBaseUrl: string }> = ({ apiBaseUrl }) => {
  const { C, colors } = useTheme();
  const ip = { size: 18, color: C.redMuted, strokeWidth: 1.8 };
  return (
    <SectionCard title="Data & Reports" icon={<BarChart3 size={11} color={colors.textOnPrimary} />}>
      <SettingRow icon={<FileDown {...ip} />} label="Export Health Report" />
      <SettingRow icon={<Share2 {...ip} />} label="Share with Doctor" />
      <SettingRow icon={<Cloud {...ip} />} label="Sync & Backup" subtitle={`Connected: ${apiBaseUrl}`} />
    </SectionCard>
  );
};
