import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../../../context/UserContext';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200';

export type AccountFieldKey = 'fullName' | 'email' | 'phone' | 'address';
type AccountForm = Record<AccountFieldKey, string>;

interface UseAccountSettingsResult {
  form: AccountForm;
  setField: (key: AccountFieldKey, value: string) => void;
  avatarUri: string;
  uploadingAvatar: boolean;
  pickAvatar: () => Promise<void>;
  saved: boolean;
  saveError: string | null;
  save: () => Promise<void>;
}

/** Account-settings form state + profile save + avatar pick/upload. */
export function useAccountSettings(): UseAccountSettingsResult {
  const { profile, updateProfile, uploadAvatar } = useUser();

  const [form, setForm] = useState<AccountForm>({
    fullName: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone_number || '',
    address: profile?.address || '',
  });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const setField = useCallback((key: AccountFieldKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const pickAvatar = useCallback(async () => {
    if (uploadingAvatar) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to update your profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      setUploadingAvatar(true);
      await uploadAvatar(result.assets[0].uri);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  }, [uploadingAvatar, uploadAvatar]);

  const save = useCallback(async () => {
    setSaveError(null);
    try {
      await updateProfile({
        name: form.fullName,
        email: form.email,
        phone_number: form.phone,
        address: form.address,
      });
      setSaved(true);
      Alert.alert('Success', 'Account settings updated successfully.');
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save settings');
    }
  }, [form, updateProfile]);

  return {
    form,
    setField,
    avatarUri: profile?.avatar_url || DEFAULT_AVATAR,
    uploadingAvatar,
    pickAvatar,
    saved,
    saveError,
    save,
  };
}
