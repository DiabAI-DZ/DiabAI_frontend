/** Best-effort message from an API error: Laravel 422 `errors` map first, then `message`. */
export function apiErrorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object') {
    const errors = (e as { errors?: Record<string, string[]> }).errors;
    if (errors) {
      const first = Object.values(errors)[0];
      if (first?.[0]) return first[0];
    }
    const message = (e as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
}
