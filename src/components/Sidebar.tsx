import React from 'react';
import { 
  LayoutDashboard, 
  Table2, 
  ShieldAlert, 
  PieChart, 
  Sparkles, 
  Download, 
  UserCheck, 
  Building2,
  FileCheck2
} from 'lucide-react';
import { ActivePage, DatasetSummary } from '../types';

interface SidebarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  datasetSummary: DatasetSummary | null;
  onOpenUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  datasetSummary,
  onOpenUpload
}) => {
  const menuItems: { id: ActivePage; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'data-explorer', label: 'Data Explorer', icon: <Table2 className="w-4 h-4" />, badge: datasetSummary ? `${datasetSummary.totalRows}` : undefined },
    { id: 'risk-analysis', label: 'Risk Analysis', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'portfolio-analysis', label: 'Portfolio Analysis', icon: <PieChart className="w-4 h-4" /> },
    { id: 'data-cleaning', label: 'Data Cleaning', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'export-data', label: 'Export Data', icon: <Download className="w-4 h-4" /> },
  ];

  return (
    <aside id="app-sidebar" className="w-64 border-r border-slate-800 bg-[#0f172a] flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-md shadow-blue-600/30">
            BRI
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-blue-400">Credit Risk</h1>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Management Dashboard</p>
      </div>

      {/* Dataset Status Banner */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${datasetSummary ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-amber-400'}`} />
            <span className="text-[11px] font-semibold text-slate-300">
              {datasetSummary ? 'DATASET: AKTIF' : 'DATASET: KOSONG'}
            </span>
          </div>
          <button
            id="btn-sidebar-upload"
            onClick={onOpenUpload}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold uppercase tracking-wider hover:underline transition-colors cursor-pointer"
          >
            {datasetSummary ? 'Ganti' : 'Upload'}
          </button>
        </div>
        {datasetSummary && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
            <FileCheck2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate font-mono">{datasetSummary.fileName}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        <div className="px-6 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Navigation
        </div>
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-6 py-3 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600/10 border-r-2 border-blue-500 text-blue-400 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-slate-600'}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-5 border-t border-slate-800 mt-auto bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
            AS
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">Anandafa Syukur Rizky</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter truncate">BFLP Risk Management</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
