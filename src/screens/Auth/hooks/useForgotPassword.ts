import { useCallback, useState } from 'react';
import { authApi } from '../../../services/authApi';
import { EMAIL_REGEX, extractErrorMessage } from '../authValidation';

interface UseForgotPasswordResult {
  email: string;
  setEmail: (v: string) => void;
  error: string | null;
  success: string | null;
  loading: boolean;
  submit: () => Promise<void>;
}

/** Forgot-password form: validates the email and requests a reset OTP. */
export function useForgotPassword(onOtpSent: (email: string) => void): UseForgotPasswordResult {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await authApi.sendResetOtp(trimmedEmail);
      setSuccess('OTP sent. Check your email or Mailpit inbox.');
      setTimeout(() => onOtpSent(trimmedEmail), 1500);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [email, onOtpSent]);

  return { email, setEmail, error, success, loading, submit };
}
