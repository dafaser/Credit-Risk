import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  PieChart,
  TrendingUp,
  Grid,
  BarChart2,
  Scale,
  Percent,
  MapPin,
  Zap,
  Activity,
  AlertTriangle,
  FileSearch,
  UserCheck,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { ActivePage } from '../types';

interface SidebarProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  thresholdAccept: number;
  setThresholdAccept: (val: number) => void;
  thresholdReject: number;
  setThresholdReject: (val: number) => void;
  acceptCount: number;
  manualCount: number;
  rejectCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  thresholdAccept,
  setThresholdAccept,
  thresholdReject,
  setThresholdReject,
  acceptCount,
  manualCount,
  rejectCount
}) => {
  const scrollToItem = (itemId: string) => {
    onSelectPage('dashboard');
    setTimeout(() => {
      const el = document.getElementById(itemId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const dashboard12Items = [
    { id: 'item-1-jumlah-data', label: '#1 Jumlah Data', icon: Users },
    { id: 'item-2-target-imbalance', label: '#2 Distribusi Imbalance', icon: PieChart },
    { id: 'item-3-roc-curve', label: '#3 ROC Curve', icon: TrendingUp },
    { id: 'item-4-matrix-korelasi', label: '#4 Matrix Korelasi', icon: Grid },
    { id: 'item-5-feature-importance', label: '#5 Feature Importance', icon: BarChart2 },
    { id: 'item-6-disparate-impact', label: '#6 Disparate Impact', icon: Scale },
    { id: 'item-7-mean-difference', label: '#7 Mean Difference', icon: Percent },
    { id: 'item-8-proxy-discrimination', label: '#8 Proxy Kode Pos', icon: MapPin },
    { id: 'item-9-feature-importance-bias', label: '#9 Feature Imp. Bias', icon: Zap },
    { id: 'item-10-shap-summary', label: '#10 SHAP Summary Plot', icon: Activity },
    { id: 'item-11-prediksi-risiko', label: '#11 Prediksi Risiko Gagal Bayar', icon: AlertTriangle },
    { id: 'item-12-lime-local', label: '#12 LIME Local Explanation', icon: FileSearch }
  ];

  return (
    <aside className="w-64 lg:w-72 shrink-0 space-y-6">
      {/* Primary Feature Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md space-y-1.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
          FITUR UTAMA APLIKASI
        </span>

        {/* Fitur 1: Dashboard */}
        <button
          onClick={() => onSelectPage('dashboard')}
          className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between ${
            activePage === 'dashboard'
              ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30'
              : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 font-medium'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="w-4 h-4 text-white" />
            <div>
              <div className="text-xs">1. Dashboard Model</div>
              <div className={`text-[10px] ${activePage === 'dashboard' ? 'text-blue-100' : 'text-slate-500'}`}>
                12 Metrik Model & Etika AI
              </div>
            </div>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
            activePage === 'dashboard' ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            12
          </span>
        </button>

        {/* Fitur 2: Pengajuan Kredit */}
        <button
          onClick={() => onSelectPage('pengajuan-kredit')}
          className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between ${
            activePage === 'pengajuan-kredit'
              ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/30'
              : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 font-medium'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-white" />
            <div>
              <div className="text-xs">2. Pengajuan Kredit</div>
              <div className={`text-[10px] ${activePage === 'pengajuan-kredit' ? 'text-emerald-100' : 'text-slate-500'}`}>
                Rumus ML & Meja Approval
              </div>
            </div>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
            activePage === 'pengajuan-kredit' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            HITL
          </span>
        </button>
      </div>

      {/* Quick Jump: 12 Metrik Dashboard (Only when on Dashboard) */}
      {activePage === 'dashboard' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Daftar 12 Metrik
            </span>
            <span className="text-[10px] text-blue-400 font-mono">Lengkap</span>
          </div>

          <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
            {dashboard12Items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToItem(item.id)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-2 font-medium"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Credit Analyst Profile & Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
            BB
          </div>
          <div>
            <div className="text-xs font-bold text-white">Barnacle Boy</div>
            <div className="text-[10px] text-blue-400 font-medium">Lead Credit Risk Analyst</div>
          </div>
        </div>

        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] space-y-1 text-slate-400">
          <div className="flex justify-between">
            <span>Peran:</span>
            <span className="text-slate-200 font-semibold">Analis & Approval</span>
          </div>
          <div className="flex justify-between">
            <span>Unit:</span>
            <span className="text-slate-200 font-semibold">Model Risk Bank BRI</span>
          </div>
          <div className="flex justify-between">
            <span>Kepatuhan:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> POJK 11/2022
            </span>
          </div>
        </div>
      </div>

      {/* Threshold Controller Widget */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white">Ambang Batas Risiko</span>
          <span className="text-[10px] text-slate-400">Threshold PD</span>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Ambang Batas Accept (Lolos):</span>
              <span className="text-emerald-400 font-mono font-bold">
                &lt; {(thresholdAccept * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.50"
              step="0.05"
              value={thresholdAccept}
              onChange={(e) => setThresholdAccept(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Ambang Batas Reject (Tolak):</span>
              <span className="text-rose-400 font-mono font-bold">
                &gt; {(thresholdReject * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.55"
              max="0.90"
              step="0.05"
              value={thresholdReject}
              onChange={(e) => setThresholdReject(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>
        </div>

        {/* Quick Summary Counts */}
        <div className="grid grid-cols-3 gap-1.5 text-center pt-2 border-t border-slate-800">
          <div className="bg-slate-950 p-1.5 rounded">
            <span className="text-[9px] text-emerald-400 block font-bold">ACCEPT</span>
            <span className="text-xs font-black text-white">{acceptCount}</span>
          </div>
          <div className="bg-slate-950 p-1.5 rounded">
            <span className="text-[9px] text-amber-400 block font-bold">REVIEW</span>
            <span className="text-xs font-black text-white">{manualCount}</span>
          </div>
          <div className="bg-slate-950 p-1.5 rounded">
            <span className="text-[9px] text-rose-400 block font-bold">REJECT</span>
            <span className="text-xs font-black text-white">{rejectCount}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
