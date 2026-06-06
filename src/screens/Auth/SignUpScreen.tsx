import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import AuthScreenShell from './components/AuthScreenShell';
import AuthInput from './components/AuthInput';
import AuthSubmitButton from './components/AuthSubmitButton';
import AuthFooterLink from './components/AuthFooterLink';
import { useSignUp } from './hooks/useSignUp';

interface SignUpScreenProps {
  onNavigateToSignIn: () => void;
  onSuccess: () => void;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigateToSignIn, onSuccess }) => {
  const { colors } = useTheme();
  const f = useSignUp(onSuccess);

  return (
    <AuthScreenShell title="Welcome Here" subtitle="Signup to continue">
      <AuthInput value={f.fullName} onChangeText={f.setFullName} placeholder="Full Name" autoCapitalize="words" />
      <AuthInput value={f.email} onChangeText={f.setEmail} placeholder="Email" keyboardType="email-address" />
      <AuthInput value={f.password} onChangeText={f.setPassword} placeholder="Password" secure containerStyle={styles.passwordSpacing} />

      {f.success && <Text style={[styles.success, { color: colors.success }]}>{f.success}</Text>}
      {f.error && <Text style={[styles.error, { color: colors.criticalText }]}>{f.error}</Text>}

      <AuthSubmitButton label="Sign up" onPress={f.submit} loading={f.loading} />
      <AuthFooterLink label="Already have an account?" actionLabel="Sign in" onPress={onNavigateToSignIn} />
    </AuthScreenShell>
  );
};

const styles = StyleSheet.create({
  passwordSpacing: { marginBottom: spacing.xxxl },
  success: { fontWeight: '600', textAlign: 'center', marginBottom: spacing.lg, fontSize: 14 },
  error: { fontWeight: '600', textAlign: 'center', marginBottom: spacing.lg, fontSize: 14 },
});

export default SignUpScreen;
