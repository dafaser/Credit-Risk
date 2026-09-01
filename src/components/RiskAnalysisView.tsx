import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Filter, 
  TrendingUp, 
  HelpCircle, 
  Layers,
  Table as TableIcon,
  PieChart as PieIcon,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Building,
  ArrowDownUp
} from 'lucide-react';
import { CreditRecord, DatasetSummary } from '../types';
import { 
  applyFilter1, 
  applyFilter2, 
  applyFilter3, 
  calculateBoxplotStats,
  calculateCorrelationMatrix,
  calculateBranchSegmentAggregates,
  calculateSegmentPivotPD,
  formatCurrencyIDR, 
  formatPercentageIDR, 
  formatPDScore,
  formatNumberIDR 
} from '../utils/creditEngine';

import { HistogramKDEChart } from './charts/HistogramKDEChart';
import { CorrelationHeatmap } from './charts/CorrelationHeatmap';
import { BoxplotChart } from './charts/BoxplotChart';
import { StackedBarKolektibilitas } from './charts/StackedBarKolektibilitas';
import { BubbleChartPDvsLGD } from './charts/BubbleChartPDvsLGD';

interface RiskAnalysisViewProps {
  records: CreditRecord[];
  summary: DatasetSummary | null;
}

export const RiskAnalysisView: React.FC<RiskAnalysisViewProps> = ({ records, summary }) => {
  const [activeTab, setActiveTab] = useState<'visualisasi' | 'filters' | 'agregasi'>('visualisasi');
  const [boxplotGroup, setBoxplotGroup] = useState<'kategori_risiko' | 'segmen'>('kategori_risiko');

  // Filter 2 State: selected branches
  const availableBranches = useMemo(() => {
    return Array.from(new Set(records.map(r => r.nama_cabang))).filter(Boolean).sort();
  }, [records]);

  const [selectedBranches, setSelectedBranches] = useState<string[]>(() => {
    return availableBranches.slice(0, 3);
  });

  // Calculate filtered sets
  const filter1Results = useMemo(() => applyFilter1(records), [records]);
  const filter2Results = useMemo(() => applyFilter2(records, selectedBranches), [records, selectedBranches]);
  const filter3Results = useMemo(() => applyFilter3(records), [records]);

  // Visualizations datasets
  const pdValues = useMemo(() => records.map(r => r.pd_score), [records]);
  const correlationMatrix = useMemo(() => calculateCorrelationMatrix(records), [records]);
  const boxplotData = useMemo(() => calculateBoxplotStats(records, 'pd_score', boxplotGroup), [records, boxplotGroup]);
  const branchSegmentAggs = useMemo(() => calculateBranchSegmentAggregates(records), [records]);
  const pivotPDSegmen = useMemo(() => calculateSegmentPivotPD(records), [records]);

  const toggleBranch = (branch: string) => {
    setSelectedBranches(prev => 
      prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Tugas 2 & Sesi 3-4 Hari 2
            </span>
            <span className="text-xs text-slate-500 font-mono">BFLP Risk Management</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            Visualisasi Risiko Kredit & Analisis Portofolio
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Implementasi 5 visualisasi inti risiko kredit (Histogram+KDE, Heatmap Korelasi, Boxplot PD, Stacked Bar Kolektibilitas, Bubble Chart PD vs LGD), 3 Filter Pandas, dan Agregasi.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 self-start md:self-auto shrink-0">
          <button
            id="tab-btn-visualisasi"
            onClick={() => setActiveTab('visualisasi')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'visualisasi' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>5 Visualisasi Risiko</span>
          </button>
          <button
            id="tab-btn-filters"
            onClick={() => setActiveTab('filters')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'filters' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>3 Filter Pandas</span>
          </button>
          <button
            id="tab-btn-agregasi"
            onClick={() => setActiveTab('agregasi')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'agregasi' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Pivot & Agregasi</span>
          </button>
        </div>
      </div>

      {/* TAB 1: 5 VISUALISASI RISIKO */}
      {activeTab === 'visualisasi' && (
        <div className="space-y-6">
          {/* Row 1: Grafik 1 (Histogram+KDE) & Grafik 2 (Correlation Heatmap) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GRAFIK 1: HISTOGRAM + KDE */}
            <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                    Histogram + KDE Distribusi PD Score
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Konsentrasi dan penyebaran frekuensi nilai Probability of Default
                  </p>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  bins=30 + KDE
                </span>
              </div>
              <HistogramKDEChart data={pdValues} binsCount={25} />
            </div>

            {/* GRAFIK 2: HEATMAP KORELASI */}
            <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold">2</span>
                    Heatmap Korelasi Variabel Risiko
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Matriks korelasi Pearson antara PD, LGD, EAD, Pinjaman, Pendapatan, Skor &amp; DSR
                  </p>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  vlag colormap
                </span>
              </div>
              <CorrelationHeatmap data={correlationMatrix} />
            </div>
          </div>

          {/* Row 2: Grafik 3 (Boxplot) & Grafik 4 (Stacked Bar Kolektibilitas) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GRAFIK 3: BOXPLOT PD */}
            <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">3</span>
                    Boxplot PD berdasarkan {boxplotGroup === 'kategori_risiko' ? 'Kategori Risiko' : 'Segmen'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Median, Q1, Q3, rentang interkuartil (IQR), dan sebaran outlier
                  </p>
                </div>
                <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 self-start">
                  <button
                    onClick={() => setBoxplotGroup('kategori_risiko')}
                    className={`px-2 py-1 text-[10px] font-semibold rounded cursor-pointer ${
                      boxplotGroup === 'kategori_risiko' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Kategori Risiko
                  </button>
                  <button
                    onClick={() => setBoxplotGroup('segmen')}
                    className={`px-2 py-1 text-[10px] font-semibold rounded cursor-pointer ${
                      boxplotGroup === 'segmen' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Segmen
                  </button>
                </div>
              </div>
              <BoxplotChart data={boxplotData} valueLabel="PD Score" />
            </div>

            {/* GRAFIK 4: STACKED BAR KOLEKTIBILITAS */}
            <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">4</span>
                    Komposisi Kolektibilitas per Segmen
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Proporsi status kredit Lancar vs Macet (NPL) pada Mikro, Kecil, dan Menengah
                  </p>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  Stacked Bar + Crosstab
                </span>
              </div>
              <StackedBarKolektibilitas records={records} />
            </div>
          </div>

          {/* Row 3: Grafik 5 (Bubble Chart PD vs LGD with Total EAD Size) */}
          <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">5</span>
                  Bubble Chart PD vs LGD per Segmen (Size = Total EAD)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sumbu X: Rata-rata PD | Sumbu Y: Rata-rata LGD | Ukuran Lingkaran: Total Exposure at Default (EAD)
                </p>
              </div>
              <span className="text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-500/30">
                Risk Exposure Mapping
              </span>
            </div>
            <BubbleChartPDvsLGD records={records} />
          </div>
        </div>
      )}

      {/* TAB 2: 3 FILTER TUGAS PANDAS */}
      {activeTab === 'filters' && (
        <div className="space-y-6">
          {/* FILTER 1 CARD */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Filter 1
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    Skor Kredit &lt; 550 &amp; Pinjaman &gt; Rp 50 Juta
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  df[(df['skor_kredit'] &lt; 550) &amp; (df['pinjaman'] &gt; 50_000_000)]
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Total Ditemukan:</span>
                <span className="text-lg font-bold font-mono text-rose-400 ml-2">{filter1Results.length} nasabah</span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">ID Nasabah</th>
                    <th className="py-2.5 px-3">Nama Nasabah</th>
                    <th className="py-2.5 px-3 text-right">Skor Kredit</th>
                    <th className="py-2.5 px-3 text-right">PD Score</th>
                    <th className="py-2.5 px-3 text-right">Pinjaman</th>
                    <th className="py-2.5 px-3">Segmen</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Cabang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                  {filter1Results.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="py-2 px-3 font-mono font-bold text-blue-400">{r.id_nasabah}</td>
                      <td className="py-2 px-3 text-white font-semibold">{r.nama_nasabah}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-400">{r.skor_kredit}</td>
                      <td className="py-2 px-3 text-right font-mono text-amber-400">{formatPDScore(r.pd_score)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-200">{formatCurrencyIDR(r.pinjaman)}</td>
                      <td className="py-2 px-3 font-semibold">{r.segmen}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status_kredit === 'Lancar' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {r.status_kredit}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400">{r.nama_cabang}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FILTER 2 CARD */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Filter 2
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    Status Kredit 'Macet' &amp; Cabang Terpilih (.isin())
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  df[(df['status_kredit'] == 'Macet') &amp; (df['nama_cabang'].isin(cabang_pilihan))]
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Total Ditemukan:</span>
                <span className="text-lg font-bold font-mono text-rose-400 ml-2">{filter2Results.length} nasabah</span>
              </div>
            </div>

            {/* Branch Selector Chips */}
            <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> Pilih Cabang:
              </span>
              {availableBranches.map(b => (
                <button
                  key={b}
                  onClick={() => toggleBranch(b)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer font-medium ${
                    selectedBranches.includes(b)
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">ID Nasabah</th>
                    <th className="py-2.5 px-3">Nama Nasabah</th>
                    <th className="py-2.5 px-3">Cabang</th>
                    <th className="py-2.5 px-3 text-right">Skor</th>
                    <th className="py-2.5 px-3 text-right">PD Score</th>
                    <th className="py-2.5 px-3 text-right">Pinjaman</th>
                    <th className="py-2.5 px-3 text-right">EAD</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                  {filter2Results.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="py-2 px-3 font-mono font-bold text-blue-400">{r.id_nasabah}</td>
                      <td className="py-2 px-3 text-white font-semibold">{r.nama_nasabah}</td>
                      <td className="py-2 px-3 text-blue-300 font-medium">{r.nama_cabang}</td>
                      <td className="py-2 px-3 text-right font-mono">{r.skor_kredit}</td>
                      <td className="py-2 px-3 text-right font-mono text-rose-400">{formatPDScore(r.pd_score)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-200">{formatCurrencyIDR(r.pinjaman)}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-300">{formatCurrencyIDR(r.EAD)}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {r.status_kredit}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FILTER 3 CARD */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Filter 3
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    Usia 25–60 Tahun ATAU Skor Kredit &lt; 500
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  df[((df['usia'] &gt;= 25) &amp; (df['usia'] &lt;= 60)) | (df['skor_kredit'] &lt; 500)]
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Total Ditemukan:</span>
                <span className="text-lg font-bold font-mono text-emerald-400 ml-2">{filter3Results.length} nasabah</span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">ID Nasabah</th>
                    <th className="py-2.5 px-3">Nama Nasabah</th>
                    <th className="py-2.5 px-3 text-right">Usia</th>
                    <th className="py-2.5 px-3 text-right">Skor Kredit</th>
                    <th className="py-2.5 px-3 text-right">PD Score</th>
                    <th className="py-2.5 px-3 text-right">Pinjaman</th>
                    <th className="py-2.5 px-3">Kategori NPL</th>
                    <th className="py-2.5 px-3">Cabang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                  {filter3Results.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="py-2 px-3 font-mono font-bold text-blue-400">{r.id_nasabah}</td>
                      <td className="py-2 px-3 text-white font-semibold">{r.nama_nasabah}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        <span className={r.usia >= 25 && r.usia <= 60 ? 'text-blue-400 font-bold' : 'text-slate-400'}>
                          {r.usia} thn
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        <span className={r.skor_kredit < 500 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                          {r.skor_kredit}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-amber-400">{formatPDScore(r.pd_score)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-200">{formatCurrencyIDR(r.pinjaman)}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.flag_npl === 'Rendah' ? 'bg-emerald-500/20 text-emerald-400' :
                          r.flag_npl === 'Sedang-Rendah' ? 'bg-blue-500/20 text-blue-400' :
                          r.flag_npl === 'Sedang-Tinggi' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {r.flag_npl}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400">{r.nama_cabang}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PIVOT & AGREGASI CABANG-SEGMEN */}
      {activeTab === 'agregasi' && (
        <div className="space-y-6">
          {/* PIVOT TABLE: RATA-RATA PD PER SEGMEN */}
          <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-blue-400" />
                  Pivot Table: Rata-rata Probability of Default (PD) per Segmen
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  pd.pivot_table(df, index='segmen', values='pd', aggfunc='mean')
                </p>
              </div>
              <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                pd.pivot_table
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Segmen</th>
                    <th className="py-2.5 px-4 text-right">Rata-rata PD Score</th>
                    <th className="py-2.5 px-4 text-right">Persentase PD</th>
                    <th className="py-2.5 px-4 text-right">Jumlah Nasabah</th>
                    <th className="py-2.5 px-4 text-right">Total Pinjaman</th>
                    <th className="py-2.5 px-4 text-right">Total EAD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {pivotPDSegmen.map((p) => (
                    <tr key={p.segmen} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          p.segmen === 'Mikro' ? 'bg-emerald-500' : p.segmen === 'Kecil' ? 'bg-blue-500' : 'bg-amber-500'
                        }`}></span>
                        {p.segmen}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-400">{formatPDScore(p.rata_rata_pd)}</td>
                      <td className="py-3 px-4 text-right font-bold text-blue-400">{(p.rata_rata_pd * 100).toFixed(2)}%</td>
                      <td className="py-3 px-4 text-right text-slate-200 font-sans">{p.jumlah_nasabah} Nasabah</td>
                      <td className="py-3 px-4 text-right text-slate-200 font-bold">{formatCurrencyIDR(p.total_pinjaman)}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-bold">{formatCurrencyIDR(p.total_ead)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABEL AGREGASI CABANG & SEGMEN */}
          <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-400" />
                  Tabel Agregasi per Cabang dan Segmen
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  df.groupby(['nama_cabang', 'segmen']).agg(...)
                </p>
              </div>
              <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                groupby + agg
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Nama Cabang</th>
                    <th className="py-2.5 px-3">Segmen</th>
                    <th className="py-2.5 px-3 text-right">Nasabah</th>
                    <th className="py-2.5 px-3 text-right">Rata-rata PD</th>
                    <th className="py-2.5 px-3 text-right">Rata-rata LGD</th>
                    <th className="py-2.5 px-3 text-right">Total Pinjaman</th>
                    <th className="py-2.5 px-3 text-right">Total EAD</th>
                    <th className="py-2.5 px-3 text-right">Rata-rata Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {branchSegmentAggs.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-sans font-semibold text-white">{row.nama_cabang}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-blue-300">{row.segmen}</td>
                      <td className="py-2.5 px-3 text-right font-sans">{row.jumlah_nasabah}</td>
                      <td className="py-2.5 px-3 text-right text-amber-400 font-bold">{formatPDScore(row.rata_rata_pd)}</td>
                      <td className="py-2.5 px-3 text-right text-indigo-400">{(row.rata_rata_lgd * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-right text-slate-200 font-bold">{formatCurrencyIDR(row.total_pinjaman)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{formatCurrencyIDR(row.total_ead)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{formatCurrencyIDR(row.rata_rata_pendapatan)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
