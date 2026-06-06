import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Share2, Pencil, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

interface ActionButtonsRowProps {
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
  editLabel?: string;
}

/** Shared detail-screen footer: Share (secondary) + Edit (primary) + Delete (icon). */
const ActionButtonsRow: React.FC<ActionButtonsRowProps> = ({
  onShare,
  onEdit,
  onDelete,
  deleting = false,
  editLabel = 'Edit Entry',
}) => {
  const { C, colors } = useTheme();

  return (
    <View style={styles.row}>
      <TouchableOpacity style={[styles.btn, styles.secondary, { backgroundColor: C.redBg }]} onPress={onShare} activeOpacity={0.85}>
        <Share2 size={16} color={C.red} />
        <Text style={[styles.secondaryText, { color: C.text }]}>Share</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.primary, { backgroundColor: colors.primary }]} onPress={onEdit} activeOpacity={0.9}>
        <Pencil size={16} color={colors.textOnPrimary} />
        <Text style={[styles.primaryText, { color: colors.textOnPrimary }]}>{editLabel}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: C.redBg }]} onPress={onDelete} disabled={deleting} activeOpacity={0.85}>
        {deleting ? <ActivityIndicator size="small" color={C.red} /> : <Trash2 size={18} color={C.red} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: 18,
    marginTop: 22,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: borderRadius.lg,
  },
  secondary: { flex: 1 },
  secondaryText: { fontSize: 14, fontWeight: '700' },
  primary: { flex: 1.4 },
  primaryText: { fontSize: 15, fontWeight: '800' },
  deleteBtn: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ActionButtonsRow;
