import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../../context/UserContext';

const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

interface UseSignInResult {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  rememberMe: boolean;
  toggleRememberMe: () => void;
  error: string | null;
  loading: boolean;
  submit: () => Promise<void>;
}

/** Sign-in form state + submit, including the "remember email" preference. */
export function useSignIn(onSuccess: () => void): UseSignInResult {
  const { signIn } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(REMEMBERED_EMAIL_KEY)
      .then((saved) => {
        if (!cancelled && saved) {
          setEmail(saved);
          setRememberMe(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleRememberMe = useCallback(() => setRememberMe((prev) => !prev), []);

  const submit = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(trimmedEmail, password);
      if (rememberMe) await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, trimmedEmail);
      else await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [email, password, rememberMe, signIn, onSuccess]);

  return { email, setEmail, password, setPassword, rememberMe, toggleRememberMe, error, loading, submit };
}
