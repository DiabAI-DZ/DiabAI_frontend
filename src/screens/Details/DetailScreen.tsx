import React from 'react';
import MeasurementDetailScreen from './MeasurementDetailScreen';
import MealDetailScreen from './MealDetailScreen';
import InjectionDetailScreen from './InjectionDetailScreen';
import ActivityDetailScreen from './ActivityDetailScreen';
import type { MeasurementEntryLike } from './measurementView';
import type { MealEntryLike } from './mealView';
import type { InjectionEntryLike } from './injectionView';
import type { ActivityEntryLike } from './activityView';

// A tapped logbook row. All per-type fields are optional, so the same value can be handed to
// whichever dedicated detail screen matches `type` (each accepts its own loose EntryLike).
type DetailEntry = { type?: string } & MeasurementEntryLike & MealEntryLike & InjectionEntryLike & ActivityEntryLike;

interface DetailScreenProps {
  entry: DetailEntry | null | undefined;
  onBack: () => void;
}

/**
 * Dispatcher: routes a tapped logbook entry to its dedicated detail screen by `entry.type`.
 * (The former all-in-one renderer was replaced by the per-type screens in this folder.)
 */
const DetailScreen: React.FC<DetailScreenProps> = ({ entry, onBack }) => {
  if (!entry) return null;
  switch (entry.type) {
    case 'meal':
      return <MealDetailScreen entry={entry} onBack={onBack} />;
    case 'injection':
      return <InjectionDetailScreen entry={entry} onBack={onBack} />;
    case 'activity':
      return <ActivityDetailScreen entry={entry} onBack={onBack} />;
    case 'measurement':
    default:
      return <MeasurementDetailScreen entry={entry} onBack={onBack} />;
  }
};

export default DetailScreen;
