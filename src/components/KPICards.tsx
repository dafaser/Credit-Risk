import React from 'react';
import { Users, Banknote, Award, Percent, ShieldAlert, AlertTriangle } from 'lucide-react';
import { CreditRecord, DatasetSummary } from '../types';
import { formatCurrencyIDR, formatPercentageIDR, formatNumberIDR } from '../utils/creditEngine';

interface KPICardsProps {
  records: CreditRecord[];
  summary: DatasetSummary | null;
}

export const KPICards: React.FC<KPICardsProps> = ({ records, summary }) => {
  const totalNasabah = records.length;
  const totalPinjaman = records.reduce((acc, cur) => acc + (cur.pinjaman || 0), 0);
  const avgSkorKredit = totalNasabah > 0 ? records.reduce((acc, cur) => acc + cur.skor_kredit, 0) / totalNasabah : 0;
  
  const validDsrList = records.filter(r => r.dsr > 0);
  const avgDSR = validDsrList.length > 0 ? validDsrList.reduce((acc, cur) => acc + cur.dsr, 0) / validDsrList.length : 0;

  const validELList = records.filter(r => r.expected_loss !== undefined);
  const totalExpectedLoss = validELList.length > 0 ? validELList.reduce((acc, cur) => acc + (cur.expected_loss || 0), 0) : null;

  const highRiskCustomers = records.filter(r => r.flag_npl === 'Tinggi').length;
  const highRiskPercent = totalNasabah > 0 ? (highRiskCustomers / totalNasabah) * 100 : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {/* 1. Total Nasabah */}
      <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 shadow-xl">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Nasabah</p>
        <p className="text-2xl font-bold text-white font-mono">{formatNumberIDR(totalNasabah)}</p>
        <p className="text-[10px] text-slate-500 font-mono mt-1">Debitur aktif</p>
      </div>

      {/* 2. Total Pinjaman */}
      <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 shadow-xl">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Pinjaman</p>
        <p className="text-lg font-bold text-blue-400 truncate" title={formatCurrencyIDR(totalPinjaman)}>
          {formatCurrencyIDR(totalPinjaman)}
        </p>
        <p className="text-[10px] text-blue-400/70 font-mono mt-1">Outstanding Portofolio</p>
      </div>

      {/* 3. Avg Credit Score */}
      <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 shadow-xl">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Avg Credit Score</p>
        <p className="text-2xl font-bold text-white font-mono">{avgSkorKredit.toFixed(1)}</p>
        <p className="text-[10px] text-emerald-400 font-mono mt-1">
          {avgSkorKredit >= 700 ? 'Kategori Baik' : avgSkorKredit >= 600 ? 'Moderat' : 'Monitoring'}
        </p>
      </div>

      {/* 4. Avg DSR */}
      <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 shadow-xl">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Avg DSR</p>
        <p className={`text-2xl font-bold font-mono ${avgDSR > 40 ? 'text-rose-400' : 'text-amber-400'}`}>
          {formatPercentageIDR(avgDSR, 1)}
        </p>
        <p className="text-[10px] text-slate-500 font-mono mt-1">Debt Service Ratio</p>
      </div>

      {/* 5. Expected Loss */}
      <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 shadow-xl">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Expected Loss</p>
        <p className="text-lg font-bold text-rose-400 truncate" title={totalExpectedLoss !== null ? formatCurrencyIDR(totalExpectedLoss) : 'N/A'}>
          {totalExpectedLoss !== null ? formatCurrencyIDR(totalExpectedLoss) : 'N/A'}
        </p>
        <p className="text-[10px] text-rose-400/70 font-mono mt-1">EAD × LGD Model</p>
      </div>

      {/* 6. High Risk */}
      <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/30 shadow-xl relative">
        <p className="text-[10px] text-rose-300 uppercase tracking-wider mb-1">High Risk</p>
        <p className="text-2xl font-bold text-rose-500 font-mono">{formatNumberIDR(highRiskCustomers)}</p>
        <p className="text-[10px] text-rose-400/80 font-mono mt-1">{formatPercentageIDR(highRiskPercent, 1)} portofolio</p>
        <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
      </div>
    </div>
  );
};
