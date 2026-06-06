// Static option lists for the Settings selection popups + slider presets.

export interface LabeledOption {
  label: string;
  sub?: string;
}

export const DIABETES_TYPES: LabeledOption[] = [
  { label: 'Type 1', sub: 'Autoimmune condition' },
  { label: 'Type 2', sub: 'Insulin resistance' },
  { label: 'Gestational', sub: 'During pregnancy' },
];

export const THEME_OPTIONS: LabeledOption[] = [
  { label: 'Light Mode' },
  { label: 'Dark Mode' },
  { label: 'System Default' },
];

export const UNIT_OPTIONS: LabeledOption[] = [
  { label: 'mg/dL', sub: 'Milligrams per deciliter (US standard)' },
  { label: 'mmol/L', sub: 'Millimoles per liter (International)' },
];

export const LANGUAGE_OPTIONS: LabeledOption[] = [
  { label: 'English', sub: 'English' },
  { label: 'French', sub: 'Français' },
  { label: 'Arabic', sub: 'العربية' },
];

export const TEXT_SIZE_OPTIONS: LabeledOption[] = [
  { label: 'Small', sub: 'Compact — fits more content on screen' },
  { label: 'Medium', sub: 'Default — balanced readability' },
  { label: 'Large', sub: 'Comfortable — easier on the eyes' },
  { label: 'Extra Large', sub: 'Accessibility — maximum readability' },
];

export const RANGE_PRESETS: { label: string; mn: number; mx: number }[] = [
  { label: 'Normal', mn: 70, mx: 140 },
  { label: 'Tight', mn: 80, mx: 130 },
  { label: 'Relaxed', mn: 60, mx: 180 },
];

/** Aa preview font-size for the Text Size options. */
export const textSizePreview = (label: string): number =>
  label === 'Small' ? 11 : label === 'Medium' ? 14 : label === 'Large' ? 17 : 20;
