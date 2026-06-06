import React from 'react';
import { Heart, Syringe, Target, Ruler, User } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import type { UserProfile } from '../../../../services/types';
import { SectionCard } from '../SectionCard';
import { SettingRow } from '../SettingRow';
import type { ModalKey } from '../../hooks/useSettingsModals';

interface HealthSectionProps {
  profile: UserProfile | null;
  targetMin: number;
  targetMax: number;
  openModal: (key: ModalKey) => void;
  onDemographics: () => void;
}

const demographicsValue = (profile: UserProfile | null): string | undefined => {
  if (!(profile?.age || profile?.weight || profile?.height || profile?.sex)) return undefined;
  const sex = profile?.sex ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : '';
  const age = profile?.age ? `, ${profile.age} yrs` : '';
  return `${sex}${age}`.replace(/^,\s*/, '');
};

export const HealthSection: React.FC<HealthSectionProps> = ({ profile, targetMin, targetMax, openModal, onDemographics }) => {
  const { C, colors } = useTheme();
  const ip = { size: 18, color: C.redMuted, strokeWidth: 1.8 };
  return (
    <SectionCard title="Health Settings" icon={<Heart size={11} color={colors.textOnPrimary} />}>
      <SettingRow icon={<Syringe {...ip} />} label="Diabetes Type" value={profile?.diabetesType || 'Type 2'} onClick={() => openModal('diabetes')} />
      <SettingRow icon={<Target {...ip} />} label="Target Glucose Range" value={`${targetMin}–${targetMax} mg/dL`} onClick={() => openModal('range')} />
      <SettingRow icon={<Ruler {...ip} />} label="Units" value={profile?.glucoseUnit || 'mg/dL'} onClick={() => openModal('units')} />
      <SettingRow icon={<User {...ip} />} label="Demographics" subtitle="Age, sex, weight & height" value={demographicsValue(profile)} onClick={onDemographics} />
    </SectionCard>
  );
};
