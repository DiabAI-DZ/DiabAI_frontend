import React from 'react';
import { CreditCard, Wallet, ArrowUpDown, Receipt } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import type { UserProfile } from '../../../../services/types';
import { SectionCard } from '../SectionCard';
import { SettingRow, type SettingBadge } from '../SettingRow';
import type { ModalKey } from '../../hooks/useSettingsModals';

interface PaymentSectionProps {
  profile: UserProfile | null;
  planSubtitle: string;
  planBadge: SettingBadge;
  defaultCard: string | null;
  openModal: (key: ModalKey) => void;
  onNavigatePayment?: (planId: string) => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({ profile, planSubtitle, planBadge, defaultCard, openModal, onNavigatePayment }) => {
  const { C, colors } = useTheme();
  const ip = { size: 18, color: C.redMuted, strokeWidth: 1.8 };
  const premium = profile?.isPremium;
  return (
    <SectionCard title="Payment Settings" icon={<CreditCard size={11} color={colors.textOnPrimary} />}>
      <SettingRow
        icon={<Wallet {...ip} />}
        label="Current Plan"
        subtitle={planSubtitle}
        badge={planBadge}
        onClick={!premium ? () => onNavigatePayment?.('premium') : undefined}
      />
      {!premium && (
        <SettingRow icon={<ArrowUpDown {...ip} />} label="Upgrade to Premium" subtitle="Get AI Insights & Meal Scanner" onClick={() => onNavigatePayment?.('premium')} />
      )}
      {premium && (
        <>
          <SettingRow icon={<ArrowUpDown {...ip} />} label="Change Plan" subtitle="Upgrade or downgrade your subscription" onClick={() => openModal('plan')} />
          <SettingRow icon={<Receipt {...ip} />} label="Payment History" subtitle="View your past transactions" onClick={() => openModal('history')} />
          <SettingRow icon={<CreditCard {...ip} />} label="Billing Method" subtitle={defaultCard || 'Manage your saved cards'} onClick={() => openModal('billing')} />
        </>
      )}
    </SectionCard>
  );
};
