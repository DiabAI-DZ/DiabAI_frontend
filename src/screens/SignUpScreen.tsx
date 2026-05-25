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
import { useUser } from '../context/UserContext';
import { LOGO_SVG } from '../assets/svgData';

interface SignUpScreenProps {
  onNavigateToSignIn: () => void;
  onSuccess: () => void;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onNavigateToSignIn,
  onSuccess,
}) => {
  const { signUp } = useUser();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&.])[A-Za-z\d@$!%?&.]{8,}$/;

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return 'Password must be at least 8 characters long.';
    if (!passwordRegex.test(pass)) {
      return 'Password must include uppercase, lowercase, a number, and a special character (@$!%?&.).';
    }
    return null;
  };

  const handleSignUp = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setErrorMessage('All fields are required.');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await signUp(trimmedName, trimmedEmail, password);
      setSuccessMessage('Account created successfully. Redirecting...');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (e: any) {
      if (e.errors) {
        // Handle Laravel validation errors
        const firstError = Object.values(e.errors)[0] as string[];
        setErrorMessage(firstError[0] || e.message);
      } else {
        setErrorMessage(e.message || 'An unexpected error occurred.');
      }
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
            <Text style={styles.title}>Welcome Here</Text>
            <Text style={styles.subtitle}>Signup to continue</Text>
          </View>

          <View style={styles.form}>
            {/* Full Name Field */}
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#C88686"
              autoCapitalize="words"
              autoCorrect={false}
              value={fullName}
              onChangeText={setFullName}
            />

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

            {/* Success / Error Messages */}
            {successMessage && (
              <Text style={styles.successText}>{successMessage}</Text>
            )}
            {errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FCF0F0" />
              ) : (
                <Text style={styles.buttonText}>Sign up</Text>
              )}
            </TouchableOpacity>

            {/* Sign In Navigation */}
            <View style={styles.signinFooter}>
              <Text style={styles.signinFooterLabel}>Already have an account? </Text>
              <TouchableOpacity onPress={onNavigateToSignIn}>
                <Text style={styles.signinFooterAction}>Sign in</Text>
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
    marginBottom: 32,
  },
  eyeIcon: {
    justifyContent: 'center',
    alignItems: 'center',
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
  signinFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinFooterLabel: {
    color: '#854444',
    fontSize: 14,
  },
  signinFooterAction: {
    color: '#9A1115',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default SignUpScreen;
