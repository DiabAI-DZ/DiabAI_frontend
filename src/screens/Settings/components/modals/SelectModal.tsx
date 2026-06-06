import React from 'react';
import { CenterPopup } from '../CenterPopup';
import { SelectOption } from '../SelectOption';

export interface SelectModalOption {
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

interface SelectModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  options: SelectModalOption[];
  isSelected: (label: string) => boolean;
  onSelect: (label: string) => void;
}

/** A selection popup: a titled CenterPopup wrapping a list of radio SelectOptions. */
export const SelectModal: React.FC<SelectModalProps> = ({ open, onClose, title, options, isSelected, onSelect }) => (
  <CenterPopup open={open} onClose={onClose} title={title}>
    {options.map((o) => (
      <SelectOption
        key={o.label}
        label={o.label}
        subtitle={o.subtitle}
        icon={o.icon}
        selected={isSelected(o.label)}
        onSelect={() => onSelect(o.label)}
      />
    ))}
  </CenterPopup>
);
