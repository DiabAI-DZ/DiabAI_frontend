import type { PlanKey } from '../../services/subscriptionService';

export interface PlanType {
  id: string;
  label: string;
  price: string;
  amount: number;
  period: string;
  sub: string;
  features: string[];
  highlight: boolean;
}

export const PLANS: PlanType[] = [
  {
    id: 'free',
    label: 'Free',
    price: 'Free',
    amount: 0,
    period: '',
    sub: 'Basic glucose tracking · Limited history',
    features: ['Basic glucose tracking', '7-day history', 'Manual entry only'],
    highlight: false,
  },
  {
    id: 'premium',
    label: 'Premium',
    price: '€4.99',
    amount: 4.99,
    period: '/month',
    sub: 'Full AI insights · Unlimited history · Doctor sharing',
    features: ['Full AI insights', 'Unlimited history', 'Doctor sharing', 'Smart scan'],
    highlight: true,
  },
  {
    id: 'annual',
    label: 'Annual Premium',
    price: '€41.99',
    amount: 41.99,
    period: '/year',
    sub: 'Everything in Premium · Save 30%',
    features: ['All Premium features', '30% savings', 'Priority support'],
    highlight: false,
  },
];

const PLAN_MAP: Record<string, PlanKey> = {
  free: 'free',
  premium: 'premium_monthly',
  annual: 'premium_annual',
};

export const backendPlanFor = (id: string): PlanKey => PLAN_MAP[id] || 'premium_monthly';

// Fixed brand-identity values for the checkout gradient / disabled state — intentionally NOT
// theme palette tokens (the dark-red checkout hero stays constant). Kept in one place.
export const CHECKOUT_PRIMARY_DARK = '#6E0000';
export const CHECKOUT_PRIMARY_DISABLED = 'rgba(139,0,0,0.40)';
