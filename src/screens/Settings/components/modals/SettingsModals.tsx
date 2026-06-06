import React from 'react';
import { Text } from 'react-native';
import { Sun, Moon, Monitor } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import type { UserProfile } from '../../../../services/types';
import {
  ChangePlanContent,
  PaymentHistoryContent,
  BillingMethodContent,
} from '../subscription';
import { CenterPopup } from '../CenterPopup';
import { SelectModal } from './SelectModal';
import { RangeModal } from './RangeModal';
import { DemographicsModal } from './DemographicsModal';
import { PasswordModal } from './PasswordModal';
import {
  DIABETES_TYPES, THEME_OPTIONS, UNIT_OPTIONS, LANGUAGE_OPTIONS, TEXT_SIZE_OPTIONS, textSizePreview,
} from '../../settingsOptions';
import type { ModalKey, SettingsModalsState } from '../../hooks/useSettingsModals';
import type { UseSettingsPrefsResult } from '../../hooks/useSettingsPrefs';
import type { UsePasswordChangeResult } from '../../hooks/usePasswordChange';
import type { UseDemographicsResult } from '../../hooks/useDemographics';

const THEME_LABEL_FOR: Record<string, string> = { 'Light Mode': 'Light', 'Dark Mode': 'Dark', 'System Default': 'System' };

interface SettingsModalsProps {
  modals: SettingsModalsState;
  profile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void> | void;
  prefs: UseSettingsPrefsResult;
  password: UsePasswordChangeResult;
  demographics: UseDemographicsResult;
  reloadBilling: () => void;
}

export const SettingsModals: React.FC<SettingsModalsProps> = ({
  modals, profile, updateProfile, prefs, password, demographics, reloadBilling,
}) => {
  const { C } = useTheme();
  const { open, closeModal } = modals;
  const close = (k: ModalKey) => () => closeModal(k);
  const themeIcons = [<Sun size={17} color={C.redMuted} />, <Moon size={17} color={C.redMuted} />, <Monitor size={17} color={C.redMuted} />];
  const themeOpts = THEME_OPTIONS.map((o, i) => ({ label: o.label, icon: themeIcons[i] }));
  const textSizeOpts = TEXT_SIZE_OPTIONS.map((o) => ({
    label: o.label,
    subtitle: o.sub,
    icon: <Text style={{ fontSize: textSizePreview(o.label), fontWeight: '700', color: C.redMuted }}>Aa</Text>,
  }));

  const onPick = (k: ModalKey, fn: (label: string) => void) => (label: string) => { fn(label); closeModal(k); };

  return (
    <>
      <SelectModal
        open={open.diabetes} onClose={close('diabetes')} title="Select Diabetes Type"
        options={DIABETES_TYPES.map((t) => ({ label: t.label, subtitle: t.sub }))}
        isSelected={(l) => profile?.diabetesType === l}
        onSelect={onPick('diabetes', (l) => updateProfile({ diabetesType: l as UserProfile['diabetesType'] }))}
      />
      <SelectModal
        open={open.theme} onClose={close('theme')} title="Select App Theme"
        options={themeOpts}
        isSelected={(l) => prefs.currentThemeLabel === THEME_LABEL_FOR[l]}
        onSelect={onPick('theme', prefs.selectTheme)}
      />
      <SelectModal
        open={open.units} onClose={close('units')} title="Glucose Units"
        options={UNIT_OPTIONS.map((u) => ({ label: u.label, subtitle: u.sub }))}
        isSelected={(l) => profile?.glucoseUnit === l}
        onSelect={onPick('units', (l) => updateProfile({ glucoseUnit: l as UserProfile['glucoseUnit'] }))}
      />
      <RangeModal
        open={open.range} onClose={close('range')}
        targetMin={prefs.targetMin} targetMax={prefs.targetMax} onChange={prefs.setRange}
        onConfirm={() => { prefs.saveGoals(); closeModal('range'); }}
      />
      <SelectModal
        open={open.lang} onClose={close('lang')} title="Language"
        options={LANGUAGE_OPTIONS.map((l) => ({ label: l.label, subtitle: l.sub }))}
        isSelected={(l) => prefs.language === l}
        onSelect={onPick('lang', prefs.setLanguage)}
      />
      <SelectModal
        open={open.textSize} onClose={close('textSize')} title="Text Size"
        options={textSizeOpts}
        isSelected={(l) => prefs.textSize === l}
        onSelect={onPick('textSize', prefs.setTextSize)}
      />

      <CenterPopup open={open.plan} onClose={() => { closeModal('plan'); reloadBilling(); }} title="Choose Your Plan">
        {open.plan && <ChangePlanContent onClose={() => { closeModal('plan'); reloadBilling(); }} />}
      </CenterPopup>
      <CenterPopup open={open.history} onClose={close('history')} title="Payment History">
        {open.history && <PaymentHistoryContent />}
      </CenterPopup>
      <CenterPopup open={open.billing} onClose={() => { closeModal('billing'); reloadBilling(); }} title="Billing Method">
        {open.billing && <BillingMethodContent onClose={() => { closeModal('billing'); reloadBilling(); }} />}
      </CenterPopup>

      <DemographicsModal open={open.demographics} onClose={close('demographics')} demographics={demographics} />
      <PasswordModal open={open.password} onClose={close('password')} password={password} />
    </>
  );
};
