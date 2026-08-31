import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  PieChart as PieIcon, 
  Layers, 
  ShieldAlert, 
  DollarSign, 
  Calculator, 
  TrendingUp, 
  Table, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { CreditRecord, DatasetSummary } from '../types';
import { 
  getPortfolioRiskAggregates, 
  getSegmentELAggregates,
  formatCurrencyIDR, 
  formatPercentageIDR, 
  formatNumberIDR 
} from '../utils/creditEngine';

interface PortfolioAnalysisViewProps {
  records: CreditRecord[];
  summary: DatasetSummary | null;
}

const COLORS_SEG = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export const PortfolioAnalysisView: React.FC<PortfolioAnalysisViewProps> = ({ records, summary }) => {
  const riskAggregates = getPortfolioRiskAggregates(records);
  const segmentEL = getSegmentELAggregates(records);

  const validEADRecords = records.filter(r => r.EAD !== undefined && r.EAD > 0);
  const validLGDRecords = records.filter(r => r.LGD !== undefined);
  const validELRecords = records.filter(r => r.expected_loss !== undefined);

  const hasExpectedLossData = validELRecords.length > 0;

  const totalEAD = validEADRecords.reduce((acc, cur) => acc + (cur.EAD || 0), 0);
  const avgEAD = validEADRecords.length > 0 ? totalEAD / validEADRecords.length : 0;
  const avgLGD = validLGDRecords.length > 0 ? validLGDRecords.reduce((acc, cur) => acc + (cur.LGD || 0), 0) / validLGDRecords.length : 0;
  const totalEL = validELRecords.reduce((acc, cur) => acc + (cur.expected_loss || 0), 0);
  const avgEL = validELRecords.length > 0 ? totalEL / validELRecords.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Credit Portfolio Modeling
          </span>
          <span className="text-xs text-slate-500 font-mono">Basel II / IFRS 9 Expected Loss Analytics</span>
        </div>
        <h2 className="text-lg font-semibold text-white mt-1">
          Analisis Portofolio & Expected Loss (EL) BRI
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Agregasi statistik multivariat, permodelan risiko gagal bayar (EAD × LGD), dan segmentasi portofolio.
        </p>
      </div>

      {/* SECTION B: EXPECTED LOSS METRIC CARDS */}
      <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-400" />
              <span>B. Perhitungan Expected Loss (EL = EAD × LGD)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Formula: <code className="text-purple-300 font-mono bg-purple-950/60 border border-purple-800/50 px-1 py-0.5 rounded">EL = EAD * (LGD/100 jika persen)</code>
            </p>
          </div>

          {hasExpectedLossData ? (
            <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
              ✓ EAD & LGD Tersedia ({validELRecords.length} Nasabah)
            </span>
          ) : (
            <span className="text-xs font-semibold bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Kolom EAD / LGD Tidak Ditemukan
            </span>
          )}
        </div>

        {hasExpectedLossData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-purple-400 block">Total EAD</span>
              <span className="text-lg font-bold text-white font-mono">{formatCurrencyIDR(totalEAD)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Exposure at Default</span>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-purple-400 block">Rata-rata EAD</span>
              <span className="text-lg font-bold text-white font-mono">{formatCurrencyIDR(avgEAD)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Rata-rata per nasabah</span>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-purple-400 block">Rata-rata LGD</span>
              <span className="text-lg font-bold text-white font-mono">{formatPercentageIDR(avgLGD * 100, 1)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Loss Given Default ({avgLGD.toFixed(3)})</span>
            </div>

            <div className="bg-gradient-to-br from-purple-900/80 to-indigo-950 text-white p-4 rounded-xl border border-purple-700/50 shadow-lg">
              <span className="text-[10px] font-bold uppercase text-purple-300 block">Total Expected Loss</span>
              <span className="text-lg font-bold text-white font-mono">{formatCurrencyIDR(totalEL)}</span>
              <span className="text-[10px] text-purple-200 block mt-0.5">Cadangan Kerugian Penurunan Nilai</span>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-purple-400 block">Rata-rata EL</span>
              <span className="text-lg font-bold text-white font-mono">{formatCurrencyIDR(avgEL)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Rata-rata EL per debitur</span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">Kolom EAD / LGD tidak ditemukan pada dataset</p>
              <p className="text-amber-300/80 mt-0.5">
                Perhitungan Expected Loss membutuhkan kolom <code className="font-mono font-bold bg-amber-950/50 px-1 py-0.5 rounded">EAD</code> (Exposure at Default) 
                dan <code className="font-mono font-bold bg-amber-950/50 px-1 py-0.5 rounded">LGD</code> (Loss Given Default). 
                Gunakan dataset <code className="font-mono font-bold bg-amber-950/50 px-1 py-0.5 rounded">data_kredit_bri.csv</code> yang sudah memiliki kolom tersebut.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION A & C IN 2 COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A. JUMLAH NASABAH PER RISIKO */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>A. Jumlah Nasabah per Kategori Risiko</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              df["kategori_risiko"].value_counts()
            </p>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Kategori Risiko</th>
                <th className="py-3 px-4 text-right">Jumlah Nasabah</th>
                <th className="py-3 px-4 text-right">Porsi (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {riskAggregates.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">
                    {item.kategori_risiko}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-blue-400">
                    {formatNumberIDR(item.jumlah_nasabah)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400">
                    {formatPercentageIDR(item.persentase_nasabah, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* C. EL PER SEGMEN */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>C. Expected Loss per Segmen Pinjaman</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              df.groupby("segmen")["expected_loss"].mean()
            </p>
          </div>

          {hasExpectedLossData ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Segmen Pinjaman</th>
                  <th className="py-3 px-4 text-right">Nasabah</th>
                  <th className="py-3 px-4 text-right">Rata-rata EL</th>
                  <th className="py-3 px-4 text-right">Total EL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                {segmentEL.map((seg, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS_SEG[idx % COLORS_SEG.length] }} />
                      {seg.segmen}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">{seg.jumlah_nasabah}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-purple-400">
                      {formatCurrencyIDR(seg.rata_rata_el)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {formatCurrencyIDR(seg.total_el)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">
              Expected Loss per segmen belum dapat dihitung karena data EAD/LGD tidak tersedia.
            </div>
          )}
        </div>
      </div>

      {/* SECTION D: AGREGASI RISIKO (.agg()) */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-900/60">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Table className="w-4 h-4 text-blue-400" />
            <span>D. Agregasi Risiko Lengkap (df.groupby("kategori_risiko").agg(...))</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {'df.groupby("kategori_risiko").agg({"skor_kredit": "mean", "pinjaman": "mean", "dsr": "mean"})'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Kategori Risiko</th>
                <th className="py-3 px-4 text-right">Rata-rata Skor</th>
                <th className="py-3 px-4 text-right">Rata-rata Pinjaman</th>
                <th className="py-3 px-4 text-right">Rata-rata DSR</th>
                {hasExpectedLossData && (
                  <th className="py-3 px-4 text-right">Rata-rata Expected Loss</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {riskAggregates.map((agg, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">
                    {agg.kategori_risiko}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-blue-400">
                    {agg.rata_rata_skor.toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                    {formatCurrencyIDR(agg.rata_rata_pinjaman)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      agg.rata_rata_dsr > 40 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {formatPercentageIDR(agg.rata_rata_dsr, 2)}
                    </span>
                  </td>
                  {hasExpectedLossData && (
                    <td className="py-3 px-4 text-right font-mono text-purple-400 font-bold">
                      {agg.rata_rata_el !== undefined ? formatCurrencyIDR(agg.rata_rata_el) : '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
