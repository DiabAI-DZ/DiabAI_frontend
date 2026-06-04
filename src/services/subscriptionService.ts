import { authApi } from './authApi';

/**
 * Typed client for the Laravel /api/subscription billing API.
 *
 * Mirrors apiService's auth conventions (Bearer JWT from authApi, baseUrl from authApi) but is
 * kept in its own module because the billing flow has its own error shape (422 card_error) and
 * its own response envelopes. Currency is always EUR; amounts arrive already in euros.
 *
 * IMPORTANT: raw card numbers NEVER touch this client. Cards are tokenised on-device by the
 * Stripe SDK (confirmSetupIntent) and only the resulting `pm_...` id is sent to our backend.
 */

// ---- Types matching the backend JSON shapes ----

export type PlanKey = 'free' | 'premium_monthly' | 'premium_annual';
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'inactive';
export type PlanInterval = 'month' | 'year' | null;

export interface SetupIntentResponse {
  client_secret: string;
  publishable_key: string;
  currency: string; // "eur"
}

export interface PlanDetails {
  name: string;
  price: number;
  currency: string; // "eur"
  interval: PlanInterval;
  description: string;
}

export interface AvailablePlan {
  key: string;
  name: string;
  description: string;
  price: number;
  currency: string; // "eur"
  interval: string | null;
  is_current: boolean;
}

export interface SubscriptionResource {
  plan: PlanKey;
  status: SubscriptionStatus;
  is_premium: boolean;
  cancel_at_period_end: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  plan_details: PlanDetails;
  available_plans: AvailablePlan[];
}

export interface PaymentMethod {
  id: number | string;
  stripe_payment_method_id: string;
  masked_number: string; // "VISA **** 4242"
  brand: string;
  last_four: string;
  expires_label: string; // "12/27"
  is_default: boolean;
}

export interface BillingMethodResponse {
  payment_methods: PaymentMethod[];
}

export interface PaymentHistoryItem {
  id: number | string;
  description: string;
  amount: number;
  currency: string; // "eur"
  formatted_amount: string;
  status: string;
  status_label: string;
  paid_at: string | null;
}

export interface Paginated<T> {
  data: T[];
  links: Record<string, string | null>;
  meta: Record<string, any>;
}

/**
 * Error carrying the backend's structured 422 payload so the UI can surface a specific
 * card-decline message (`code === 'card_error'`) vs. a generic toast.
 */
export class SubscriptionApiError extends Error {
  code?: string;
  status: number;
  body?: any;
  constructor(message: string, status: number, code?: string, body?: any) {
    super(message);
    this.name = 'SubscriptionApiError';
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

// ---- Request helper (JWT injection + structured error parsing) ----

const request = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; status: number }> => {
  const token = authApi.getToken();
  const url = `${authApi.baseUrl}${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, { ...options, headers });

  // 204 No Content (delete card) — nothing to parse.
  if (response.status === 204) {
    return { data: undefined as unknown as T, status: 204 };
  }

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message =
      json?.message || `Request failed (${response.status}) for ${path}`;
    throw new SubscriptionApiError(message, response.status, json?.code, json);
  }

  return { data: json as T, status: response.status };
};

// Laravel API Resources wrap a single resource in `{ data: {...} }`. Unwrap defensively so we
// accept both the wrapped and the flat shape documented in the spec.
const unwrap = <T>(body: any): T =>
  (body && typeof body === 'object' && 'data' in body ? body.data : body) as T;

export const subscriptionService = {
  // 1. Create a SetupIntent to collect/confirm a card on-device.
  async createSetupIntent(): Promise<SetupIntentResponse> {
    const { data } = await request<SetupIntentResponse>(
      '/api/subscription/setup-intent',
      { method: 'POST' }
    );
    return unwrap<SetupIntentResponse>(data);
  },

  // 2. Start a paid subscription with a tokenised payment method.
  async subscribe(
    plan: Exclude<PlanKey, 'free'>,
    stripePaymentMethodId: string
  ): Promise<SubscriptionResource> {
    const { data } = await request<any>('/api/subscription/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        plan,
        stripe_payment_method_id: stripePaymentMethodId,
      }),
    });
    return unwrap<SubscriptionResource>(data);
  },

  // 3. Current subscription state.
  async getSubscription(): Promise<SubscriptionResource> {
    const { data } = await request<any>('/api/subscription', { method: 'GET' });
    return unwrap<SubscriptionResource>(data);
  },

  // 4. Change plan (free cancels at period end; paid→paid prorates).
  async changePlan(plan: PlanKey): Promise<SubscriptionResource> {
    const { data } = await request<any>('/api/subscription/change-plan', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
    return unwrap<SubscriptionResource>(data);
  },

  // 5. Cancel at period end.
  async cancel(): Promise<SubscriptionResource> {
    const { data } = await request<any>('/api/subscription/cancel', {
      method: 'POST',
    });
    return unwrap<SubscriptionResource>(data);
  },

  // 6. Paginated payment history.
  async getPaymentHistory(perPage = 20): Promise<Paginated<PaymentHistoryItem>> {
    const { data } = await request<Paginated<PaymentHistoryItem>>(
      `/api/subscription/payment-history?per_page=${perPage}`,
      { method: 'GET' }
    );
    return data;
  },

  // 7. Saved cards.
  async getBillingMethods(): Promise<PaymentMethod[]> {
    const { data } = await request<BillingMethodResponse>(
      '/api/subscription/billing-method',
      { method: 'GET' }
    );
    return data?.payment_methods ?? [];
  },

  // 8. Save a tokenised card.
  async addBillingMethod(
    stripePaymentMethodId: string,
    setAsDefault = true
  ): Promise<PaymentMethod> {
    const { data } = await request<any>('/api/subscription/billing-method', {
      method: 'POST',
      body: JSON.stringify({
        stripe_payment_method_id: stripePaymentMethodId,
        set_as_default: setAsDefault,
      }),
    });
    return unwrap<PaymentMethod>(data);
  },

  // 9. Delete a card (422 if deleting the default while a subscription is active).
  async deleteBillingMethod(id: number | string): Promise<void> {
    await request<void>(`/api/subscription/billing-method/${id}`, {
      method: 'DELETE',
    });
  },

  // 10. Make a card the default.
  async setDefaultBillingMethod(id: number | string): Promise<PaymentMethod> {
    const { data } = await request<any>(
      `/api/subscription/billing-method/${id}/default`,
      { method: 'PATCH' }
    );
    return unwrap<PaymentMethod>(data);
  },
};

export default subscriptionService;
