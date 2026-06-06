import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { CreditCard, CheckCircle2, Plus, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { subStyles } from './styles';
import { StateBlock } from './StateBlock';
import { AddCardForm } from './AddCardForm';
import { useBillingMethods } from './hooks/useBillingMethods';

export const BillingMethodContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { C, isDark, colors } = useTheme();
  const { methods, loading, error, busyId, addMode, setup, preparing, load, startAdd, saved, setDefault, remove, cancelAdd } = useBillingMethods();

  if (loading || error) return <StateBlock loading={loading} error={error} onRetry={load} />;

  if (addMode && setup) {
    return (
      <StripeProvider publishableKey={setup.pk} merchantIdentifier="merchant.com.anonymous.DiabAI">
        <Text style={[subStyles.addTitle, { color: C.text }]}>Add Payment Method</Text>
        <AddCardForm clientSecret={setup.clientSecret} onSaved={saved} onCancel={cancelAdd} />
      </StripeProvider>
    );
  }

  const rowBgSelected = isDark ? colors.backgroundInput : colors.backgroundCard;
  const rowBgIdle = isDark ? colors.backgroundInput : colors.backgroundMuted;

  return (
    <View>
      {methods.length === 0 && <StateBlock empty emptyText="No saved cards yet." />}

      {methods.map((m) => (
        <TouchableOpacity
          key={String(m.id)}
          activeOpacity={0.85}
          onPress={() => setDefault(m)}
          style={[subStyles.cardRow, { backgroundColor: m.is_default ? rowBgSelected : rowBgIdle, borderColor: m.is_default ? C.red : C.divider }]}
        >
          <View style={[subStyles.cardRowIcon, { backgroundColor: rowBgIdle }]}>
            <CreditCard size={18} color={isDark ? C.textSm : colors.textSecondary} />
          </View>
          <View style={subStyles.flex1}>
            <Text style={[subStyles.cardRowTitle, { color: C.text }]}>{m.masked_number}</Text>
            <Text style={[subStyles.cardRowSub, { color: C.textSm }]}>Expires {m.expires_label}</Text>
          </View>

          {busyId === m.id ? (
            <ActivityIndicator size="small" color={C.red} />
          ) : m.is_default ? (
            <View style={[subStyles.defaultBadge, { backgroundColor: C.redBg }]}>
              <CheckCircle2 size={11} color={C.red} />
              <Text style={[subStyles.defaultBadgeText, { color: C.red }]}>Default</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={() => remove(m)} hitSlop={8} style={subStyles.trashBtn}>
              <Trash2 size={16} color={C.redMuted} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={startAdd} disabled={preparing} activeOpacity={0.85} style={[subStyles.addCardBtn, { borderColor: C.redBorder, backgroundColor: C.redBg }]}>
        {preparing ? (
          <ActivityIndicator size="small" color={C.red} />
        ) : (
          <>
            <Plus size={16} color={C.red} />
            <Text style={[subStyles.addCardText, { color: C.red }]}>Add Payment Method</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={[subStyles.primaryBtn, subStyles.marginTopXs, { backgroundColor: C.red }]}>
        <Text style={[subStyles.primaryBtnText, { color: colors.textOnPrimary }]}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};
