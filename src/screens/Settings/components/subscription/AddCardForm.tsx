import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CardField, useConfirmSetupIntent, type CardFieldInput } from '@stripe/stripe-react-native';
import { AlertTriangle, Lock } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { borderRadius } from '../../../../theme/borderRadius';
import { subStyles } from './styles';
import { subErrorMessage } from './format';

interface AddCardFormProps {
  clientSecret: string;
  onSaved: (pmId: string) => Promise<void>;
  onCancel: () => void;
}

/** Stripe card-entry form. Rendered under a StripeProvider so useConfirmSetupIntent is available. */
export const AddCardForm: React.FC<AddCardFormProps> = ({ clientSecret, onSaved, onCancel }) => {
  const { C, colors } = useTheme();
  const { confirmSetupIntent } = useConfirmSetupIntent();
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (!complete || saving) return;
    setSaving(true);
    setError(null);
    try {
      const { setupIntent, error: stripeError } = await confirmSetupIntent(clientSecret, { paymentMethodType: 'Card' });
      if (stripeError) {
        setError(stripeError.message || 'We could not validate your card.');
        return;
      }
      const pmId = setupIntent?.paymentMethod?.id || (setupIntent as { paymentMethodId?: string })?.paymentMethodId;
      if (!pmId) {
        setError('Could not obtain a payment method from Stripe.');
        return;
      }
      await onSaved(pmId);
    } catch (err) {
      setError(subErrorMessage(err, 'Could not save your card.'));
    } finally {
      setSaving(false);
    }
  }, [complete, saving, confirmSetupIntent, clientSecret, onSaved]);

  const disabled = !complete || saving;
  return (
    <View style={subStyles.addCardForm}>
      <CardField
        postalCodeEnabled={false}
        placeholders={{ number: '4242 4242 4242 4242' }}
        cardStyle={{
          backgroundColor: colors.backgroundInput,
          textColor: C.text,
          placeholderColor: colors.textMuted,
          borderColor: C.redBorder,
          borderWidth: 1,
          borderRadius: borderRadius.md,
          fontSize: 15,
        }}
        style={subStyles.cardField}
        onCardChange={(d: CardFieldInput.Details) => setComplete(d.complete)}
      />

      {error && (
        <View style={[subStyles.errBanner, { backgroundColor: colors.criticalBg, borderColor: colors.border }]}>
          <AlertTriangle size={14} color={colors.criticalText} />
          <Text style={[subStyles.errBannerText, { color: colors.criticalText }]}>{error}</Text>
        </View>
      )}

      <View style={subStyles.secureRow}>
        <Lock size={12} color={colors.success} />
        <Text style={[subStyles.secureText, { color: colors.loggedTagText }]}>Encrypted & tokenized by Stripe. We never store your card number.</Text>
      </View>

      <TouchableOpacity onPress={handleSave} disabled={disabled} activeOpacity={0.85} style={[subStyles.primaryBtn, { backgroundColor: disabled ? colors.primaryLight : C.red }]}>
        {saving ? <ActivityIndicator size="small" color={colors.textOnPrimary} /> : <Text style={[subStyles.primaryBtnText, { color: colors.textOnPrimary }]}>Save Card</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel} disabled={saving} style={subStyles.linkBtn}>
        <Text style={[subStyles.linkBtnText, { color: C.textSm }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};
