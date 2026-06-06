import { useMemo } from 'react';
import type { TrendPoint } from '../../../types/home';

export interface Coord {
  x: number;
  y: number;
}

export interface TrendGeometry {
  coords: Coord[];
  linePath: string;
  areaPath: string;
  targetMinY: number;
  targetMaxY: number;
  paddingLeft: number;
  paddingBottom: number;
  graphWidth: number;
  hasRealData: boolean;
}

const MIN_VAL = 60;
const MAX_VAL = 200;
const PADDING_LEFT = 25;
const PADDING_RIGHT = 10;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 20;

const bezierPath = (coords: Coord[]): string => {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 3;
    const cpX2 = p0.x + (2 * (p1.x - p0.x)) / 3;
    d += ` C ${cpX1} ${p0.y}, ${cpX2} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
};

// Fill gaps (null values) by linear interpolation between the nearest real points so the line
// stays continuous; with no real data at all, draw a flat baseline sine for visual context.
const interpolate = (points: TrendPoint[], hasRealData: boolean): TrendPoint[] => {
  if (!hasRealData) {
    return points.map((item, index) => ({ ...item, value: 100 + Math.sin(index * 1.2) * 15 }));
  }
  const result: TrendPoint[] = points.map((item) => ({ ...item }));
  for (let i = 0; i < result.length; i++) {
    if (result[i].value === null) {
      let prev: number | null = null;
      for (let j = i - 1; j >= 0; j--) if (points[j].real) { prev = points[j].value; break; }
      let next: number | null = null;
      for (let j = i + 1; j < points.length; j++) if (points[j].real) { next = points[j].value; break; }
      if (prev !== null && next !== null) result[i].value = prev + (next - prev) * 0.5;
      else if (prev !== null) result[i].value = prev;
      else if (next !== null) result[i].value = next;
      else result[i].value = 100;
    }
  }
  return result;
};

/** Pure chart math: turns trend points into SVG coordinates, paths and threshold guide lines. */
export function useTrendGeometry(
  points: TrendPoint[],
  targetMin: number,
  targetMax: number,
  chartWidth: number,
  chartHeight: number,
): TrendGeometry {
  const hasRealData = useMemo(() => points.some((d) => d.real), [points]);
  const interpolated = useMemo(() => interpolate(points, hasRealData), [points, hasRealData]);

  return useMemo<TrendGeometry>(() => {
    const graphWidth = chartWidth - PADDING_LEFT - PADDING_RIGHT;
    const graphHeight = chartHeight - PADDING_TOP - PADDING_BOTTOM;

    const coords: Coord[] = interpolated.map((item, index) => {
      const x = PADDING_LEFT + (index / Math.max(1, interpolated.length - 1)) * graphWidth;
      const bounded = Math.max(MIN_VAL, Math.min(MAX_VAL, item.value || 100));
      const y = PADDING_TOP + graphHeight - ((bounded - MIN_VAL) / (MAX_VAL - MIN_VAL)) * graphHeight;
      return { x, y };
    });

    const linePath = bezierPath(coords);
    const areaPath = coords.length
      ? `${linePath} L ${coords[coords.length - 1].x} ${chartHeight - PADDING_BOTTOM} L ${coords[0].x} ${chartHeight - PADDING_BOTTOM} Z`
      : '';

    const yFor = (v: number): number =>
      PADDING_TOP + graphHeight - ((v - MIN_VAL) / (MAX_VAL - MIN_VAL)) * graphHeight;

    return {
      coords,
      linePath,
      areaPath,
      targetMinY: yFor(targetMin),
      targetMaxY: yFor(targetMax),
      paddingLeft: PADDING_LEFT,
      paddingBottom: PADDING_BOTTOM,
      graphWidth,
      hasRealData,
    };
  }, [interpolated, targetMin, targetMax, chartWidth, chartHeight, hasRealData]);
}
