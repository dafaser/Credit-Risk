import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { CreditRecord } from '../../types';
import { calculateCrosstab } from '../../utils/creditEngine';

interface StackedBarKolektibilitasProps {
  records: CreditRecord[];
}

export const StackedBarKolektibilitas: React.FC<StackedBarKolektibilitasProps> = ({ records }) => {
  const crosstabData = calculateCrosstab(records);

  if (!crosstabData || crosstabData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        Tidak ada data kolektibilitas
      </div>
    );
  }

  const chartData = crosstabData.map(d => ({
    segmen: d.segmen,
    Lancar: d.Lancar,
    Macet: d.Macet,
    Total: d.Total,
    nplRate: d.nplRate
  }));

  return (
    <div className="space-y-4">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis dataKey="segmen" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const lancar = payload.find(p => p.dataKey === 'Lancar')?.value || 0;
                  const macet = payload.find(p => p.dataKey === 'Macet')?.value || 0;
                  const total = Number(lancar) + Number(macet);
                  const npl = total > 0 ? (Number(macet) / total) * 100 : 0;
                  return (
                    <div className="bg-[#020617] border border-slate-700 p-2.5 rounded-lg text-xs text-white shadow-xl">
                      <div className="font-semibold text-blue-400">Segmen: {label}</div>
                      <div className="text-emerald-400 mt-1 flex justify-between gap-4">
                        <span>Lancar:</span>
                        <span className="font-bold font-mono">{lancar} nasabah</span>
                      </div>
                      <div className="text-rose-400 flex justify-between gap-4">
                        <span>Macet (NPL):</span>
                        <span className="font-bold font-mono">{macet} nasabah</span>
                      </div>
                      <div className="border-t border-slate-800 pt-1 mt-1 flex justify-between gap-4 text-slate-300">
                        <span>NPL Ratio:</span>
                        <span className="font-bold font-mono text-amber-400">{npl.toFixed(2)}%</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              height={30}
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />
            <Bar dataKey="Lancar" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} name="Lancar" />
            <Bar dataKey="Macet" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} name="Macet" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Crosstab Matrix Table (pd.crosstab equivalent) */}
      <div className="overflow-x-auto pt-2 border-t border-slate-800">
        <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
          <span>Tabel Crosstab (pd.crosstab(df['segmen'], df['kolektibilitas']))</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-300 text-[10px] uppercase font-semibold border-b border-slate-800">
            <tr>
              <th className="py-2 px-3">Segmen</th>
              <th className="py-2 px-3 text-right text-emerald-400">Lancar</th>
              <th className="py-2 px-3 text-right text-rose-400">Macet</th>
              <th className="py-2 px-3 text-right text-slate-200">Total</th>
              <th className="py-2 px-3 text-right text-amber-400">NPL Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {crosstabData.map((row) => (
              <tr key={row.segmen} className="hover:bg-slate-800/30">
                <td className="py-2 px-3 font-sans font-semibold text-white">{row.segmen}</td>
                <td className="py-2 px-3 text-right text-emerald-400">{row.Lancar}</td>
                <td className="py-2 px-3 text-right text-rose-400">{row.Macet}</td>
                <td className="py-2 px-3 text-right text-slate-200 font-bold">{row.Total}</td>
                <td className="py-2 px-3 text-right font-bold text-amber-400">{row.nplRate.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
