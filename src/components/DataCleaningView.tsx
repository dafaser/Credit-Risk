import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Trash2, 
  CopyMinus, 
  FileCheck, 
  AlertOctagon, 
  Layers,
  ArrowRight,
  ShieldCheck,
  Scissors,
  Database,
  Search,
  Filter,
  BarChart,
  Table
} from 'lucide-react';
import { CreditRecord, CleaningStats, DatasetSummary } from '../types';
import { validateData, formatCurrencyIDR, formatNumberIDR } from '../utils/creditEngine';

interface DataCleaningViewProps {
  records: CreditRecord[];
  stats: CleaningStats | null;
  summary: DatasetSummary | null;
}

export const DataCleaningView: React.FC<DataCleaningViewProps> = ({
  records,
  stats,
  summary
}) => {
  const validationItems = validateData(records);
  const isAllValid = validationItems.length > 0 && validationItems.every(v => v.isValid);

  if (!stats) {
    return (
      <div className="bg-[#0f172a] rounded-xl p-8 border border-slate-800 text-center text-slate-500 text-sm">
        Belum ada dataset yang dimuat untuk proses data cleaning.
      </div>
    );
  }

  const allColumns = Array.from(
    new Set([
      ...Object.keys(stats.missingValuesBefore || {}),
      ...Object.keys(stats.missingValuesAfter || {})
    ])
  );

  return (
    <div className="space-y-6">
      {/* Header with Data Clean Badge */}
      <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Data Quality Assurance
            </span>
            <span className="text-xs text-slate-500 font-mono">clean_credit_data(df) Pipeline</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            Monitoring Pembersihan Data &amp; IQR Outlier Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit komprehensif imputasi median/mode, deduplikasi keep="last", IQR Outlier Capping, dan feature engineering.
          </p>
        </div>

        <div>
          {isAllValid ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30 shadow-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold block uppercase tracking-wider text-slate-400">Status Validasi</span>
                <span className="text-sm font-bold text-emerald-300">DATA CLEAN ✓</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30 shadow-lg">
              <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold block uppercase tracking-wider text-slate-400">Status Validasi</span>
                <span className="text-sm font-bold text-amber-300">Perlu Penyesuaian</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PIPELINE WORKFLOW (from v1.ipynb) */}
      <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Alur Pipeline Data Cleaning &amp; Pemodelan Risiko (v1.ipynb)
          </h3>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">9 Tahap Terstruktur</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-blue-400 font-mono">01. LOAD DATA</span>
            <p className="text-slate-300 font-medium text-[11px] mt-1">Read CSV / Excel &amp; Standardisasi Kolom</p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-blue-400 font-mono">02. EDA AWAL</span>
            <p className="text-slate-300 font-medium text-[11px] mt-1">Inspeksi .info(), .describe(), &amp; Missing</p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-amber-400 font-mono">03. IMPUTASI</span>
            <p className="text-slate-300 font-medium text-[11px] mt-1">Numerik → Median | Kategorikal → Mode / ffill</p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-amber-400 font-mono">04. DEDUPLIKASI</span>
            <p className="text-slate-300 font-medium text-[11px] mt-1">drop_duplicates(id_nasabah, keep='last')</p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-rose-400 font-mono">05. IQR CAPPING</span>
            <p className="text-slate-300 font-medium text-[11px] mt-1">Outlier clipping: [Q1 - 1.5*IQR, Q3 + 1.5*IQR]</p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-400 font-mono">06. TURUNAN</span>
            <p className="text-slate-300 font-medium text-[11px] mt-1">Segmen, Kategori Risiko, Kolektibilitas, DSR</p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-400 font-mono">07. RESHAPING</span>
            <p className="text-slate-300 font-medium text-[11px] mt-1">Melt format data pembayaran &amp; Cross-tab</p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-indigo-400 font-mono">08. AGREGASI</span>
            <p className="text-slate-300 font-medium text-[11px] mt-1">Groupby cabang-segmen &amp; Pivot Table PD</p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-1 lg:col-span-2">
            <span className="text-[10px] font-bold text-emerald-400 font-mono">09. EXPORT &amp; DASHBOARD</span>
            <p className="text-slate-300 font-medium text-[11px] mt-1">Excel Multi-Sheet &amp; Streamlit Visual Engine</p>
          </div>
        </div>
      </div>

      {/* KPI Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Rows Before */}
        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Baris Sebelum</span>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {stats.rowsBefore}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Raw Dataset Input</span>
        </div>

        {/* Rows After */}
        <div className="bg-[#0f172a] p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 shadow-xl">
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">Baris Sesudah</span>
          <div className="text-2xl font-bold text-blue-300 font-mono mt-1">
            {stats.rowsAfter}
          </div>
          <span className="text-[10px] text-blue-400/80 block mt-0.5">Data Bersih Siap Pakai</span>
        </div>

        {/* Duplicates Removed */}
        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Duplikasi Dihapus</span>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
            {stats.duplicatesRemoved}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">keep="last" id_nasabah</span>
        </div>

        {/* Missing Values Filled */}
        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Missing Imputed</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {stats.missingScoresImputed + stats.missingBranchesImputed + stats.missingNumericImputed}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Median &amp; Mode / ffill</span>
        </div>

        {/* Outliers Capped */}
        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Outlier Capped (IQR)</span>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1">
            {(stats.iqrReports || []).reduce((acc, cur) => acc + cur.outliersBeforeCap, 0)}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Plafon &amp; Pendapatan</span>
        </div>
      </div>

      {/* IQR OUTLIER REPORT TABLE */}
      {stats.iqrReports && stats.iqrReports.length > 0 && (
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-rose-400" />
                Laporan Deteksi &amp; Capping Outlier IQR (Interquartile Range)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Formula: Lower Bound = max(0, Q1 - 1.5*IQR) | Upper Bound = Q3 + 1.5*IQR
              </p>
            </div>
            <span className="text-[10px] font-mono font-semibold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
              IQR Capping Method
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Kolom</th>
                  <th className="py-2.5 px-4 text-right">Q1 (25%)</th>
                  <th className="py-2.5 px-4 text-right">Q3 (75%)</th>
                  <th className="py-2.5 px-4 text-right">IQR</th>
                  <th className="py-2.5 px-4 text-right">Lower Bound</th>
                  <th className="py-2.5 px-4 text-right">Upper Bound</th>
                  <th className="py-2.5 px-4 text-right">Outliers Capped</th>
                  <th className="py-2.5 px-4 text-right">Rentang Sebelum</th>
                  <th className="py-2.5 px-4 text-right">Rentang Sesudah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {stats.iqrReports.map((report) => (
                  <tr key={report.column} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-sans font-bold text-white">
                      {report.columnLabel} ({report.column})
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">{formatCurrencyIDR(report.q1)}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{formatCurrencyIDR(report.q3)}</td>
                    <td className="py-3 px-4 text-right text-indigo-400 font-bold">{formatCurrencyIDR(report.iqr)}</td>
                    <td className="py-3 px-4 text-right text-amber-400">{formatCurrencyIDR(report.lowerBound)}</td>
                    <td className="py-3 px-4 text-right text-amber-400">{formatCurrencyIDR(report.upperBound)}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">{report.outliersBeforeCap} baris</td>
                    <td className="py-3 px-4 text-right text-slate-400 text-[10px]">
                      {formatCurrencyIDR(report.minBefore)} - {formatCurrencyIDR(report.maxBefore)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold text-[10px]">
                      {formatCurrencyIDR(report.minAfter)} - {formatCurrencyIDR(report.maxAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2-Column Section: Missing Value Audit Table & Data Validation Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Value Audit Table */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-400" />
              <span>Perbandingan Missing Value (Sebelum vs Sesudah)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pemeriksaan nilai NaN pada setiap kolom dataset
            </p>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Nama Kolom</th>
                  <th className="py-2.5 px-4 text-right">Missing Sebelum</th>
                  <th className="py-2.5 px-4 text-right">Missing Sesudah</th>
                  <th className="py-2.5 px-4 text-center">Metode Cleaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                {allColumns.map((col) => {
                  const before = stats.missingValuesBefore?.[col] ?? 0;
                  const after = stats.missingValuesAfter?.[col] ?? 0;
                  
                  let method = 'Valid';
                  if (col === 'skor_kredit') method = 'Imputasi Median';
                  else if (col === 'nama_cabang') method = 'Mode / Forward Fill (ffill)';
                  else if (col === 'pinjaman' || col === 'pendapatan') method = 'Median & IQR Capping';
                  else if (col === 'usia' || col === 'tenor_bulan') method = 'Median Imputation';
                  else if (col === 'id_nasabah') method = 'Auto-generate unique CIF';

                  return (
                    <tr key={col} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-semibold text-white">
                        {col}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono">
                        <span className={before > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                          {before}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono">
                        <span className={after === 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {after}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {method}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Validation Checklist */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Daftar Checklist Validasi Data (validate_data)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verifikasi aturan integritas data sebelum memasuki modul visualisasi &amp; permodelan
            </p>
          </div>

          <div className="p-4 space-y-3">
            {validationItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                  item.isValid
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="mt-0.5">
                  {item.isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
