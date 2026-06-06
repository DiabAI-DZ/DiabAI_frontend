import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { authApi } from '../../../services/authApi';
import { apiErrorMessage } from '../settingsErrors';

export interface PasswordForm { current: string; next: string; confirm: string; }

const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&.])[A-Za-z\d@$!%?&.]{8,}$/;
const EMPTY: PasswordForm = { current: '', next: '', confirm: '' };

export interface UsePasswordChangeResult {
  form: PasswordForm;
  setField: (key: keyof PasswordForm, value: string) => void;
  saving: boolean;
  error: string | null;
  reset: () => void;
  save: () => Promise<void>;
}

/** Owns the change-password modal form + validation + authApi call. */
export function usePasswordChange(onSuccess: () => void): UsePasswordChangeResult {
  const [form, setForm] = useState<PasswordForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = useCallback((key: keyof PasswordForm, value: string) => setForm((p) => ({ ...p, [key]: value })), []);
  const reset = useCallback(() => { setForm(EMPTY); setError(null); }, []);

  const save = useCallback(async () => {
    setError(null);
    if (!form.current || !form.next || !form.confirm) { setError('All fields are required.'); return; }
    if (form.next !== form.confirm) { setError('New passwords do not match.'); return; }
    if (!STRONG_PASSWORD.test(form.next)) {
      setError('Must be 8+ chars with upper, lower, a number and a symbol (@$!%?&.).');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(form.current, form.next, form.confirm);
      onSuccess();
      Alert.alert('Success', 'Password changed successfully.');
    } catch (e) {
      setError(apiErrorMessage(e, 'Failed to change password.'));
    } finally {
      setSaving(false);
    }
  }, [form, onSuccess]);

  return { form, setField, saving, error, reset, save };
}
