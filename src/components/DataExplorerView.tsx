import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  Eye,
  Building,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { CreditRecord, DatasetSummary } from '../types';
import { 
  formatCurrencyIDR, 
  formatPercentageIDR, 
  formatNumberIDR 
} from '../utils/creditEngine';
import { CustomerDetailModal } from './CustomerDetailModal';

interface DataExplorerViewProps {
  records: CreditRecord[];
  summary: DatasetSummary | null;
}

export const DataExplorerView: React.FC<DataExplorerViewProps> = ({ records, summary }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Lancar' | 'Macet'>('Semua');
  const [branchFilter, setBranchFilter] = useState<string>('Semua');
  const [riskFilter, setRiskFilter] = useState<string>('Semua');
  const [nplFilter, setNplFilter] = useState<string>('Semua');
  const [minScore, setMinScore] = useState<number>(300);
  const [maxLoanMillions, setMaxLoanMillions] = useState<number>(1500);
  
  // Sorting & Pagination
  const [sortField, setSortField] = useState<keyof CreditRecord>('id_nasabah');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Selected customer for modal
  const [selectedCustomer, setSelectedCustomer] = useState<CreditRecord | null>(null);

  // Available branches
  const availableBranches = useMemo(() => {
    const branches = Array.from(new Set(records.map(r => r.nama_cabang))).filter(Boolean);
    return ['Semua', ...branches.sort()];
  }, [records]);

  // Filtered & Sorted records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Search
      const searchMatch = !searchTerm || 
        r.id_nasabah.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (r.nama_nasabah && r.nama_nasabah.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status
      const statusMatch = statusFilter === 'Semua' || r.status_kredit === statusFilter;

      // Branch
      const branchMatch = branchFilter === 'Semua' || r.nama_cabang === branchFilter;

      // Risk Category
      const riskMatch = riskFilter === 'Semua' || r.kategori_risiko === riskFilter;

      // NPL Flag
      const nplMatch = nplFilter === 'Semua' || r.flag_npl === nplFilter;

      // Min Score
      const scoreMatch = r.skor_kredit >= minScore;

      // Max Loan
      const loanMatch = (r.pinjaman / 1_000_000) <= maxLoanMillions;

      return searchMatch && statusMatch && branchMatch && riskMatch && nplMatch && scoreMatch && loanMatch;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [records, searchTerm, statusFilter, branchFilter, riskFilter, nplFilter, minScore, maxLoanMillions, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

  const handleSort = (field: keyof CreditRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('Semua');
    setBranchFilter('Semua');
    setRiskFilter('Semua');
    setNplFilter('Semua');
    setMinScore(300);
    setMaxLoanMillions(1500);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Header */}
      <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              <span>Data Explorer – Nasabah Kredit BRI</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pencarian interaktif, filtering multi-dimensi, dan inspeksi profil debitur individual
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-xl border border-blue-500/20 font-semibold">
              Menampilkan {filteredRecords.length} dari {records.length} data nasabah
            </span>
            <button
              id="btn-reset-filters"
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
          {/* Search */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Cari ID / Nama Nasabah
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                id="input-search-nasabah"
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Contoh: BRI-1001 / Budi"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#020617] text-slate-200 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Status Kredit */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Status Kredit
            </label>
            <select
              id="select-status-kredit"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#020617] text-slate-200 cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Lancar">Lancar</option>
              <option value="Macet">Macet</option>
            </select>
          </div>

          {/* Cabang */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Kantor Cabang
            </label>
            <select
              id="select-cabang"
              value={branchFilter}
              onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#020617] text-slate-200 cursor-pointer"
            >
              {availableBranches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Kategori Risiko */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Kategori Risiko (Plafon)
            </label>
            <select
              id="select-kategori-risiko"
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#020617] text-slate-200 cursor-pointer"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="0–25 Juta">0–25 Juta</option>
              <option value="25–100 Juta">25–100 Juta</option>
              <option value="100–500 Juta">100–500 Juta</option>
              <option value="> 500 Juta">&gt; 500 Juta</option>
            </select>
          </div>
        </div>

        {/* Sliders: Skor Kredit & Pinjaman Max */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
          {/* Slider Skor Kredit */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-300">Filter Minimal Skor Kredit:</span>
              <span className="font-mono font-bold text-blue-400 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded">
                ≥ {minScore}
              </span>
            </div>
            <input
              id="slider-min-score"
              type="range"
              min={300}
              max={850}
              step={10}
              value={minScore}
              onChange={(e) => { setMinScore(Number(e.target.value)); setCurrentPage(1); }}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>300 (Subprime)</span>
              <span>600 (Prime)</span>
              <span>850 (Super Prime)</span>
            </div>
          </div>

          {/* Slider Plafon Pinjaman */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-300">Maksimal Plafon Pinjaman:</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded">
                ≤ Rp {maxLoanMillions} Juta
              </span>
            </div>
            <input
              id="slider-max-loan"
              type="range"
              min={25}
              max={1500}
              step={25}
              value={maxLoanMillions}
              onChange={(e) => { setMaxLoanMillions(Number(e.target.value)); setCurrentPage(1); }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Rp 25 Juta</span>
              <span>Rp 500 Juta</span>
              <span>Rp 1.500 Juta</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table id="table-data-explorer" className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('id_nasabah')}>
                  <div className="flex items-center gap-1">
                    <span>ID Nasabah</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-3">Nama Nasabah</th>
                <th className="py-3 px-3 text-right cursor-pointer hover:bg-slate-800" onClick={() => handleSort('pinjaman')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Pinjaman</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Tenor</th>
                <th className="py-3 px-3 text-right cursor-pointer hover:bg-slate-800" onClick={() => handleSort('cicilan_bulanan')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Cicilan / Bln</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:bg-slate-800" onClick={() => handleSort('dsr')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>DSR</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:bg-slate-800" onClick={() => handleSort('skor_kredit')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Skor</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Kategori Risiko</th>
                <th className="py-3 px-3">Flag NPL</th>
                <th className="py-3 px-3">Cabang</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400">
                      {r.id_nasabah}
                    </td>
                    <td className="py-2.5 px-3 text-white font-semibold">
                      {r.nama_nasabah || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                      {formatCurrencyIDR(r.pinjaman)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {r.tenor_bulan} bln
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {formatCurrencyIDR(r.cicilan_bulanan)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        r.dsr > 40 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {formatPercentageIDR(r.dsr, 1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-400">
                      {r.skor_kredit}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status_kredit === 'Lancar' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {r.status_kredit === 'Lancar' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {r.status_kredit}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-300">
                      <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {r.kategori_risiko}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.flag_npl === 'Rendah' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        r.flag_npl === 'Sedang-Rendah' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        r.flag_npl === 'Sedang-Tinggi' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {r.flag_npl}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-[140px]" title={r.nama_cabang}>
                      {r.nama_cabang}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedCustomer(r)}
                        className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg transition-colors cursor-pointer"
                        title="Lihat Detail Nasabah"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500">
                    Tidak ada nasabah yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">
            Halaman {currentPage} dari {totalPages} ({filteredRecords.length} total baris)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg font-mono font-semibold text-white">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};
