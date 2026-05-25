import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { 
  User, Lock, LogOut, Syringe, Target, Ruler, 
  Bell, Heart, Palette, ChevronRight, HelpCircle, Info,
  Sun, Moon, Monitor, Globe, Type, CreditCard, Wallet, 
  ArrowUpDown, Receipt, BellRing, Clock, FileText, Settings,
  AlertTriangle, Check, CheckCircle2, Shield, X, BarChart3,
  Share2, Cloud, FileDown
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Sub-Component: Center Popup Modal
interface PopupProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const CenterPopup: React.FC<PopupProps> = ({ open, onClose, title, children }) => {
  const { C } = useTheme();
  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.popupOverlay}>
        <TouchableOpacity style={styles.popupDismissArea} activeOpacity={1} onPress={onClose} />
        <View style={[styles.popupCard, { backgroundColor: C.white, borderColor: C.redBorder }]}>
          <View style={[styles.popupHeader, { borderBottomColor: C.divider }]}>
            <Text style={[styles.popupTitleText, { color: C.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={[styles.popupCloseBtn, { backgroundColor: C.redBg }]}>
              <X size={15} color={C.redMuted} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.popupScroll} contentContainerStyle={{ paddingVertical: 12 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Sub-Component: Selectable Option Row
interface SelectOptionProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  subtitle?: string;
  icon?: React.ReactNode;
}

const SelectOption: React.FC<SelectOptionProps> = ({ label, selected, onSelect, subtitle, icon }) => {
  const { C, isDark } = useTheme();
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[
        styles.selectOptionBtn,
        {
          backgroundColor: selected ? C.redBg : (isDark ? "#222226" : "#FAFAFA"),
          borderColor: selected ? C.red : C.divider
        }
      ]}
    >
      {icon && (
        <View
          style={[
            styles.selectOptionIconBox,
            { backgroundColor: selected ? "rgba(196,30,38,0.1)" : "#F0EDED" }
          ]}
        >
          {icon}
        </View>
      )}
      <View style={styles.selectOptionMain}>
        <Text style={[styles.selectOptionTitleText, { color: selected ? C.red : C.text, fontWeight: selected ? '700' : '600' }]}>
          {label}
        </Text>
        {subtitle && (
          <Text style={[styles.selectOptionSubtext, { color: C.textSm }]}>{subtitle}</Text>
        )}
      </View>
      <View
        style={[
          styles.selectOptionRadio,
          {
            backgroundColor: selected ? C.red : "transparent",
            borderColor: selected ? C.red : (isDark ? "#555" : "#D1D5DB")
          }
        ]}
      >
        {selected && <Check size={10} color="white" strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  );
};

// Sub-Component: Target Glucose Range Slider
const TargetGlucoseSlider: React.FC<{
  min: number;
  max: number;
  minVal: number;
  maxVal: number;
  onChange: (min: number, max: number) => void;
}> = ({ min, max, minVal, maxVal, onChange }) => {
  const { C, isDark } = useTheme();
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  
  const trackWidth = width - 80;

  const handleTrackTouch = (event: any) => {
    const touchX = event.nativeEvent.locationX;
    const touchedPct = (touchX / trackWidth) * 100;
    const value = Math.round(min + (touchedPct / 100) * (max - min));
    
    const distToMin = Math.abs(value - minVal);
    const distToMax = Math.abs(value - maxVal);
    
    if (distToMin < distToMax) {
      onChange(Math.min(Math.max(min, value), maxVal - 5), maxVal);
    } else {
      onChange(minVal, Math.max(Math.min(max, value), minVal + 5));
    }
  };

  return (
    <View style={styles.sliderWrap}>
      <View style={styles.sliderValuesRow}>
        <View style={styles.sliderValBox}>
          <Text style={[styles.sliderValSub, { color: C.textSm }]}>Minimum</Text>
          <Text style={[styles.sliderValText, { color: C.red }]}>{minVal}</Text>
          <Text style={[styles.sliderValUnit, { color: C.textSm }]}>mg/dL</Text>
        </View>
        <View style={[styles.sliderValDivider, { backgroundColor: C.divider }]} />
        <View style={styles.sliderValBox}>
          <Text style={[styles.sliderValSub, { color: C.textSm }]}>Maximum</Text>
          <Text style={[styles.sliderValText, { color: C.red }]}>{maxVal}</Text>
          <Text style={[styles.sliderValUnit, { color: C.textSm }]}>mg/dL</Text>
        </View>
      </View>

      <View 
        style={[styles.sliderTrackContainer, { width: trackWidth }]}
        onStartShouldSetResponder={() => true}
        onResponderRelease={handleTrackTouch}
      >
        <View style={[styles.sliderBgTrack, { backgroundColor: isDark ? "#2A2A30" : "#F0EDED" }]} />
        <LinearGradient
          colors={[C.red, C.redLight]}
          style={[styles.sliderActiveTrack, { left: `${pct(minVal)}%`, width: `${pct(maxVal) - pct(minVal)}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={[styles.sliderHandle, { left: `${pct(minVal)}%`, borderColor: C.red }]} />
        <View style={[styles.sliderHandle, { left: `${pct(maxVal)}%`, borderColor: C.red }]} />
      </View>

      <View style={styles.sliderPresetsRow}>
        {[
          { label: "Normal", mn: 70, mx: 140 },
          { label: "Tight", mn: 80, mx: 130 },
          { label: "Relaxed", mn: 60, mx: 160 },
        ].map((p) => {
          const active = minVal === p.mn && maxVal === p.mx;
          return (
            <TouchableOpacity
              key={p.label}
              onPress={() => onChange(p.mn, p.mx)}
              style={[
                styles.sliderPresetBtn,
                {
                  backgroundColor: active ? C.redBg : (isDark ? "#222226" : "#FAFAFA"),
                  borderColor: active ? C.red : C.divider
                }
              ]}
            >
              <Text style={[styles.sliderPresetText, { color: active ? C.red : C.textMd }]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Sub-Component: Section Grid Card
interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children }) => {
  const { C, isDark } = useTheme();
  return (
    <View style={styles.sectionContainer}>
      <View style={[styles.sectionCardFrame, { backgroundColor: C.white, borderColor: isDark ? (C.redBorder || '#555') : "rgba(196,30,38,0.18)" }]}>
        <LinearGradient
          colors={[C.red, C.redDark]}
          style={styles.sectionHeaderBand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.sectionHeaderIconBox}>{icon}</View>
          <Text style={styles.sectionHeaderTitleText}>{title}</Text>
        </LinearGradient>
        <View style={styles.sectionBody}>
          {React.Children.map(children, (child, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={[styles.rowDivider, { backgroundColor: C.divider }]} />}
              {child}
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
};

// Sub-Component: Setting Row Item
interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  value?: string;
  badge?: { label: string; color: string; bg: string };
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, label, subtitle, toggle, toggleValue, onToggle, onClick, value, badge }) => {
  const { C, isDark } = useTheme();
  return (
    <TouchableOpacity
      style={styles.settingRowBtn}
      onPress={toggle ? onToggle : onClick}
      disabled={!onClick && !toggle}
    >
      <View style={[styles.settingRowIconBox, { backgroundColor: C.redBg }]}>
        {icon}
      </View>
      <View style={styles.settingRowMain}>
        <Text style={[styles.settingRowLabelText, { color: C.text }]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.settingRowSubtitleText, { color: C.textSm }]}>{subtitle}</Text>
        )}
      </View>
      {toggle ? (
        <Switch 
          value={toggleValue} 
          onValueChange={onToggle}
          trackColor={{ false: '#DDD', true: C.red }}
          thumbColor="#FFF"
        />
      ) : (
        <View style={styles.settingRowRight}>
          {badge && (
            <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          )}
          {value ? (
            <View style={styles.valueRowCompact}>
              <Text style={[styles.valueTextLabel, { color: C.textSm }]}>{value}</Text>
              <ChevronRight size={16} color={C.textSm} />
            </View>
          ) : (
            <ChevronRight size={18} color={C.textSm} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

interface SettingsScreenProps {
  onNavigateAccountSettings?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigateAccountSettings }) => {
  const { C, isDark, mode, setMode } = useTheme();
  const { profile, updateProfile, signOut, apiBaseUrl } = useUser();

  const [glucoseAlerts, setGlucoseAlerts] = useState(true);
  const [hypoAlerts, setHypoAlerts] = useState(true);
  const [reminders, setReminders] = useState(false);

  // Modals Visibility
  const [diabetesPopup, setDiabetesPopup] = useState(false);
  const [themePopup, setThemePopup] = useState(false);
  const [unitsPopup, setUnitsPopup] = useState(false);
  const [rangePopup, setRangePopup] = useState(false);
  const [langPopup, setLangPopup] = useState(false);
  const [textSizePopup, setTextSizePopup] = useState(false);
  const [planPopup, setPlanPopup] = useState(false);
  const [historyPopup, setHistoryPopup] = useState(false);
  const [billingPopup, setBillingPopup] = useState(false);

  // Local preferences states
  const [targetMin, setTargetMin] = useState(profile?.goals?.min || 70);
  const [targetMax, setTargetMax] = useState(profile?.goals?.max || 140);
  const [language, setLanguage] = useState("English");
  const [textSize, setTextSize] = useState("Medium");
  const [selectedPlanId, setSelectedPlanId] = useState("premium");

  const iconProps = { size: 18, color: C.redMuted, strokeWidth: 1.8 };

  const handleSignOut = () => {
    const performSignOut = () => {
      signOut();
    };

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm("Are you sure you want to sign out?")) {
        performSignOut();
      }
    } else {
      Alert.alert(
        "Sign Out",
        "Are you sure you want to sign out?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign Out", style: "destructive", onPress: performSignOut }
        ]
      );
    }
  };

  const handleThemeSelect = (themeLabel: string) => {
    if (themeLabel === "Light Mode") setMode("light");
    else if (themeLabel === "Dark Mode") setMode("dark");
    else setMode("system");
    setThemePopup(false);
  };

  const handleSaveGlucoseGoals = () => {
    updateProfile({
      goals: { min: targetMin, max: targetMax }
    });
    setRangePopup(false);
  };

  const currentThemeLabel = useMemo(() => {
    if (mode === 'light') return "Light";
    if (mode === 'dark') return "Dark";
    return "System";
  }, [mode]);

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      
      {/* Header strip */}
      <View style={[styles.headerStrip, { backgroundColor: C.white, borderBottomColor: C.redBorder }]}>
        <Text style={[styles.headerTitleText, { color: C.textDark }]}>Settings</Text>
        <Text style={[styles.headerSubtitleText, { color: C.textSm }]}>Manage your account and health preferences</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <SectionCard title="Account Settings" icon={<Settings size={11} color="#FFF" />}>
          <SettingRow 
            icon={<User {...iconProps} />} 
            label="Profile Information" 
            subtitle={profile?.name || profile?.email} 
            onClick={onNavigateAccountSettings}
          />
          <SettingRow 
            icon={<Lock {...iconProps} />} 
            label="Change Password" 
            onClick={onNavigateAccountSettings}
          />
          <SettingRow icon={<LogOut {...iconProps} />} label="Sign Out" onClick={handleSignOut} />
        </SectionCard>

        <SectionCard title="Health Settings" icon={<Heart size={11} color="#FFF" />}>
          <SettingRow 
            icon={<Syringe {...iconProps} />} 
            label="Diabetes Type" 
            value={profile?.diabetesType || "Type 2"} 
            onClick={() => setDiabetesPopup(true)} 
          />
          <SettingRow 
            icon={<Target {...iconProps} />} 
            label="Target Glucose Range" 
            value={`${targetMin}–${targetMax} mg/dL`} 
            onClick={() => setRangePopup(true)} 
          />
          <SettingRow 
            icon={<Ruler {...iconProps} />} 
            label="Units" 
            value={profile?.glucoseUnit || "mg/dL"} 
            onClick={() => setUnitsPopup(true)} 
          />
        </SectionCard>

        <SectionCard title="Data & Reports" icon={<BarChart3 size={11} color="#FFF" />}>
          <SettingRow icon={<FileDown {...iconProps} />} label="Export Health Report" />
          <SettingRow icon={<Share2 {...iconProps} />} label="Share with Doctor" />
          <SettingRow icon={<Cloud {...iconProps} />} label="Sync & Backup" subtitle={`Connected: ${apiBaseUrl}`} />
        </SectionCard>

        <SectionCard title="Notifications" icon={<BellRing size={11} color="#FFF" />}>
          <SettingRow
            icon={<Bell {...iconProps} />}
            label="Glucose Alerts"
            subtitle="Alert when out of range"
            toggle 
            toggleValue={glucoseAlerts}
            onToggle={() => setGlucoseAlerts(!glucoseAlerts)}
          />
          <SettingRow
            icon={<AlertTriangle {...iconProps} />}
            label="Hypoglycemia Alerts"
            subtitle="Critical low warnings"
            toggle 
            toggleValue={hypoAlerts}
            onToggle={() => setHypoAlerts(!hypoAlerts)}
          />
          <SettingRow
            icon={<Clock {...iconProps} />}
            label="Reminders"
            subtitle="Measurement reminders"
            toggle 
            toggleValue={reminders}
            onToggle={() => setReminders(!reminders)}
          />
        </SectionCard>

        <SectionCard title="App Preferences" icon={<Palette size={11} color="#FFF" />}>
          <SettingRow icon={<Globe {...iconProps} />} label="Language" value={language} onClick={() => setLangPopup(true)} />
          <SettingRow icon={<Sun {...iconProps} />} label="Theme" value={currentThemeLabel} onClick={() => setThemePopup(true)} />
          <SettingRow icon={<Type {...iconProps} />} label="Text Size" value={textSize} onClick={() => setTextSizePopup(true)} />
        </SectionCard>

        <SectionCard title="Payment Settings" icon={<CreditCard size={11} color="#FFF" />}>
          <SettingRow
            icon={<Wallet {...iconProps} />}
            label="Current Plan"
            subtitle="Premium Plan · $4.99/month"
            badge={{ label: "Active", color: "#16A34A", bg: isDark ? "#132A1B" : "#DCFCE7" }}
          />
          <SettingRow
            icon={<ArrowUpDown {...iconProps} />}
            label="Change Plan"
            subtitle="Upgrade or downgrade your subscription"
            onClick={() => setPlanPopup(true)}
          />
          <SettingRow
            icon={<Receipt {...iconProps} />}
            label="Payment History"
            subtitle="View your past transactions"
            onClick={() => setHistoryPopup(true)}
          />
          <SettingRow
            icon={<CreditCard {...iconProps} />}
            label="Billing Method"
            subtitle="Visa **** 4242"
            onClick={() => setBillingPopup(true)}
          />
        </SectionCard>

        <SectionCard title="Legal & Support" icon={<Shield size={11} color="#FFF" />}>
          <SettingRow icon={<FileText {...iconProps} />} label="Terms & Privacy Policy" />
          <SettingRow icon={<HelpCircle {...iconProps} />} label="Contact & Support" />
          <SettingRow icon={<Info {...iconProps} />} label="About App" />
        </SectionCard>

        <Text style={[styles.versionText, { color: C.textSm }]}>DiabAI Native v1.1.0</Text>
      </ScrollView>

      {/* --- Modals and Popups Dialogs --- */}

      {/* Diabetes Type Popup */}
      <CenterPopup open={diabetesPopup} onClose={() => setDiabetesPopup(false)} title="Select Diabetes Type">
        {[
          { label: "Type 1", sub: "Autoimmune condition" },
          { label: "Type 2", sub: "Insulin resistance" },
          { label: "Gestational", sub: "During pregnancy" },
        ].map((t) => (
          <SelectOption
            key={t.label}
            label={t.label}
            subtitle={t.sub}
            selected={profile?.diabetesType === t.label}
            onSelect={() => {
              updateProfile({ diabetesType: t.label as any });
              setDiabetesPopup(false);
            }}
          />
        ))}
      </CenterPopup>

      {/* Theme Selection Popup */}
      <CenterPopup open={themePopup} onClose={() => setThemePopup(false)} title="Select App Theme">
        {[
          { label: "Light Mode", ic: <Sun size={17} color={C.redMuted} /> },
          { label: "Dark Mode", ic: <Moon size={17} color={C.redMuted} /> },
          { label: "System Default", ic: <Monitor size={17} color={C.redMuted} /> },
        ].map((t) => (
          <SelectOption
            key={t.label}
            label={t.label}
            icon={t.ic}
            selected={currentThemeLabel + " Mode" === t.label || (mode === 'system' && t.label === "System Default")}
            onSelect={() => handleThemeSelect(t.label)}
          />
        ))}
      </CenterPopup>

      {/* Units Selection Popup */}
      <CenterPopup open={unitsPopup} onClose={() => setUnitsPopup(false)} title="Glucose Units">
        {[
          { label: "mg/dL", sub: "Milligrams per deciliter (US standard)" },
          { label: "mmol/L", sub: "Millimoles per liter (International)" },
        ].map((u) => (
          <SelectOption
            key={u.label}
            label={u.label}
            subtitle={u.sub}
            selected={profile?.glucoseUnit === u.label}
            onSelect={() => {
              updateProfile({ glucoseUnit: u.label as any });
              setUnitsPopup(false);
            }}
          />
        ))}
      </CenterPopup>

      {/* Target Glucose Range Custom Slider Popup */}
      <CenterPopup open={rangePopup} onClose={() => setRangePopup(false)} title="Set Target Range">
        <TargetGlucoseSlider
          min={40}
          max={250}
          minVal={targetMin}
          maxVal={targetMax}
          onChange={(mn, mx) => { setTargetMin(mn); setTargetMax(mx); }}
        />
        <TouchableOpacity onPress={handleSaveGlucoseGoals} style={[styles.popupSaveBtn, { backgroundColor: C.red }]}>
          <Text style={styles.popupSaveBtnText}>Confirm Range</Text>
        </TouchableOpacity>
      </CenterPopup>

      {/* Language Popup */}
      <CenterPopup open={langPopup} onClose={() => setLangPopup(false)} title="Language">
        {[
          { label: "English", sub: "English" },
          { label: "French", sub: "Français" },
          { label: "Arabic", sub: "العربية" },
        ].map((l) => (
          <SelectOption
            key={l.label}
            label={l.label}
            subtitle={l.sub}
            selected={language === l.label}
            onSelect={() => {
              setLanguage(l.label);
              setLangPopup(false);
            }}
          />
        ))}
      </CenterPopup>

      {/* Text Size Popup */}
      <CenterPopup open={textSizePopup} onClose={() => setTextSizePopup(false)} title="Text Size">
        {[
          { label: "Small", sub: "Compact — fits more content on screen" },
          { label: "Medium", sub: "Default — balanced readability" },
          { label: "Large", sub: "Comfortable — easier on the eyes" },
          { label: "Extra Large", sub: "Accessibility — maximum readability" },
        ].map((s) => (
          <SelectOption
            key={s.label}
            label={s.label}
            subtitle={s.sub}
            selected={textSize === s.label}
            onSelect={() => {
              setTextSize(s.label);
              setTextSizePopup(false);
            }}
            icon={
              <Text style={{ fontSize: s.label === "Small" ? 11 : s.label === "Medium" ? 14 : s.label === "Large" ? 17 : 20, fontWeight: '700', color: C.redMuted }}>
                Aa
              </Text>
            }
          />
        ))}
      </CenterPopup>

      {/* Choose Subscription Plan Popup */}
      <CenterPopup open={planPopup} onClose={() => setPlanPopup(false)} title="Choose Subscription Plan">
        {[
          { id: "free", label: "Basic Plan", sub: "Glucose tracking only", price: "$0.00", icon: <Heart size={16} color={C.red} /> },
          { id: "premium", label: "Premium Plan", sub: "AI Insights & Food Scanner", price: "$4.99/mo", icon: <CreditCard size={16} color={C.red} /> },
          { id: "pro", label: "Pro Consultant Plan", sub: "Doctor sharing pipeline", price: "$9.99/mo", icon: <Shield size={16} color={C.red} /> },
        ].map((p) => (
          <SelectOption
            key={p.id}
            label={p.label}
            subtitle={`${p.sub} · ${p.price}`}
            selected={selectedPlanId === p.id}
            onSelect={() => {
              setSelectedPlanId(p.id);
              setPlanPopup(false);
            }}
            icon={p.icon}
          />
        ))}
      </CenterPopup>

      {/* Payment Transactions History Popup */}
      <CenterPopup open={historyPopup} onClose={() => setHistoryPopup(false)} title="Payment Transactions">
        <View style={styles.transactionsWrap}>
          {[
            { date: "Mar 1, 2026", desc: "Premium Plan – Monthly", amount: "$4.99", status: "Paid" },
            { date: "Feb 1, 2026", desc: "Premium Plan – Monthly", amount: "$4.99", status: "Paid" },
            { date: "Jan 1, 2026", desc: "Premium Plan – Monthly", amount: "$4.99", status: "Paid" },
          ].map((tx, i) => (
            <View
              key={i}
              style={[
                styles.transactionRow,
                { borderBottomColor: C.divider, borderBottomWidth: i < 2 ? 1 : 0 }
              ]}
            >
              <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: C.redBg }]}>
                  <Receipt size={16} color={C.redMuted} />
                </View>
                <View>
                  <Text style={[styles.transactionTitle, { color: C.text }]}>{tx.desc}</Text>
                  <Text style={[styles.transactionDate, { color: C.textSm }]}>{tx.date}</Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={[styles.transactionAmount, { color: C.text }]}>{tx.amount}</Text>
                <View style={styles.transactionStatusRow}>
                  <CheckCircle2 size={10} color={C.green} />
                  <Text style={[styles.transactionStatusText, { color: C.green }]}>{tx.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </CenterPopup>

      {/* Billing Method Popup */}
      <CenterPopup open={billingPopup} onClose={() => setBillingPopup(false)} title="Billing Method">
        <View style={[styles.billingCard, { backgroundColor: C.redBg, borderColor: C.red }]}>
          <View style={[styles.billingIcon, { backgroundColor: C.red }]}>
            <CreditCard size={20} color="#FFF" />
          </View>
          <View style={styles.billingCardDetails}>
            <Text style={[styles.billingCardTitle, { color: C.text }]}>Visa **** 4242</Text>
            <Text style={[styles.billingCardSub, { color: C.textSm }]}>Expires 08 / 27</Text>
          </View>
          <View style={[styles.billingBadge, { backgroundColor: isDark ? "#132A1B" : "#DCFCE7" }]}>
            <CheckCircle2 size={11} color={C.green} />
            <Text style={[styles.billingBadgeText, { color: C.green }]}>Default</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.addBillingBtn, { borderColor: C.divider }]}>
          <Text style={[styles.addBillingText, { color: C.text }]}>Add New Card</Text>
        </TouchableOpacity>
      </CenterPopup>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerStrip: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '900',
  },
  headerSubtitleText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 60,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionCardFrame: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderBand: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    paddingHorizontal: 12,
    gap: 6,
  },
  sectionHeaderIconBox: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitleText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionBody: {
    paddingVertical: 4,
  },
  rowDivider: {
    height: 1,
  },
  settingRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  settingRowIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRowMain: {
    flex: 1,
  },
  settingRowLabelText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  settingRowSubtitleText: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePill: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  valueRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  valueTextLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },

  // --- POPUP DIALOGS ---
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  popupDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  popupCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    maxHeight: '75%',
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  popupTitleText: {
    fontSize: 16,
    fontWeight: '800',
  },
  popupCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupScroll: {
    paddingHorizontal: 16,
  },
  selectOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  selectOptionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectOptionMain: {
    flex: 1,
  },
  selectOptionTitleText: {
    fontSize: 14,
  },
  selectOptionSubtext: {
    fontSize: 11.5,
    marginTop: 1,
  },
  selectOptionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupSaveBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  popupSaveBtnText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: 'bold',
  },

  // --- TARGET RANGE SLIDER ---
  sliderWrap: {
    padding: 8,
  },
  sliderValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sliderValBox: {
    flex: 1,
    alignItems: 'center',
  },
  sliderValSub: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  sliderValText: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },
  sliderValUnit: {
    fontSize: 9,
    fontWeight: '600',
  },
  sliderValDivider: {
    width: 16,
    height: 2,
    marginHorizontal: 10,
  },
  sliderTrackContainer: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sliderBgTrack: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  sliderActiveTrack: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
  },
  sliderHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    backgroundColor: '#FFF',
    top: '50%',
    marginTop: -10,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderPresetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sliderPresetBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 8,
    alignItems: 'center',
  },
  sliderPresetText: {
    fontSize: 11.5,
    fontWeight: 'bold',
  },

  // --- TRANSACTIONS POPUP ---
  transactionsWrap: {
    gap: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionTitle: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 1,
  },
  transactionAmount: {
    fontSize: 13.5,
    fontWeight: 'bold',
  },
  transactionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  transactionStatusText: {
    fontSize: 9.5,
    fontWeight: '700',
  },

  // --- BILLING POPUP ---
  billingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  billingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billingCardDetails: {
    flex: 1,
  },
  billingCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  billingCardSub: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },
  billingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  billingBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  addBillingBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addBillingText: {
    fontSize: 13.5,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
