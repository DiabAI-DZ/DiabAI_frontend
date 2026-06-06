import { useCallback, useState } from 'react';

export type ModalKey =
  | 'diabetes' | 'theme' | 'units' | 'range' | 'lang' | 'textSize'
  | 'plan' | 'history' | 'billing' | 'demographics' | 'password';

const CLOSED: Record<ModalKey, boolean> = {
  diabetes: false, theme: false, units: false, range: false, lang: false, textSize: false,
  plan: false, history: false, billing: false, demographics: false, password: false,
};

export interface SettingsModalsState {
  open: Record<ModalKey, boolean>;
  openModal: (key: ModalKey) => void;
  closeModal: (key: ModalKey) => void;
}

/** Tracks which Settings popup is visible. */
export function useSettingsModals(): SettingsModalsState {
  const [open, setOpen] = useState<Record<ModalKey, boolean>>(CLOSED);
  const openModal = useCallback((key: ModalKey) => setOpen((s) => ({ ...s, [key]: true })), []);
  const closeModal = useCallback((key: ModalKey) => setOpen((s) => ({ ...s, [key]: false })), []);
  return { open, openModal, closeModal };
}
