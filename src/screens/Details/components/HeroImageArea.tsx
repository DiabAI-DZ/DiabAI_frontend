import React, { useState } from 'react';
import { Dimensions, Image, Modal, Platform, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ChevronLeft, Maximize2, X } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';

const { width } = Dimensions.get('window');

interface HeroImageAreaProps {
  imageUri?: string | null;
  /** Rendered when there is no image (centered by default). */
  fallback: React.ReactNode;
  onBack: () => void;
  /** Overrides the default hero box (height/bg/border) for screens with a different hero. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Overlay content (e.g. a gradient + title) drawn above the image, below the expand button. */
  children?: React.ReactNode;
}

const VIEWER_BACKDROP = 'rgba(0,0,0,0.95)';

/**
 * Detail-screen hero: the image (or a fallback), an absolute back button, and an expand button
 * that opens a fullscreen viewer. Owns only the viewer's open/close UI state. Defaults match the
 * measurement hero; pass containerStyle/children to adapt it (e.g. the meal hero's gradient+title).
 */
const HeroImageArea: React.FC<HeroImageAreaProps> = ({ imageUri, fallback, onBack, containerStyle, children }) => {
  const { colors } = useTheme();
  const [viewerOpen, setViewerOpen] = useState(false);
  const onPrimary = colors.textOnPrimary;

  return (
    <>
      <TouchableOpacity
        onPress={onBack}
        style={[styles.backButton, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}
        activeOpacity={0.85}
      >
        <ChevronLeft size={22} color={onPrimary} />
      </TouchableOpacity>

      <View style={[styles.hero, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.divider }, containerStyle]}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.heroImg} resizeMode="cover" /> : fallback}
        {children}
        {!!imageUri && (
          <TouchableOpacity
            style={[styles.expandBtn, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}
            onPress={() => setViewerOpen(true)}
            activeOpacity={0.85}
          >
            <Maximize2 size={16} color={onPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <View style={styles.viewerBackdrop}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerOpen(false)}>
            <X size={26} color={onPrimary} />
          </TouchableOpacity>
          {!!imageUri && <Image source={{ uri: imageUri }} style={styles.viewerImg} resizeMode="contain" />}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 44,
    left: spacing.xl,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  hero: {
    height: width * 0.95,
    maxHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  heroImg: { width: '100%', height: '100%' },
  expandBtn: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  viewerBackdrop: { flex: 1, backgroundColor: VIEWER_BACKDROP, alignItems: 'center', justifyContent: 'center' },
  viewerClose: { position: 'absolute', top: 54, right: spacing.xl, zIndex: 10, padding: spacing.xs },
  viewerImg: { width: '100%', height: '80%' },
});

export default HeroImageArea;
