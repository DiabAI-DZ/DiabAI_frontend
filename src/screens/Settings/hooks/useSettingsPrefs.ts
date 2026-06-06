import { useCallback, useMemo, useState } from 'react';
import { useUser } from '../../../context/UserContext';
import { useTheme } from '../../../context/ThemeContext';

export interface UseSettingsPrefsResult {
  targetMin: number;
  targetMax: number;
  setRange: (min: number, max: number) => void;
  saveGoals: () => void;
  language: string;
  setLanguage: (v: string) => void;
  textSize: string;
  setTextSize: (v: string) => void;
  currentThemeLabel: string;
  selectTheme: (label: string) => void;
}

/** Local preference state: target glucose goals (persisted), plus language / text-size / theme. */
export function useSettingsPrefs(): UseSettingsPrefsResult {
  const { profile, updateProfile } = useUser();
  const { mode, setMode } = useTheme();

  const [targetMin, setTargetMin] = useState(profile?.goals?.min || 70);
  const [targetMax, setTargetMax] = useState(profile?.goals?.max || 140);
  const [language, setLanguage] = useState('English');
  const [textSize, setTextSize] = useState('Medium');

  const setRange = useCallback((min: number, max: number) => { setTargetMin(min); setTargetMax(max); }, []);
  const saveGoals = useCallback(() => { updateProfile({ goals: { min: targetMin, max: targetMax } }); }, [targetMin, targetMax, updateProfile]);

  const currentThemeLabel = useMemo(() => (mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'), [mode]);
  const selectTheme = useCallback((label: string) => {
    if (label === 'Light Mode') setMode('light');
    else if (label === 'Dark Mode') setMode('dark');
    else setMode('system');
  }, [setMode]);

  return { targetMin, targetMax, setRange, saveGoals, language, setLanguage, textSize, setTextSize, currentThemeLabel, selectTheme };
}
