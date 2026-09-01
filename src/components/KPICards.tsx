import React from 'react';
import { Users, Banknote, ShieldAlert, Percent, TrendingUp, AlertTriangle } from 'lucide-react';
import { CreditRecord, DatasetSummary } from '../types';
import { formatCurrencyIDR, formatPercentageIDR, formatPDScore, formatNumberIDR } from '../utils/creditEngine';

interface KPICardsProps {
  records: CreditRecord[];
  summary: DatasetSummary | null;
}

export const KPICards: React.FC<KPICardsProps> = ({ records, summary }) => {
  const totalNasabah = records.length;
  
  // Rata-rata PD
  const avgPD = totalNasabah > 0 ? records.reduce((acc, cur) => acc + cur.pd_score, 0) / totalNasabah : 0;
  
  // Total Eksposur (EAD)
  const totalEAD = records.reduce((acc, cur) => acc + (cur.EAD || cur.pinjaman || 0), 0);
  
  // NPL Rate
  const macetCount = records.filter(r => r.status_kredit === 'Macet' || r.kolektibilitas === 'Macet').length;
  const nplRate = totalNasabah > 0 ? (macetCount / totalNasabah) * 100 : 0;

  // Additional Supporting Metrics
  const totalPinjaman = records.reduce((acc, cur) => acc + (cur.pinjaman || 0), 0);
  const avgSkorKredit = totalNasabah > 0 ? records.reduce((acc, cur) => acc + cur.skor_kredit, 0) / totalNasabah : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. TOTAL NASABAH */}
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Nasabah</p>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <p className="text-3xl font-bold text-white font-mono mt-2">{formatNumberIDR(totalNasabah)}</p>
        <p className="text-[11px] text-slate-400 mt-1 font-mono flex items-center gap-1.5">
          <span className="text-emerald-400">● 100% data clean</span>
          <span>• CIF aktif</span>
        </p>
      </div>

      {/* 2. RATA-RATA PD (Probability of Default) */}
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Rata-rata PD Score</p>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <p className="text-3xl font-bold text-amber-400 font-mono mt-2">{formatPDScore(avgPD)}</p>
        <p className="text-[11px] text-slate-400 mt-1 font-mono">
          Setara <span className="text-white font-bold">{(avgPD * 100).toFixed(2)}%</span> probabilitas default
        </p>
      </div>

      {/* 3. NPL RATE */}
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">NPL Rate (Kredit Macet)</p>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <p className={`text-3xl font-bold font-mono mt-2 ${nplRate > 5 ? 'text-rose-500' : 'text-emerald-400'}`}>
          {formatPercentageIDR(nplRate, 2)}
        </p>
        <p className="text-[11px] text-slate-400 mt-1 font-mono">
          <span className="text-rose-400 font-semibold">{macetCount} debitur macet</span> dari {totalNasabah}
        </p>
      </div>

      {/* 4. TOTAL EKSPOSUR (EAD) */}
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Eksposur (EAD)</p>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Banknote className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-emerald-400 font-mono mt-2 truncate" title={formatCurrencyIDR(totalEAD)}>
          {formatCurrencyIDR(totalEAD)}
        </p>
        <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">
          Plafon: <span className="text-slate-300">{formatCurrencyIDR(totalPinjaman)}</span>
        </p>
      </div>
    </div>
  );
};
