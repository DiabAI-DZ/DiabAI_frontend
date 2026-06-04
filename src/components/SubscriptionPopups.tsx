import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  StripeProvider,
  CardField,
  useConfirmSetupIntent,
  CardFieldInput,
} from '@stripe/stripe-react-native';
import {
  CreditCard,
  CheckCircle2,
  Plus,
  Trash2,
  AlertTriangle,
  Receipt,
  Check,
  Lock,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import {
  subscriptionService,
  SubscriptionApiError,
  SubscriptionResource,
  PaymentHistoryItem,
  PaymentMethod,
  PlanKey,
} from '../services/subscriptionService';

const ENV_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// ---- Shared helpers ----

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const intervalShort = (interval: string | null): string => {
  if (interval === 'month') return '/mo';
  if (interval === 'year') return '/yr';
  return '';
};

const formatPlanPrice = (price: number, interval: string | null): string => {
  if (!price || price <= 0) return 'Free';
  return `€${price.toFixed(2)}${intervalShort(interval)}`;
};

// Small reusable loading / error / empty state.
const StateBlock: React.FC<{
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
}> = ({ loading, error, empty, emptyText, onRetry }) => {
  const { C } = useTheme();
  if (loading) {
    return (
      <View style={styles.stateBlock}>
        <ActivityIndicator color={C.red} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.stateBlock}>
        <AlertTriangle size={24} color={C.red} />
        <Text style={[styles.stateText, { color: C.text }]}>{error}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={[styles.retryBtn, { borderColor: C.red }]}>
            <Text style={[styles.retryText, { color: C.red }]}>Try again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.stateBlock}>
        <Text style={[styles.stateText, { color: C.textSm }]}>{emptyText || 'Nothing here yet.'}</Text>
      </View>
    );
  }
  return null;
};

/* ───────────────────────── Choose Your Plan ───────────────────────── */

export const ChangePlanContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { C, isDark } = useTheme();
  const { refreshProfile } = useUser();

  const [sub, setSub] = useState<SubscriptionResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await subscriptionService.getSubscription();
      setSub(data);
      const current = data.available_plans.find((p) => p.is_current);
      setSelectedKey(current?.key ?? data.plan);
    } catch (err: any) {
      setError(err?.message || 'Could not load plans.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const currentKey = sub?.available_plans.find((p) => p.is_current)?.key ?? sub?.plan;

  const handleConfirm = useCallback(async () => {
    if (!selectedKey || selectedKey === currentKey || processing) return;
    setProcessing(true);
    try {
      await subscriptionService.changePlan(selectedKey as PlanKey);
      await refreshProfile();
      onClose();
    } catch (err: any) {
      const msg =
        err instanceof SubscriptionApiError
          ? err.message
          : err?.message || 'Could not change your plan.';
      Alert.alert('Plan change failed', msg);
    } finally {
      setProcessing(false);
    }
  }, [selectedKey, currentKey, processing, refreshProfile, onClose]);

  if (loading || error) {
    return <StateBlock loading={loading} error={error} onRetry={load} />;
  }

  const plans = sub?.available_plans ?? [];
  const confirmDisabled = !selectedKey || selectedKey === currentKey || processing;

  return (
    <View>
      {plans.map((p) => {
        const selected = p.key === selectedKey;
        const isAnnual = p.key.includes('annual');
        return (
          <TouchableOpacity
            key={p.key}
            activeOpacity={0.85}
            onPress={() => setSelectedKey(p.key)}
            style={[
              styles.planRow,
              {
                backgroundColor: selected ? C.redBg : (isDark ? '#222226' : '#FAFAFA'),
                borderColor: selected ? C.red : C.divider,
              },
            ]}
          >
            <View style={[styles.planIconBox, { backgroundColor: selected ? 'rgba(196,30,38,0.1)' : '#F0EDED' }]}>
              <CreditCard size={16} color={C.red} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.planTitleRow}>
                <Text style={[styles.planName, { color: selected ? C.red : C.text }]}>{p.name}</Text>
                {p.is_current && (
                  <View style={[styles.currentChip, { backgroundColor: isDark ? '#132A1B' : '#DCFCE7' }]}>
                    <Text style={[styles.currentChipText, { color: C.green }]}>Current</Text>
                  </View>
                )}
                {isAnnual && (
                  <View style={[styles.saveChip, { backgroundColor: C.redBg, borderColor: C.red }]}>
                    <Text style={[styles.saveChipText, { color: C.red }]}>Save 30%</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.planSub, { color: C.textSm }]} numberOfLines={2}>
                {p.description} · {formatPlanPrice(p.price, p.interval)}
              </Text>
            </View>
            <View
              style={[
                styles.radio,
                { backgroundColor: selected ? C.red : 'transparent', borderColor: selected ? C.red : (isDark ? '#555' : '#D1D5DB') },
              ]}
            >
              {selected && <Check size={10} color="#fff" strokeWidth={3} />}
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        onPress={handleConfirm}
        disabled={confirmDisabled}
        activeOpacity={0.85}
        style={[styles.primaryBtn, { backgroundColor: confirmDisabled ? '#C99' : C.red, marginTop: 8 }]}
      >
        {processing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>
            {selectedKey === currentKey ? 'Current Plan' : 'Confirm'}
          </Text>
        )}
      </TouchableOpacity>
      {selectedKey === 'free' && selectedKey !== currentKey && (
        <Text style={[styles.noteText, { color: C.textSm }]}>
          You'll keep premium access until the end of your current billing period.
        </Text>
      )}
    </View>
  );
};

/* ───────────────────────── Payment History ───────────────────────── */

export const PaymentHistoryContent: React.FC = () => {
  const { C } = useTheme();
  const [items, setItems] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await subscriptionService.getPaymentHistory(20);
      setItems(res.data ?? []);
    } catch (err: any) {
      setError(err?.message || 'Could not load payment history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading || error || items.length === 0) {
    return (
      <StateBlock
        loading={loading}
        error={error}
        empty={!loading && !error && items.length === 0}
        emptyText="No transactions yet."
        onRetry={load}
      />
    );
  }

  const isPaid = (s: string) => /paid|succeeded|active/i.test(s);

  return (
    <View style={styles.txWrap}>
      {items.map((tx, i) => {
        const paid = isPaid(tx.status);
        return (
          <View
            key={String(tx.id)}
            style={[styles.txRow, { borderBottomColor: C.divider, borderBottomWidth: i < items.length - 1 ? 1 : 0 }]}
          >
            <View style={styles.txLeft}>
              <View style={[styles.txIcon, { backgroundColor: C.redBg }]}>
                <Receipt size={16} color={C.redMuted} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={[styles.txTitle, { color: C.text }]} numberOfLines={1}>{tx.description}</Text>
                <Text style={[styles.txDate, { color: C.textSm }]}>{formatDate(tx.paid_at)}</Text>
              </View>
            </View>
            <View style={styles.txRight}>
              <Text style={[styles.txAmount, { color: C.text }]}>{tx.formatted_amount}</Text>
              <View style={styles.txStatusRow}>
                <CheckCircle2 size={10} color={paid ? C.green : C.textSm} />
                <Text style={[styles.txStatusText, { color: paid ? C.green : C.textSm }]}>{tx.status_label}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

/* ───────────────────────── Billing Method ───────────────────────── */

// Inner form rendered under StripeProvider so useConfirmSetupIntent is available.
const AddCardForm: React.FC<{
  clientSecret: string;
  onSaved: (pmId: string) => Promise<void>;
  onCancel: () => void;
}> = ({ clientSecret, onSaved, onCancel }) => {
  const { C } = useTheme();
  const { confirmSetupIntent } = useConfirmSetupIntent();
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (!complete || saving) return;
    setSaving(true);
    setError(null);
    try {
      const { setupIntent, error: stripeError } = await confirmSetupIntent(clientSecret, {
        paymentMethodType: 'Card',
      });
      if (stripeError) {
        setError(stripeError.message || 'We could not validate your card.');
        return;
      }
      const pmId = setupIntent?.paymentMethod?.id || (setupIntent as any)?.paymentMethodId;
      if (!pmId) {
        setError('Could not obtain a payment method from Stripe.');
        return;
      }
      await onSaved(pmId);
    } catch (err: any) {
      setError(err?.message || 'Could not save your card.');
    } finally {
      setSaving(false);
    }
  }, [complete, saving, confirmSetupIntent, clientSecret, onSaved]);

  return (
    <View style={{ gap: 12 }}>
      <CardField
        postalCodeEnabled={false}
        placeholders={{ number: '4242 4242 4242 4242' }}
        cardStyle={{
          backgroundColor: '#FDF9F9',
          textColor: C.text,
          placeholderColor: '#C88686',
          borderColor: C.redBorder || '#F2D0D0',
          borderWidth: 1,
          borderRadius: 14,
          fontSize: 15,
        }}
        style={styles.cardField}
        onCardChange={(d: CardFieldInput.Details) => setComplete(d.complete)}
      />

      {error && (
        <View style={styles.errBanner}>
          <AlertTriangle size={14} color="#D7181D" />
          <Text style={styles.errBannerText}>{error}</Text>
        </View>
      )}

      <View style={styles.secureRow}>
        <Lock size={12} color="#16A34A" />
        <Text style={styles.secureText}>Encrypted & tokenized by Stripe. We never store your card number.</Text>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={!complete || saving}
        activeOpacity={0.85}
        style={[styles.primaryBtn, { backgroundColor: !complete || saving ? '#C99' : C.red }]}
      >
        {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryBtnText}>Save Card</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel} disabled={saving} style={styles.linkBtn}>
        <Text style={[styles.linkBtnText, { color: C.textSm }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

export const BillingMethodContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { C, isDark } = useTheme();

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | number | null>(null);

  // Add-card flow
  const [addMode, setAddMode] = useState(false);
  const [setup, setSetup] = useState<{ clientSecret: string; pk: string } | null>(null);
  const [preparing, setPreparing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMethods(await subscriptionService.getBillingMethods());
    } catch (err: any) {
      setError(err?.message || 'Could not load your cards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStartAdd = useCallback(async () => {
    setPreparing(true);
    try {
      const res = await subscriptionService.createSetupIntent();
      const pk = res.publishable_key || ENV_PUBLISHABLE_KEY;
      if (!pk) {
        Alert.alert('Stripe not configured', 'Missing publishable key.');
        return;
      }
      setSetup({ clientSecret: res.client_secret, pk });
      setAddMode(true);
    } catch (err: any) {
      Alert.alert('Could not start', err?.message || 'Please try again.');
    } finally {
      setPreparing(false);
    }
  }, []);

  const handleSaved = useCallback(async (pmId: string) => {
    await subscriptionService.addBillingMethod(pmId, methods.length === 0);
    setAddMode(false);
    setSetup(null);
    await load();
  }, [methods.length, load]);

  const handleSetDefault = useCallback(async (m: PaymentMethod) => {
    if (m.is_default) return;
    setBusyId(m.id);
    try {
      await subscriptionService.setDefaultBillingMethod(m.id);
      await load();
    } catch (err: any) {
      Alert.alert('Could not set default', err?.message || 'Please try again.');
    } finally {
      setBusyId(null);
    }
  }, [load]);

  const handleDelete = useCallback((m: PaymentMethod) => {
    Alert.alert(
      'Remove card',
      `Remove ${m.masked_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setBusyId(m.id);
            try {
              await subscriptionService.deleteBillingMethod(m.id);
              await load();
            } catch (err: any) {
              // 422: can't delete the default card while a subscription is active.
              const msg = err instanceof SubscriptionApiError ? err.message : err?.message;
              Alert.alert('Could not remove card', msg || 'Please try again.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  }, [load]);

  if (loading || error) {
    return <StateBlock loading={loading} error={error} onRetry={load} />;
  }

  // Add-card mode (Stripe)
  if (addMode && setup) {
    return (
      <StripeProvider publishableKey={setup.pk} merchantIdentifier="merchant.com.anonymous.DiabAI">
        <Text style={[styles.addTitle, { color: C.text }]}>Add Payment Method</Text>
        <AddCardForm
          clientSecret={setup.clientSecret}
          onSaved={handleSaved}
          onCancel={() => { setAddMode(false); setSetup(null); }}
        />
      </StripeProvider>
    );
  }

  return (
    <View>
      {methods.length === 0 && (
        <StateBlock empty emptyText="No saved cards yet." />
      )}

      {methods.map((m) => (
        <TouchableOpacity
          key={String(m.id)}
          activeOpacity={0.85}
          onPress={() => handleSetDefault(m)}
          style={[styles.cardRow, { backgroundColor: C.redBg, borderColor: m.is_default ? C.red : C.divider }]}
        >
          <View style={[styles.cardRowIcon, { backgroundColor: C.red }]}>
            <CreditCard size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardRowTitle, { color: C.text }]}>{m.masked_number}</Text>
            <Text style={[styles.cardRowSub, { color: C.textSm }]}>Expires {m.expires_label}</Text>
          </View>

          {busyId === m.id ? (
            <ActivityIndicator size="small" color={C.red} />
          ) : m.is_default ? (
            <View style={[styles.defaultBadge, { backgroundColor: isDark ? '#132A1B' : '#DCFCE7' }]}>
              <CheckCircle2 size={11} color={C.green} />
              <Text style={[styles.defaultBadgeText, { color: C.green }]}>Default</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={() => handleDelete(m)} hitSlop={8} style={styles.trashBtn}>
              <Trash2 size={16} color={C.redMuted} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        onPress={handleStartAdd}
        disabled={preparing}
        activeOpacity={0.85}
        style={[styles.addCardBtn, { borderColor: C.redBorder, backgroundColor: C.redBg }]}
      >
        {preparing ? (
          <ActivityIndicator size="small" color={C.red} />
        ) : (
          <>
            <Plus size={16} color={C.red} />
            <Text style={[styles.addCardText, { color: C.red }]}>Add Payment Method</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={[styles.primaryBtn, { backgroundColor: C.red, marginTop: 4 }]}>
        <Text style={styles.primaryBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  stateBlock: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: 12 },
  stateText: { fontSize: 13, textAlign: 'center', paddingHorizontal: 16, fontWeight: '600' },
  retryBtn: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8 },
  retryText: { fontSize: 13, fontWeight: '700' },

  primaryBtn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkBtnText: { fontSize: 13, fontWeight: '600' },
  noteText: { fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 15 },

  // Plans
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16, padding: 12, marginBottom: 10 },
  planIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  planName: { fontSize: 14.5, fontWeight: '700' },
  planSub: { fontSize: 11.5, marginTop: 2, lineHeight: 15 },
  currentChip: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  currentChipText: { fontSize: 9, fontWeight: 'bold' },
  saveChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1 },
  saveChipText: { fontSize: 9, fontWeight: 'bold' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  // Transactions
  txWrap: { gap: 4 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  txIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontSize: 13.5, fontWeight: '600' },
  txDate: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  txRight: { alignItems: 'flex-end', gap: 1 },
  txAmount: { fontSize: 13.5, fontWeight: 'bold' },
  txStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  txStatusText: { fontSize: 9.5, fontWeight: '700' },

  // Billing cards
  cardRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, padding: 12, marginBottom: 12, gap: 12 },
  cardRowIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardRowTitle: { fontSize: 14.5, fontWeight: '700' },
  cardRowSub: { fontSize: 11.5, fontWeight: '500', marginTop: 1 },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, gap: 3 },
  defaultBadgeText: { fontSize: 9.5, fontWeight: 'bold' },
  trashBtn: { padding: 4 },
  addCardBtn: { flexDirection: 'row', gap: 8, borderRadius: 14, borderWidth: 1.5, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  addCardText: { fontSize: 13.5, fontWeight: 'bold' },

  // Add-card form
  addTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  cardField: { width: '100%', height: 50 },
  errBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  errBannerText: { flex: 1, fontSize: 12, color: '#B91C1C', lineHeight: 16 },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  secureText: { flex: 1, fontSize: 11, color: '#166534', lineHeight: 14 },
});
