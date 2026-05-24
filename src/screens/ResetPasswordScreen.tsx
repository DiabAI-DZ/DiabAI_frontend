import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Eye, EyeOff } from 'lucide-react-native';
import { authApi } from '../services/authApi';
import { LOGO_SVG } from '../assets/svgData';

interface ResetPasswordScreenProps {
  email: string;
  onSuccess: () => void;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  email: initialEmail,
  onSuccess,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  const [obscureConfirmPassword, setObscureConfirmPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/;

  const handleResetPassword = async () => {
    const trimmedEmail = email.trim();
    const trimmedOtp = otp.trim();

    if (!trimmedEmail || !trimmedOtp || !password || !confirmPassword) {
      setErrorMessage('All fields are required.');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (trimmedOtp.length !== 6) {
      setErrorMessage('OTP must be 6 digits.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await authApi.resetPassword(trimmedEmail, trimmedOtp, password, confirmPassword);
      setSuccessMessage('Password reset successful. Please sign in again.');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (e: any) {
      setErrorMessage(e.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrapper}>
            <SvgXml xml={LOGO_SVG} width={100} height={100} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>You can change your password</Text>
          </View>

          <View style={styles.form}>
            {/* Email Field */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#C88686"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

            {/* Password Field */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                placeholder="Password"
                placeholderTextColor="#C88686"
                secureTextEntry={obscurePassword}
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setObscurePassword(!obscurePassword)}
                style={styles.eyeIcon}
              >
                {obscurePassword ? (
                  <EyeOff size={20} color="#C88686" />
                ) : (
                  <Eye size={20} color="#C88686" />
                )}
              </TouchableOpacity>
            </View>

            {/* Confirm Password Field */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                placeholder="Confirm Password"
                placeholderTextColor="#C88686"
                secureTextEntry={obscureConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setObscureConfirmPassword(!obscureConfirmPassword)}
                style={styles.eyeIcon}
              >
                {obscureConfirmPassword ? (
                  <EyeOff size={20} color="#C88686" />
                ) : (
                  <Eye size={20} color="#C88686" />
                )}
              </TouchableOpacity>
            </View>

            {/* OTP Code Field */}
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="000000"
              placeholderTextColor="#C88686"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />

            {/* Messages */}
            {successMessage && (
              <Text style={styles.successText}>{successMessage}</Text>
            )}
            {errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleResetPassword}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FCF0F0" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF0F0',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#622E2E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#C88686',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#F5DEDE',
    borderWidth: 2,
    borderColor: '#EAC5C5',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#451C1C',
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5DEDE',
    borderWidth: 2,
    borderColor: '#EAC5C5',
    borderRadius: 12,
    height: 56,
    paddingRight: 16,
    marginBottom: 16,
  },
  eyeIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInput: {
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 6,
    marginBottom: 32,
  },
  successText: {
    color: '#16A34A',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  errorText: {
    color: '#D7181D',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#D7181D',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D7181D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  buttonText: {
    color: '#FCF0F0',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ResetPasswordScreen;
