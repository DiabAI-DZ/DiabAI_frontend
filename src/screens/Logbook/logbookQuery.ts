// Pure logbook helpers: map filter UI state → /api/logbook query params, and group entries by day.
import { format, isSameDay, isAfter, isBefore, subDays, parseISO, startOfDay } from 'date-fns';
import type { LogEntry } from '../../types';
import { PAGE_SIZE, type Filters, type LogbookQueryParams, type LogbookSection } from '../../types/logbook';

/** Translate the local filter UI state into the documented /api/logbook query contract. */
export const buildParams = (filters: Filters, search: string): LogbookQueryParams => {
  const p: LogbookQueryParams = { perPage: PAGE_SIZE };

  switch (filters.typeFilter) {
    case 'measurements': p.entryTypes = ['measurement']; break;
    case 'meals': p.entryTypes = ['meal']; break;
    case 'injections': p.entryTypes = ['injection']; break;
    case 'activities': p.entryTypes = ['activity']; break;
    default: break; // "all" → omit entry_types[]
  }

  if (search) p.search = search;

  if (filters.datePreset === 'custom' && filters.rangeStart && filters.rangeEnd) {
    const s = isBefore(filters.rangeStart, filters.rangeEnd) ? filters.rangeStart : filters.rangeEnd;
    const e = isAfter(filters.rangeStart, filters.rangeEnd) ? filters.rangeStart : filters.rangeEnd;
    p.dateFrom = format(s, 'yyyy-MM-dd');
    p.dateTo = format(e, 'yyyy-MM-dd');
  } else if (filters.datePreset === 'today') {
    p.datePreset = 'today';
  } else if (filters.datePreset === '7days') {
    p.datePreset = 'last_7_days';
  } else if (filters.datePreset === '30days') {
    p.datePreset = 'last_30_days';
  }

  if (filters.glucosePreset) {
    p.healthStatus = filters.glucosePreset;
  } else if (filters.glucoseMin !== 40 || filters.glucoseMax !== 300) {
    p.valueMinMgDl = filters.glucoseMin;
    p.valueMaxMgDl = filters.glucoseMax;
  }

  if (filters.mealTypes.length === 1) p.mealType = filters.mealTypes[0];

  return p;
};

/** Group entries into one section per calendar day, preserving the server's newest-first order. */
export const groupByDay = (entries: LogEntry[]): LogbookSection[] => {
  const todayStart = startOfDay(new Date());
  const yesterdayStart = subDays(todayStart, 1);
  const groups: LogbookSection[] = [];
  const indexByKey = new Map<string, number>();

  entries.forEach((e) => {
    const d = startOfDay(parseISO(e.date));
    const key = format(d, 'yyyy-MM-dd');
    let idx = indexByKey.get(key);
    if (idx === undefined) {
      const label = isSameDay(d, todayStart)
        ? 'Today'
        : isSameDay(d, yesterdayStart)
          ? 'Yesterday'
          : format(d, 'EEEE, MMMM d');
      idx = groups.length;
      groups.push({ key, label, sublabel: format(d, 'MMMM d, yyyy'), entries: [] });
      indexByKey.set(key, idx);
    }
    groups[idx].entries.push(e);
  });

  return groups;
};
