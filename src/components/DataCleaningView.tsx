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
  ShieldCheck
} from 'lucide-react';
import { CreditRecord, CleaningStats, DatasetSummary } from '../types';
import { validateData } from '../utils/creditEngine';

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
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
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
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Data Quality Assurance
            </span>
            <span className="text-xs text-slate-400 font-mono">clean_credit_data(df) Pipeline</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Monitoring Pembersihan Data (Data Cleaning Engine)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit komprehensif imputasi missing values, deduplikasi, konversi tipe numerik, dan eliminasi outlier.
          </p>
        </div>

        <div>
          {isAllValid ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-300 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold block uppercase tracking-wider">Status Validasi</span>
                <span className="text-sm font-bold text-emerald-900">DATA CLEAN ✓</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 rounded-2xl border border-amber-300 shadow-xs">
              <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="text-xs font-bold block uppercase tracking-wider">Status Validasi</span>
                <span className="text-sm font-bold text-amber-900">Perlu Penyesuaian</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Rows Before */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Baris Sebelum</span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {stats.rowsBefore}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Raw Dataset Input</span>
        </div>

        {/* Rows After */}
        <div className="bg-white rounded-2xl p-4 border border-blue-200 bg-blue-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Baris Sesudah</span>
          <div className="text-2xl font-bold text-blue-900 font-mono mt-1">
            {stats.rowsAfter}
          </div>
          <span className="text-[10px] text-blue-600 block mt-0.5">Data Bersih Siap Pakai</span>
        </div>

        {/* Duplicates Removed */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Duplikasi Dihapus</span>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-1">
            {stats.duplicatesRemoved}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">keep="last" pada id_nasabah</span>
        </div>

        {/* Invalid Rows Removed */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Outlier / Invalid</span>
          <div className="text-2xl font-bold text-rose-600 font-mono mt-1">
            {stats.invalidRowsRemoved + stats.nullIdOrLoanRemoved}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Usia &lt;18/&gt;75 / Pendapatan &lt;0</span>
        </div>

        {/* Missing Values Filled */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Missing Imputed</span>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            {stats.missingScoresImputed + stats.missingBranchesImputed}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Median Skor &amp; Cabang ffill</span>
        </div>
      </div>

      {/* 2-Column Section: Missing Value Audit Table & Data Validation Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Value Audit Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Perbandingan Missing Value (Sebelum vs Sesudah)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemeriksaan nilai NaN pada setiap kolom dataset
            </p>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Nama Kolom</th>
                <th className="py-2.5 px-4 text-right">Missing Sebelum</th>
                <th className="py-2.5 px-4 text-right">Missing Sesudah</th>
                <th className="py-2.5 px-4 text-center">Metode Cleaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
              {allColumns.map((col) => {
                const before = stats.missingValuesBefore?.[col] ?? 0;
                const after = stats.missingValuesAfter?.[col] ?? 0;
                
                let method = 'Valid';
                if (col === 'skor_kredit') method = 'Imputasi Median';
                else if (col === 'nama_cabang') method = 'Forward Fill (ffill)';
                else if (col === 'id_nasabah' || col === 'pinjaman') method = 'Drop jika null';
                else if (col === 'usia' || col === 'pendapatan') method = 'Filter Outlier';

                return (
                  <tr key={col} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                      {col}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      <span className={before > 0 ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                        {before}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      <span className={after === 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        {after}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {method}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Data Validation Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Daftar Checklist Validasi Data (validate_data)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verifikasi aturan integritas data sebelum memasuki modul perhitungan risiko
            </p>
          </div>

          <div className="p-4 space-y-3">
            {validationItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                  item.isValid
                    ? 'bg-emerald-50/40 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/40 border-rose-200 text-rose-900'
                }`}
              >
                <div className="mt-0.5">
                  {item.isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
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
