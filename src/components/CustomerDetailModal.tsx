import React from 'react';
import { X, User, DollarSign, Calendar, MapPin, Award, Percent, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { CreditRecord } from '../types';
import { formatCurrencyIDR, formatPercentageIDR } from '../utils/creditEngine';

interface CustomerDetailModalProps {
  customer: CreditRecord | null;
  onClose: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ customer, onClose }) => {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-[#0f172a] w-full max-w-lg rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
              {customer.id_nasabah.slice(-3)}
            </div>
            <div>
              <h3 className="text-base font-semibold">{customer.nama_nasabah || customer.id_nasabah}</h3>
              <p className="text-xs text-slate-400 font-mono">ID: {customer.id_nasabah}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Status & Risk Badges */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
            <span className={`px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${
              customer.status_kredit === 'Lancar' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {customer.status_kredit === 'Lancar' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              Status: {customer.status_kredit}
            </span>

            <span className="px-2.5 py-1 rounded-full font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Plafon: {customer.kategori_risiko}
            </span>

            <span className={`px-2.5 py-1 rounded-full font-semibold border ${
              customer.flag_npl === 'Rendah' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              customer.flag_npl === 'Sedang-Rendah' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
              customer.flag_npl === 'Sedang-Tinggi' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              Flag NPL: {customer.flag_npl}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total Pinjaman</span>
              <span className="text-sm font-bold text-white">{formatCurrencyIDR(customer.pinjaman)}</span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Pendapatan Bulanan</span>
              <span className="text-sm font-bold text-white">{formatCurrencyIDR(customer.pendapatan)}</span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Cicilan Bulanan</span>
              <span className="text-sm font-bold text-white">{formatCurrencyIDR(customer.cicilan_bulanan)}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Tenor: {customer.tenor_bulan} Bulan</span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Debt Service Ratio (DSR)</span>
              <span className="text-sm font-bold text-white">{formatPercentageIDR(customer.dsr)}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{customer.dsr > 40 ? 'DSR Tinggi (>40%)' : 'DSR Aman (≤40%)'}</span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Skor Kredit</span>
              <span className="text-sm font-bold text-blue-400">{customer.skor_kredit}</span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Usia Nasabah</span>
              <span className="text-sm font-bold text-white">{customer.usia} Tahun</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Kantor Cabang:</span>
              <span className="font-semibold text-slate-200">{customer.nama_cabang}</span>
            </div>
            {customer.segmen && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Segmen Pinjaman:</span>
                <span className="font-semibold text-slate-200">{customer.segmen}</span>
              </div>
            )}
            {customer.tanggal_akad && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tanggal Akad:</span>
                <span className="font-mono text-slate-200">{customer.tanggal_akad}</span>
              </div>
            )}
            {customer.expected_loss !== undefined && (
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                <span className="text-purple-400 font-semibold">Expected Loss (EL):</span>
                <span className="font-bold text-purple-300">{formatCurrencyIDR(customer.expected_loss)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-900/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
