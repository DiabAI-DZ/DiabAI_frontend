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
  User, Mail, Phone, MapPin, ChevronLeft, Camera 
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface AccountSettingsScreenProps {
  onBack: () => void;
}

const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({ onBack }) => {
  const { C } = useTheme();
  const [form, setForm] = useState({
    fullName: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    address: "123 Maple Street, Springfield",
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.redBorder }]}>
          <TouchableOpacity
            onClick={onBack} // using onPress
            onPress={onBack}
            activeOpacity={0.85}
            style={[styles.backButton, { backgroundColor: C.red }]}
          >
            <ChevronLeft size={20} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.accent }]}>Account Settings</Text>
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
                    backgroundColor: C.inputBg || '#F5DEDE',
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
        </View>

        {/* Save Button */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.85}
            style={[
              styles.saveButton,
              { backgroundColor: saved ? '#16A34A' : '#D7181D' }
            ]}
          >
            <Text style={styles.saveButtonText}>
              {saved ? "✓ Saved" : "Save"}
            </Text>
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
});

export default AccountSettingsScreen;
