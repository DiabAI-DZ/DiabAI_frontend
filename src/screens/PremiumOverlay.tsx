import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Lock, Sparkles, Brain, Bell, Heart } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const features = [
  { icon: Brain, text: "Detect glucose patterns automatically" },
  { icon: Bell, text: "Receive real-time anomaly alerts" },
  { icon: Heart, text: "Get personalized health recommendations" },
];

interface PremiumOverlayProps {
  children: React.ReactNode;
  onUpgrade: () => void;
  onDismiss: () => void;
}

const PremiumOverlay: React.FC<PremiumOverlayProps> = ({
  children,
  onUpgrade,
  onDismiss,
}) => {
  const { C } = useTheme();

  return (
    <View style={styles.container}>
      {/* Blurred background content */}
      <View style={[styles.backgroundContent, { pointerEvents: 'none' }]}>
        {children}
      </View>

      {/* Overlay Background */}
      <View style={[styles.overlay, { backgroundColor: (C as any).overlayBg || 'rgba(98, 46, 46, 0.45)' }]}>
        
        {/* Premium badge */}
        <View style={[styles.badge, { backgroundColor: C.redBg, borderColor: `${C.red}20` }]}>
          <Lock size={12} color={C.red} />
          <Text style={[styles.badgeText, { color: C.red }]}>Premium Feature</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: (C as any).overlayCardBg || '#FCF0F0' }]}>
          {/* Icon */}
          <View style={[styles.iconWrapper, { backgroundColor: C.red }]}>
            <Sparkles size={26} color="#fff" />
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
                  <Text style={[styles.featureText, { color: C.textMd || '#854444' }]}>
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
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.8}
            style={styles.dismissButton}
          >
            <Text style={styles.dismissButtonText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundContent: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
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
    shadowColor: '#000',
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
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  dismissButtonText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default PremiumOverlay;
