import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LightTheme,
  DarkTheme,
  AppTheme,
  LegacyLightColors,
  LegacyDarkColors,
  LegacyColors,
} from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = '@diabai_theme_mode';

interface ThemeContextType {
  /** Canonical app tokens — use these in all UI. */
  colors: AppTheme;
  /** Legacy `C.*` palette, kept so already-migrated screens render unchanged. */
  C: LegacyColors;
  /** True when the dark palette is active (manual dark OR system-dark). */
  isDark: boolean;

  // New API (spec)
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;

  // Legacy API aliases (kept so existing call sites keep compiling).
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  // Default to following the system until the persisted preference loads.
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // On mount: load the saved preference; fall back to system if none/unreadable.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setThemeModeState(saved);
        }
      } catch {
        // Ignore — keep the 'system' default.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist every change. 'system' is stored too, so the choice survives restarts.
  const setThemeMode = useCallback((next: ThemeMode) => {
    setThemeModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Non-fatal: the in-memory preference still applies this session.
    });
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') return systemColorScheme === 'dark';
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  // toggleTheme flips between explicit light/dark (escaping 'system').
  const toggleTheme = useCallback(() => {
    setThemeMode(isDark ? 'light' : 'dark');
  }, [isDark, setThemeMode]);

  const colors = useMemo<AppTheme>(() => (isDark ? DarkTheme : LightTheme), [isDark]);
  const C = useMemo<LegacyColors>(
    () => (isDark ? LegacyDarkColors : LegacyLightColors),
    [isDark],
  );

  const value = useMemo<ThemeContextType>(
    () => ({
      colors,
      C,
      isDark,
      themeMode,
      setThemeMode,
      toggleTheme,
      // Legacy aliases:
      mode: themeMode,
      setMode: setThemeMode,
    }),
    [colors, C, isDark, themeMode, setThemeMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
