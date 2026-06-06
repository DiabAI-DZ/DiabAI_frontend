import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Lock, Sparkles, Brain, Bell, Heart } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const features = [
  { icon: Brain, text: "Detect glucose patterns automatically" },
  { icon: Bell, text: "Receive real-time anomaly alerts" },
  { icon: Heart, text: "Get personalized health recommendations" },
];

interface PremiumOverlayProps {
  visible: boolean;
  onUpgrade: () => void;
  onDismiss: () => void;
}

const PremiumOverlay: React.FC<PremiumOverlayProps> = ({
  visible,
  onUpgrade,
  onDismiss,
}) => {
  const { C, colors } = useTheme();

  // The overlay is a blocker: the user must pick Upgrade or "Maybe later". Trap the Android
  // hardware back button so it can't silently close the gate — route it through "Maybe later"
  // (which sends the user Home) instead of letting the underlying screen handle back.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss();
      return true; // consume the event
    });
    return () => sub.remove();
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="auto">
      {/* Real blur of the live screen behind the overlay */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : 60}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />

      {/* Reddish tint on top of the blur, matching the design */}
      <View style={[styles.overlay, { backgroundColor: OVERLAY_TINT }]}>
        {/* Premium badge */}
        <View style={[styles.badge, { backgroundColor: C.redBg, borderColor: `${C.red}20` }]}>
          <Lock size={12} color={C.red} />
          <Text style={[styles.badgeText, { color: C.red }]}>Premium Feature</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.backgroundCard, shadowColor: colors.shadow }]}>
          {/* Icon */}
          <View style={[styles.iconWrapper, { backgroundColor: C.red }]}>
            <Sparkles size={26} color={colors.textOnPrimary} />
          </View>

          <Text style={[styles.title, { color: C.text }]}>Unlock AI Insights</Text>
          <Text style={[styles.subtitle, { color: C.textSm }]}>
            Get personalized analysis, anomaly detection, and smart recommendations based on your glucose data.
          </Text>

          {/* Features */}
          <View style={styles.featuresList}>
            {features.map((f, i) => {
              const IconComponent = f.icon;
              return (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.featureIconBox, { backgroundColor: C.redBg }]}>
                    <IconComponent size={18} color={C.red} />
                  </View>
                  <Text style={[styles.featureText, { color: C.textMd || colors.textSecondary }]}>
                    {f.text}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={onUpgrade}
            activeOpacity={0.85}
            style={[styles.upgradeButton, { backgroundColor: C.red }]}
          >
            <Text style={[styles.upgradeButtonText, { color: colors.textOnPrimary }]}>Upgrade to Premium</Text>
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.8}
            style={styles.dismissButton}
          >
            <Text style={[styles.dismissButtonText, { color: colors.textSecondary }]}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Reddish scrim drawn over the live-screen blur (a deliberate overlay tint, not a palette token).
const OVERLAY_TINT = 'rgba(98, 46, 46, 0.35)';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  featuresList: {
    gap: 12,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  upgradeButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  dismissButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default PremiumOverlay;
