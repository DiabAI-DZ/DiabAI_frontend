import React from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Camera } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { borderRadius } from '../../../theme/borderRadius';

interface ProfileAvatarProps {
  uri: string;
  uploading: boolean;
  onPick: () => void;
}

const UPLOAD_SCRIM = 'rgba(0,0,0,0.35)';

/** Circular profile avatar with an upload overlay + camera button. */
const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ uri, uploading, onPick }) => {
  const { C, colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.wrapper, { borderColor: C.redBorder }]}>
        <Image source={{ uri }} style={styles.image} />
        {uploading && (
          <View style={styles.overlay}>
            <ActivityIndicator color={colors.textOnPrimary} />
          </View>
        )}
        <TouchableOpacity
          onPress={onPick}
          disabled={uploading}
          activeOpacity={0.85}
          style={[styles.cameraButton, { backgroundColor: C.redBg, borderColor: C.redBorder }]}
        >
          <Camera size={14} color={C.red} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  wrapper: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, position: 'relative' },
  image: { width: '100%', height: '100%', borderRadius: 60 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UPLOAD_SCRIM,
  },
  cameraButton: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 0,
    right: 0,
  },
});

export default ProfileAvatar;
