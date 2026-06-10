import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, BellOff, CheckCircle2, SmilePlus } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/borderRadius';
import { BRAND_RED_GRADIENT } from '../../theme/colors';
import type { AlertItem } from '../../types';
import { useNotifications } from './hooks/useNotifications';
import NotificationCard from './components/NotificationCard';

type FilterTab = 'all' | 'critical' | 'warning' | 'info';

interface DaySection {
  key: number;
  label: string;
  fullDate: string;
  items: AlertItem[];
}

const startOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** Bucket alerts by calendar day, newest day first, with TODAY/YESTERDAY/weekday labels. */
function groupByDay(items: AlertItem[]): DaySection[] {
  const map = new Map<number, AlertItem[]>();
  for (const it of items) {
    const parsed = it.date ? new Date(it.date) : new Date();
    const d = isNaN(parsed.getTime()) ? new Date() : parsed;
    const key = startOfDay(d).getTime();
    const bucket = map.get(key);
    if (bucket) bucket.push(it);
    else map.set(key, [it]);
  }
  const todayKey = startOfDay(new Date()).getTime();
  const yesterdayKey = todayKey - 86_400_000;
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([key, list]) => {
      const date = new Date(key);
      const label =
        key === todayKey ? 'TODAY'
          : key === yesterdayKey ? 'YESTERDAY'
            : date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
      const fullDate = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
      return { key, label, fullDate, items: list };
    });
}

/** Notifications screen: header + stats bar + severity filter chips + day-grouped list. */
const AlertsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { C, colors } = useTheme();
  const { groups, unread, isEmpty, markRead, markAll } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const counts = useMemo(() => {
    const critical = groups.critical.length;
    const warning = groups.warning.length;
    const info = groups.info.length;
    return { critical, warning, info, total: critical + warning + info };
  }, [groups]);

  const allAlerts = useMemo(
    () => [...groups.critical, ...groups.warning, ...groups.info],
    [groups],
  );

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return allAlerts;
    if (activeFilter === 'critical') return allAlerts.filter((a) => a.severity === 'critical');
    if (activeFilter === 'warning') return allAlerts.filter((a) => a.severity === 'warning');
    return allAlerts.filter((a) => a.severity !== 'critical' && a.severity !== 'warning');
  }, [allAlerts, activeFilter]);

  const sections = useMemo(() => groupByDay(filtered), [filtered]);

  const filters: { id: FilterTab; label: string; count: number; color: string }[] = [
    { id: 'all', label: 'All', count: counts.total, color: colors.primary },
    { id: 'critical', label: 'Critical', count: counts.critical, color: colors.criticalText },
    { id: 'warning', label: 'Warning', count: counts.warning, color: colors.warningText },
    { id: 'info', label: 'Info', count: counts.info, color: colors.infoText },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
          <ArrowLeft size={16} color={C.red} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Alerts</Text>
            {unread > 0 && (
              <View style={[styles.titleBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.titleBadgeText}>{unread}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.subtitle, { color: C.redMuted }]}>Stay informed about your glucose & health</Text>
        </View>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
          <BellOff size={15} color={C.redMuted} />
        </TouchableOpacity>
      </View>

      {/* ── Summary stats bar ── */}
      <LinearGradient colors={BRAND_RED_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statsBar}>
        <View style={styles.statsGroup}>
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{counts.critical}</Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{counts.warning}</Text>
            <Text style={styles.statLabel}>Warnings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{unread}</Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
        </View>
        <TouchableOpacity onPress={markAll} style={styles.markAllBtn}>
          <CheckCircle2 size={13} color="rgba(255,255,255,0.85)" />
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {filters.map((f) => {
          const active = activeFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setActiveFilter(f.id)}
              activeOpacity={0.85}
              style={[
                styles.chip,
                active
                  ? { backgroundColor: f.color, borderColor: f.color }
                  : { backgroundColor: colors.backgroundCard, borderColor: C.redBorder },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? colors.textOnPrimary : C.red }]}>{f.label}</Text>
              <View style={[styles.chipBadge, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : C.redBg }]}>
                <Text style={[styles.chipBadgeText, { color: active ? colors.textOnPrimary : C.red }]}>{f.count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── List ── */}
      {isEmpty || sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBox, { backgroundColor: colors.successBg, borderColor: colors.loggedTagBg }]}>
            <SmilePlus size={28} color={colors.success} />
          </View>
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
            No {activeFilter === 'all' ? '' : activeFilter} alerts
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {activeFilter === 'critical'
              ? "No critical alerts right now. Your glucose is being monitored continuously."
              : activeFilter === 'warning'
                ? "No warnings detected. Keep maintaining your healthy routine!"
                : "You're all caught up — we'll let you know when something needs your attention."}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {sections.map((section) => (
            <View key={section.key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>{section.label}</Text>
                  <View style={[styles.sectionCount, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
                    <Text style={[styles.sectionCountText, { color: C.red }]}>{section.items.length}</Text>
                  </View>
                </View>
                <Text style={[styles.sectionDate, { color: C.redMuted }]}>{section.fullDate}</Text>
              </View>
              {section.items.map((item) => (
                <NotificationCard key={String(item.id)} item={item} onMarkRead={markRead} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  headerTop: {
    paddingTop: 56,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 22, fontWeight: '800' },
  titleBadge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  titleBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  statsGroup: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  statCol: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', lineHeight: 24 },
  statLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginLeft: spacing.sm,
  },
  markAllText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.92)' },

  // Filter chips
  chipsScroll: { flexGrow: 0, marginTop: spacing.md, marginBottom: spacing.xs },
  chipsContent: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 12.5, fontWeight: '700' },
  chipBadge: { minWidth: 18, borderRadius: borderRadius.pill, paddingHorizontal: 5, paddingVertical: 1, alignItems: 'center', justifyContent: 'center' },
  chipBadgeText: { fontSize: 10, fontWeight: '800' },

  // List + sections
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxxxl },
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm, paddingHorizontal: 2 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionLabel: { fontSize: 12.5, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionCount: { minWidth: 20, borderRadius: borderRadius.pill, paddingHorizontal: 6, paddingVertical: 1, alignItems: 'center', borderWidth: 1 },
  sectionCountText: { fontSize: 10, fontWeight: '800' },
  sectionDate: { fontSize: 11, fontWeight: '500' },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxxl, paddingBottom: 60 },
  emptyIconBox: { width: 72, height: 72, borderRadius: borderRadius.pill, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, borderWidth: 2 },
  emptyText: { fontSize: 17, fontWeight: '800', textAlign: 'center', textTransform: 'capitalize' },
  emptySubtext: { fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});

export default AlertsScreen;
