import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraView, useCameraPermissions, type PermissionResponse } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export interface UseScanCameraResult {
  permission: PermissionResponse | null;
  requestPermission: () => Promise<PermissionResponse>;
  flash: 'off' | 'on';
  setFlash: (v: 'off' | 'on') => void;
  cameraRef: React.RefObject<CameraView | null>;
  takePicture: () => Promise<void>;
  pickImage: () => Promise<void>;
}

/** Camera permission + capture (shutter / gallery). Hands the captured URI to `onCaptured`. */
export function useScanCamera(onCaptured: (uri: string) => void, onError: (msg: string) => void): UseScanCameraResult {
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      if (permission && !permission.granted && permission.canAskAgain) await requestPermission();
    })();
  }, [permission]); // eslint-disable-line react-hooks/exhaustive-deps

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const data = await cameraRef.current.takePictureAsync();
      if (data) onCaptured(data.uri);
    } catch {
      onError('Failed to take picture. Please try again.');
    }
  }, [onCaptured, onError]);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, base64: false, quality: 0.85 });
      if (!result.canceled && result.assets && result.assets.length > 0) onCaptured(result.assets[0].uri);
    } catch {
      onError('Failed to pick image from gallery. Please try again.');
    }
  }, [onCaptured, onError]);

  return { permission, requestPermission, flash, setFlash, cameraRef, takePicture, pickImage };
}
