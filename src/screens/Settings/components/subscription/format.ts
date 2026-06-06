/** Shared formatters for the subscription/billing popups. */

export const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const intervalShort = (interval: string | null): string => {
  if (interval === 'month') return '/mo';
  if (interval === 'year') return '/yr';
  return '';
};

export const formatPlanPrice = (price: number, interval: string | null): string => {
  if (!price || price <= 0) return 'Free';
  return `€${price.toFixed(2)}${intervalShort(interval)}`;
};

/** Best-effort message from a subscription API error. */
export const subErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error ? err.message : fallback;
