import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import AuthScreenShell from './components/AuthScreenShell';
import AuthInput from './components/AuthInput';
import AuthSubmitButton from './components/AuthSubmitButton';
import AuthFooterLink from './components/AuthFooterLink';
import { useSignIn } from './hooks/useSignIn';

interface SignInScreenProps {
  onNavigateToSignUp: () => void;
  onNavigateToForgotPassword: () => void;
  onSuccess: () => void;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ onNavigateToSignUp, onNavigateToForgotPassword, onSuccess }) => {
  const { colors } = useTheme();
  const f = useSignIn(onSuccess);

  return (
    <AuthScreenShell title="Welcome Back" subtitle="Sign in to continue">
      <AuthInput value={f.email} onChangeText={f.setEmail} placeholder="Email" keyboardType="email-address" />
      <AuthInput value={f.password} onChangeText={f.setPassword} placeholder="Password" secure />

      <View style={styles.optionsRow}>
        <TouchableOpacity style={styles.remember} onPress={f.toggleRememberMe} activeOpacity={0.7}>
          {f.rememberMe ? <CheckSquare size={20} color={colors.primary} /> : <Square size={20} color={colors.textMuted} />}
          <Text style={[styles.rememberText, { color: f.rememberMe ? colors.primary : colors.textMuted }]}>Remember me</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNavigateToForgotPassword}>
          <Text style={[styles.forgot, { color: colors.primary }]}>Forgot password</Text>
        </TouchableOpacity>
      </View>

      {f.error && <Text style={[styles.error, { color: colors.criticalText }]}>{f.error}</Text>}

      <AuthSubmitButton label="Sign in" onPress={f.submit} loading={f.loading} />
      <AuthFooterLink label="Don't have an account?" actionLabel="Sign up" onPress={onNavigateToSignUp} />
    </AuthScreenShell>
  );
};

const styles = StyleSheet.create({
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxxl },
  remember: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rememberText: { fontSize: 14, fontWeight: '600' },
  forgot: { fontWeight: '600', fontSize: 14 },
  error: { fontWeight: '600', textAlign: 'center', marginBottom: spacing.lg, fontSize: 14 },
});

export default SignInScreen;
