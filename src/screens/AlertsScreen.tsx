import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { 
  AlertTriangle, 
  Zap, 
  TrendingUp, 
  Activity, 
  Droplets, 
  Utensils, 
  Moon, 
  BarChart3, 
  Pill, 
  FileText, 
  Clock, 
  BellOff, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft,
  Eye,
  Shield,
  Sparkles,
  SmilePlus
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type FilterTab = "all" | "critical" | "warning" | "info";

const AlertsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { C, isDark } = useTheme();
  const { alerts, markAlertRead, markAllAlertsRead } = useData();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => activeFilter === 'all' || a.severity === activeFilter);
  }, [alerts, activeFilter]);

  const stats = useMemo(() => {
    const critical = alerts.filter(a => a.severity === 'critical').length;
    const warnings = alerts.filter(a => a.severity === 'warning').length;
    const info = alerts.filter(a => a.severity === 'info').length;
    const unread = alerts.filter(a => !a.read).length;
    return { critical, warnings, info, unread };
  }, [alerts]);

  const severityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', darkBg: '#DC2626', label: 'Critical' };
      case 'warning':
        return { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', darkBg: '#D97706', label: 'Warning' };
      case 'info':
        return { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', darkBg: '#3B82F6', label: 'Info' };
      default:
        return { color: C.textSm, bg: C.bg, border: C.redBorder, darkBg: C.red, label: 'Alert' };
    }
  };

  const getAlertIcon = (severity: string, tag?: string) => {
    const size = 16;
    const color = '#FFF';
    if (tag === 'AI Detected') return <Sparkles size={size} color={color} />;
    if (tag === 'System') return <Shield size={size} color={color} />;
    if (severity === 'critical') return <Zap size={size} color={color} />;
    if (severity === 'warning') return <TrendingUp size={size} color={color} />;
    if (severity === 'info' && tag === 'Logged') return <Utensils size={size} color={color} />;
    return <Activity size={size} color={color} />;
  };

  const renderAlert = ({ item, index }: { item: any; index: number }) => {
    const cfg = severityConfig(item.severity);
    const isCritical = item.severity === 'critical';
    
    return (
      <View
        style={[
          styles.alertCard,
          {
            backgroundColor: C.white,
            borderColor: isCritical ? cfg.color + '50' : cfg.border,
            opacity: item.read ? 0.85 : 1,
          }
        ]}
      >
        {isCritical && (
          <LinearGradient
            colors={[cfg.darkBg, '#B91C1C']}
            style={styles.criticalHeaderStrip}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <AlertTriangle size={10} color="rgba(255,255,255,0.85)" />
            <Text style={styles.criticalHeaderTitle}>Requires Immediate Attention</Text>
          </LinearGradient>
        )}

        <View style={styles.alertCardBody}>
          <TouchableOpacity
            style={[styles.iconContainer, { backgroundColor: cfg.darkBg }]}
            onPress={() => markAlertRead(item.id)}
          >
            {getAlertIcon(item.severity, item.tag)}
          </TouchableOpacity>

          <View style={styles.alertContent}>
            <View style={styles.alertHeaderRow}>
              <Text style={[styles.alertTitleText, { color: C.text }]} numberOfLines={2}>
                {!item.read && <View style={[styles.unreadBadgeDot, { backgroundColor: cfg.color }]} />}
                {item.title}
              </Text>
            </View>
            <Text style={[styles.alertDescText, { color: C.textSm }]}>{item.desc}</Text>

            <View style={styles.alertMetaRow}>
              <View style={[styles.badgePill, { backgroundColor: isCritical ? '#FFF' : cfg.bg, borderColor: cfg.border }]}>
                <View style={[styles.badgeDot, { backgroundColor: cfg.color }]} />
                <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              
              {item.tag && (
                <View style={[styles.badgePill, { backgroundColor: item.tag === 'AI Detected' ? C.purpleBg : '#F3F4F6', borderColor: item.tag === 'AI Detected' ? C.purpleBorder : '#E5E7EB' }]}>
                  <Text style={[styles.badgeText, { color: item.tag === 'AI Detected' ? C.purple : C.textSm }]}>{item.tag}</Text>
                </View>
              )}

              <View style={styles.timeWrapper}>
                <Clock size={9} color={C.textXs} />
                <Text style={[styles.timeText, { color: C.textXs }]}>{item.time}</Text>
              </View>
            </View>

            {isCritical && !item.read && (
              <TouchableOpacity
                onPress={() => markAlertRead(item.id)}
                style={styles.actionBtnContainer}
              >
                <LinearGradient
                  colors={[cfg.darkBg, '#B91C1C']}
                  style={styles.actionBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Eye size={12} color="#FFF" />
                  <Text style={styles.actionBtnText}>Acknowledge Alert</Text>
                  <ChevronRight size={12} color="rgba(255,255,255,0.7)" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const filters: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: alerts.length },
    { id: "critical", label: "Critical", count: stats.critical },
    { id: "warning", label: "Warnings", count: stats.warnings },
    { id: "info", label: "Info", count: stats.info },
  ];

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.divider }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <ArrowLeft size={16} color={C.red} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: C.text }]}>Alerts</Text>
              {stats.unread > 0 && (
                <LinearGradient colors={[C.red, C.redDark]} style={styles.unreadCountBadge}>
                  <Text style={styles.unreadCountText}>{stats.unread}</Text>
                </LinearGradient>
              )}
            </View>
            <Text style={[styles.subtitle, { color: C.redMuted }]}>Stay informed about your glucose & health</Text>
          </View>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <BellOff size={15} color={C.redMuted} />
          </TouchableOpacity>
        </View>

        {/* Summary counters strip */}
        <LinearGradient
          colors={[C.red, C.redDark]}
          style={styles.summaryStrip}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryMetrics}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryVal}>{stats.critical}</Text>
              <Text style={styles.summaryLabel}>Critical</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryVal}>{stats.warnings}</Text>
              <Text style={styles.summaryLabel}>Warnings</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryVal}>{stats.unread}</Text>
              <Text style={styles.summaryLabel}>Unread</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.markReadBtn}
            onPress={async () => {
              if (stats.unread <= 0) return;
              try {
                await markAllAlertsRead();
              } catch (e) {
                console.warn('Failed to mark all alerts read', e);
              }
            }}
          >
            <CheckCircle2 size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Filters bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
          style={styles.filtersBar}
        >
          {filters.map((f) => {
            const isActive = activeFilter === f.id;
            const filterColor = f.id === "critical" ? "#EF4444" : f.id === "warning" ? C.amber : f.id === "info" ? C.blue : C.red;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setActiveFilter(f.id)}
                style={[
                  styles.filterTabBtn,
                  {
                    backgroundColor: isActive ? filterColor : (isDark ? "#222" : "#FAFAFA"),
                    borderColor: isActive ? filterColor : C.divider,
                  }
                ]}
              >
                <Text style={[styles.filterTabText, { color: isActive ? '#FFF' : C.textSm }]}>
                  {f.label}
                </Text>
                <View style={[styles.filterCountBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : (isDark ? '#333' : '#ECEAEA') }]}>
                  <Text style={[styles.filterCountText, { color: isActive ? '#FFF' : C.textXs }]}>
                    {f.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredAlerts}
        renderItem={renderAlert}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: C.greenBg, borderColor: C.greenBorder }]}>
              <SmilePlus size={28} color={C.green} />
            </View>
            <Text style={[styles.emptyText, { color: C.text }]}>
              No {activeFilter === 'all' ? '' : activeFilter} alerts
            </Text>
            <Text style={[styles.emptySubtext, { color: C.textSm }]}>
              {activeFilter === "critical"
                ? "No critical alerts right now. Your glucose is being monitored continuously."
                : activeFilter === "warning"
                ? "No warnings detected. Keep maintaining your healthy routine!"
                : "You're all caught up. You're doing great!"}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  headerTop: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  unreadCountBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCountText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  summaryStrip: {
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#C41E26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryCol: {
    alignItems: 'center',
  },
  summaryVal: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  markReadText: {
    color: '#FFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  filtersBar: {
    marginTop: 12,
    paddingBottom: 8,
  },
  filtersScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  filterCountBadge: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 14,
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
  },
  alertCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  criticalHeaderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  criticalHeaderTitle: {
    color: '#FFF',
    fontSize: 8.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  alertCardBody: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertTitleText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  unreadBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  alertDescText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  alertMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  badgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  timeText: {
    fontSize: 9,
    fontWeight: '500',
  },
  actionBtnContainer: {
    marginTop: 10,
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
});

export default AlertsScreen;
