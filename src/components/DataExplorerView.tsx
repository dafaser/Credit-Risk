import React, { useState } from 'react';
import {
  Database,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UserCheck,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { DebtorRecord } from '../types';
import { formatRupiah, formatPercent } from '../utils/aiEthicsEngine';

interface DataExplorerViewProps {
  debtors: DebtorRecord[];
  onSelectForExplain: (debtor: DebtorRecord) => void;
  onSelectForDecision: (debtor: DebtorRecord) => void;
  thresholdAccept: number;
  thresholdReject: number;
}

export const DataExplorerView: React.FC<DataExplorerViewProps> = ({
  debtors,
  onSelectForExplain,
  onSelectForDecision,
  thresholdAccept,
  thresholdReject
}) => {
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('ALL');
  const [locFilter, setLocFilter] = useState('ALL');
  const [defaultFilter, setDefaultFilter] = useState('ALL');
  const [recFilter, setRecFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Filter logic
  const filtered = debtors.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      const matchCIF = d.id_nasabah.toLowerCase().includes(q);
      const matchName = d.nama_nasabah.toLowerCase().includes(q);
      if (!matchCIF && !matchName) return false;
    }
    if (jobFilter !== 'ALL' && d.status_pekerjaan !== jobFilter) return false;
    if (locFilter !== 'ALL' && d.kode_pos !== locFilter) return false;
    if (defaultFilter !== 'ALL' && String(d.default) !== defaultFilter) return false;

    // Rec logic
    if (recFilter !== 'ALL') {
      let rec = 'ACCEPT';
      if (d.proba_default > thresholdReject) rec = 'REJECT';
      else if (d.proba_default >= thresholdAccept) rec = 'MANUAL_REVIEW';
      if (rec !== recFilter) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const pageData = filtered.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
                DATA EXPLORER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold">
                10,000 Debitur Imbalanced
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Eksplorasi & Filter Basis Data Debitur Bank BRI
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
              Telusuri data individual nasabah, inspeksi skor probabilitas gagal bayar (PD), dan alirkan kasus
              secara langsung ke modul penjelasan LIME atau meja keputusan persetujuan kredit (*Human-in-the-Loop*).
            </p>
          </div>

          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-right">
            <div className="text-xs text-slate-400">Total Ditemukan:</div>
            <div className="text-xl font-black text-white">{filtered.length.toLocaleString()}</div>
            <div className="text-[10px] text-blue-400">dari {debtors.length.toLocaleString()} Total</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama atau CIF..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Job Filter */}
          <div>
            <select
              value={jobFilter}
              onChange={(e) => {
                setJobFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Pekerjaan</option>
              <option value="PNS">PNS (Privileged)</option>
              <option value="Wiraswasta">Wiraswasta</option>
              <option value="Buruh">Buruh</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={locFilter}
              onChange={(e) => {
                setLocFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Wilayah</option>
              <option value="Jakarta">Jakarta</option>
              <option value="Bandung">Bandung</option>
              <option value="Surabaya">Surabaya</option>
              <option value="Medan">Medan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Default Status Filter */}
          <div>
            <select
              value={defaultFilter}
              onChange={(e) => {
                setDefaultFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Status Target</option>
              <option value="0">Lancar / Non-Default (0)</option>
              <option value="1">Macet / Default (1)</option>
            </select>
          </div>

          {/* AI Recommendation Filter */}
          <div>
            <select
              value={recFilter}
              onChange={(e) => {
                setRecFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Rekomendasi</option>
              <option value="ACCEPT">Auto-Accept</option>
              <option value="MANUAL_REVIEW">Manual Review</option>
              <option value="REJECT">Auto-Reject</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-slate-300 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3 rounded-l">CIF & Nasabah</th>
                <th className="py-2.5 px-3">Pekerjaan</th>
                <th className="py-2.5 px-3">Wilayah</th>
                <th className="py-2.5 px-3 text-right">Income</th>
                <th className="py-2.5 px-3 text-right">DSR</th>
                <th className="py-2.5 px-3 text-right">LTV</th>
                <th className="py-2.5 px-3 text-right">DPD</th>
                <th className="py-2.5 px-3 text-right">Tenor</th>
                <th className="py-2.5 px-3 text-right">Prediksi PD</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 rounded-r text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {pageData.map((d) => {
                let rec = 'ACCEPT';
                if (d.proba_default > thresholdReject) rec = 'REJECT';
                else if (d.proba_default >= thresholdAccept) rec = 'MANUAL_REVIEW';

                return (
                  <tr key={d.id_nasabah} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{d.nama_nasabah}</div>
                      <div className="font-mono text-[10px] text-slate-400">{d.id_nasabah}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {d.status_pekerjaan}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{d.kode_pos}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                      {formatRupiah(d.income)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">{d.dsr}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">{d.ltv}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">{d.dpd} hr</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">{d.durasi_pinjaman} bln</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black">
                      <span
                        className={
                          d.proba_default > 0.65
                            ? 'text-rose-400'
                            : d.proba_default < 0.35
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }
                      >
                        {(d.proba_default * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          rec === 'ACCEPT'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : rec === 'REJECT'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}
                      >
                        {rec}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectForExplain(d)}
                          title="Buka Penjelasan LIME Nasabah Ini"
                          className="p-1 text-blue-400 hover:text-white bg-blue-950/60 hover:bg-blue-600 rounded border border-blue-800/60 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectForDecision(d)}
                          title="Bawa ke Meja Keputusan HITL"
                          className="p-1 text-emerald-400 hover:text-white bg-emerald-950/60 hover:bg-emerald-600 rounded border border-emerald-800/60 transition"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Menampilkan baris <strong>{startIndex + 1}</strong> -{' '}
            <strong>{Math.min(startIndex + pageSize, filtered.length)}</strong> dari{' '}
            <strong>{filtered.length.toLocaleString()}</strong> debitur
          </div>

          <div className="flex items-center space-x-2 self-center sm:self-auto">
            <button
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-200">
              Halaman <strong>{safeCurrentPage}</strong> dari <strong>{totalPages}</strong>
            </span>
            <button
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
