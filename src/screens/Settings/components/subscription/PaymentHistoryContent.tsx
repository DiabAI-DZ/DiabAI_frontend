import React from 'react';
import { View, Text } from 'react-native';
import { Receipt, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { subStyles } from './styles';
import { StateBlock } from './StateBlock';
import { formatDate } from './format';
import { usePaymentHistory } from './hooks/usePaymentHistory';

const isPaid = (s: string) => /paid|succeeded|active/i.test(s);

export const PaymentHistoryContent: React.FC = () => {
  const { C } = useTheme();
  const { items, loading, error, load } = usePaymentHistory();

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

  return (
    <View style={subStyles.txWrap}>
      {items.map((tx, i) => {
        const paid = isPaid(tx.status);
        return (
          <View key={String(tx.id)} style={[subStyles.txRow, { borderBottomColor: C.divider, borderBottomWidth: i < items.length - 1 ? 1 : 0 }]}>
            <View style={subStyles.txLeft}>
              <View style={[subStyles.txIcon, { backgroundColor: C.redBg }]}>
                <Receipt size={16} color={C.redMuted} />
              </View>
              <View style={subStyles.shrink}>
                <Text style={[subStyles.txTitle, { color: C.text }]} numberOfLines={1}>{tx.description}</Text>
                <Text style={[subStyles.txDate, { color: C.textSm }]}>{formatDate(tx.paid_at)}</Text>
              </View>
            </View>
            <View style={subStyles.txRight}>
              <Text style={[subStyles.txAmount, { color: C.text }]}>{tx.formatted_amount}</Text>
              <View style={subStyles.txStatusRow}>
                <CheckCircle2 size={10} color={paid ? C.green : C.textSm} />
                <Text style={[subStyles.txStatusText, { color: paid ? C.green : C.textSm }]}>{tx.status_label}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};
