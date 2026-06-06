import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, CheckCircle2, Bell } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/borderRadius';
import type { AlertItem } from '../../types';
import { useNotifications } from './hooks/useNotifications';
import NotificationCard from './components/NotificationCard';

/** Notifications screen: coordinates useNotifications() + the grouped notification list. */
const AlertsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { C, colors } = useTheme();
  const { groups, unread, isEmpty, markRead, markAll } = useNotifications();

  const renderGroup = (items: AlertItem[]) =>
    items.map((item) => <NotificationCard key={String(item.id)} item={item} onMarkRead={markRead} />);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
          <ArrowLeft size={16} color={C.red} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </Text>
        </View>
        {unread > 0 && (
          <TouchableOpacity onPress={markAll} style={styles.markAllBtn}>
            <CheckCircle2 size={13} color={C.red} />
            <Text style={[styles.markAllText, { color: C.red }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBox, { backgroundColor: colors.backgroundMuted }]}>
            <Bell size={28} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No notifications yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            You're all caught up — we'll let you know when something needs your attention.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {renderGroup(groups.critical)}
          {renderGroup(groups.warning)}
          {renderGroup(groups.info)}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 56,
    paddingHorizontal: spacing.xl,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerText: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 1 },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  markAllText: { fontSize: 12, fontWeight: '700' },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 6,
    paddingBottom: spacing.xxxxl,
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxxl, paddingBottom: 60 },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptySubtext: { fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});

export default AlertsScreen;
