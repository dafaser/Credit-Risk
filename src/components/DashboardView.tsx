import React from 'react';
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
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  ShieldCheck, 
  PieChart as PieIcon, 
  Building, 
  ArrowUpRight, 
  Layers,
  FileSpreadsheet,
  AlertOctagon
} from 'lucide-react';
import { CreditRecord, DatasetSummary, ActivePage } from '../types';
import { KPICards } from './KPICards';
import { 
  getPortfolioRiskAggregates, 
  formatCurrencyIDR, 
  formatPercentageIDR, 
  formatNumberIDR 
} from '../utils/creditEngine';

interface DashboardViewProps {
  records: CreditRecord[];
  summary: DatasetSummary | null;
  setActivePage: (page: ActivePage) => void;
}

const COLORS_RISK = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
const COLORS_NPL = {
  'Rendah': '#10B981',
  'Sedang-Rendah': '#3B82F6',
  'Sedang-Tinggi': '#F59E0B',
  'Tinggi': '#EF4444',
  'Tidak Diketahui': '#94A3B8'
};
const COLORS_STATUS = ['#10B981', '#EF4444'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  summary,
  setActivePage
}) => {
  const riskAggregates = getPortfolioRiskAggregates(records);

  // Distribution for NPL Flag
  const nplCounts: { [flag: string]: number } = {
    'Rendah': 0,
    'Sedang-Rendah': 0,
    'Sedang-Tinggi': 0,
    'Tinggi': 0
  };
  records.forEach(r => {
    if (nplCounts[r.flag_npl] !== undefined) {
      nplCounts[r.flag_npl]++;
    }
  });

  const nplChartData = Object.keys(nplCounts).map(flag => ({
    name: flag,
    count: nplCounts[flag],
    percentage: records.length > 0 ? (nplCounts[flag] / records.length) * 100 : 0
  }));

  // Status Distribution (Lancar vs Macet)
  const lancarCount = records.filter(r => r.status_kredit === 'Lancar').length;
  const macetCount = records.filter(r => r.status_kredit === 'Macet').length;
  const statusChartData = [
    { name: 'Lancar', value: lancarCount, color: '#10B981' },
    { name: 'Macet', value: macetCount, color: '#EF4444' }
  ];

  // Branch risk summary
  const branchMap = new Map<string, { total: number; macet: number; loan: number }>();
  records.forEach(r => {
    const cur = branchMap.get(r.nama_cabang) || { total: 0, macet: 0, loan: 0 };
    cur.total++;
    if (r.status_kredit === 'Macet') cur.macet++;
    cur.loan += r.pinjaman;
    branchMap.set(r.nama_cabang, cur);
  });

  const branchData = Array.from(branchMap.entries()).map(([branch, stat]) => ({
    branch: branch.replace('KC ', ''),
    total: stat.total,
    macet: stat.macet,
    nplRate: stat.total > 0 ? (stat.macet / stat.total) * 100 : 0,
    loan: stat.loan
  })).sort((a, b) => b.nplRate - a.nplRate);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-300 border border-blue-400/30">
              Executive Credit Portfolio
            </span>
            <span className="text-xs text-slate-400 font-mono">Real-time Risk Metrics</span>
          </div>
          <h2 className="text-xl font-bold mt-1 text-white">
            Analisis Portofolio Risiko Kredit PT Bank Rakyat Indonesia (Persero) Tbk
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Modul analisis komprehensif mengintegrasikan data cleaning, evaluasi DSR, segmentasi eksposur risiko pinjaman, 
            dan mitigasi kredit macet (NPL).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-dash-explore"
            onClick={() => setActivePage('data-explorer')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Buka Data Explorer</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-dash-risk"
            onClick={() => setActivePage('risk-analysis')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Filter Tugas</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards records={records} summary={summary} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Risk Category Distribution */}
        <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Distribusi Kategori Risiko
              </h3>
              <p className="text-[10px] text-slate-400">Berdasarkan besaran plafon pinjaman (pd.cut)</p>
            </div>
            <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
              4 Bucket
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskAggregates} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="kategori_risiko" 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  formatter={(val: any) => [`${val} Nasabah`, 'Jumlah']}
                  contentStyle={{ backgroundColor: '#090d16', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="jumlah_nasabah" radius={[6, 6, 0, 0]}>
                  {riskAggregates.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_RISK[index % COLORS_RISK.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: NPL Flag Distribution */}
        <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Distribusi Flag NPL
              </h3>
              <p className="text-[10px] text-slate-400">Berdasarkan skor kredit (np.select)</p>
            </div>
            <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
              Kredit Skor
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nplChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  formatter={(val: any) => [`${val} Nasabah`, 'Jumlah']}
                  contentStyle={{ backgroundColor: '#090d16', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {nplChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_NPL[entry.name as keyof typeof COLORS_NPL] || '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Status Kredit (Lancar vs Macet) */}
        <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-400" />
                Status Kredit Portofolio
              </h3>
              <p className="text-[10px] text-slate-400">Rasio Lancar vs Macet</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                NPL: {records.length > 0 ? ((macetCount / records.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any, name: any) => [`${val} Nasabah (${records.length > 0 ? ((Number(val) / records.length) * 100).toFixed(1) : 0}%)`, name]}
                  contentStyle={{ backgroundColor: '#090d16', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(val: string) => <span className="text-xs text-slate-300 font-medium">{val}</span>} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Portfolio Summary Table (.agg() preview) */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              <span>Ringkasan Agregasi Risiko Portofolio (Portfolio Summary)</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Hasil kalkulasi <code className="text-blue-400 font-mono bg-slate-800 px-1 py-0.5 rounded">df.groupby("kategori_risiko").agg(...)</code>
            </p>
          </div>

          <button
            id="btn-summary-full-portfolio"
            onClick={() => setActivePage('portfolio-analysis')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Analisis Detail Portofolio</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Kategori Risiko</th>
                <th className="py-3 px-4 text-right">Jumlah Nasabah</th>
                <th className="py-3 px-4 text-right">Porsi (%)</th>
                <th className="py-3 px-4 text-right">Total Pinjaman</th>
                <th className="py-3 px-4 text-right">Rata-rata Skor</th>
                <th className="py-3 px-4 text-right">Rata-rata Pinjaman</th>
                <th className="py-3 px-4 text-right">Rata-rata DSR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {riskAggregates.map((agg, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS_RISK[idx] }} />
                      {agg.kategori_risiko}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{formatNumberIDR(agg.jumlah_nasabah)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatPercentageIDR(agg.persentase_nasabah, 1)}</td>
                  <td className="py-3 px-4 text-right font-mono text-blue-400">{formatCurrencyIDR(agg.total_pinjaman)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">{agg.rata_rata_skor.toFixed(1)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrencyIDR(agg.rata_rata_pinjaman)}</td>
                  <td className="py-3 px-4 text-right font-mono">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      agg.rata_rata_dsr > 40 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {formatPercentageIDR(agg.rata_rata_dsr, 2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branch Risk Exposure Breakdown */}
      <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              Tingkat NPL per Kantor Cabang BRI
            </h3>
            <p className="text-[10px] text-slate-400">Cabang diurutkan berdasarkan persentase rasio kredit macet tertinggi</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Total {branchData.length} Cabang
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {branchData.map((b, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">KC {b.branch}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  b.nplRate > 35 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  b.nplRate > 15 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  NPL: {b.nplRate.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>{b.macet} Macet / {b.total} Total</span>
                <span className="text-slate-300">{formatCurrencyIDR(b.loan)}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${b.nplRate > 35 ? 'bg-rose-500' : b.nplRate > 15 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(b.nplRate, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
