import React from 'react';
import { Palette, Globe, Sun, Type } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { SectionCard } from '../SectionCard';
import { SettingRow } from '../SettingRow';
import type { ModalKey } from '../../hooks/useSettingsModals';

interface AppPreferencesSectionProps {
  language: string;
  textSize: string;
  currentThemeLabel: string;
  openModal: (key: ModalKey) => void;
}

export const AppPreferencesSection: React.FC<AppPreferencesSectionProps> = ({ language, textSize, currentThemeLabel, openModal }) => {
  const { C, colors } = useTheme();
  const ip = { size: 18, color: C.redMuted, strokeWidth: 1.8 };
  return (
    <SectionCard title="App Preferences" icon={<Palette size={11} color={colors.textOnPrimary} />}>
      <SettingRow icon={<Globe {...ip} />} label="Language" value={language} onClick={() => openModal('lang')} />
      <SettingRow icon={<Sun {...ip} />} label="Theme" value={currentThemeLabel} onClick={() => openModal('theme')} />
      <SettingRow icon={<Type {...ip} />} label="Text Size" value={textSize} onClick={() => openModal('textSize')} />
    </SectionCard>
  );
};
