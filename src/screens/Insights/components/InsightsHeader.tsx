import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useData } from '../../../context/DataContext';
import { useUser } from '../../../context/UserContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

interface InsightsHeaderProps {
  /** Show the "clear chat" button (only in conversation mode). */
  showClear?: boolean;
  onClear?: () => void;
  onNavigateAlerts?: () => void;
}

export const InsightsHeader: React.FC<InsightsHeaderProps> = ({ showClear, onClear, onNavigateAlerts }) => {
  const { C, colors } = useTheme();
  const { alerts, selectedDate } = useData();
  const { profile } = useUser();

  const dateLabel = useMemo(
    () => selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    [selectedDate],
  );
  const unreadCount = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);

  return (
    <View style={[styles.header, { borderBottomColor: C.divider }]}>
      <View style={styles.flex1}>
        <Text style={[styles.dateText, { color: C.textSm }]}>{dateLabel}</Text>
        <Text style={[styles.titleText, { color: C.text }]}>Hello, {profile?.name || 'there'}</Text>
        <Text style={[styles.subText, { color: C.textSm }]}>Track your glucose with confidence</Text>
      </View>
      <View style={styles.actions}>
        {showClear && (
          <TouchableOpacity onPress={onClear} style={[styles.clearBtn, { backgroundColor: C.redBg }]}>
            <Trash2 size={18} color={C.red} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.alertButton} onPress={onNavigateAlerts}>
          <View style={[styles.alertIconBox, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <Bell size={20} color={C.red} strokeWidth={2} />
          </View>
          {unreadCount > 0 && <View style={[styles.alertBadgeDot, { backgroundColor: C.red, borderColor: C.bg }]} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, marginBottom: 2 },
  titleText: { fontSize: 20, fontWeight: '900' },
  subText: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clearBtn: { padding: spacing.sm, borderRadius: borderRadius.md },
  alertButton: { position: 'relative' },
  alertIconBox: { width: 40, height: 40, borderRadius: borderRadius.md, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  alertBadgeDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
});
