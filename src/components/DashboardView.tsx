import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  RotateCcw, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  AlertTriangle, 
  Building, 
  TrendingUp, 
  Layers, 
  Calendar, 
  Sliders, 
  Sparkles, 
  Check, 
  X,
  ArrowRight,
  HelpCircle,
  Eye,
  ShieldAlert
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CreditRecord, DatasetSummary, ActivePage } from '../types';
import { KPICards } from './KPICards';
import { 
  calculateBranchSegmentAggregates,
  calculateBoxplotStats,
  calculateCorrelationMatrix,
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

interface DashboardViewProps {
  records: CreditRecord[];
  summary: DatasetSummary | null;
  setActivePage: (page: ActivePage) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  summary,
  setActivePage
}) => {
  // --- FILTER STATES ---
  const [selectedSegment, setSelectedSegment] = useState<string>('Semua');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [minPD, setMinPD] = useState<number>(0.0);
  const [maxPD, setMaxPD] = useState<number>(1.0);
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Top 10 High Risk Modal State
  const [showTop10Modal, setShowTop10Modal] = useState<boolean>(false);

  // Available Branches
  const allBranches = useMemo(() => {
    return Array.from(new Set(records.map(r => r.nama_cabang))).filter(Boolean).sort();
  }, [records]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedSegment('Semua');
    setSelectedBranches([]);
    setMinPD(0.0);
    setMaxPD(1.0);
    setSelectedStatus('Semua');
    setStartDate('');
    setEndDate('');
  };

  // Filter Pipeline (Streamlit parity)
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Segmen
      if (selectedSegment !== 'Semua' && r.segmen !== selectedSegment) {
        return false;
      }
      // 2. Cabang
      if (selectedBranches.length > 0 && !selectedBranches.includes(r.nama_cabang)) {
        return false;
      }
      // 3. PD Range
      if (r.pd_score < minPD || r.pd_score > maxPD) {
        return false;
      }
      // 4. Status Kredit
      if (selectedStatus !== 'Semua' && r.status_kredit !== selectedStatus) {
        return false;
      }
      // 5. Tanggal Pengajuan Range
      if (startDate || endDate) {
        const rowDate = r.tanggal_pengajuan || r.tanggal_akad || '';
        if (startDate && rowDate < startDate) return false;
        if (endDate && rowDate > endDate) return false;
      }
      return true;
    });
  }, [records, selectedSegment, selectedBranches, minPD, maxPD, selectedStatus, startDate, endDate]);

  // Top 10 Nasabah dengan PD Tertinggi (Bonus Challenge)
  const top10HighPDCustomers = useMemo(() => {
    return [...filteredRecords]
      .sort((a, b) => b.pd_score - a.pd_score)
      .slice(0, 10);
  }, [filteredRecords]);

  // Aggregates for Filtered Data
  const branchSegmentAggs = useMemo(() => calculateBranchSegmentAggregates(filteredRecords), [filteredRecords]);
  const boxplotData = useMemo(() => calculateBoxplotStats(filteredRecords, 'pd_score', 'kategori_risiko'), [filteredRecords]);
  const correlationMatrix = useMemo(() => calculateCorrelationMatrix(filteredRecords), [filteredRecords]);
  const pdValues = useMemo(() => filteredRecords.map(r => r.pd_score), [filteredRecords]);

  // Export Filtered CSV
  const handleExportFilteredCSV = () => {
    const headers = ['id_nasabah', 'nama_nasabah', 'usia', 'pendapatan', 'pinjaman', 'tenor_bulan', 'skor_kredit', 'pd_score', 'lgd', 'ead', 'segmen', 'kategori_risiko', 'status_kredit', 'nama_cabang', 'tanggal_pengajuan'];
    const csvRows = [headers.join(',')];

    filteredRecords.forEach(r => {
      const row = [
        `"${r.id_nasabah}"`,
        `"${r.nama_nasabah}"`,
        r.usia,
        r.pendapatan,
        r.pinjaman,
        r.tenor_bulan,
        r.skor_kredit,
        r.pd_score,
        r.LGD,
        r.EAD,
        `"${r.segmen}"`,
        `"${r.kategori_risiko}"`,
        `"${r.status_kredit}"`,
        `"${r.nama_cabang}"`,
        `"${r.tanggal_pengajuan || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risk_dashboard_filtered_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export Multi-Sheet Excel (Tugas 3: Filtered_Data & Aggregation)
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Filtered_Data
    const dataSheet = filteredRecords.map(r => ({
      'ID Nasabah': r.id_nasabah,
      'Nama Nasabah': r.nama_nasabah,
      'Usia': r.usia,
      'Pendapatan (Rp)': r.pendapatan,
      'Pinjaman (Rp)': r.pinjaman,
      'Tenor (Bulan)': r.tenor_bulan,
      'Skor Kredit': r.skor_kredit,
      'PD Score': r.pd_score,
      'LGD': r.LGD,
      'EAD (Rp)': r.EAD,
      'Expected Loss (Rp)': r.expected_loss,
      'Segmen': r.segmen,
      'Kategori Risiko': r.kategori_risiko,
      'Status Kredit': r.status_kredit,
      'Cabang': r.nama_cabang,
      'Tanggal Pengajuan': r.tanggal_pengajuan
    }));
    const ws1 = XLSX.utils.json_to_sheet(dataSheet);
    XLSX.utils.book_append_sheet(wb, ws1, 'Filtered_Data');

    // Sheet 2: Aggregation (Branch & Segment)
    const aggSheet = branchSegmentAggs.map(a => ({
      'Nama Cabang': a.nama_cabang,
      'Segmen': a.segmen,
      'Jumlah Nasabah': a.jumlah_nasabah,
      'Rata-rata PD': a.rata_rata_pd,
      'Rata-rata LGD': a.rata_rata_lgd,
      'Total Pinjaman (Rp)': a.total_pinjaman,
      'Total EAD (Rp)': a.total_ead,
      'Rata-rata Pendapatan (Rp)': a.rata_rata_pendapatan
    }));
    const ws2 = XLSX.utils.json_to_sheet(aggSheet);
    XLSX.utils.book_append_sheet(wb, ws2, 'Aggregation');

    XLSX.writeFile(wb, `risk_dashboard_filtered_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* 1. STREAMLIT-STYLE INTERACTIVE FILTER BAR */}
      <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Filter Portofolio Risiko Kredit
            </h3>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
              Interactive Sidebar Engine
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filter
            </button>
            <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
              {filteredRecords.length} / {records.length} Nasabah
            </span>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* 1. Segmen */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Segmen Portofolio</label>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Semua">Semua Segmen</option>
              <option value="Mikro">Mikro (≤ Rp 50 Juta)</option>
              <option value="Kecil">Kecil (Rp 50M - 200 Juta)</option>
              <option value="Menengah">Menengah (&gt; Rp 200 Juta)</option>
            </select>
          </div>

          {/* 2. Status Kredit */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status Kredit</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Lancar">Lancar (Performing)</option>
              <option value="Macet">Macet (NPL)</option>
            </select>
          </div>

          {/* 3. Rentang PD Score */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-slate-400">Rentang Skor PD</label>
              <span className="text-[10px] font-mono text-amber-400">{(minPD * 100).toFixed(0)}%–{(maxPD * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={minPD}
                onChange={(e) => setMinPD(parseFloat(e.target.value))}
                className="w-1/2 accent-blue-500 cursor-pointer"
                title={`Min PD: ${(minPD * 100).toFixed(1)}%`}
              />
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.01"
                value={maxPD}
                onChange={(e) => setMaxPD(parseFloat(e.target.value))}
                className="w-1/2 accent-amber-500 cursor-pointer"
                title={`Max PD: ${(maxPD * 100).toFixed(1)}%`}
              />
            </div>
          </div>

          {/* 4. Tanggal Pengajuan Range */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Branch Filter Multiselect Chips */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Building className="w-3.5 h-3.5" /> Cabang:
          </span>
          <button
            onClick={() => setSelectedBranches([])}
            className={`px-2 py-0.5 text-[10px] rounded-full border transition-all cursor-pointer ${
              selectedBranches.length === 0
                ? 'bg-blue-600 text-white border-blue-500 font-bold'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
            }`}
          >
            Semua Cabang
          </button>
          {allBranches.map(branch => {
            const isSelected = selectedBranches.includes(branch);
            return (
              <button
                key={branch}
                onClick={() => {
                  setSelectedBranches(prev => 
                    prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch]
                  );
                }}
                className={`px-2 py-0.5 text-[10px] rounded-full border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
                }`}
              >
                {branch}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TOP ACTION BUTTONS & BONUS CHALLENGE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-4 rounded-xl border border-blue-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Bonus Challenge: Top 10 Debitur Risiko Tertinggi</h4>
            <p className="text-[11px] text-slate-400">Identifikasi cepat nasabah dengan nilai PD score tertinggi untuk penanganan khusus</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-top10-high-risk"
            onClick={() => setShowTop10Modal(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Lihat Top 10 PD Tertinggi</span>
          </button>

          <button
            onClick={handleExportFilteredCSV}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download data terfilter dalam format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
            title="Download Excel multi-sheet (Filtered_Data & Aggregation)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 3. 4 KEY METRIC CARDS */}
      <KPICards records={filteredRecords} summary={summary} />

      {/* 4. VISUAL DASHBOARD GRID (Histogram, Bubble Chart, Boxplot, Heatmap) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribusi PD Score */}
        <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Distribusi Probability of Default (PD)</h3>
              <p className="text-[11px] text-slate-400">Histogram frekuensi &amp; Gaussian KDE curve</p>
            </div>
            <button
              onClick={() => setActivePage('risiko')}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Detail 5 Grafik <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <HistogramKDEChart data={pdValues} binsCount={20} />
        </div>

        {/* Bubble Chart PD vs LGD per Segmen */}
        <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Bubble Chart PD vs LGD per Segmen</h3>
              <p className="text-[11px] text-slate-400">Ukuran bubble proporsional terhadap Total EAD</p>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              EAD Exposure
            </span>
          </div>
          <BubbleChartPDvsLGD records={filteredRecords} />
        </div>
      </div>

      {/* Row 2: Boxplot & Correlation Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Boxplot PD */}
        <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Boxplot PD berdasarkan Kategori Risiko</h3>
              <p className="text-[11px] text-slate-400">Kuartil, median, dan sebaran data outlier</p>
            </div>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              IQR Whiskers
            </span>
          </div>
          <BoxplotChart data={boxplotData} />
        </div>

        {/* Matriks Korelasi */}
        <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Heatmap Korelasi Variabel Risiko</h3>
              <p className="text-[11px] text-slate-400">Korelasi Pearson antar parameter kredit</p>
            </div>
            <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Pearson r
            </span>
          </div>
          <CorrelationHeatmap data={correlationMatrix} />
        </div>
      </div>

      {/* 5. TABEL AGREGASI CABANG DAN SEGMEN */}
      <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-400" />
              Tabel Agregasi per Cabang dan Segmen (Tugas 3)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              df.groupby(['nama_cabang', 'segmen']).agg(...)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Total Baris:</span>
            <span className="text-xs font-mono font-bold text-blue-400">{branchSegmentAggs.length} grup</span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] font-semibold border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Cabang</th>
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

      {/* 6. BONUS CHALLENGE MODAL: TOP 10 HIGH PD NASABAH */}
      {showTop10Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f172a] rounded-2xl border border-slate-700 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Top 10 Nasabah dengan PD Tertinggi (Bonus Challenge)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Daftar 10 debitur dengan estimasi probabilitas default tertinggi untuk mitigasi dan monitoring khusus
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTop10Modal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Table Body */}
            <div className="p-5 overflow-x-auto overflow-y-auto space-y-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">ID Nasabah</th>
                    <th className="py-2.5 px-3">Nama Nasabah</th>
                    <th className="py-2.5 px-3 text-right">PD Score</th>
                    <th className="py-2.5 px-3 text-right">Skor Kredit</th>
                    <th className="py-2.5 px-3 text-right">Pinjaman</th>
                    <th className="py-2.5 px-3 text-right">EAD</th>
                    <th className="py-2.5 px-3">Segmen</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Cabang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                  {top10HighPDCustomers.map((r, idx) => (
                    <tr key={r.id_nasabah} className="hover:bg-slate-800/60 transition-all">
                      <td className="py-2.5 px-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          idx === 0 ? 'bg-rose-500 text-white' :
                          idx === 1 ? 'bg-rose-600/80 text-white' :
                          idx === 2 ? 'bg-amber-500 text-slate-950' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-400">{r.id_nasabah}</td>
                      <td className="py-2.5 px-3 text-white font-semibold">{r.nama_nasabah}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400 text-sm">
                        {formatPDScore(r.pd_score)}
                        <span className="text-[10px] font-normal text-slate-400 block">{(r.pd_score * 100).toFixed(2)}%</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">{r.skor_kredit}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">{formatCurrencyIDR(r.pinjaman)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">{formatCurrencyIDR(r.EAD)}</td>
                      <td className="py-2.5 px-3 font-semibold">{r.segmen}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status_kredit === 'Lancar' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {r.status_kredit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{r.nama_cabang}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">
                Menampilkan 10 nasabah teratas terurut berdasarkan Probability of Default (PD) descending.
              </span>
              <button
                onClick={() => setShowTop10Modal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold cursor-pointer transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
