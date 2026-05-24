import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';

export const COLORS = {
  red: "#C41E26",
  redDark: "#7B0C12",
  redLight: "#E32B34",
  redBg: "#FDF1F1",
  redBorder: "#F2D0D0",
  redMuted: "#A86262",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
  amber: "#D97706",
  amberBg: "#FFFBEB",
  amberBorder: "#FDE68A",
  blue: "#2563EB",
  blueBg: "#EFF6FF",
  blueBorder: "#BFDBFE",
  purple: "#7C3AED",
  purpleBg: "#F5F3FF",
  text: "#111827",
  textDark: "#451C1C",
  textMd: "#4B5563",
  textSm: "#6B7280",
  textXs: "#9CA3AF",
  bg: "#F8F6F6",
  divider: "#F5DEDE",
  white: "#FFFFFF",
  black: "#000000",
};

const DARK_COLORS = {
  ...COLORS,
  bg: "#100e10",
  divider: "#2A2424",
  text: "#f5eded",
  textDark: "#ede8e8",
  textMd: "#e8e2e2",
  textSm: "#9CA3AF",
  white: "#1a1215",
  black: "#FFFFFF",
};

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  C: typeof COLORS;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}


const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  const isDark = useMemo(() => {
    if (mode === 'system') return systemColorScheme === 'dark';
    return mode === 'dark';
  }, [mode, systemColorScheme]);

  const toggleTheme = () => setMode(isDark ? 'light' : 'dark');

  const C = useMemo(() => (isDark ? DARK_COLORS : COLORS), [isDark]);

  return (
    <ThemeContext.Provider value={{ C, isDark, mode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
