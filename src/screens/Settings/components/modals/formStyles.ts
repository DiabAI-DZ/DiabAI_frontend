import { StyleSheet } from 'react-native';
import { spacing } from '../../../../theme/spacing';
import { borderRadius } from '../../../../theme/borderRadius';

/** Shared layout for the demographics + change-password modal forms (colors applied inline). */
export const formStyles = StyleSheet.create({
  form: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', marginTop: spacing.sm, marginBottom: 6 },
  input: { height: 46, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 14, fontSize: 15 },
  saveBtn: { height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  saveText: { fontSize: 15, fontWeight: 'bold' },
});
