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
import { authApi } from '../services/authApi';
import { LOGO_SVG } from '../assets/svgData';

interface ForgotPasswordScreenProps {
  onNavigateToSignIn: () => void;
  onOtpSent: (email: string) => void;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onNavigateToSignIn,
  onOtpSent,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/;

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await authApi.sendResetOtp(trimmedEmail);
      setSuccessMessage('OTP sent. Check your email or Mailpit inbox.');
      setTimeout(() => {
        onOtpSent(trimmedEmail);
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
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>We'll email you an OTP to reset your password</Text>
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
              onPress={handleSendOtp}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FCF0F0" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <View style={styles.loginFooter}>
              <Text style={styles.loginFooterLabel}>You remembered your password? </Text>
              <TouchableOpacity onPress={onNavigateToSignIn}>
                <Text style={styles.loginFooterAction}>Sign in</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 12,
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
  loginFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginFooterLabel: {
    color: '#854444',
    fontSize: 14,
  },
  loginFooterAction: {
    color: '#9A1115',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ForgotPasswordScreen;
