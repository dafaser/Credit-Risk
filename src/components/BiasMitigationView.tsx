import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Scale,
  Zap,
  TrendingUp,
  FileCheck,
  Info
} from 'lucide-react';
import { formatPercent } from '../utils/aiEthicsEngine';

export const BiasMitigationView: React.FC = () => {
  const [activeApproach, setActiveApproach] = useState<'reweighing' | 'threshold'>('reweighing');
  const [interactiveThresholdLainnya, setInteractiveThresholdLainnya] = useState(0.42);

  // Approximate acceptance rate for Lainnya based on slider
  // At 0.50 -> 78.5%, at 0.42 -> 84.8%, at 0.35 -> 89.2%
  const acceptanceRateLainnya = Math.min(
    0.95,
    Math.max(0.60, 0.785 + (0.50 - interactiveThresholdLainnya) * 0.78)
  );
  const acceptanceRateJakarta = 0.848;
  const simulatedDI = acceptanceRateLainnya / acceptanceRateJakarta;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
                LANGKAH 4: MITIGASI BIAS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> AIF360 & Post-Processing
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Teknik Mitigasi Bias ML: Reweighing vs Threshold Adjustment
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
              Memulihkan keadilan model kredit (DI &ge; 0.80) tanpa mengorbankan performa prediksi risiko default
              melalui pendekatan pra-pelatihan (*pre-processing*) maupun pasca-pelatihan (*post-processing*).
            </p>
          </div>

          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/80 shrink-0">
            <button
              onClick={() => setActiveApproach('reweighing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeApproach === 'reweighing'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Reweighing (Pre-Processing)
            </button>
            <button
              onClick={() => setActiveApproach('threshold')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeApproach === 'threshold'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Threshold Adjustment
            </button>
          </div>
        </div>
      </div>

      {activeApproach === 'reweighing' && (
        <div className="space-y-6">
          {/* Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Evaluasi Pendekatan Pre-Processing: AIF360 Reweighing
                </h2>
                <p className="text-xs text-slate-400">
                  Pembobotan ulang sampel data pelatihan sebelum masuk ke algoritma XGBoost
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-semibold">
                DI Pulih &gt; 0.85
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-300 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4 rounded-l-lg">Kondisi Model & Data</th>
                    <th className="py-3 px-3 text-right">Disparate Impact</th>
                    <th className="py-3 px-3 text-right">Mean Difference</th>
                    <th className="py-3 px-3 text-right">Model AUC</th>
                    <th className="py-3 px-4 rounded-r-lg text-center">Status Kepatuhan OJK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-200">Data Terkontaminasi (Sebelum Reweighing)</div>
                      <div className="text-[11px] text-slate-400">Injeksi bias lokasi kode pos</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">0.7170</td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400">-0.1620</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">0.518</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800 font-bold text-[10px]">
                        FAIL (DI &lt; 0.80)
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40 bg-blue-950/20">
                    <td className="py-3 px-4">
                      <div className="font-bold text-emerald-300">Setelah AIF360 Reweighing (Mitigasi)</div>
                      <div className="text-[11px] text-slate-400">Sampel terbobot seimbang</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-400 text-sm">
                      0.8520
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-300">-0.0480</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">0.515</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                        PASSED (Fairness Pulih)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Kesimpulan Hasil Notebook:</strong> Algoritma Reweighing berhasil
                meningkatkan Disparate Impact sebesar <strong>+18.8%</strong> (dari 0.7170 ke 0.8520), meloloskan model
                dari ambang batas 0.80. Yang terpenting, <strong>penurunan AUC hanya sebesar 0.003</strong> (dari 0.518 ke 0.515),
                membuktikan mitigasi keadilan tidak merusak akurasi scoring kredit.
              </div>
            </div>
          </div>

          {/* Mathematical Formula Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Rumus Matematis AIF360 Reweighing</h3>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-blue-300 text-center">
                W(S=s, Y=y) = [ P(S=s) &times; P(Y=y) ] / P(S=s, Y=y)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reweighing menghitung bobot bagi setiap kombinasi fitur terproteksi (S) dan label target (Y).
                Kombinasi yang mengalami <em>under-representation</em> historis (misal debitur wilayah luar Jakarta yang lancar)
                diberikan bobot lebih tinggi dalam fungsi <em>loss function</em> tanpa perlu menghapus baris data.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Keunggulan Implementasi di Bank BRI</h3>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Transparan & Audit-Proof:</strong> Tidak mengubah struktur model, hanya memodifikasi bobot pelatihan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Lossless Performance:</strong> Menjaga rasio loss kredit portofolio tetap optimal sesuai risk appetite perseroan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Standar OJK:</strong> Sesuai butir rekomendasi AI Governance perbankan mengenai pre-processing fairness.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeApproach === 'threshold' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white">
                Simulator Interaktif: Penyesuaian Ambang Batas Kelompok (Threshold Adjustment)
              </h2>
              <p className="text-xs text-slate-400">
                Geser ambang batas cut-off untuk wilayah 'Lainnya' untuk melihat pemulihan Disparate Impact secara langsung
              </p>
            </div>

            {/* Interactive Slider */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">
                  Ambang Batas Persetujuan untuk Wilayah 'Lainnya':
                </span>
                <span className="font-mono text-sm font-black text-blue-400">
                  Threshold: {interactiveThresholdLainnya.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.60"
                step="0.01"
                value={interactiveThresholdLainnya}
                onChange={(e) => setInteractiveThresholdLainnya(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.30 (Lebih Longgar)</span>
                <span>0.42 (Rekomendasi Optimal)</span>
                <span>0.50 (Baseline Timpang)</span>
                <span>0.60 (Ketat)</span>
              </div>
            </div>

            {/* Live Comparison Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                <div className="text-xs text-slate-400">Acceptance Rate Jakarta (Fixed)</div>
                <div className="text-2xl font-black text-white mt-1">
                  {(acceptanceRateJakarta * 100).toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Threshold: 0.50</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                <div className="text-xs text-slate-400">Acceptance Rate Wilayah Lainnya</div>
                <div className="text-2xl font-black text-blue-400 mt-1">
                  {(acceptanceRateLainnya * 100).toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Threshold: {interactiveThresholdLainnya.toFixed(2)}
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border text-center ${
                  simulatedDI >= 0.80
                    ? 'bg-emerald-950/40 border-emerald-800'
                    : 'bg-rose-950/40 border-rose-800'
                }`}
              >
                <div className="text-xs text-slate-300">Disparate Impact Terhitung</div>
                <div
                  className={`text-2xl font-black mt-1 ${
                    simulatedDI >= 0.80 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {simulatedDI.toFixed(3)}
                </div>
                <div className="text-[11px] font-bold mt-0.5">
                  {simulatedDI >= 0.80 ? 'PASSED (Kepatuhan Terpenuhi)' : 'WARNING (Di Bawah 0.80)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
