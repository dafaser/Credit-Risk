import React from 'react';
import { BoxplotStats } from '../../types';
import { formatPDScore } from '../../utils/creditEngine';

interface BoxplotChartProps {
  data: BoxplotStats[];
  valueLabel?: string;
  yMin?: number;
  yMax?: number;
}

export const BoxplotChart: React.FC<BoxplotChartProps> = ({
  data,
  valueLabel = 'PD Score',
  yMin,
  yMax
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        Tidak ada data untuk boxplot
      </div>
    );
  }

  // Determine global bounds
  const globalMin = yMin !== undefined ? yMin : Math.min(...data.map(d => d.lowerWhisker));
  const globalMax = yMax !== undefined ? yMax : Math.max(...data.map(d => Math.max(d.upperWhisker, ...(d.outliers || []))));
  const padding = (globalMax - globalMin) * 0.1 || 0.02;
  const scaleMin = Math.max(0, globalMin - padding);
  const scaleMax = globalMax + padding;

  const svgHeight = 240;
  const svgWidth = 560;
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  const yScale = (val: number) => {
    if (scaleMax === scaleMin) return plotHeight / 2;
    return plotHeight - ((val - scaleMin) / (scaleMax - scaleMin)) * plotHeight;
  };

  const groupWidth = plotWidth / data.length;
  const boxWidth = Math.min(60, groupWidth * 0.5);

  const colors = ['#3B82F6', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6'];

  // Y-axis ticks (5 ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => scaleMin + pct * (scaleMax - scaleMin));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-64 select-none font-sans"
      >
        {/* Background grid lines */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {yTicks.map((tickVal, idx) => {
            const y = yScale(tickVal);
            return (
              <g key={`ytick-${idx}`}>
                <line
                  x1={0}
                  y1={y}
                  x2={plotWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={-10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {(tickVal * 100).toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* Left Y Axis line */}
          <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="#334155" />
          {/* Bottom X Axis line */}
          <line x1={0} y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="#334155" />

          {/* Render Boxes for each group */}
          {data.map((stat, i) => {
            const cx = (i + 0.5) * groupWidth;
            const xLeft = cx - boxWidth / 2;
            const color = colors[i % colors.length];

            const yMedian = yScale(stat.median);
            const yQ1 = yScale(stat.q1);
            const yQ3 = yScale(stat.q3);
            const yLower = yScale(stat.lowerWhisker);
            const yUpper = yScale(stat.upperWhisker);
            const boxHeight = Math.max(2, Math.abs(yQ1 - yQ3));
            const boxTop = Math.min(yQ1, yQ3);

            return (
              <g key={stat.category} className="transition-all duration-300">
                {/* Whisker line (lower to upper) */}
                <line
                  x1={cx}
                  y1={yLower}
                  x2={cx}
                  y2={yUpper}
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="2 2"
                />

                {/* Whisker caps */}
                <line
                  x1={cx - boxWidth / 4}
                  y1={yLower}
                  x2={cx + boxWidth / 4}
                  y2={yLower}
                  stroke={color}
                  strokeWidth="2"
                />
                <line
                  x1={cx - boxWidth / 4}
                  y1={yUpper}
                  x2={cx + boxWidth / 4}
                  y2={yUpper}
                  stroke={color}
                  strokeWidth="2"
                />

                {/* Box body (IQR Q1 to Q3) */}
                <rect
                  x={xLeft}
                  y={boxTop}
                  width={boxWidth}
                  height={boxHeight}
                  fill={color}
                  fillOpacity="0.25"
                  stroke={color}
                  strokeWidth="2"
                  rx="3"
                  className="hover:fill-opacity-40 cursor-pointer"
                >
                  <title>
                    {`${stat.category}\nMedian: ${formatPDScore(stat.median)} (${(stat.median * 100).toFixed(2)}%)\nQ1: ${formatPDScore(stat.q1)}\nQ3: ${formatPDScore(stat.q3)}\nIQR: ${formatPDScore(stat.iqr)}\nMin: ${formatPDScore(stat.min)}\nMax: ${formatPDScore(stat.max)}\nJumlah Nasabah: ${stat.count}`}
                  </title>
                </rect>

                {/* Median Line */}
                <line
                  x1={xLeft}
                  y1={yMedian}
                  x2={xLeft + boxWidth}
                  y2={yMedian}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />

                {/* Median Value Badge */}
                <circle cx={cx} cy={yMedian} r="3" fill="#FFFFFF" />

                {/* Outliers dots */}
                {(stat.outliers || []).map((outlierVal, oIdx) => (
                  <circle
                    key={`outlier-${oIdx}`}
                    cx={cx + (Math.sin(oIdx) * 6)}
                    cy={yScale(outlierVal)}
                    r="3"
                    fill="#EF4444"
                    stroke="#0f172a"
                    strokeWidth="1"
                    opacity="0.8"
                  >
                    <title>{`Outlier: ${formatPDScore(outlierVal)}`}</title>
                  </circle>
                ))}

                {/* Category Label at bottom */}
                <text
                  x={cx}
                  y={plotHeight + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#e2e8f0"
                >
                  {stat.category}
                </text>

                {/* Subtitle count */}
                <text
                  x={cx}
                  y={plotHeight + 33}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                >
                  (n={stat.count})
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Boxplot Data Summary Table below */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px]">
        {data.map((stat, i) => (
          <div key={stat.category} className="bg-slate-900/70 rounded-lg p-2.5 border border-slate-800/80">
            <div className="flex items-center justify-between font-semibold text-slate-200">
              <span>{stat.category}</span>
              <span className="font-mono text-blue-400">Median: {(stat.median * 100).toFixed(2)}%</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400 font-mono mt-1">
              <div>Q1: {(stat.q1 * 100).toFixed(1)}%</div>
              <div>Q3: {(stat.q3 * 100).toFixed(1)}%</div>
              <div>IQR: {(stat.iqr * 100).toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
