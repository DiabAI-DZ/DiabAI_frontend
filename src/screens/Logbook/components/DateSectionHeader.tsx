import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { cardStyles as s } from './logbookCardStyles';

interface DateSectionHeaderProps {
  label: string;
  sublabel: string;
  count: number;
}

/** Day-group header: "Today / Yesterday / <date>" + entry count + full date. */
const DateSectionHeader: React.FC<DateSectionHeaderProps> = ({ label, sublabel, count }) => {
  const { C } = useTheme();
  return (
    <View style={s.groupTitleRow}>
      <View style={s.groupLabelWrapper}>
        <Text style={[s.groupLabelText, { color: C.textDark }]}>{label}</Text>
        <View style={[s.groupCountBadge, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
          <Text style={[s.groupCountText, { color: C.red }]}>{count}</Text>
        </View>
      </View>
      <Text style={[s.groupSubLabelText, { color: C.textXs }]}>{sublabel}</Text>
    </View>
  );
};

export default DateSectionHeader;
