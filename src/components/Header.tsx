import React from 'react';
import { Upload, Database, RefreshCw, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import { DatasetSummary } from '../types';

interface HeaderProps {
  datasetSummary: DatasetSummary | null;
  onOpenUpload: () => void;
  onLoadSample: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  datasetSummary,
  onOpenUpload,
  onLoadSample,
  isLoading,
}) => {
  return (
    <header id="app-header" className="h-16 bg-[#020617] border-b border-slate-800 px-8 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-lg font-semibold text-white">Portfolio Performance Summary</h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
          Data Driven Risk Management – BFLP
        </p>
      </div>

      <div className="flex items-center gap-4">
        {datasetSummary ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              <span className="text-[10px] text-emerald-400 font-bold">DATASET: LIVE</span>
            </div>

            <div className="hidden sm:block text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Active File</p>
              <p className="text-xs font-mono text-slate-300 truncate max-w-[160px]">{datasetSummary.fileName}</p>
            </div>

            <button
              id="btn-header-reupload"
              onClick={onOpenUpload}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Upload className="w-3 h-3 text-blue-400" />
              <span>Ganti File</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              id="btn-header-load-sample"
              onClick={onLoadSample}
              disabled={isLoading}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Memuat...' : 'Muat Default CSV'}</span>
            </button>

            <button
              id="btn-header-upload-csv"
              onClick={onOpenUpload}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
