import React from 'react';
import { CreditRecord } from '../../types';
import { getBubbleChartData, formatCurrencyIDR, formatPDScore } from '../../utils/creditEngine';

interface BubbleChartPDvsLGDProps {
  records: CreditRecord[];
}

export const BubbleChartPDvsLGD: React.FC<BubbleChartPDvsLGDProps> = ({ records }) => {
  const data = getBubbleChartData(records);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        Data segmen tidak cukup untuk bubble chart
      </div>
    );
  }

  // Calculate SVG scale
  const minPD = Math.min(...data.map(d => d.pd_score));
  const maxPD = Math.max(...data.map(d => d.pd_score));
  const minLGD = Math.min(...data.map(d => d.lgd));
  const maxLGD = Math.max(...data.map(d => d.lgd));
  const minEAD = Math.min(...data.map(d => d.total_ead));
  const maxEAD = Math.max(...data.map(d => d.total_ead));

  const xPadding = Math.max(0.01, (maxPD - minPD) * 0.25 || 0.02);
  const yPadding = Math.max(0.02, (maxLGD - minLGD) * 0.25 || 0.05);

  const xMin = Math.max(0, minPD - xPadding);
  const xMax = maxPD + xPadding;
  const yMin = Math.max(0, minLGD - yPadding);
  const yMax = Math.min(1, maxLGD + yPadding);

  const svgWidth = 560;
  const svgHeight = 240;
  const margin = { top: 25, right: 40, bottom: 45, left: 60 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  const xScale = (val: number) => {
    if (xMax === xMin) return plotWidth / 2;
    return ((val - xMin) / (xMax - xMin)) * plotWidth;
  };

  const yScale = (val: number) => {
    if (yMax === yMin) return plotHeight / 2;
    return plotHeight - ((val - yMin) / (yMax - yMin)) * plotHeight;
  };

  const radiusScale = (ead: number) => {
    if (maxEAD === minEAD) return 24;
    return 16 + ((ead - minEAD) / (maxEAD - minEAD)) * 32;
  };

  const segColors: { [key: string]: { fill: string; border: string; text: string } } = {
    'Mikro': { fill: '#10B981', border: '#059669', text: '#34D399' },
    'Kecil': { fill: '#3B82F6', border: '#2563EB', text: '#60A5FA' },
    'Menengah': { fill: '#F59E0B', border: '#D97706', text: '#FBBF24' }
  };

  return (
    <div className="space-y-4">
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-64 select-none font-sans">
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const yVal = yMin + pct * (yMax - yMin);
              const y = yScale(yVal);
              return (
                <g key={`ygrid-${idx}`}>
                  <line x1={0} y1={y} x2={plotWidth} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={-10} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                    {(yVal * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })}

            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const xVal = xMin + pct * (xMax - xMin);
              const x = xScale(xVal);
              return (
                <g key={`xgrid-${idx}`}>
                  <line x1={x} y1={0} x2={x} y2={plotHeight} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={x} y={plotHeight + 18} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                    {(xVal * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })}

            {/* Axis Lines */}
            <line x1={0} y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="#334155" />
            <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="#334155" />

            {/* Axis Labels */}
            <text x={plotWidth / 2} y={plotHeight + 35} textAnchor="middle" fontSize="11" fill="#cbd5e1" fontWeight="600">
              Rata-rata Probability of Default (PD) →
            </text>
            <text x={-plotHeight / 2} y={-38} transform="rotate(-90)" textAnchor="middle" fontSize="11" fill="#cbd5e1" fontWeight="600">
              Rata-rata Loss Given Default (LGD) →
            </text>

            {/* Render Bubbles */}
            {data.map((item) => {
              const cx = xScale(item.pd_score);
              const cy = yScale(item.lgd);
              const r = radiusScale(item.total_ead);
              const color = segColors[item.segmen] || { fill: '#8B5CF6', border: '#7C3AED', text: '#A78BFA' };

              return (
                <g key={item.segmen} className="cursor-pointer group">
                  {/* Bubble circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={color.fill}
                    fillOpacity="0.4"
                    stroke={color.border}
                    strokeWidth="2.5"
                    className="transition-all duration-300 hover:fill-opacity-60"
                  >
                    <title>
                      {`Segmen: ${item.segmen}\nRata-rata PD: ${formatPDScore(item.pd_score)} (${(item.pd_score * 100).toFixed(2)}%)\nRata-rata LGD: ${(item.lgd * 100).toFixed(1)}%\nTotal EAD: ${formatCurrencyIDR(item.total_ead)}\nTotal Nasabah: ${item.jumlah_nasabah}`}
                    </title>
                  </circle>

                  {/* Center Dot */}
                  <circle cx={cx} cy={cy} r="3" fill="#FFFFFF" />

                  {/* Segment Label Badge */}
                  <text
                    x={cx}
                    y={cy - r - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill={color.text}
                    className="drop-shadow-md"
                  >
                    {item.segmen}
                  </text>

                  {/* EAD Subtitle */}
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#FFFFFF"
                  >
                    {item.total_ead >= 1_000_000_000 
                      ? `${(item.total_ead / 1_000_000_000).toFixed(1)}M` 
                      : `${(item.total_ead / 1_000_000).toFixed(0)}jt`}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Bubble Legend & Explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
        {data.map((item) => (
          <div key={item.segmen} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: segColors[item.segmen]?.fill || '#3B82F6' }}></span>
                Segmen {item.segmen}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{item.jumlah_nasabah} Nasabah</span>
            </div>
            <div className="mt-2 space-y-0.5 text-[11px] text-slate-300 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Total EAD:</span>
                <span className="font-bold text-emerald-400">{formatCurrencyIDR(item.total_ead)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rata-rata PD:</span>
                <span className="font-bold text-amber-400">{(item.pd_score * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rata-rata LGD:</span>
                <span className="font-bold text-indigo-400">{(item.lgd * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
