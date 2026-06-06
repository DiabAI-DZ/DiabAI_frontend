import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

interface DashboardHeaderProps {
  date: string;
  name: string;
  unreadAlerts: number;
  onNavigateAlerts: () => void;
}

/** Home greeting row: date + "Hello, <name>" + a bell button with an unread dot. */
const DashboardHeader: React.FC<DashboardHeaderProps> = ({ date, name, unreadAlerts, onNavigateAlerts }) => {
  const { C } = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.textColumn}>
        <Text style={[styles.date, { color: C.textSm }]}>{date}</Text>
        <Text style={[styles.greeting, { color: C.text }]}>Hello, {name}</Text>
        <Text style={[styles.subtitle, { color: C.textMd }]}>Track your glucose with confidence</Text>
      </View>
      <TouchableOpacity style={styles.bellBtn} onPress={onNavigateAlerts}>
        <View style={[styles.bellBox, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
          <Bell size={20} color={C.red} strokeWidth={2} />
        </View>
        {unreadAlerts > 0 && <View style={[styles.bellBadge, { backgroundColor: C.red, borderColor: C.bg }]} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xxl,
    paddingTop: 60,
    paddingBottom: spacing.xl,
  },
  textColumn: { flex: 1 },
  date: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  greeting: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  bellBtn: { position: 'relative' },
  bellBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
});

export default DashboardHeader;
