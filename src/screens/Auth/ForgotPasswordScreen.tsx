import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import AuthScreenShell from './components/AuthScreenShell';
import AuthInput from './components/AuthInput';
import AuthSubmitButton from './components/AuthSubmitButton';
import AuthFooterLink from './components/AuthFooterLink';
import { useForgotPassword } from './hooks/useForgotPassword';

interface ForgotPasswordScreenProps {
  onNavigateToSignIn: () => void;
  onOtpSent: (email: string) => void;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigateToSignIn, onOtpSent }) => {
  const { colors } = useTheme();
  const f = useForgotPassword(onOtpSent);

  return (
    <AuthScreenShell title="Forgot Password" subtitle="We'll email you an OTP to reset your password">
      <AuthInput
        value={f.email}
        onChangeText={f.setEmail}
        placeholder="Email"
        keyboardType="email-address"
        containerStyle={styles.emailSpacing}
      />

      {f.success && <Text style={[styles.success, { color: colors.success }]}>{f.success}</Text>}
      {f.error && <Text style={[styles.error, { color: colors.criticalText }]}>{f.error}</Text>}

      <AuthSubmitButton label="Send OTP" onPress={f.submit} loading={f.loading} />
      <AuthFooterLink label="You remembered your password?" actionLabel="Sign in" onPress={onNavigateToSignIn} />
    </AuthScreenShell>
  );
};

const styles = StyleSheet.create({
  emailSpacing: { marginBottom: spacing.xxxl },
  success: { fontWeight: '600', textAlign: 'center', marginBottom: spacing.lg, fontSize: 14 },
  error: { fontWeight: '600', textAlign: 'center', marginBottom: spacing.lg, fontSize: 14 },
});

export default ForgotPasswordScreen;
