import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useUser } from '../../../context/UserContext';
import { apiErrorMessage } from '../settingsErrors';

type Sex = 'male' | 'female';
export interface DemoForm { sex: Sex; age: string; weight: string; height: string; }

export interface UseDemographicsResult {
  form: DemoForm;
  setField: (key: keyof DemoForm, value: string) => void;
  saving: boolean;
  reseed: () => void;
  save: () => Promise<void>;
}

/** Owns the demographics modal form, seeded from the profile and saved via updateProfile. */
export function useDemographics(onSuccess: () => void): UseDemographicsResult {
  const { profile, updateProfile } = useUser();
  const seed = useCallback((): DemoForm => ({
    sex: (profile?.sex as Sex) || 'male',
    age: profile?.age ? String(profile.age) : '',
    weight: profile?.weight ? String(profile.weight) : '',
    height: profile?.height ? String(profile.height) : '',
  }), [profile?.sex, profile?.age, profile?.weight, profile?.height]);

  const [form, setForm] = useState<DemoForm>(seed);
  const [saving, setSaving] = useState(false);

  const setField = useCallback(
    (key: keyof DemoForm, value: string) => setForm((p) => ({ ...p, [key]: value }) as DemoForm),
    [],
  );
  const reseed = useCallback(() => setForm(seed()), [seed]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await updateProfile({
        sex: form.sex,
        age: form.age ? parseInt(form.age, 10) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        height: form.height ? parseInt(form.height, 10) : undefined,
      });
      onSuccess();
    } catch (e) {
      Alert.alert('Could not save', apiErrorMessage(e, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  }, [form, updateProfile, onSuccess]);

  return { form, setField, saving, reseed, save };
}
