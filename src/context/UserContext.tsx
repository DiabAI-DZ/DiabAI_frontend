import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../services/types';
import { apiService } from '../services/apiService';
import { authApi, AUTH_BASE_URL } from '../services/authApi';

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
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

  const signOut = () => {
    console.log("Signing out...");
    authApi.setToken(null);
    setProfile(null);
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

  return (
    <UserContext.Provider value={{ 
      profile, 
      loading, 
      apiBaseUrl, 
      setApiBaseUrl, 
      updateProfile, 
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
