import React from 'react';
import Svg, {
  Path, Line, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText,
} from 'react-native-svg';
import { useTheme } from '../../../theme/ThemeContext';
import type { TrendPoint } from '../../../types/home';
import type { TrendGeometry } from '../hooks/useTrendGeometry';

interface TrendPlotProps {
  geometry: TrendGeometry;
  points: TrendPoint[];
  period: '7d' | '30d';
  targetMin: number;
  targetMax: number;
  width: number;
  height: number;
}

/** The SVG plot itself: gradient area, threshold guides, smooth line, real-data dots, axis labels. */
const TrendPlot: React.FC<TrendPlotProps> = ({ geometry, points, period, targetMin, targetMax, width, height }) => {
  const { C, colors } = useTheme();
  const { coords, linePath, areaPath, targetMinY, targetMaxY, paddingLeft, hasRealData } = geometry;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgLinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={C.red} stopOpacity={hasRealData ? 0.18 : 0.06} />
          <Stop offset="100%" stopColor={C.red} stopOpacity={0} />
        </SvgLinearGradient>
      </Defs>

      {/* High threshold (orange dashed) */}
      <Line
        x1={paddingLeft} y1={targetMaxY} x2={width - 10} y2={targetMaxY}
        stroke={colors.trendHigh} strokeWidth={1} strokeDasharray="4,4" strokeOpacity={0.6}
      />
      {/* Low threshold (red dashed) */}
      <Line
        x1={paddingLeft} y1={targetMinY} x2={width - 10} y2={targetMinY}
        stroke={colors.trendLow} strokeWidth={1} strokeDasharray="4,4" strokeOpacity={0.6}
      />

      {areaPath !== '' && <Path d={areaPath} fill="url(#trendFill)" />}

      {linePath !== '' && (
        <Path
          d={linePath}
          fill="none"
          stroke={C.red}
          strokeWidth={2.5}
          strokeOpacity={hasRealData ? 1 : 0.3}
          strokeDasharray={hasRealData ? undefined : '4,4'}
        />
      )}

      {hasRealData && coords.map((p, i) => {
        if (!points[i].real) return null;
        const isLast = i === coords.length - 1;
        return (
          <Circle
            key={i}
            cx={p.x} cy={p.y} r={isLast ? 5 : 3.5}
            fill={isLast ? C.red : colors.backgroundCard} stroke={C.red} strokeWidth={isLast ? 2.5 : 1.5}
          />
        );
      })}

      {coords.map((p, i) => {
        if (period === '30d' && i % 5 !== 0) return null;
        return (
          <SvgText
            key={`lbl-${i}`}
            x={p.x} y={height - 4} textAnchor="middle"
            fill={colors.textSecondary} fontSize={8} fontWeight="600"
          >
            {points[i].label}
          </SvgText>
        );
      })}

      <SvgText x={paddingLeft - 6} y={targetMaxY + 3} textAnchor="end" fill={colors.textSecondary} fontSize={8} fontWeight="600">
        {targetMax}
      </SvgText>
      <SvgText x={paddingLeft - 6} y={targetMinY + 3} textAnchor="end" fill={colors.textSecondary} fontSize={8} fontWeight="600">
        {targetMin}
      </SvgText>
    </Svg>
  );
};

export default TrendPlot;
