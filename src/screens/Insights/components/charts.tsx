import React from 'react';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { PATTERN_SPARK } from '../insightsVisuals';
import type { PatternView } from '../../../types/insights';

interface ProgressRingProps {
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
  bgColor: string;
  /** Decorative dashed ring over a faint track (insulin card). */
  segmented?: boolean;
}

/** Circular progress ring. `segmented` draws an evenly-dashed ring whose dash count scales
 * with the radius so the gaps stay even (matches the Figma insulin card). */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max,
  size,
  strokeWidth,
  color,
  bgColor,
  segmented = false,
}) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const center = size / 2;

  if (segmented) {
    const segCount = Math.max(12, Math.round(circ / 14));
    const dash = circ / segCount;
    return (
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={r} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
        <Circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash * 0.55} ${dash * 0.45}`}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  const strokeDashoffset = circ - (value / max) * circ;
  return (
    <Svg width={size} height={size}>
      <Circle cx={center} cy={center} r={r} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
      <Circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${center}, ${center}`}
      />
    </Svg>
  );
};

/** Tiny trend sparkline rendered from one of the fixed PATTERN_SPARK shapes. */
export const PatternSparkline: React.FC<{ trend: PatternView['trend'] }> = ({ trend }) => {
  const { data, color } = PATTERN_SPARK[trend] || PATTERN_SPARK.stable;
  const w = 60, h = 30, pad = 4;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = pad + ((v - min) / range) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <Svg width={w} height={h}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};
