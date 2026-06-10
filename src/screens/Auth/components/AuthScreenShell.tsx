import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { ChevronLeft } from 'lucide-react-native';
import { LOGO_SVG } from '../../../assets/svgData';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';

interface AuthScreenShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** When set, renders an absolute back button at the top-left. */
  onBack?: () => void;
  backLabel?: string;
}

/** Shared auth chrome: themed safe area + keyboard-avoiding scroll + logo + title/subtitle. */
const AuthScreenShell: React.FC<AuthScreenShellProps> = ({ title, subtitle, children, onBack, backLabel = 'Back' }) => {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
              <ChevronLeft size={24} color={colors.textPrimary} />
              <Text style={[styles.backText, { color: colors.textPrimary }]}>{backLabel}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.logo}>
            <SvgXml xml={LOGO_SVG} width={100} height={100} />
          </View>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          </View>
          <View style={[styles.form, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl, paddingVertical: spacing.xxxxl },
  logo: { alignItems: 'center', marginBottom: spacing.xxxxl },
  header: { alignItems: 'center', marginBottom: spacing.xxxl },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: spacing.sm },
  subtitle: { fontSize: 15, textAlign: 'center', paddingHorizontal: spacing.md },
  form: { width: '100%', borderRadius: 20, borderWidth: 1, padding: spacing.xl },
  backButton: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: spacing.xl, left: spacing.xl, zIndex: 1 },
  backText: { fontSize: 14, fontWeight: '600', marginLeft: spacing.xs },
});

export default AuthScreenShell;
