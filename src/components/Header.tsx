import React from 'react';
import { Upload, Database, RefreshCw, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import { DatasetSummary } from '../types';

interface HeaderProps {
  datasetSummary: DatasetSummary | null;
  onOpenUpload: () => void;
  onLoadSample: () => void;
  onResetDefault?: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  datasetSummary,
  onOpenUpload,
  onLoadSample,
  onResetDefault,
  isLoading,
}) => {
  const isDefaultFile = datasetSummary?.fileName === 'data_kredit_bri.csv';

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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              <span className="text-[10px] text-emerald-400 font-bold">DATASET: LIVE</span>
            </div>

            <div className="hidden sm:block text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Active File</p>
              <p className="text-xs font-mono text-slate-300 truncate max-w-[160px]">{datasetSummary.fileName}</p>
            </div>

            {!isDefaultFile && onResetDefault && (
              <button
                id="btn-header-reset-default"
                onClick={onResetDefault}
                disabled={isLoading}
                title="Kembalikan ke dataset default BRI"
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Reset Default</span>
              </button>
            )}

            <button
              id="btn-header-reupload"
              onClick={onOpenUpload}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg border border-blue-500/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Upload className="w-3 h-3 text-blue-400" />
              <span>Ganti / Upload File</span>
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
