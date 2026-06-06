import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '../../../context/UserContext';
import { useTheme } from '../../../context/ThemeContext';
import { subscriptionService, type SubscriptionResource } from '../../../services/subscriptionService';
import type { SettingBadge } from '../components/SettingRow';

export interface UseBillingSummaryResult {
  defaultCard: string | null;
  planSubtitle: string;
  planBadge: SettingBadge;
  reload: () => void;
}

/** Loads the live subscription + default card for the Payment Settings rows. */
export function useBillingSummary(): UseBillingSummaryResult {
  const { profile } = useUser();
  const { C, colors } = useTheme();
  const [sub, setSub] = useState<SubscriptionResource | null>(null);
  const [defaultCard, setDefaultCard] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!profile?.isPremium) return;
    try {
      const [s, cards] = await Promise.all([
        subscriptionService.getSubscription().catch(() => null),
        subscriptionService.getBillingMethods().catch(() => []),
      ]);
      if (s) setSub(s);
      const def = cards.find((c) => c.is_default) || cards[0];
      setDefaultCard(def ? def.masked_number : null);
    } catch {
      // Non-fatal: rows fall back to profile-based defaults.
    }
  }, [profile?.isPremium]);

  useEffect(() => { reload(); }, [reload]);

  const planSubtitle = useMemo(() => {
    if (sub?.plan_details) {
      const pd = sub.plan_details;
      const interval = pd.interval === 'month' ? 'Monthly' : pd.interval === 'year' ? 'Annual' : '';
      const price = pd.price > 0 ? ` · €${pd.price.toFixed(2)}` : '';
      return `${pd.name}${interval ? ' · ' + interval : ''}${price}`;
    }
    return profile?.isPremium ? 'Premium Plan · Monthly' : 'Basic Free Plan';
  }, [sub, profile?.isPremium]);

  const planBadge = useMemo<SettingBadge>(() => {
    if (sub?.cancel_at_period_end) return { label: 'Ends soon', color: colors.warningText, bg: colors.warningBg };
    if (sub?.status === 'past_due') return { label: 'Past due', color: C.red, bg: C.redBg };
    if (profile?.isPremium) return { label: 'Active', color: colors.success, bg: colors.successBg };
    return { label: 'Upgrade', color: C.red, bg: C.redBg };
  }, [sub, profile?.isPremium, C, colors]);

  return { defaultCard, planSubtitle, planBadge, reload };
}
