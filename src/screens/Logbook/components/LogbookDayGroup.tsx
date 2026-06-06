import React from 'react';
import { View } from 'react-native';
import type { LogEntry } from '../../../types';
import type { LogbookSection } from '../../../types/logbook';
import { cardStyles as s } from './logbookCardStyles';
import DateSectionHeader from './DateSectionHeader';
import LogbookEntryCard from './LogbookEntryCard';

interface LogbookDayGroupProps {
  section: LogbookSection;
  onSelectEntry: (entry: LogEntry) => void;
}

// Within a day, cards are grouped by type (measurements → meals → injections → activities),
// matching the original layout regardless of the server's mixed newest-first order.
const TYPE_ORDER: LogEntry['type'][] = ['measurement', 'meal', 'injection', 'activity'];

/** One calendar-day section: date header + a type-ordered grid of entry cards. */
const LogbookDayGroup: React.FC<LogbookDayGroupProps> = ({ section, onSelectEntry }) => {
  if (section.entries.length === 0) return null;
  const ordered = TYPE_ORDER.flatMap((t) => section.entries.filter((e) => e.type === t));

  return (
    <View style={s.groupFrame}>
      <DateSectionHeader label={section.label} sublabel={section.sublabel} count={section.entries.length} />
      <View style={s.gridContainer}>
        {ordered.map((entry) => (
          <LogbookEntryCard key={entry.id || `${entry.type}-${entry.date}`} entry={entry} onSelect={() => onSelectEntry(entry)} />
        ))}
      </View>
    </View>
  );
};

export default LogbookDayGroup;
