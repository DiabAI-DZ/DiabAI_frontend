import { useCallback, useState } from 'react';
import { authApi } from '../../../services/authApi';
import { EMAIL_REGEX, extractErrorMessage, validatePassword } from '../authValidation';

interface UseResetPasswordResult {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  otp: string;
  setOtp: (v: string) => void;
  error: string | null;
  success: string | null;
  loading: boolean;
  submit: () => Promise<void>;
}

/** Reset-password form: validates email/OTP/password rules and submits the reset. */
export function useResetPassword(initialEmail: string, onSuccess: () => void): UseResetPasswordResult {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = useCallback(async () => {
    const trimmedEmail = email.trim();
    const trimmedOtp = otp.trim();

    if (!trimmedEmail || !trimmedOtp || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (trimmedOtp.length !== 6) {
      setError('OTP must be 6 digits.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
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
      await authApi.resetPassword(trimmedEmail, trimmedOtp, password, confirmPassword);
      setSuccess('Password reset successful. Please sign in again.');
      setTimeout(() => onSuccess(), 1500);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [email, otp, password, confirmPassword, onSuccess]);

  return {
    email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, otp, setOtp,
    error, success, loading, submit,
  };
}
