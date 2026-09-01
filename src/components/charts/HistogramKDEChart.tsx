import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { calculateHistogramKDE } from '../../utils/creditEngine';

interface HistogramKDEChartProps {
  data: number[];
  binsCount?: number;
  title?: string;
  xLabel?: string;
}

export const HistogramKDEChart: React.FC<HistogramKDEChartProps> = ({
  data,
  binsCount = 25,
  xLabel = 'PD Score'
}) => {
  const { bins, mean, median, min, max, std } = calculateHistogramKDE(data, binsCount);

  if (bins.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        Tidak ada data distribusi PD
      </div>
    );
  }

  const chartData = bins.map(b => ({
    label: `${(b.binStart * 100).toFixed(1)}%`,
    range: b.binLabel,
    count: b.count,
    kde: b.kdeDensity,
    mid: b.midValue
  }));

  return (
    <div className="space-y-3">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              interval={Math.floor(binsCount / 6)}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'Frekuensi', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, offset: 25 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              hide={true}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#020617] border border-slate-700 p-2.5 rounded-lg text-xs text-white shadow-xl">
                      <div className="font-semibold text-blue-400">Rentang PD: {d.range}</div>
                      <div className="text-slate-300 mt-1">Frekuensi: <span className="font-bold text-white">{d.count} nasabah</span></div>
                      <div className="text-indigo-300">Estimasi Densitas KDE: <span className="font-bold">{d.kde}</span></div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Reference Line for Mean and Median */}
            <ReferenceLine
              yAxisId="left"
              x={`${(mean * 100).toFixed(1)}%`}
              stroke="#F59E0B"
              strokeDasharray="3 3"
              label={{ value: `Mean: ${(mean * 100).toFixed(1)}%`, fill: '#F59E0B', fontSize: 10, position: 'top' }}
            />
            {/* Histogram Bars */}
            <Bar
              yAxisId="left"
              dataKey="count"
              fill="#3B82F6"
              fillOpacity={0.75}
              radius={[3, 3, 0, 0]}
              name="Frekuensi"
            />
            {/* Smooth KDE Density Curve */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="kde"
              stroke="#EC4899"
              strokeWidth={2.5}
              dot={false}
              name="KDE Density Curve"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 block">Rata-rata (Mean)</span>
          <span className="font-bold font-mono text-amber-400">{(mean * 100).toFixed(2)}% ({mean.toFixed(4)})</span>
        </div>
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 block">Nilai Tengah (Median)</span>
          <span className="font-bold font-mono text-blue-400">{(median * 100).toFixed(2)}% ({median.toFixed(4)})</span>
        </div>
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 block">Standar Deviasi</span>
          <span className="font-bold font-mono text-indigo-400">{(std * 100).toFixed(2)}%</span>
        </div>
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 block">Rentang (Min - Max)</span>
          <span className="font-bold font-mono text-emerald-400">{(min * 100).toFixed(1)}% - {(max * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};
