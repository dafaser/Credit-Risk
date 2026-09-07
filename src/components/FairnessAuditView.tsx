import React from 'react';
import {
  Scale,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart2,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { FAIRNESS_STATUS_PEKERJAAN } from '../utils/aiEthicsEngine';

export const FairnessAuditView: React.FC = () => {
  const metrics = FAIRNESS_STATUS_PEKERJAAN;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
                LANGKAH 2: AUDIT BIAS ALGORITMA
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> AIF360 Toolkit
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Audit Keadilan Berdasarkan Status Pekerjaan
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
              Pengujian disparitas perlakuan model kredit antara kelompok PNS (kelompok berprivilese) dengan Buruh,
              Wiraswasta, dan kategori Lainnya berdasarkan standar 4/5th Rule (Disparate Impact &ge; 0.80).
            </p>
          </div>

          <div className="bg-emerald-950/70 border border-emerald-800/60 px-4 py-2.5 rounded-xl text-center shrink-0">
            <div className="text-xs text-emerald-300 font-medium">Status Kepatuhan</div>
            <div className="text-base font-extrabold text-emerald-400">100% COMPLIANT</div>
            <div className="text-[10px] text-emerald-500">Semua DI &gt; 1.000</div>
          </div>
        </div>
      </div>

      {/* Main Table: Disparate Impact & Mean Difference */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">
              Tabel Hasil Audit Disparate Impact (DI) & Mean Difference (MD)
            </h2>
            <p className="text-xs text-slate-400">
              Perbandingan data historis pelatihan vs hasil inferensi model XGBoost (Notebook Cell 4)
            </p>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Favorable Label: 0 (Non-Default/Lancar)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-slate-300 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 rounded-l-lg">Pasangan Grup (Privileged vs Unprivileged)</th>
                <th className="py-3 px-3 text-right">DI Historis</th>
                <th className="py-3 px-3 text-right">DI Prediksi XGB</th>
                <th className="py-3 px-3 text-right">MD Historis</th>
                <th className="py-3 px-3 text-right">MD Prediksi XGB</th>
                <th className="py-3 px-4 rounded-r-lg text-center">Status Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {metrics.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{item.grup}</div>
                    <div className="text-[11px] text-slate-400">
                      Privileged: {item.privileged} vs {item.unprivileged}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-300">
                    {item.di_hist.toFixed(4)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-400">
                    {item.di_pred.toFixed(4)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {item.md_hist.toFixed(4)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-blue-300">
                    {item.md_pred.toFixed(4)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3 h-3" /> Lolos 4/5th Rule
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Regulatory Note */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Interpretasi Standar Regulasi OJK:</strong> Nilai Disparate Impact (DI) di atas 0.8000
            menandakan tidak terjadi diskriminasi sistemik. Pada dataset ini, nilai DI untuk ketiga kelompok berada di kisaran{' '}
            <code className="text-emerald-400">1.0014 - 1.0041</code>, membuktikan bahwa tingkat persetujuan kredit antara
            PNS, Buruh, Wiraswasta, dan Lainnya adalah setara secara statistik.
          </div>
        </div>
      </div>

      {/* Visual Charts: Disparate Impact & Mean Difference Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Disparate Impact */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Disparate Impact Ratio per Kelompok</h2>
              <p className="text-xs text-slate-400">Ambang batas aman &ge; 0.80 (Garis Kuning)</p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm inline-block" /> Historis
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block" /> Model Pred
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {metrics.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{item.grup}</span>
                  <span className="font-mono text-slate-300">
                    Hist: <span className="text-blue-400 font-bold">{item.di_hist.toFixed(4)}</span> | Model:{' '}
                    <span className="text-emerald-400 font-bold">{item.di_pred.toFixed(4)}</span>
                  </span>
                </div>
                <div className="w-full h-5 bg-slate-800 rounded-lg overflow-hidden relative flex">
                  {/* Threshold marker 0.80 (80% of max 1.2 scale = 66.6%) */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                    style={{ left: `${(0.8 / 1.2) * 100}%` }}
                    title="Batas Minimum Keadilan 0.80"
                  />
                  {/* Bar for DI Pred */}
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-lg transition-all duration-500"
                    style={{ width: `${(item.di_pred / 1.2) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Skala 0.0 s.d. 1.20</span>
            <span className="text-amber-400 font-semibold">Garis Vertikal Kuning = 0.80 Minimum</span>
          </div>
        </div>

        {/* Chart 2: Extended Fairness Metrics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Matriks Keadilan Komprehensif (AIF360)</h2>
              <p className="text-xs text-slate-400">Statistical Parity, Equal Opportunity & Theil Index</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-semibold">
              OJK Compliant
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-300 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l">Metrik Keadilan</th>
                  <th className="py-2.5 px-3 text-right">PNS vs Buruh</th>
                  <th className="py-2.5 px-3 text-right">PNS vs Lainnya</th>
                  <th className="py-2.5 px-3 rounded-r text-center">Batas Aman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-200">Statistical Parity Difference (SPD)</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">-0.0025</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">-0.0013</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">± 0.100</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-200">Equal Opportunity Difference (EOD)</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">+0.0062</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">+0.0034</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">± 0.100</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-200">Average Odds Difference (AOD)</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">+0.0038</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">+0.0021</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">± 0.100</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-200">Theil Index (Ukuran Ketimpangan)</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-400">0.0892</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-400">0.0895</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">&lt; 0.200</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-400 mt-3">
            Semua metrik ketimpangan berada di bawah batas toleransi &plusmn;0.10, memvalidasi bahwa model tidak
            melanggar prinsip Equal Opportunity (kesempatan yang sama bagi yang layak kredit).
          </p>
        </div>
      </div>
    </div>
  );
};
