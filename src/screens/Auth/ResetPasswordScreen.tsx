import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import AuthScreenShell from './components/AuthScreenShell';
import AuthInput from './components/AuthInput';
import AuthSubmitButton from './components/AuthSubmitButton';
import { useResetPassword } from './hooks/useResetPassword';

interface ResetPasswordScreenProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ email, onSuccess, onBack }) => {
  const { colors } = useTheme();
  const f = useResetPassword(email, onSuccess);

  return (
    <AuthScreenShell title="Reset Password" subtitle="You can change your password" onBack={onBack} backLabel="Back to Sign In">
      <AuthInput value={f.email} onChangeText={f.setEmail} placeholder="Email" keyboardType="email-address" />
      <AuthInput value={f.password} onChangeText={f.setPassword} placeholder="Password" secure containerStyle={styles.fieldSpacing} />
      <AuthInput value={f.confirmPassword} onChangeText={f.setConfirmPassword} placeholder="Confirm Password" secure containerStyle={styles.fieldSpacing} />
      <AuthInput
        value={f.otp}
        onChangeText={f.setOtp}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        containerStyle={styles.otpInput}
      />

      {f.success && <Text style={[styles.success, { color: colors.success }]}>{f.success}</Text>}
      {f.error && <Text style={[styles.error, { color: colors.criticalText }]}>{f.error}</Text>}

      <AuthSubmitButton label="Reset Password" onPress={f.submit} loading={f.loading} />
    </AuthScreenShell>
  );
};

const styles = StyleSheet.create({
  fieldSpacing: { marginBottom: spacing.lg },
  otpInput: { textAlign: 'center', fontWeight: 'bold', letterSpacing: 6, marginBottom: spacing.xxxl },
  success: { fontWeight: '600', textAlign: 'center', marginBottom: spacing.lg, fontSize: 14 },
  error: { fontWeight: '600', textAlign: 'center', marginBottom: spacing.lg, fontSize: 14 },
});

export default ResetPasswordScreen;
