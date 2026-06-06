import React from 'react';
import { KeyboardTypeOptions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Phone, MapPin, ChevronLeft, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/borderRadius';
import { useAccountSettings, type AccountFieldKey } from './hooks/useAccountSettings';
import ProfileAvatar from './components/ProfileAvatar';
import AccountField from './components/AccountField';

interface AccountSettingsScreenProps {
  onBack: () => void;
}

const FIELDS: { key: AccountFieldKey; label: string; icon: LucideIcon; keyboardType?: KeyboardTypeOptions }[] = [
  { key: 'fullName', label: 'Full Name', icon: User },
  { key: 'email', label: 'Email', icon: Mail, keyboardType: 'email-address' },
  { key: 'phone', label: 'Phone Number', icon: Phone, keyboardType: 'phone-pad' },
  { key: 'address', label: 'Address', icon: MapPin },
];

const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({ onBack }) => {
  const { C, colors } = useTheme();
  const a = useAccountSettings();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { borderBottomColor: C.redBorder }]}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.85} style={[styles.backButton, { backgroundColor: C.red }]}>
            <ChevronLeft size={20} color={colors.textOnPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.redDark }]}>Account Settings</Text>
        </View>

        <ProfileAvatar uri={a.avatarUri} uploading={a.uploadingAvatar} onPick={a.pickAvatar} />

        <View style={styles.form}>
          {FIELDS.map((f) => (
            <AccountField
              key={f.key}
              label={f.label}
              icon={f.icon}
              value={a.form[f.key]}
              onChangeText={(val) => a.setField(f.key, val)}
              keyboardType={f.keyboardType}
            />
          ))}
        </View>

        <View style={styles.buttonWrapper}>
          {a.saveError && <Text style={[styles.errorText, { color: colors.criticalText }]}>{a.saveError}</Text>}
          <TouchableOpacity
            onPress={a.save}
            activeOpacity={0.85}
            style={[styles.saveButton, { backgroundColor: a.saved ? colors.success : colors.criticalText, shadowColor: colors.shadow }]}
          >
            <Text style={[styles.saveButtonText, { color: colors.textOnPrimary }]}>{a.saved ? '✓ Saved' : 'Save Settings'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: spacing.xxxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.lg,
  },
  backButton: { width: 36, height: 36, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', letterSpacing: 1.5 },
  form: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  buttonWrapper: { paddingHorizontal: spacing.xxxxl, paddingTop: spacing.xxxl },
  errorText: { fontSize: 14, textAlign: 'center', fontWeight: '600', marginBottom: spacing.md },
  saveButton: {
    width: '100%',
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: { fontSize: 18, fontWeight: 'bold' },
});

export default AccountSettingsScreen;
