import { useCallback } from 'react';
import { useData } from '../../../context/DataContext';
import { useUser } from '../../../context/UserContext';
import { buildMealLog, buildMeasurementLog, getStatus } from '../scanLogic';
import type { ScanMode, ScanResultState, ToastType } from '../scanTypes';

interface UseScanSaveArgs {
  mode: ScanMode;
  scanResult: ScanResultState | null;
  notes: string;
  isEditing: boolean;
  photo: string | null;
  showToast: (message: string, type?: ToastType) => void;
  slideOut: (cb: () => void) => void;
  onComplete: () => void;
}

/** Persists the confirmed scan (measurement or meal) via DataContext, with toasts + slide-out. */
export function useScanSave({ mode, scanResult, notes, isEditing, photo, showToast, slideOut, onComplete }: UseScanSaveArgs): () => Promise<void> {
  const { addLog } = useData();
  const { profile, refreshProfile } = useUser();

  return useCallback(async () => {
    if (!scanResult) return;
    try {
      const now = new Date().toISOString();
      if (mode === 'glucose') {
        const status = getStatus(scanResult.value ?? 0, scanResult.unit || 'mg/dL', profile?.goals?.min, profile?.goals?.max);
        await addLog(buildMeasurementLog(scanResult, notes, status, isEditing, now));
        await refreshProfile();
        showToast('Glucose reading logged successfully!', 'success');
      } else {
        await addLog(buildMealLog(scanResult, notes, photo, now));
        showToast('Meal scan logged successfully!', 'success');
      }
      setTimeout(() => slideOut(onComplete), 600);
    } catch {
      showToast('Failed to save the entry.', 'error');
    }
  }, [mode, scanResult, notes, isEditing, photo, addLog, refreshProfile, profile, showToast, slideOut, onComplete]);
}
