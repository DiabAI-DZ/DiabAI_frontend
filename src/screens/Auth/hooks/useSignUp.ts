import { useCallback, useState } from 'react';
import { useUser } from '../../../context/UserContext';
import { EMAIL_REGEX, extractErrorMessage, validatePassword } from '../authValidation';

interface UseSignUpResult {
  fullName: string;
  setFullName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string | null;
  success: string | null;
  loading: boolean;
  submit: () => Promise<void>;
}

/** Sign-up form state, client-side validation, and submit. */
export function useSignUp(onSuccess: () => void): UseSignUpResult {
  const { signUp } = useUser();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = useCallback(async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setError('All fields are required.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await signUp(trimmedName, trimmedEmail, password);
      setSuccess('Account created successfully. Redirecting...');
      setTimeout(() => onSuccess(), 1500);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [fullName, email, password, signUp, onSuccess]);

  return { fullName, setFullName, email, setEmail, password, setPassword, error, success, loading, submit };
}
