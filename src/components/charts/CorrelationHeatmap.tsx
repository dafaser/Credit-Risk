import React, { useState } from 'react';
import { CorrelationMatrix } from '../../types';

interface CorrelationHeatmapProps {
  data: CorrelationMatrix;
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ data }) => {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; val: number } | null>(null);

  if (!data || !data.matrix || data.matrix.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        Data korelasi tidak tersedia
      </div>
    );
  }

  const { labels, matrix } = data;
  const n = labels.length;

  /**
   * Seaborn 'vlag' colormap simulation (Coolwarm diverging):
   * -1.0 -> Deep Blue (#2563EB)
   *  0.0 -> Neutral Slate (#1E293B)
   * +1.0 -> Deep Red (#EF4444)
   */
  const getCellColor = (val: number) => {
    if (val === 1) return 'bg-slate-700/80 text-white font-bold';
    if (val > 0.6) return 'bg-rose-600/80 text-white font-bold';
    if (val > 0.3) return 'bg-rose-500/50 text-rose-100 font-semibold';
    if (val > 0.1) return 'bg-rose-500/25 text-rose-200';
    if (val >= -0.1 && val <= 0.1) return 'bg-slate-800/40 text-slate-400';
    if (val < -0.6) return 'bg-blue-600/80 text-white font-bold';
    if (val < -0.3) return 'bg-blue-500/50 text-blue-100 font-semibold';
    return 'bg-blue-500/25 text-blue-200';
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-[11px] font-mono">
          <thead>
            <tr>
              <th className="p-2 text-left text-slate-400 font-sans text-xs font-semibold">Variabel</th>
              {labels.map((label, i) => (
                <th key={`th-${i}`} className="p-2 font-semibold text-slate-300 text-center min-w-[70px]">
                  <span className="block truncate" title={label}>{label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIdx) => (
              <tr key={`tr-${rowIdx}`} className="border-t border-slate-800/50">
                <td className="p-2 text-left font-sans font-semibold text-slate-300 whitespace-nowrap bg-slate-900/30">
                  {labels[rowIdx]}
                </td>
                {row.map((val, colIdx) => (
                  <td
                    key={`td-${rowIdx}-${colIdx}`}
                    onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx, val })}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`p-2 transition-all cursor-pointer border border-slate-800/40 ${getCellColor(val)} ${
                      hoveredCell?.row === rowIdx || hoveredCell?.col === colIdx ? 'ring-1 ring-white/50' : ''
                    }`}
                  >
                    {val.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Color Scale Legend */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
          <span>Negatif Kuat (-1.00)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-800 inline-block border border-slate-700"></span>
          <span>Netral (0.00)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-600 inline-block"></span>
          <span>Positif Kuat (+1.00)</span>
        </div>
      </div>

      {hoveredCell && (
        <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 text-xs text-slate-200">
          Korelasi antara <span className="font-semibold text-blue-400">{labels[hoveredCell.row]}</span> dan{' '}
          <span className="font-semibold text-indigo-400">{labels[hoveredCell.col]}</span>: <span className="font-bold text-white font-mono">{hoveredCell.val.toFixed(2)}</span>
          <span className="text-slate-400 block text-[10px] mt-0.5">
            {hoveredCell.val > 0.5 ? 'Hubungan linier positif kuat' : hoveredCell.val < -0.5 ? 'Hubungan linier negatif kuat' : 'Korelasi rendah atau moderat'}
          </span>
        </div>
      )}
    </div>
  );
};
