import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

interface NotesEditorModalProps {
  visible: boolean;
  value: string;
  onChange: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
  saving?: boolean;
  placeholder?: string;
}

const SHEET_BACKDROP = 'rgba(0,0,0,0.4)';

/** Bottom-sheet modal for editing an entry's notes. Shared across detail screens. */
const NotesEditorModal: React.FC<NotesEditorModalProps> = ({
  visible,
  value,
  onChange,
  onSave,
  onClose,
  saving = false,
  placeholder = 'Add a note…',
}) => {
  const { C, colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.backgroundCard }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: C.text }]}>Edit Notes</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={C.textSm} />
            </TouchableOpacity>
          </View>
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={colors.inputText}
            multiline
            style={[styles.input, { color: colors.inputText, borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
            onPress={onSave}
            disabled={saving}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.textOnPrimary }]}>Save Notes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: SHEET_BACKDROP, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, padding: 22, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { fontSize: 18, fontWeight: '800' },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: 14,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  saveBtn: { height: 52, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '800' },
});

export default NotesEditorModal;
