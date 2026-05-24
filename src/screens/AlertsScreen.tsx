import React, { useState } from 'react';
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
import { AlertTriangle, Zap, TrendingUp, Activity, Droplets, Utensils, Moon, BarChart3, Pill, FileText, Clock, BellOff, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react-native';

const AlertsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { C, isDark } = useTheme();
  const { alerts, markAlertRead } = useData();
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredAlerts = alerts.filter(a => filter === 'all' || a.severity === filter);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' };
      case 'warning': return { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
      case 'info': return { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' };
      default: return { color: C.textSm, bg: C.bg, border: C.redBorder };
    }
  };

  const getAlertIcon = (severity: string, tag?: string) => {
    const size = 20;
    const color = '#FFF';
    if (tag === 'AI Detected') return <Zap size={size} color={color} />;
    if (severity === 'critical') return <AlertTriangle size={size} color={color} />;
    if (severity === 'warning') return <TrendingUp size={size} color={color} />;
    return <Activity size={size} color={color} />;
  };

  const renderAlert = ({ item }: { item: any }) => {
    const s = getSeverityStyle(item.severity);
    return (
      <TouchableOpacity 
        style={[styles.alertCard, { backgroundColor: C.white, borderColor: item.severity === 'critical' ? s.color : s.border }]}
        onPress={() => markAlertRead(item.id)}
      >
        <View style={[styles.iconBox, { backgroundColor: item.severity === 'critical' ? s.color : s.color }]}>
          {getAlertIcon(item.severity, item.tag)}
        </View>
        <View style={styles.alertMain}>
          <View style={styles.alertHeader}>
            <Text style={[styles.alertTitle, { color: C.text }]}>{item.title}</Text>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: s.color }]} />}
          </View>
          <Text style={[styles.alertDesc, { color: C.textSm }]}>{item.desc}</Text>
          <View style={styles.alertFooter}>
            <View style={[styles.tag, { backgroundColor: s.bg, borderColor: s.border }]}>
               <Text style={[styles.tagText, { color: s.color }]}>{item.severity.toUpperCase()}</Text>
            </View>
            <Text style={[styles.alertTime, { color: C.textXs }]}>{item.time}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
          <ArrowLeft size={20} color={C.red} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.text }]}>Alerts</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
          <BellOff size={20} color={C.red} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {(['all', 'critical', 'warning', 'info'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.tab,
              filter === f && { backgroundColor: C.red, borderColor: C.red }
            ]}
          >
            <Text style={[
              styles.tabText,
              { color: filter === f ? '#FFF' : C.textSm }
            ]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredAlerts}
        renderItem={renderAlert}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={64} color={C.green} />
            <Text style={[styles.emptyText, { color: C.text }]}>No alerts found</Text>
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
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  alertCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  alertMain: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  alertDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '900',
  },
  alertTime: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
  },
});

export default AlertsScreen;
