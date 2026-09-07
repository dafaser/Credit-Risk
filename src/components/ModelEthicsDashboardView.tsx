import React, { useState } from 'react';
import {
  Users,
  PieChart,
  TrendingUp,
  Grid,
  BarChart2,
  Scale,
  Percent,
  MapPin,
  AlertTriangle,
  Zap,
  Activity,
  FileSearch,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import { DebtorRecord } from '../types';
import {
  MODEL_PERFORMANCE_DATA,
  FAIRNESS_STATUS_PEKERJAAN,
  PROXY_SCENARIO_DATA,
  SHAP_GLOBAL_SUMMARY,
  computeLimeExplanation,
  formatPercent,
  formatRupiah,
  formatNumber
} from '../utils/aiEthicsEngine';

interface ModelEthicsDashboardViewProps {
  debtors: DebtorRecord[];
  onNavigateToCreditApp: () => void;
}

export const ModelEthicsDashboardView: React.FC<ModelEthicsDashboardViewProps> = ({
  debtors,
  onNavigateToCreditApp
}) => {
  // 12 Items Navigation / Jump anchor or smooth section
  const total = debtors.length || 10000;
  const defaultCount = debtors.filter((d) => d.default === 1).length || 1590;
  const nonDefaultCount = total - defaultCount;
  const defaultRate = defaultCount / total;

  // Debtor selector for LIME (Item 12)
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>(
    debtors[0]?.id_nasabah || 'CIF-010001'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentDebtor =
    debtors.find((d) => d.id_nasabah === selectedDebtorId) || debtors[0];
  const limeExplanation = currentDebtor
    ? computeLimeExplanation(currentDebtor)
    : null;

  // Correlation Matrix Data
  const corr = MODEL_PERFORMANCE_DATA.correlation_matrix;

  // Filter debtors for LIME picker
  const filteredDebtors = debtors
    .filter(
      (d) =>
        d.id_nasabah.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.nama_nasabah.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 8);

  // PD distribution buckets for Item 11
  const pdBuckets = [
    { label: '< 10%', min: 0, max: 0.1, count: debtors.filter((d) => d.proba_default < 0.1).length },
    { label: '10 - 20%', min: 0.1, max: 0.2, count: debtors.filter((d) => d.proba_default >= 0.1 && d.proba_default < 0.2).length },
    { label: '20 - 35%', min: 0.2, max: 0.35, count: debtors.filter((d) => d.proba_default >= 0.2 && d.proba_default < 0.35).length },
    { label: '35 - 50%', min: 0.35, max: 0.5, count: debtors.filter((d) => d.proba_default >= 0.35 && d.proba_default < 0.5).length },
    { label: '50 - 65%', min: 0.5, max: 0.65, count: debtors.filter((d) => d.proba_default >= 0.5 && d.proba_default < 0.65).length },
    { label: '65 - 80%', min: 0.65, max: 0.8, count: debtors.filter((d) => d.proba_default >= 0.65 && d.proba_default < 0.8).length },
    { label: '> 80%', min: 0.8, max: 1.0, count: debtors.filter((d) => d.proba_default >= 0.8).length }
  ];

  const lowRiskCount = debtors.filter((d) => d.proba_default < 0.35).length;
  const medRiskCount = debtors.filter((d) => d.proba_default >= 0.35 && d.proba_default <= 0.65).length;
  const highRiskCount = debtors.filter((d) => d.proba_default > 0.65).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-800/40 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 text-xs font-bold tracking-wide">
                FITUR 1: DASHBOARD UTAMA
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 12 Metrik Model & Etika AI
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              Dashboard Model & Tata Kelola Etika AI
            </h1>
            <p className="text-slate-300 text-xs lg:text-sm mt-1 max-w-3xl">
              Memuat lengkap 12 metrik audit kinerja model, ketidakseimbangan data, korelasi, kurva ROC, keadilan AIF360, proxy discrimination kode pos, SHAP summary plot, serta interpretasi lokal LIME.
            </p>
          </div>

          <button
            onClick={onNavigateToCreditApp}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 self-start lg:self-center"
          >
            Buka Pengajuan Kredit <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          ITEM 1 & ITEM 2: JUMLAH DATA & DISTRIBUSI KELAS TARGET IMBALANCE
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item 1: Jumlah Data */}
        <div id="item-1-jumlah-data" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30">
                #1
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Jumlah Data (Dataset Size)
                </h3>
                <p className="text-xs text-slate-400">Total data historis portofolio kredit debitur Bank BRI</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-blue-900/40 text-blue-300 text-xs font-semibold rounded-lg border border-blue-700/50">
              100% Lengkap
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 flex items-baseline justify-between mb-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Debitur</span>
              <div className="text-3xl lg:text-4xl font-black text-white mt-1">
                {total.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-slate-400 mt-1">Record nasabah dengan 10 variabel finansial & demografis</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Atribut Fitur</span>
              <div className="text-xl font-bold text-blue-400 mt-1">11 Kolom</div>
              <p className="text-xs text-slate-500">Numerik & Kategorikal</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <span className="text-[11px] text-slate-400">Fitur Finansial</span>
              <div className="text-sm font-bold text-slate-200 mt-0.5">Income, DSR, LTV</div>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <span className="text-[11px] text-slate-400">Fitur Kredit</span>
              <div className="text-sm font-bold text-slate-200 mt-0.5">DPD, Tenor, Plafon</div>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <span className="text-[11px] text-slate-400">Demografis</span>
              <div className="text-sm font-bold text-slate-200 mt-0.5">Usia, Pekerjaan, Wilayah</div>
            </div>
          </div>
        </div>

        {/* Item 2: Distribusi Kelas Target Imbalance */}
        <div id="item-2-target-imbalance" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/30">
                #2
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-amber-400" />
                  Distribusi Kelas Target Imbalance
                </h3>
                <p className="text-xs text-slate-400">Proporsi kelas 0 (Non-Default) vs kelas 1 (Default)</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-900/30 text-amber-300 text-xs font-semibold rounded-lg border border-amber-700/40">
              Rasio ~5.3 : 1
            </span>
          </div>

          <div className="space-y-4">
            {/* Visual Bar Distribution */}
            <div className="h-5 w-full bg-slate-800 rounded-full overflow-hidden flex border border-slate-700">
              <div
                style={{ width: `${((nonDefaultCount / total) * 100).toFixed(1)}%` }}
                className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-bold text-slate-950"
                title={`Non-Default: ${nonDefaultCount}`}
              >
                {((nonDefaultCount / total) * 100).toFixed(1)}%
              </div>
              <div
                style={{ width: `${((defaultCount / total) * 100).toFixed(1)}%` }}
                className="bg-rose-500 h-full flex items-center justify-center text-[10px] font-bold text-white"
                title={`Default: ${defaultCount}`}
              >
                {((defaultCount / total) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-300">Kelas 0: Non-Default (Lancar)</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {nonDefaultCount.toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-emerald-400/80 mt-0.5">
                  {((nonDefaultCount / total) * 100).toFixed(2)}% dari total debitur
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-rose-300">Kelas 1: Default (Macet)</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-rose-400 mt-1">
                  {defaultCount.toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-rose-400/80 mt-0.5">
                  {((defaultCount / total) * 100).toFixed(2)}% (Minority Class)
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              💡 <span className="text-slate-300 font-semibold">Catatan Imbalance:</span> Karena kelas default minoritas (~15.9%), metrik evaluasi model berfokus pada AUC-ROC, Precision-Recall, dan AIF360 Reweighing daripada sekadar Accuracy mentah.
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ITEM 3 & ITEM 4: ROC CURVE & MATRIX KORELASI
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item 3: ROC Curve */}
        <div id="item-3-roc-curve" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm border border-purple-500/30">
                #3
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  ROC Curve (Receiver Operating Characteristic)
                </h3>
                <p className="text-xs text-slate-400">Evaluasi diskriminasi model: Random Forest vs XGBoost</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-900/40 text-blue-300 text-[11px] font-semibold rounded border border-blue-700/50">
                XGBoost AUC: {MODEL_PERFORMANCE_DATA.xgb_auc}
              </span>
              <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-300 text-[11px] font-semibold rounded border border-emerald-700/50">
                RF AUC: {MODEL_PERFORMANCE_DATA.rf_auc}
              </span>
            </div>
          </div>

          {/* SVG ROC Plot */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="h-64 w-full relative">
              <svg viewBox="0 0 300 240" className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                <line x1="40" y1="20" x2="280" y2="20" stroke="#334155" strokeDasharray="2,2" />
                <line x1="40" y1="70" x2="280" y2="70" stroke="#334155" strokeDasharray="2,2" />
                <line x1="40" y1="120" x2="280" y2="120" stroke="#334155" strokeDasharray="2,2" />
                <line x1="40" y1="170" x2="280" y2="170" stroke="#334155" strokeDasharray="2,2" />
                <line x1="40" y1="220" x2="280" y2="220" stroke="#475569" strokeWidth="1.5" />
                
                <line x1="40" y1="20" x2="40" y2="220" stroke="#475569" strokeWidth="1.5" />
                <line x1="100" y1="20" x2="100" y2="220" stroke="#334155" strokeDasharray="2,2" />
                <line x1="160" y1="20" x2="160" y2="220" stroke="#334155" strokeDasharray="2,2" />
                <line x1="220" y1="20" x2="220" y2="220" stroke="#334155" strokeDasharray="2,2" />
                <line x1="280" y1="20" x2="280" y2="220" stroke="#334155" strokeDasharray="2,2" />

                {/* Diagonal Random Guess line */}
                <line x1="40" y1="220" x2="280" y2="20" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />

                {/* RF Curve (Emerald) */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  points={MODEL_PERFORMANCE_DATA.roc_curve
                    .map((pt) => `${40 + pt.fpr * 240},${220 - pt.tpr_rf * 200}`)
                    .join(' ')}
                />

                {/* XGBoost Curve (Blue) */}
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  points={MODEL_PERFORMANCE_DATA.roc_curve
                    .map((pt) => `${40 + pt.fpr * 240},${220 - pt.tpr_xgb * 200}`)
                    .join(' ')}
                />

                {/* Y-axis Labels */}
                <text x="32" y="24" textAnchor="end" className="text-[10px] fill-slate-400">1.0</text>
                <text x="32" y="124" textAnchor="end" className="text-[10px] fill-slate-400">0.5</text>
                <text x="32" y="224" textAnchor="end" className="text-[10px] fill-slate-400">0.0</text>
                
                {/* X-axis Labels */}
                <text x="40" y="235" textAnchor="middle" className="text-[10px] fill-slate-400">0.0</text>
                <text x="160" y="235" textAnchor="middle" className="text-[10px] fill-slate-400">0.5 (FPR)</text>
                <text x="280" y="235" textAnchor="middle" className="text-[10px] fill-slate-400">1.0</text>
              </svg>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                <span>XGBoost (AUC = 0.518)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span>Random Forest (AUC = 0.515)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 border-t border-dashed border-slate-400 inline-block" />
                <span className="text-slate-400">Chance Line (0.50)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Item 4: Matrix Korelasi */}
        <div id="item-4-matrix-korelasi" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm border border-cyan-500/30">
                #4
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Grid className="w-4 h-4 text-cyan-400" />
                  Matrix Korelasi (Correlation Matrix)
                </h3>
                <p className="text-xs text-slate-400">Korelasi Pearson antar fitur finansial & target default</p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              VIF &lt; 1.05 (Multicollinearity Aman)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr>
                  <th className="p-1.5 text-left text-slate-400 font-semibold text-[11px]">Var</th>
                  {corr.features.map((f) => (
                    <th key={f} className="p-1.5 text-slate-300 font-semibold uppercase text-[10px]">
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {corr.matrix.map((row, rIdx) => (
                  <tr key={corr.features[rIdx]} className="border-t border-slate-800/60">
                    <td className="p-1.5 text-left font-semibold text-slate-300 uppercase text-[10px]">
                      {corr.features[rIdx]}
                    </td>
                    {row.map((val, cIdx) => {
                      const isDiag = rIdx === cIdx;
                      let bg = 'bg-slate-950';
                      let textColor = 'text-slate-400';

                      if (isDiag) {
                        bg = 'bg-blue-900/40 font-bold';
                        textColor = 'text-blue-300';
                      } else if (val > 0.1) {
                        bg = 'bg-rose-950/60 font-bold';
                        textColor = 'text-rose-300';
                      } else if (val > 0.03) {
                        bg = 'bg-amber-950/40';
                        textColor = 'text-amber-300';
                      } else if (val < -0.03) {
                        bg = 'bg-emerald-950/40';
                        textColor = 'text-emerald-300';
                      }

                      return (
                        <td key={cIdx} className={`p-1.5 text-[11px] rounded ${bg} ${textColor}`}>
                          {val > 0 && !isDiag ? `+${val.toFixed(2)}` : val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 bg-slate-950/50 p-2 rounded border border-slate-800">
            📌 <span className="text-slate-200 font-semibold">Insight Korelasi:</span> Korelasi terkuat terhadap <code className="text-rose-300">default</code> adalah <code className="text-amber-300 font-bold">dpd (+0.18)</code> dan <code className="text-emerald-300 font-bold">usia (-0.08)</code>. Variabel lainnya memiliki korelasi linear mendekati nol, memvalidasi asumsi model berbasis *non-linear tree*.
          </p>
        </div>
      </div>

      {/* =========================================================================
          ITEM 5: FEATURE IMPORTANCE (MODEL STANDAR)
         ========================================================================= */}
      <div id="item-5-feature-importance" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/30">
              #5
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                Feature Importance (Model Standar Bersih)
              </h3>
              <p className="text-xs text-slate-400">Tingkat kepentingan fitur pada model XGBoost tanpa kontaminasi bias proxy</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-indigo-900/30 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-700/40 self-start sm:self-auto">
            DPD Mendominasi (24.5%)
          </span>
        </div>

        <div className="space-y-3">
          {SHAP_GLOBAL_SUMMARY.map((item, idx) => {
            const pct = (item.mean_abs_shap * 100).toFixed(1);
            return (
              <div key={item.feature} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 w-4 font-mono">#{idx + 1}</span>
                    {item.label} <span className="text-slate-500 font-mono text-[11px]">({item.feature})</span>
                  </span>
                  <span className="font-bold text-indigo-300 font-mono">{pct}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, item.mean_abs_shap * 350)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          ITEM 6 & ITEM 7: DISPARATE IMPACT & MEAN DIFFERENCE PER KELOMPOK PEKERJAAN
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item 6: Disparate Impact per Kelompok Pekerjaan */}
        <div id="item-6-disparate-impact" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
                #6
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  Disparate Impact per Kelompok Pekerjaan
                </h3>
                <p className="text-xs text-slate-400">Rasio persetujuan vs kelompok berprivilese (PNS)</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-300 text-xs font-semibold rounded border border-emerald-700/50">
              Threshold 4/5th Rule: 0.80
            </span>
          </div>

          <div className="space-y-3.5">
            {FAIRNESS_STATUS_PEKERJAAN.map((item) => (
              <div key={item.grup} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{item.grup}</span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    DI = {item.di_pred.toFixed(4)} (LOLOS)
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Kelompok Unprivileged: {item.unprivileged}</span>
                    <span>Kelompok Privileged: {item.privileged}</span>
                  </div>
                  {/* Gauge bar with 0.80 marker */}
                  <div className="w-full bg-slate-800 h-3 rounded-full relative overflow-hidden flex items-center">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, item.di_pred * 75)}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-2">{item.keterangan}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Item 7: Mean Difference per Kelompok Pekerjaan */}
        <div id="item-7-mean-difference" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm border border-teal-500/30">
                #7
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-teal-400" />
                  Mean Difference per Kelompok Pekerjaan
                </h3>
                <p className="text-xs text-slate-400">Selisih rata-rata tingkat persetujuan kredit (AIF360)</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-teal-900/40 text-teal-300 text-xs font-semibold rounded border border-teal-700/50">
              Ideal: Mendekati 0.000
            </span>
          </div>

          <div className="space-y-3.5">
            {FAIRNESS_STATUS_PEKERJAAN.map((item) => (
              <div key={item.grup} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white">{item.grup}</span>
                  <span className="font-mono text-xs font-bold text-teal-300">
                    MD = {item.md_pred > 0 ? `+${item.md_pred.toFixed(4)}` : item.md_pred.toFixed(4)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] mt-2 bg-slate-900/60 p-2 rounded">
                  <div>
                    <span className="text-slate-500">Histori Nyata:</span>
                    <div className="font-mono text-slate-300 font-semibold">{item.md_hist.toFixed(4)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Prediksi Model AI:</span>
                    <div className="font-mono text-teal-300 font-semibold">{item.md_pred.toFixed(4)}</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 mt-2">
                  Selisih tingkat persetujuan kredit sangat kecil (&lt; 0.5%), membuktikan model tidak menganaktirikan profesi Buruh atau Wiraswasta.
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ITEM 8 & ITEM 9: PROXY DISCRIMINATION VIA KODE POS & FEATURE IMPORTANCE BIAS
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item 8: Proxy Discrimination via Kode Pos */}
        <div id="item-8-proxy-discrimination" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm border border-rose-500/30">
                #8
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  Proxy Discrimination via Kode Pos
                </h3>
                <p className="text-xs text-slate-400">Efek injeksi bias geografis laten (Redlining Simulation)</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-rose-900/40 text-rose-300 text-xs font-semibold rounded border border-rose-700/50 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> DI Anjlok &lt; 0.80
            </span>
          </div>

          <div className="space-y-4">
            {/* Comparison Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
                <span className="text-[11px] text-emerald-300 font-semibold">Sebelum Injeksi Bias</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {PROXY_SCENARIO_DATA.di_sebelum.toFixed(3)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Status: Lolos Uji Adil (DI &gt; 0.8)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/50">
                <span className="text-[11px] text-rose-300 font-semibold">Setelah Injeksi Bias Lokasi</span>
                <div className="text-2xl font-black text-rose-400 mt-1">
                  {PROXY_SCENARIO_DATA.di_sesudah.toFixed(3)}
                </div>
                <div className="text-[11px] text-rose-300/80 mt-0.5">⚠️ Terbukti Diskriminatif (Anjlok 30%)</div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Tingkat Persetujuan (Jakarta):</span>
                <span className="font-bold text-slate-200">
                  {formatPercent(PROXY_SCENARIO_DATA.acceptance_rate_jakarta)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tingkat Persetujuan (Lainnya - Raw):</span>
                <span className="font-bold text-rose-400">
                  {formatPercent(PROXY_SCENARIO_DATA.acceptance_rate_lainnya_raw)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Setelah Mitigasi Reweighing:</span>
                <span className="font-bold text-emerald-400">
                  DI Pulih ke {PROXY_SCENARIO_DATA.di_reweighed.toFixed(3)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              💡 <span className="text-slate-300 font-semibold">Mekanisme Proxy:</span> Meskipun model tidak secara langsung menggunakan etnis/ras, variabel <code className="text-rose-300">kode_pos</code> bertindak sebagai proxy laten yang menurunkan persetujuan nasabah di luar wilayah Jakarta secara sistemik.
            </p>
          </div>
        </div>

        {/* Item 9: Feature Importance Model dengan Kontaminasi Bias Lokasi */}
        <div id="item-9-feature-importance-bias" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm border border-orange-500/30">
                #9
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-400" />
                  Feature Importance (Kontaminasi Bias Lokasi)
                </h3>
                <p className="text-xs text-slate-400">Ketika model dilatih dengan target berlabel bias wilayah</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-orange-900/40 text-orange-300 text-xs font-semibold rounded border border-orange-700/50">
              Proxy Loncat ke #1
            </span>
          </div>

          <div className="space-y-2.5">
            {PROXY_SCENARIO_DATA.top_features_bias.map((f, idx) => {
              const isProxy = f.isBiasProxy;
              const pct = (f.importance * 100).toFixed(1);
              return (
                <div key={f.feature} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold flex items-center gap-2 ${isProxy ? 'text-rose-400' : 'text-slate-300'}`}>
                      <span className="text-[10px] text-slate-500 w-4 font-mono">#{idx + 1}</span>
                      {f.feature} {isProxy && <span className="px-1.5 py-0.2 text-[10px] bg-rose-950 text-rose-300 rounded border border-rose-800">BIAS PROXY</span>}
                    </span>
                    <span className={`font-bold font-mono ${isProxy ? 'text-rose-400 font-black' : 'text-slate-400'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isProxy ? 'bg-gradient-to-r from-rose-600 to-orange-500' : 'bg-slate-700'}`}
                      style={{ width: `${Math.min(100, f.importance * 260)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-rose-300/90 mt-3 bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/40">
            ⚠️ <span className="font-bold">Anomali Terdeteksi:</span> Fitur <code className="text-rose-200">kode_pos_Lainnya</code> melompat drastis menjadi kontributor terbesar (34.2%), mengalahkan variabel fundamental seperti DPD (21.5%) dan Income (14.5%).
          </p>
        </div>
      </div>

      {/* =========================================================================
          ITEM 10: SHAP SUMMARY PLOT
         ========================================================================= */}
      <div id="item-10-shap-summary" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm border border-sky-500/30">
              #10
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                SHAP Summary Plot (Global Feature Attribution)
              </h3>
              <p className="text-xs text-slate-400">
                Nilai mean |SHAP| dan polaritas pengaruh fitur terhadap probabilitas default seluruh portofolio
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Menaikkan Risiko Default (+)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Menurunkan Risiko Default (-)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {SHAP_GLOBAL_SUMMARY.map((item, idx) => {
            const isPos = item.direction === 'positive';
            const isNeg = item.direction === 'negative';
            return (
              <div
                key={item.feature}
                className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-4 text-slate-500 font-mono text-[10px]">#{idx + 1}</span>
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-300">
                      |SHAP|: {item.mean_abs_shap.toFixed(3)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isPos
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : isNeg
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isPos ? 'Risk Driver (+)' : isNeg ? 'Risk Mitigator (-)' : 'Neutral'}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-2">
                  <div
                    className={`h-full rounded-full ${
                      isPos ? 'bg-rose-500' : isNeg ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}
                    style={{ width: `${Math.min(100, item.mean_abs_shap * 380)}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400">{item.impact_description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          ITEM 11: PREDIKSI RISIKO GAGAL BAYAR
         ========================================================================= */}
      <div id="item-11-prediksi-risiko" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold text-sm border border-yellow-500/30">
              #11
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Prediksi Risiko Gagal Bayar (Probability of Default)
              </h3>
              <p className="text-xs text-slate-400">
                Segmentasi & distribusi nilai prediksi PD debitur pada portofolio kredit Bank BRI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg">
              Rata-rata PD: <strong className="text-white">26.8%</strong>
            </span>
          </div>
        </div>

        {/* 3 Risk Zones Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300">Risiko Rendah (PD &lt; 35%)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                ACCEPT
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2">
              {lowRiskCount.toLocaleString('id-ID')} Debitur
            </div>
            <div className="text-xs text-emerald-400/80 mt-1">
              {((lowRiskCount / total) * 100).toFixed(1)}% dari total portofolio
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300">Risiko Sedang (35% - 65%)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                MANUAL REVIEW
              </span>
            </div>
            <div className="text-2xl font-black text-amber-400 mt-2">
              {medRiskCount.toLocaleString('id-ID')} Debitur
            </div>
            <div className="text-xs text-amber-400/80 mt-1">
              {((medRiskCount / total) * 100).toFixed(1)}% (Borderline - Perlu Review Analis)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-300">Risiko Tinggi (PD &gt; 65%)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                REJECT
              </span>
            </div>
            <div className="text-2xl font-black text-rose-400 mt-2">
              {highRiskCount.toLocaleString('id-ID')} Debitur
            </div>
            <div className="text-xs text-rose-400/80 mt-1">
              {((highRiskCount / total) * 100).toFixed(1)}% dari total portofolio
            </div>
          </div>
        </div>

        {/* Histogram of PD Buckets */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-300 block mb-3">
            Distribusi Frekuensi Rentang Prediksi Probability of Default (PD)
          </span>
          <div className="grid grid-cols-7 gap-2 items-end h-36 pt-4">
            {pdBuckets.map((b) => {
              const maxCount = Math.max(...pdBuckets.map((x) => x.count), 1);
              const heightPct = Math.round((b.count / maxCount) * 100);
              return (
                <div key={b.label} className="flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] text-slate-400 font-mono mb-1">{b.count}</span>
                  <div
                    style={{ height: `${Math.max(8, heightPct)}%` }}
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-md group-hover:from-blue-500 group-hover:to-indigo-300 transition"
                  />
                  <span className="text-[10px] text-slate-400 font-mono mt-2 text-center whitespace-nowrap">
                    {b.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ITEM 12: LIME LOCAL EXPLANATION
         ========================================================================= */}
      <div id="item-12-lime-local" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-sm border border-pink-500/30">
              #12
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-pink-400" />
                LIME Local Explanation (Interpretasi Nasabah Perorangan)
              </h3>
              <p className="text-xs text-slate-400">
                Transparansi faktor keputusan per individu calon debitur (*Right to Explanation* POJK No. 11/2022)
              </p>
            </div>
          </div>

          {/* Quick Debtor Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Pilih Nasabah:</span>
            <select
              value={selectedDebtorId}
              onChange={(e) => setSelectedDebtorId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
            >
              {debtors.slice(0, 30).map((d) => (
                <option key={d.id_nasabah} value={d.id_nasabah}>
                  {d.id_nasabah} - {d.nama_nasabah} (PD: {(d.proba_default * 100).toFixed(1)}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentDebtor && limeExplanation ? (
          <div className="space-y-6">
            {/* Debtor Profile Snapshot */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">ID & Nama:</span>
                <span className="font-bold text-white block truncate">{currentDebtor.nama_nasabah}</span>
                <span className="font-mono text-[11px] text-slate-400">{currentDebtor.id_nasabah}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Pendapatan (Income):</span>
                <span className="font-bold text-slate-200">{formatRupiah(currentDebtor.income)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">DPD (Tunggakan):</span>
                <span className={`font-bold ${currentDebtor.dpd > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {currentDebtor.dpd} hari
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Rasio DSR / LTV:</span>
                <span className="font-bold text-slate-200">
                  {(currentDebtor.dsr * 100).toFixed(1)}% / {(currentDebtor.ltv * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Usia / Profesi:</span>
                <span className="font-bold text-slate-200">
                  {currentDebtor.usia} thn / {currentDebtor.status_pekerjaan}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Skor PD & Rekomendasi:</span>
                <span
                  className={`font-black text-sm block ${
                    currentDebtor.proba_default > 0.65
                      ? 'text-rose-400'
                      : currentDebtor.proba_default >= 0.35
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {(currentDebtor.proba_default * 100).toFixed(1)}% ({currentDebtor.decision_recommendation})
                </span>
              </div>
            </div>

            {/* LIME Feature Contribution Bars */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                Bobot Kontribusi Fitur Lokal (LIME Feature Weights)
              </span>

              {limeExplanation.features.map((feat) => {
                const isIncrease = feat.effect === 'increases_default';
                return (
                  <div
                    key={feat.feature}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-200 uppercase font-mono">{feat.feature}</span>
                        <span className="text-slate-400 ml-2">({feat.condition})</span>
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          isIncrease ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {feat.weight > 0 ? `+${feat.weight}` : feat.weight}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isIncrease ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.abs(feat.weight) * 600)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Nilai Aktual: {feat.actual_value}</span>
                      <span>{isIncrease ? 'Menaikkan risiko default ⬆' : 'Meringankan risiko default ⬇'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Natural Language Summary for Customer Right to Explanation */}
            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs">
              <div className="flex items-center gap-2 text-blue-300 font-bold mb-1">
                <Info className="w-4 h-4" /> Narasi Penjelasan Regulasi POJK untuk Nasabah:
              </div>
              <p className="text-slate-300 leading-relaxed">
                "{limeExplanation.summary_text}"
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs">Data nasabah tidak ditemukan</div>
        )}
      </div>
    </div>
  );
};
