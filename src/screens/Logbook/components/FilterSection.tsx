import React from 'react';
import { Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { filterStyles as f } from './logbookFilterStyles';

interface FilterSectionProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  children: React.ReactNode;
}

/** A labeled section (colored icon box + uppercase label) inside the filter sheet. */
const FilterSection: React.FC<FilterSectionProps> = ({ icon: Icon, iconColor, iconBg, label, children }) => {
  const { C } = useTheme();
  return (
    <View style={f.section}>
      <View style={f.sectionTitleRow}>
        <View style={[f.sectionIconBox, { backgroundColor: iconBg }]}>
          <Icon size={13} color={iconColor} />
        </View>
        <Text style={[f.sectionLabel, { color: C.textDark }]}>{label}</Text>
      </View>
      {children}
    </View>
  );
};

export default FilterSection;
