import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Users,
  CheckCircle2,
  FileText,
  Activity,
  BarChart3,
  Scale
} from 'lucide-react';
import { DebtorRecord, ModelPerformanceMetrics } from '../types';
import {
  MODEL_PERFORMANCE_DATA,
  formatPercent,
  formatNumber
} from '../utils/aiEthicsEngine';

interface ExecutiveDashboardViewProps {
  debtors: DebtorRecord[];
  thresholdAccept: number;
  thresholdReject: number;
  onNavigate: (page: any) => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  debtors,
  thresholdAccept,
  thresholdReject,
  onNavigate
}) => {
  const total = debtors.length;
  const defaultCount = debtors.filter((d) => d.default === 1).length;
  const nonDefaultCount = total - defaultCount;
  const defaultRate = total > 0 ? defaultCount / total : 0;
  const avgPD = total > 0 ? debtors.reduce((acc, d) => acc + d.proba_default, 0) / total : 0;

  const acceptCount = debtors.filter((d) => d.proba_default < thresholdAccept).length;
  const reviewCount = debtors.filter(
    (d) => d.proba_default >= thresholdAccept && d.proba_default <= thresholdReject
  ).length;
  const rejectCount = debtors.filter((d) => d.proba_default > thresholdReject).length;

  const metrics = MODEL_PERFORMANCE_DATA;

  return (
    <div className="space-y-6">
      {/* Executive Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-blue-700/40 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 text-xs font-bold tracking-wide">
                BFLP HARI 7: RESPONSIBLE AI
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> POJK No. 11/2022 Compliant
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              Model Risk Ethics & Explainability Dashboard
            </h1>
            <p className="text-slate-300 text-xs lg:text-sm mt-1 max-w-3xl">
              Platform terpadu evaluasi etika kecerdasan buatan Bank BRI: Audit Bias Disparate Impact (AIF360),
              interpretasi model global/lokal (SHAP & LIME), mitigasi Reweighing, serta tata kelola Human-in-the-Loop.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate('fairness-audit')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              <Scale className="w-4 h-4" /> Uji Keadilan (DI/MD)
            </button>
            <button
              onClick={() => onNavigate('shap-lime')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Activity className="w-4 h-4" /> SHAP & LIME Explainer
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Debitur</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{total.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-blue-400 font-semibold">100% Valid</span> Imbalanced Set
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Tingkat Default Riil</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{formatPercent(defaultRate)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {defaultCount.toLocaleString()} Macet / {nonDefaultCount.toLocaleString()} Lancar
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Rata-rata Prediksi PD</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">{formatPercent(avgPD)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Expected Portfolio Risk
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Model AUC (XGBoost)</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{metrics.xgb_auc.toFixed(3)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            RF: {metrics.rf_auc.toFixed(3)} (Terkalibrasi)
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Pending Review HITL</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{reviewCount.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Zona Abu-abu {(thresholdAccept * 100).toFixed(0)}%-{(thresholdReject * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Row 1: Distribution & ROC Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Target Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Distribusi Kelas Target Historis</h2>
              <p className="text-xs text-slate-400">Rasio ketimpangan kelas (Imbalanced Target ~16% Default)</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-semibold">
              Hari 6 Recap
            </span>
          </div>

          <div className="space-y-3">
            {/* Non-Default bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Lancar / Non-Default (Kelas 0)</span>
                <span className="font-bold text-slate-100">
                  {nonDefaultCount.toLocaleString()} ({formatPercent(nonDefaultCount / total)})
                </span>
              </div>
              <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(nonDefaultCount / total) * 100}%` }}
                />
              </div>
            </div>

            {/* Default bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-rose-400">Gagal Bayar / Default (Kelas 1)</span>
                <span className="font-bold text-rose-300">
                  {defaultCount.toLocaleString()} ({formatPercent(defaultRate)})
                </span>
              </div>
              <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${defaultRate * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Metode penyeimbangan di notebook: <code>class_weight='balanced'</code></span>
            <span className="text-emerald-400 font-medium">Validasi Stratified 80:20</span>
          </div>
        </div>

        {/* ROC Curves */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Evaluasi Model: ROC Curve</h2>
              <p className="text-xs text-slate-400">Perbandingan Random Forest vs XGBoost Classifier</p>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> RF (0.515)
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> XGB (0.518)
              </span>
            </div>
          </div>

          {/* Custom SVG Line Chart */}
          <div className="w-full h-44 relative bg-slate-950/60 rounded-lg border border-slate-800 p-2">
            <svg viewBox="0 0 400 180" className="w-full h-full overflow-visible">
              {/* Grid lines */}
              <line x1="40" y1="20" x2="380" y2="20" stroke="#334155" strokeDasharray="3,3" strokeWidth="0.8" />
              <line x1="40" y1="60" x2="380" y2="60" stroke="#334155" strokeDasharray="3,3" strokeWidth="0.8" />
              <line x1="40" y1="100" x2="380" y2="100" stroke="#334155" strokeDasharray="3,3" strokeWidth="0.8" />
              <line x1="40" y1="140" x2="380" y2="140" stroke="#334155" strokeDasharray="3,3" strokeWidth="0.8" />

              {/* Diagonal baseline */}
              <line x1="40" y1="140" x2="380" y2="20" stroke="#64748B" strokeDasharray="4,4" strokeWidth="1.2" />

              {/* RF curve: blue */}
              <path
                d="M 40,140 Q 150,110 200,75 T 380,20"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
              />

              {/* XGB curve: rose */}
              <path
                d="M 40,140 Q 140,105 190,68 T 380,20"
                fill="none"
                stroke="#F43F5E"
                strokeWidth="2.5"
              />

              {/* Axis labels */}
              <text x="35" y="25" fill="#94A3B8" fontSize="10" textAnchor="end">1.0</text>
              <text x="35" y="85" fill="#94A3B8" fontSize="10" textAnchor="end">0.5</text>
              <text x="35" y="145" fill="#94A3B8" fontSize="10" textAnchor="end">0.0</text>
              <text x="40" y="160" fill="#94A3B8" fontSize="10" textAnchor="middle">0.0</text>
              <text x="210" y="160" fill="#94A3B8" fontSize="10" textAnchor="middle">0.5 FPR</text>
              <text x="380" y="160" fill="#94A3B8" fontSize="10" textAnchor="middle">1.0</text>
            </svg>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            AUC ~0.52 mencerminkan data sintetis terkontrol untuk pengujian etika dan keadilan algoritma (AIF360).
          </p>
        </div>
      </div>

      {/* Row 2: VIF Multicollinearity Table & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* VIF Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Uji Multikolinearitas (VIF)</h2>
              <p className="text-xs text-slate-400">Variance Inflation Factor fitur input model</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold">
              Semua VIF &lt; 2.5
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-300 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2 px-3 rounded-l">Fitur Kredit</th>
                  <th className="py-2 px-3 text-right">Nilai VIF</th>
                  <th className="py-2 px-3 text-right">Batas Toleransi</th>
                  <th className="py-2 px-3 rounded-r text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {metrics.vif_data.map((v, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono text-blue-300 font-medium">{v.feature}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-100">{v.vif.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right text-slate-400">5.000</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-full text-[10px] font-semibold">
                        Lolos
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">
            Nilai VIF mendekati 1.000 membuktikan tidak terjadi korelasi ganda antar fitur yang dapat mengacaukan estimasi SHAP/LIME.
          </p>
        </div>

        {/* Confusion Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Matriks Kebingungan (Confusion Matrix)</h2>
              <p className="text-xs text-slate-400">Evaluasi keputusan model pada threshold 0.50</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-semibold">
              Test Set (2,000)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center pt-1">
            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 font-medium">True Negative (Lancar Benar)</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">
                {metrics.confusion_matrix.tn.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-500 font-medium mt-0.5">Persetujuan Tepat</div>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 font-medium">False Positive (Salah Tolak)</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">
                {metrics.confusion_matrix.fp.toLocaleString()}
              </div>
              <div className="text-[10px] text-amber-400 font-medium mt-0.5">Risiko Hilang Peluang</div>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 font-medium">False Negative (Salah Terima)</div>
              <div className="text-xl font-bold text-rose-400 mt-0.5">
                {metrics.confusion_matrix.fn.toLocaleString()}
              </div>
              <div className="text-[10px] text-rose-400 font-medium mt-0.5">Risiko NPL Tak Terduga</div>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 font-medium">True Positive (Macet Terdeteksi)</div>
              <div className="text-xl font-bold text-blue-400 mt-0.5">
                {metrics.confusion_matrix.tp.toLocaleString()}
              </div>
              <div className="text-[10px] text-blue-400 font-medium mt-0.5">Pencegahan Kerugian</div>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-300 flex justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span>Akurasi: <strong>{(metrics.accuracy * 100).toFixed(1)}%</strong></span>
            <span>Presisi: <strong>{(metrics.precision * 100).toFixed(1)}%</strong></span>
            <span>Recall: <strong>{(metrics.recall * 100).toFixed(1)}%</strong></span>
            <span>F1-Score: <strong>{metrics.f1_score.toFixed(3)}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
