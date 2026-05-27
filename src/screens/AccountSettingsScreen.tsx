import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { 
  User, Mail, Phone, MapPin, ChevronLeft, Camera, Lock, Calendar, Scale, Ruler
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../services/authApi';
import { apiService } from '../services/apiService';
import { useUser } from '../context/UserContext';

interface AccountSettingsScreenProps {
  onBack: () => void;
}

  const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({ onBack }) => {
  const { C } = useTheme();
  const { profile: userProfile, updateProfile } = useUser();
  const [form, setForm] = useState({
    fullName: userProfile?.name || "",
    email: userProfile?.email || "",
    phone: userProfile?.phone_number || "",
    address: userProfile?.address || "",
    age: userProfile?.age ? userProfile.age.toString() : "",
    weight: userProfile?.weight ? userProfile.weight.toString() : "",
    height: userProfile?.height ? userProfile.height.toString() : "",
    sex: userProfile?.sex || "male",
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&.])[A-Za-z\d@$!%?&.]{8,}$/;

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return 'Password must be at least 8 characters long.';
    if (!passwordRegex.test(pass)) {
      return 'Password must include uppercase, lowercase, a number, and a special character (@$!%?&.).';
    }
    return null;
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      await updateProfile({
        name: form.fullName,
        email: form.email,
        phone_number: form.phone,
        address: form.address,
        age: form.age ? parseInt(form.age) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        height: form.height ? parseInt(form.height) : undefined,
        sex: form.sex as any,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setSaveError(e.message || 'Failed to save settings');
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPasswordError('All password fields are required.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }

    const passwordValError = validatePassword(passwords.new);
    if (passwordValError) {
      setPasswordError(passwordValError);
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await authApi.changePassword(passwords.current, passwords.new, passwords.confirm);
      setPasswordSuccess('Password changed successfully.');
      setPasswords({ current: '', new: '', confirm: '' });
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (e: any) {
      if (e.errors) {
        const firstError = Object.values(e.errors)[0] as string[];
        setPasswordError(firstError[0] || e.message);
      } else {
        setPasswordError(e.message || 'Failed to change password.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const fields = [
    { 
      key: "fullName", 
      label: "Full Name", 
      icon: User 
    },
    { 
      key: "email", 
      label: "Email", 
      icon: Mail,
      keyboardType: "email-address" as const 
    },
    { 
      key: "phone", 
      label: "Phone Number", 
      icon: Phone,
      keyboardType: "phone-pad" as const 
    },
    { 
      key: "address", 
      label: "Address", 
      icon: MapPin 
    },
    { 
      key: "age", 
      label: "Age (years)", 
      icon: Calendar,
      keyboardType: "numeric" as const 
    },
    { 
      key: "weight", 
      label: "Weight (kg)", 
      icon: Scale,
      keyboardType: "numeric" as const 
    },
    { 
      key: "height", 
      label: "Height (cm)", 
      icon: Ruler,
      keyboardType: "numeric" as const 
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.redBorder }]}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.85}
            style={[styles.backButton, { backgroundColor: C.red }]}
          >
            <ChevronLeft size={20} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.redDark }]}>Account Settings</Text>
        </View>

        {/* Profile Avatar */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarWrapper, { borderColor: C.redBorder }]}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' }}
              style={styles.avatarImage}
            />
            <TouchableOpacity style={[styles.cameraButton, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
              <Camera size={14} color={C.red} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {fields.map((f) => {
            const IconComponent = f.icon;
            const isFocused = focusedField === f.key;
            return (
              <View key={f.key} style={styles.fieldContainer}>
                <Text style={[
                  styles.label, 
                  { color: isFocused ? C.red : C.textSm }
                ]}>
                  {f.label}
                </Text>
                <View style={[
                  styles.inputWrapper,
                  { 
                    backgroundColor: C.redBg || '#F5DEDE',
                    borderColor: isFocused ? C.red : (C.redBorder || '#EAC5C5')
                  }
                ]}>
                  <View style={styles.iconWrapper}>
                    <IconComponent size={18} color={C.textXs || '#C88686'} strokeWidth={1.8} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: C.text }]}
                    value={form[f.key as keyof typeof form]}
                    onChangeText={(val) => setForm({ ...form, [f.key]: val })}
                    onFocus={() => setFocusedField(f.key)}
                    onBlur={() => setFocusedField(null)}
                    keyboardType={f.keyboardType || "default"}
                    placeholder={f.label}
                    placeholderTextColor="#C88686"
                    autoCorrect={false}
                  />
                </View>
              </View>
            );
          })}

          {/* Sex Selection */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: C.textSm, marginBottom: 8 }]}>Gender</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setForm({ ...form, sex: 'male' })}
                style={[
                  styles.genderButton,
                  {
                    backgroundColor: form.sex === 'male' ? C.red : (C.redBg || '#F5DEDE'),
                    borderColor: form.sex === 'male' ? C.red : (C.redBorder || '#EAC5C5'),
                  }
                ]}
              >
                <Text style={[
                  styles.genderButtonText,
                  { color: form.sex === 'male' ? '#FFF' : (C.text || '#000') }
                ]}>Male</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setForm({ ...form, sex: 'female' })}
                style={[
                  styles.genderButton,
                  {
                    backgroundColor: form.sex === 'female' ? C.red : (C.redBg || '#F5DEDE'),
                    borderColor: form.sex === 'female' ? C.red : (C.redBorder || '#EAC5C5'),
                  }
                ]}
              >
                <Text style={[
                  styles.genderButtonText,
                  { color: form.sex === 'female' ? '#FFF' : (C.text || '#000') }
                ]}>Female</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonWrapper}>
          {saveError && <Text style={[styles.errorText, { marginBottom: 12 }]}>{saveError}</Text>}
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.85}
            style={[
              styles.saveButton,
              { backgroundColor: saved ? '#16A34A' : '#D7181D' }
            ]}
          >
            <Text style={styles.saveButtonText}>
              {saved ? "✓ Saved" : "Save Settings"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Change Password Section */}
        <View style={[styles.sectionDivider, { backgroundColor: C.redBorder }]} />
        
        <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: C.redDark }]}>Security</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: C.textSm }]}>Current Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: C.redBg || '#F5DEDE', borderColor: C.redBorder }]}>
              <View style={styles.iconWrapper}>
                <Lock size={18} color={C.textXs} strokeWidth={1.8} />
              </View>
              <TextInput
                style={[styles.input, { color: C.text }]}
                value={passwords.current}
                onChangeText={(val) => setPasswords({ ...passwords, current: val })}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#C88686"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: C.textSm }]}>New Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: C.redBg || '#F5DEDE', borderColor: C.redBorder }]}>
              <View style={styles.iconWrapper}>
                <Lock size={18} color={C.textXs} strokeWidth={1.8} />
              </View>
              <TextInput
                style={[styles.input, { color: C.text }]}
                value={passwords.new}
                onChangeText={(val) => setPasswords({ ...passwords, new: val })}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#C88686"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: C.textSm }]}>Confirm New Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: C.redBg || '#F5DEDE', borderColor: C.redBorder }]}>
              <View style={styles.iconWrapper}>
                <Lock size={18} color={C.textXs} strokeWidth={1.8} />
              </View>
              <TextInput
                style={[styles.input, { color: C.text }]}
                value={passwords.confirm}
                onChangeText={(val) => setPasswords({ ...passwords, confirm: val })}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#C88686"
              />
            </View>
          </View>

          {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
          {passwordSuccess && <Text style={styles.successText}>{passwordSuccess}</Text>}

          <TouchableOpacity
            onPress={handleChangePassword}
            disabled={isChangingPassword}
            activeOpacity={0.85}
            style={[styles.passwordButton, { borderColor: C.red }]}
          >
            {isChangingPassword ? (
              <Text style={{ color: C.red }}>Updating...</Text>
            ) : (
              <Text style={{ color: C.red, fontWeight: 'bold' }}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  cameraButton: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 0,
    right: 0,
  },
  form: {
    paddingHorizontal: 20,
    gap: 20,
  },
  fieldContainer: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    height: 56,
    paddingHorizontal: 16,
  },
  iconWrapper: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  buttonWrapper: {
    paddingHorizontal: 40,
    paddingTop: 32,
  },
  saveButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D7181D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionDivider: {
    height: 1,
    marginHorizontal: 20,
    marginVertical: 32,
    opacity: 0.3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  passwordButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  errorText: {
    color: '#D7181D',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  successText: {
    color: '#16A34A',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  genderButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AccountSettingsScreen;
