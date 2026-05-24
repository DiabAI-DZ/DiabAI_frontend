import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { 
  User, Lock, LogOut, Syringe, Target, Ruler, 
  Bell, Heart, Palette, ChevronRight, HelpCircle, Info,
  Sun, Moon, Monitor, Globe, Type, CreditCard, Wallet, 
  ArrowUpDown, Receipt, BellRing, Clock, FileText, Settings
} from 'lucide-react-native';

const SettingsScreen: React.FC = () => {
  const { C, isDark, mode, setMode } = useTheme();
  const { profile, updateProfile, signOut, apiBaseUrl, setApiBaseUrl } = useUser();
  const [glucoseAlerts, setGlucoseAlerts] = useState(true);
  const [reminders, setReminders] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: signOut }
      ]
    );
  };

  const handleToggleTheme = () => {
    // Cycles between Light -> Dark -> System
    if (mode === 'light') setMode('dark');
    else if (mode === 'dark') setMode('system');
    else setMode('light');
  };

  const renderSection = (title: string, Icon: any, children: React.ReactNode) => (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { backgroundColor: C.red }]}>
        <Icon size={14} color="#FFF" />
        <Text style={styles.sectionHeaderText}>{title.toUpperCase()}</Text>
      </View>
      <View style={[styles.sectionContent, { backgroundColor: C.white, borderColor: C.redBorder }]}>
        {children}
      </View>
    </View>
  );

  const renderRow = (Icon: any, label: string, value?: string, onPress?: () => void, isToggle?: boolean, toggleVal?: boolean, onToggle?: (v: boolean) => void) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={[styles.rowIcon, { backgroundColor: C.redBg }]}>
         <Icon size={18} color={C.red} strokeWidth={2} />
      </View>
      <View style={styles.rowMain}>
         <Text style={[styles.rowText, { color: C.text }]}>{label}</Text>
      </View>
      {isToggle ? (
        <Switch 
          value={toggleVal} 
          onValueChange={onToggle} 
          trackColor={{ false: '#DDD', true: C.red }}
          thumbColor="#FFF"
        />
      ) : (
        <View style={styles.rowRight}>
           {value && <Text style={[styles.rowValue, { color: C.textSm }]}>{value}</Text>}
           <ChevronRight size={18} color={C.textXs} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { backgroundColor: C.red }]}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSub}>Manage your account & health</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderSection("Account Settings", User, (
          <>
            {renderRow(User, "Profile Information", profile?.name, () => Alert.alert("Profile", "Edit Profile feature coming soon."))}
            {renderRow(Lock, "Security & Privacy", undefined, () => {})}
            {renderRow(LogOut, "Sign Out", undefined, handleSignOut)}
          </>
        ))}

        {renderSection("Health Preferences", Heart, (
          <>
            {renderRow(Syringe, "Diabetes Type", profile?.diabetesType, () => {
              Alert.alert("Diabetes Type", "Select your type", [
                { text: "Type 1", onPress: () => updateProfile({ diabetesType: "Type 1" }) },
                { text: "Type 2", onPress: () => updateProfile({ diabetesType: "Type 2" }) },
                { text: "Cancel", style: "cancel" }
              ]);
            })}
            {renderRow(Target, "Glucose Goals", `${profile?.goals.min}-${profile?.goals.max}`, () => {})}
            {renderRow(Ruler, "Units", profile?.glucoseUnit, () => {
              Alert.alert("Units", "Select glucose unit", [
                { text: "mg/dL", onPress: () => updateProfile({ glucoseUnit: "mg/dL" }) },
                { text: "mmol/L", onPress: () => updateProfile({ glucoseUnit: "mmol/L" }) },
                { text: "Cancel", style: "cancel" }
              ]);
            })}
          </>
        ))}

        {renderSection("Notifications", BellRing, (
          <>
            {renderRow(Bell, "Glucose Alerts", undefined, undefined, true, glucoseAlerts, setGlucoseAlerts)}
            {renderRow(Clock, "Log Reminders", undefined, undefined, true, reminders, setReminders)}
          </>
        ))}

        {renderSection("App Customization", Palette, (
          <>
            {renderRow(Globe, "Language", "English")}
            {renderRow(Palette, "App Theme", mode.charAt(0).toUpperCase() + mode.slice(1), handleToggleTheme)}
            {renderRow(Type, "Text Size", "Medium")}
          </>
        ))}

        {renderSection("Subscription", CreditCard, (
          <>
            {renderRow(Wallet, "Current Plan", "Premium")}
            {renderRow(ArrowUpDown, "Change Plan")}
            {renderRow(Receipt, "Billing History")}
          </>
        ))}

        {renderSection("Support", HelpCircle, (
          <>
            {renderRow(Globe, "API Base URL", apiBaseUrl, () => {
              // On iOS/Android we can prompt or alert to set it
              Alert.alert(
                "Change API URL",
                `Current URL: ${apiBaseUrl}\nTo modify, update the default base URL in src/services/authApi.ts or configure your backend connection.`,
                [{ text: "OK" }]
              );
            })}
            {renderRow(FileText, "Terms of Service", undefined, () => {})}
            {renderRow(Info, "About DiabAI", undefined, () => {})}
          </>
        ))}

        <Text style={[styles.versionText, { color: C.textXs }]}>DiabAI Native v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sectionHeaderText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sectionContent: { borderWidth: 1, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  rowIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowMain: { flex: 1 },
  rowText: { fontSize: 15, fontWeight: '600' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 13, fontWeight: '500' },
  versionText: { textAlign: 'center', fontSize: 12, marginTop: 16 },
});

export default SettingsScreen;
