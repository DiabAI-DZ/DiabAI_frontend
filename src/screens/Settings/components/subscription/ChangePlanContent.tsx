import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CreditCard, Check } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { subStyles } from './styles';
import { StateBlock } from './StateBlock';
import { formatPlanPrice } from './format';
import { useChangePlan } from './hooks/useChangePlan';

export const ChangePlanContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { C, isDark, colors } = useTheme();
  const { sub, loading, error, selectedKey, setSelectedKey, processing, currentKey, load, confirm } = useChangePlan(onClose);

  if (loading || error) return <StateBlock loading={loading} error={error} onRetry={load} />;

  const plans = sub?.available_plans ?? [];
  const confirmDisabled = !selectedKey || selectedKey === currentKey || processing;
  const rowBgSelected = isDark ? colors.backgroundInput : colors.backgroundCard;
  const rowBgIdle = isDark ? colors.backgroundInput : colors.backgroundMuted;

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
            style={[subStyles.planRow, { backgroundColor: selected ? rowBgSelected : rowBgIdle, borderColor: selected ? C.red : C.divider }]}
          >
            <View style={[subStyles.planIconBox, { backgroundColor: rowBgIdle }]}>
              <CreditCard size={16} color={isDark ? C.textSm : colors.textSecondary} />
            </View>
            <View style={subStyles.flex1}>
              <View style={subStyles.planTitleRow}>
                <Text style={[subStyles.planName, { color: C.text }]}>{p.name}</Text>
                {p.is_current && (
                  <View style={[subStyles.currentChip, { backgroundColor: colors.successBg }]}>
                    <Text style={[subStyles.currentChipText, { color: C.green }]}>Current</Text>
                  </View>
                )}
                {isAnnual && (
                  <View style={[subStyles.saveChip, { backgroundColor: C.redBg, borderColor: C.red }]}>
                    <Text style={[subStyles.saveChipText, { color: C.red }]}>Save 30%</Text>
                  </View>
                )}
              </View>
              <Text style={[subStyles.planSub, { color: C.textSm }]} numberOfLines={2}>
                {p.description} · {formatPlanPrice(p.price, p.interval)}
              </Text>
            </View>
            <View style={[subStyles.radio, { borderColor: selected ? C.red : colors.border }]}>
              {selected && <Check size={12} color={C.red} strokeWidth={3} />}
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        onPress={confirm}
        disabled={confirmDisabled}
        activeOpacity={0.85}
        style={[subStyles.primaryBtn, subStyles.marginTopSm, { backgroundColor: confirmDisabled ? colors.primaryLight : C.red }]}
      >
        {processing ? (
          <ActivityIndicator size="small" color={colors.textOnPrimary} />
        ) : (
          <Text style={[subStyles.primaryBtnText, { color: colors.textOnPrimary }]}>
            {selectedKey === currentKey ? 'Current Plan' : 'Confirm'}
          </Text>
        )}
      </TouchableOpacity>
      {selectedKey === 'free' && selectedKey !== currentKey && (
        <Text style={[subStyles.noteText, { color: C.textSm }]}>
          You'll keep premium access until the end of your current billing period.
        </Text>
      )}
    </View>
  );
};
