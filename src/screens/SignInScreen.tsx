import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { Eye, EyeOff, CheckSquare, Square } from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import { LOGO_SVG } from '../assets/svgData';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SignInScreenProps {
  onNavigateToSignUp: () => void;
  onNavigateToForgotPassword: () => void;
  onSuccess: () => void;
}

const SignInScreen: React.FC<SignInScreenProps> = ({
  onNavigateToSignUp,
  onNavigateToForgotPassword,
  onSuccess,
}) => {
  const { signIn } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [obscurePassword, setObscurePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const loadCredentials = async () => {
      const savedEmail = await AsyncStorage.getItem('rememberedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    };
    loadCredentials();
  }, []);

  const handleSignIn = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await signIn(trimmedEmail, password);
      
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedEmail', trimmedEmail);
      } else {
        await AsyncStorage.removeItem('rememberedEmail');
      }
      
      onSuccess();
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
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

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.rememberMeWrapper} 
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                {rememberMe ? (
                  <CheckSquare size={20} color="#9A1115" />
                ) : (
                  <Square size={20} color="#C88686" />
                )}
                <Text style={[styles.rememberMeText, { color: rememberMe ? '#9A1115' : '#C88686' }]}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onNavigateToForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot password</Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FCF0F0" />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Navigation */}
            <View style={styles.signupFooter}>
              <Text style={styles.signupFooterLabel}>Don't have an account? </Text>
              <TouchableOpacity onPress={onNavigateToSignUp}>
                <Text style={styles.signupFooterAction}>Sign up</Text>
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
    marginBottom: 12,
  },
  eyeIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  rememberMeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberMeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPasswordText: {
    color: '#9A1115',
    fontWeight: '600',
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
  signupFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupFooterLabel: {
    color: '#854444',
    fontSize: 14,
  },
  signupFooterAction: {
    color: '#9A1115',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default SignInScreen;
