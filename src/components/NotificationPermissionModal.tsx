import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { BellRing, ShieldCheck, Sparkles, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export type PermissionPromptPhase = 'pre-permission' | 'blocked';

interface NotificationPermissionModalProps {
  visible: boolean;
  phase: PermissionPromptPhase;
  onAllow: () => void;
  onCancel: () => void;
  onOpenSettings: () => void;
}

const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  visible,
  phase,
  onAllow,
  onCancel,
  onOpenSettings,
}) => {
  const { C, isDark } = useTheme();
  const blocked = phase === 'blocked';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: C.white,
              borderColor: C.redBorder,
              shadowColor: isDark ? '#000' : '#7B0C12',
            },
          ]}
        >
          <View style={[styles.headerBadge, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
            <BellRing size={14} color={C.red} />
            <Text style={[styles.headerBadgeText, { color: C.red }]}>Device notifications</Text>
          </View>

          <View style={[styles.iconWrap, { backgroundColor: C.red }]}>
            <Sparkles size={26} color="#fff" />
          </View>

          <Text style={[styles.title, { color: C.text }]}>
            {blocked ? 'Notifications are blocked' : 'Enable device alerts'}
          </Text>

          <Text style={[styles.body, { color: C.textSm }]}>
            {blocked
              ? 'Turn notifications back on in system settings to keep receiving glucose, meal, activity, and insulin alerts from DiabAI.'
              : 'DiabAI can send important glucose, meal, activity, and insulin alerts directly to your phone, even when the app is closed.'}
          </Text>

          <View style={[styles.benefitBox, { backgroundColor: isDark ? '#1C1517' : '#FAF5F5', borderColor: C.redBorder }]}>
            <ShieldCheck size={16} color={C.red} />
            <Text style={[styles.benefitText, { color: C.textMd }]}>
              Only important health alerts are sent to your device.
            </Text>
          </View>

          <View style={styles.actions}>
            {blocked ? (
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={onOpenSettings}
                style={[styles.primaryButton, { backgroundColor: C.red }]}
              >
                <Text style={styles.primaryButtonText}>Open Settings</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={onAllow}
                style={[styles.primaryButton, { backgroundColor: C.red }]}
              >
                <Text style={styles.primaryButtonText}>Enable notifications</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onCancel}
              style={[styles.secondaryButton, { backgroundColor: C.redBg, borderColor: C.redBorder }]}
            >
              <Text style={[styles.secondaryButtonText, { color: C.redMuted }]}>Maybe later</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onCancel} style={[styles.closeButton, { backgroundColor: isDark ? '#24181a' : '#FFF7F7' }]}>
            <X size={16} color={C.redMuted} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(17, 24, 39, 0.62)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 18,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  benefitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NotificationPermissionModal;
