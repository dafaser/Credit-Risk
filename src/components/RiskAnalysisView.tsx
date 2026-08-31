import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  LineChart, 
  Line,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { 
  ShieldAlert, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Building, 
  HelpCircle, 
  TrendingDown, 
  TrendingUp,
  Layers,
  Award,
  Percent,
  Check
} from 'lucide-react';
import { CreditRecord, DatasetSummary } from '../types';
import { 
  applyFilter1, 
  applyFilter2, 
  applyFilter3, 
  getPortfolioRiskAggregates,
  formatCurrencyIDR, 
  formatPercentageIDR, 
  formatNumberIDR 
} from '../utils/creditEngine';

interface RiskAnalysisViewProps {
  records: CreditRecord[];
  summary: DatasetSummary | null;
}

const COLORS_RISK = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
const COLORS_NPL: { [key: string]: string } = {
  'Rendah': '#10B981',
  'Sedang-Rendah': '#3B82F6',
  'Sedang-Tinggi': '#F59E0B',
  'Tinggi': '#EF4444'
};

export const RiskAnalysisView: React.FC<RiskAnalysisViewProps> = ({ records, summary }) => {
  const [activeTab, setActiveTab] = useState<'filters' | 'charts'>('filters');

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

  // Risk aggregates for Chart 4 & 5
  const riskAggregates = useMemo(() => getPortfolioRiskAggregates(records), [records]);

  // Chart 1: Risk Category
  const riskDistData = riskAggregates.map(r => ({
    name: r.kategori_risiko,
    count: r.jumlah_nasabah,
    totalLoan: r.total_pinjaman
  }));

  // Chart 2: NPL Flag
  const nplCounts: { [flag: string]: number } = { 'Rendah': 0, 'Sedang-Rendah': 0, 'Sedang-Tinggi': 0, 'Tinggi': 0 };
  records.forEach(r => {
    if (nplCounts[r.flag_npl] !== undefined) nplCounts[r.flag_npl]++;
  });
  const nplDistData = Object.keys(nplCounts).map(flag => ({
    name: flag,
    count: nplCounts[flag],
    percentage: records.length > 0 ? (nplCounts[flag] / records.length) * 100 : 0
  }));

  // Chart 3: Status Kredit
  const lancarCount = records.filter(r => r.status_kredit === 'Lancar').length;
  const macetCount = records.filter(r => r.status_kredit === 'Macet').length;
  const statusData = [
    { name: 'Lancar', value: lancarCount, color: '#10B981' },
    { name: 'Macet', value: macetCount, color: '#EF4444' }
  ];

  const toggleBranch = (branch: string) => {
    setSelectedBranches(prev => 
      prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Risk Segmentation & Monitoring
            </span>
            <span className="text-xs text-slate-500 font-mono">Tugas Hari 2 Sesi 2</span>
          </div>
          <h2 className="text-lg font-semibold text-white mt-1">
            Analisis Risiko Kredit & 3 Filter Tugas Pandas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Eksekusi filtering logis terarah pada sub-populasi debitur berisiko tinggi dan visualisasi matriks risiko.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            id="tab-btn-filters"
            onClick={() => setActiveTab('filters')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'filters' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3 Filter Tugas Pandas
          </button>
          <button
            id="tab-btn-charts"
            onClick={() => setActiveTab('charts')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'charts' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5 Grafik Visualisasi Risiko
          </button>
        </div>
      </div>

      {activeTab === 'filters' ? (
        <div className="space-y-6">
          {/* FILTER 1 CARD */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white">
                    FILTER 1
                  </span>
                  <h3 className="text-sm font-semibold text-white">
                    Skor Kredit &lt; 550 DAN Pinjaman &gt; Rp 50 Juta
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  df[(df["skor_kredit"] &lt; 550) & (df["pinjaman"] &gt; 50_000_000)]
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Hasil:</span>
                <span className="px-3 py-1 bg-rose-500/20 text-rose-400 font-bold rounded-xl text-xs font-mono border border-rose-500/30">
                  {filter1Results.length} Nasabah
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">ID Nasabah</th>
                    <th className="py-2.5 px-3">Nama Nasabah</th>
                    <th className="py-2.5 px-3 text-right">Skor Kredit (&lt;550)</th>
                    <th className="py-2.5 px-3 text-right">Pinjaman (&gt;50Jt)</th>
                    <th className="py-2.5 px-3 text-right">DSR</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Cabang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                  {filter1Results.length > 0 ? (
                    filter1Results.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-400">{r.id_nasabah}</td>
                        <td className="py-2.5 px-3 text-white font-semibold">{r.nama_nasabah}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">{r.skor_kredit}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">{formatCurrencyIDR(r.pinjaman)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">{formatPercentageIDR(r.dsr)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status_kredit === 'Lancar' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {r.status_kredit}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{r.nama_cabang}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">
                        Tidak ditemukan nasabah dengan skor &lt; 550 dan pinjaman &gt; Rp50 juta.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FILTER 2 CARD */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-900/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white">
                      FILTER 2
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                      Status Kredit = Macet DAN Cabang Terpilih (.isin())
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    df[(df["status_kredit"] == "Macet") & (df["nama_cabang"].isin(selected_branches))]
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Hasil:</span>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 font-bold rounded-xl text-xs font-mono border border-amber-500/30">
                    {filter2Results.length} Nasabah Macet
                  </span>
                </div>
              </div>

              {/* Branch Multi-select pills */}
              <div>
                <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                  Pilih Cabang (st.multiselect equivalent):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {availableBranches.map((branch) => {
                    const isSelected = selectedBranches.includes(branch);
                    return (
                      <button
                        key={branch}
                        onClick={() => toggleBranch(branch)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600 text-white font-semibold'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{branch}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">ID Nasabah</th>
                    <th className="py-2.5 px-3">Nama Nasabah</th>
                    <th className="py-2.5 px-3">Cabang (.isin())</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Pinjaman</th>
                    <th className="py-2.5 px-3 text-right">Skor Kredit</th>
                    <th className="py-2.5 px-3 text-right">DSR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                  {filter2Results.length > 0 ? (
                    filter2Results.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-400">{r.id_nasabah}</td>
                        <td className="py-2.5 px-3 text-white font-semibold">{r.nama_nasabah}</td>
                        <td className="py-2.5 px-3 font-semibold text-amber-400">{r.nama_cabang}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {r.status_kredit}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">{formatCurrencyIDR(r.pinjaman)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-400 font-bold">{r.skor_kredit}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">{formatPercentageIDR(r.dsr)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">
                        {selectedBranches.length === 0 
                          ? 'Silakan pilih minimal 1 cabang di atas untuk melihat data kredit macet.' 
                          : 'Tidak ada nasabah macet pada cabang yang dipilih.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FILTER 3 CARD */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white">
                    FILTER 3
                  </span>
                  <h3 className="text-sm font-semibold text-white">
                    Usia 25–60 Tahun ATAU Skor Kredit &lt; 500
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  df[((df["usia"] &gt;= 25) & (df["usia"] &lt;= 60)) | (df["skor_kredit"] &lt; 500)]
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Hasil:</span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 font-bold rounded-xl text-xs font-mono border border-blue-500/30">
                  {filter3Results.length} Nasabah
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">ID Nasabah</th>
                    <th className="py-2.5 px-3">Nama Nasabah</th>
                    <th className="py-2.5 px-3 text-right">Usia (25–60)</th>
                    <th className="py-2.5 px-3 text-right">Skor Kredit (&lt;500)</th>
                    <th className="py-2.5 px-3 text-right">Pinjaman</th>
                    <th className="py-2.5 px-3 text-center">Kategori NPL</th>
                    <th className="py-2.5 px-3">Cabang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                  {filter3Results.length > 0 ? (
                    filter3Results.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-400">{r.id_nasabah}</td>
                        <td className="py-2.5 px-3 text-white font-semibold">{r.nama_nasabah}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          <span className={`${r.usia >= 25 && r.usia <= 60 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
                            {r.usia} thn
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className={`${r.skor_kredit < 500 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                            {r.skor_kredit}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">{formatCurrencyIDR(r.pinjaman)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.flag_npl === 'Rendah' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            r.flag_npl === 'Sedang-Rendah' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            r.flag_npl === 'Sedang-Tinggi' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {r.flag_npl}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{r.nama_cabang}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">
                        Tidak ada data yang memenuhi kriteria filter 3.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Visual Charts Section */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Distribusi Kategori Risiko */}
            <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Chart 1: Distribusi Kategori Risiko
                </h3>
                <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                  Plafon Pinjaman
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskDistData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip 
                      formatter={(val: any) => [`${val} Nasabah`, 'Jumlah']}
                      contentStyle={{ backgroundColor: '#020617', color: '#FFF', borderRadius: '8px', fontSize: '11px', border: '1px solid #1e293b' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {riskDistData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_RISK[index % COLORS_RISK.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Distribusi Flag NPL */}
            <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Chart 2: Distribusi Flag NPL
                </h3>
                <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                  Skor Kredit
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nplDistData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip 
                      formatter={(val: any) => [`${val} Nasabah`, 'Jumlah']}
                      contentStyle={{ backgroundColor: '#020617', color: '#FFF', borderRadius: '8px', fontSize: '11px', border: '1px solid #1e293b' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {nplDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_NPL[entry.name] || '#3B82F6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Distribusi Status Kredit */}
            <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Chart 3: Distribusi Status Kredit
                </h3>
                <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                  Lancar vs Macet
                </span>
              </div>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any, name: any) => [`${val} Nasabah`, name]}
                      contentStyle={{ backgroundColor: '#020617', color: '#FFF', borderRadius: '8px', fontSize: '11px', border: '1px solid #1e293b' }}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Rata-rata Skor Kredit Berdasarkan Kategori Risiko */}
            <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-400" />
                  Chart 4: Rata-rata Skor Kredit per Kategori Risiko
                </h3>
                <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                  Skor Rata-rata
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskAggregates} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="kategori_risiko" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis domain={[300, 850]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip 
                      formatter={(val: any) => [`${Number(val).toFixed(1)} Poin`, 'Rata-rata Skor']}
                      contentStyle={{ backgroundColor: '#020617', color: '#FFF', borderRadius: '8px', fontSize: '11px', border: '1px solid #1e293b' }}
                    />
                    <Bar dataKey="rata_rata_skor" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart 5: Rata-rata DSR Berdasarkan Kategori Risiko */}
          <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-indigo-400" />
                Chart 5: Rata-rata DSR Berdasarkan Kategori Risiko
              </h3>
              <span className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                Batas Aman DSR: ≤ 40%
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskAggregates} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="kategori_risiko" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip 
                    formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'Rata-rata DSR']}
                    contentStyle={{ backgroundColor: '#020617', color: '#FFF', borderRadius: '8px', fontSize: '11px', border: '1px solid #1e293b' }}
                  />
                  <Bar dataKey="rata_rata_dsr" fill="#3B82F6" radius={[6, 6, 0, 0]}>
                    {riskAggregates.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.rata_rata_dsr > 40 ? '#EF4444' : '#10B981'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
