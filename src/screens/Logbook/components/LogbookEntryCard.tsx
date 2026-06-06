import React from 'react';
import type { LogEntry } from '../../../types';
import MeasurementCard from './MeasurementCard';
import MealCard from './MealCard';
import InjectionCard from './InjectionCard';
import ActivityCard from './ActivityCard';

/** The ONE place that maps a log entry to its card by `type`. */
const LogbookEntryCard: React.FC<{ entry: LogEntry; onSelect: () => void }> = ({ entry, onSelect }) => {
  switch (entry.type) {
    case 'measurement':
      return <MeasurementCard entry={entry} onSelect={onSelect} />;
    case 'meal':
      return <MealCard entry={entry} onSelect={onSelect} />;
    case 'injection':
      return <InjectionCard entry={entry} onSelect={onSelect} />;
    case 'activity':
      return <ActivityCard entry={entry} onSelect={onSelect} />;
    default:
      return null;
  }
};

export default LogbookEntryCard;
