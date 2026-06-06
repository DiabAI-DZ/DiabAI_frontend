import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

interface MetadataRowProps {
  label: string;
  value: string;
  // Optional override for the value text colour (e.g. coloured health-status value).
  valueColor?: string;
  valueBold?: boolean;
  // The last row in a card omits its bottom divider.
  last?: boolean;
}

// A single label -> value row used by the detail screens' metadata cards.
// Label sits on the left (dark), value on the right (muted, or coloured), with a
// hairline divider underneath unless it is the last row.
const MetadataRow: React.FC<MetadataRowProps> = ({ label, value, valueColor, valueBold, last }) => {
  const { C } = useTheme();
  return (
    <View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: C.divider }]}>
      <Text style={[styles.label, { color: C.text }]}>{label}</Text>
      <Text
        style={[
          styles.value,
          { color: valueColor || C.textSm },
          valueBold && { fontWeight: '800' },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
});

export default MetadataRow;
