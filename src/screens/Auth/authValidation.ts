// Shared auth form validation + error extraction. No React.

export const EMAIL_REGEX = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&.])[A-Za-z\d@$!%?&.]{8,}$/;

/** Backend (Laravel) validation error envelope, surfaced by the auth layer on a 422. */
export interface ValidationError {
  errors?: Record<string, string[]>;
  message?: string;
}

export const validatePassword = (pass: string): string | null => {
  if (pass.length < 8) return 'Password must be at least 8 characters long.';
  if (!PASSWORD_REGEX.test(pass)) {
    return 'Password must include uppercase, lowercase, a number, and a special character (@$!%?&.).';
  }
  return null;
};

/** Pull a user-facing message from a thrown auth error (Laravel field errors → message → fallback). */
export const extractErrorMessage = (e: unknown, fallback = 'An unexpected error occurred.'): string => {
  const err = e as ValidationError;
  if (err?.errors) {
    const first = Object.values(err.errors)[0];
    return first?.[0] || err.message || fallback;
  }
  return err?.message || fallback;
};
