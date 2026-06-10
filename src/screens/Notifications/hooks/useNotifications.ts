import { useCallback, useEffect, useMemo } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { useData } from '../../../context/DataContext';
import { useUser } from '../../../context/UserContext';
import { emitPremiumRequired } from '../../../services/uiEvents';
import type { AlertItem } from '../../../types';

interface NotificationGroups {
  critical: AlertItem[];
  warning: AlertItem[];
  info: AlertItem[];
}

interface UseNotificationsResult {
  groups: NotificationGroups;
  unread: number;
  isEmpty: boolean;
  markRead: (id: number) => void;
  markAll: () => Promise<void>;
}

/** Owns the notifications screen state: premium gate, severity grouping, unread count, actions. */
export function useNotifications(): UseNotificationsResult {
  const { alerts, markAlertRead, markAllAlertsRead, refreshAlerts } = useData();
  const { profile } = useUser();

  // Always pull a fresh list of alerts when the screen is entered (it mounts per visit).
  useEffect(() => {
    refreshAlerts();
  }, [refreshAlerts]);

  // Notifications is premium-only: opening as a free user pops the blocker over this screen.
  useEffect(() => {
    if (!profile?.isPremium) emitPremiumRequired();
  }, [profile?.isPremium]);

  const unread = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);

  // Group by severity (critical → warning → info), newest first within each group.
  const groups = useMemo<NotificationGroups>(() => {
    const byDate = (a: AlertItem, b: AlertItem) =>
      new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    return {
      critical: alerts.filter((a) => a.severity === 'critical').sort(byDate),
      warning: alerts.filter((a) => a.severity === 'warning').sort(byDate),
      info: alerts.filter((a) => !['critical', 'warning'].includes(a.severity)).sort(byDate),
    };
  }, [alerts]);

  const markAll = useCallback(async () => {
    if (unread <= 0) return;
    try {
      const marked = await markAllAlertsRead();
      const msg = marked > 0 ? `Marked ${marked} as read` : 'No unread notifications';
      if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
      else Alert.alert('Notifications', msg);
    } catch {
      if (Platform.OS === 'android') ToastAndroid.show('Failed to mark read', ToastAndroid.SHORT);
    }
  }, [unread, markAllAlertsRead]);

  return { groups, unread, isEmpty: alerts.length === 0, markRead: markAlertRead, markAll };
}
