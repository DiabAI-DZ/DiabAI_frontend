import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface AuthFooterLinkProps {
  label: string;
  actionLabel: string;
  onPress: () => void;
}

/** "Don't have an account? Sign up" style footer with a tappable action. */
const AuthFooterLink: React.FC<AuthFooterLinkProps> = ({ label, actionLabel, onPress }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label} </Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={[styles.action, { color: colors.primary }]}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 14 },
  action: { fontWeight: 'bold', fontSize: 14 },
});

export default AuthFooterLink;
