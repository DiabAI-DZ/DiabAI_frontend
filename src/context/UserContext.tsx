import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../services/types';
import { apiService } from '../services/apiService';
import { authApi, AUTH_BASE_URL } from '../services/authApi';
import { registerDeviceToken, unregisterDeviceToken } from '../services/pushNotifications';

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (imageUri: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  upgradeToPremium: (planId?: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(AUTH_BASE_URL || 'http://localhost:8000');
  const [loading, setLoading] = useState(false);

  const setApiBaseUrl = (url: string) => {
    setApiBaseUrlState(url);
    authApi.setBaseUrl(url);
  };

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.fetchProfile();
      setProfile(data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      if (result && result.access_token) {
        authApi.setToken(result.access_token);
      }
      // Fetch user profile upon successful authentication
      const userProfile = await apiService.fetchProfile();
      setProfile(userProfile);
      // Register this device for push now that we have a JWT (fire-and-forget; self-guards).
      void registerDeviceToken();
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      await authApi.register(name, email, password);
    } catch (error) {
      console.error("Sign up failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const updated = await apiService.updateProfile(updates);
      setProfile(updated);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    const updated = await apiService.uploadAvatar(imageUri);
    setProfile(updated);
  };

  const signOut = async () => {
    console.log("Signing out...");
    // Unregister the FCM token BEFORE clearing the JWT (the DELETE call is authenticated).
    try {
      await unregisterDeviceToken();
    } catch (error) {
      console.warn('[push] Failed to unregister device token:', error);
    }

    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Failed to revoke backend session:', error);
    } finally {
      authApi.setToken(null);
      setProfile(null);
    }
  };

  const upgradeToPremium = async (planId?: string) => {
    setLoading(true);
    try {
      const updated = await apiService.upgradeAccount(planId || 'premium_monthly');
      setProfile(updated);
    } catch (error) {
      console.error("Failed to upgrade account:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sync initial base URL configuration
  useEffect(() => {
    authApi.setBaseUrl(apiBaseUrl);
  }, [apiBaseUrl]);

  // Restore a persisted session on cold start: load the saved token, then fetch the profile.
  // Setting the profile triggers the post-login data + insights prefetch in DataContext.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await authApi.restoreToken();
      if (!token || cancelled) return;
      try {
        const data = await apiService.fetchProfile();
        if (!cancelled) {
          setProfile(data);
          // Already-logged-in cold start: refresh/register the device token.
          void registerDeviceToken();
        }
      } catch {
        // Token invalid/expired — drop it so the app falls back to the sign-in screen.
        authApi.setToken(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <UserContext.Provider value={{ 
      profile, 
      loading, 
      apiBaseUrl, 
      setApiBaseUrl, 
      updateProfile,
      uploadAvatar,
      signIn,
      signUp, 
      signOut, 
      refreshProfile,
      upgradeToPremium
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
