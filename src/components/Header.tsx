import React from 'react';
import {
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  UserCheck,
  RefreshCw,
  UploadCloud,
  FileCode2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ActivePage } from '../types';

interface HeaderProps {
  totalDebtors: number;
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onResetData: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentUser?: string;
  isCustomLoaded?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalDebtors,
  activePage,
  onNavigate,
  onResetData,
  onFileUpload,
  currentUser = 'Barnacle Boy',
  isCustomLoaded = false
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-white">BANK BRI</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30 font-semibold">
                  BFLP Hari 7
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> POJK 11/2022
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Responsible AI Governance: Model Ethics, SHAP, LIME & Mitigasi Bias
              </p>
            </div>
          </div>

          {/* Center 2 Main Features Navigation */}
          <nav className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activePage === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <span>📊</span>
              <span>1. Dashboard (12 Metrik AI)</span>
            </button>
            <button
              onClick={() => onNavigate('pengajuan-kredit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activePage === 'pengajuan-kredit'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <span>📝</span>
              <span>2. Pengajuan Kredit & Approval</span>
            </button>
          </nav>

          {/* Quick Metrics & User Action */}
          <div className="flex items-center space-x-3">
            {/* Dataset Badge */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Dataset:</span>
              <span className="font-bold text-slate-200">{totalDebtors.toLocaleString()} Nasabah</span>
              {isCustomLoaded && (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-semibold">
                  Custom
                </span>
              )}
            </div>

            {/* Officer Profile Badge */}
            <div className="flex items-center space-x-2 bg-blue-950/60 border border-blue-800/60 px-3 py-1.5 rounded-lg text-xs">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-[11px]">
                BB
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-blue-200 leading-tight">{currentUser}</span>
                <span className="text-[10px] text-blue-400 leading-tight">Lead AI Risk Auditor</span>
              </div>
            </div>

            {/* File Upload Button */}
            <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition">
              <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Upload CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={onFileUpload}
                className="hidden"
              />
            </label>

            {/* Reset Button */}
            <button
              onClick={onResetData}
              title="Reset ke Dataset Resmi 10.000 Nasabah"
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
