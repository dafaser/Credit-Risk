import React from 'react';
import {
  AlertTriangle,
  MapPin,
  CheckCircle2,
  XCircle,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { PROXY_SCENARIO_DATA } from '../utils/aiEthicsEngine';

export const ProxyDiscriminationView: React.FC = () => {
  const data = PROXY_SCENARIO_DATA;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-bold">
                LANGKAH 2 TANTANGAN: PROXY DISCRIMINATION
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Redlining Risk
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Simulasi Proxy Discrimination via Fitur Lokasi (Kode Pos)
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
              Model kredit yang tampak adil pada status pekerjaan dapat menyelundupkan bias laten melalui fitur proksi
              seperti kode pos geografis (*digital redlining*), di mana nasabah dari wilayah tertentu ditolak secara sistemik.
            </p>
          </div>

          <div className="bg-rose-950/70 border border-rose-800/60 px-4 py-2.5 rounded-xl text-center shrink-0">
            <div className="text-xs text-rose-300 font-medium">DI Pasca Injeksi</div>
            <div className="text-xl font-black text-rose-400">0.7170</div>
            <div className="text-[10px] text-rose-500 font-bold">FAIL (&lt; 0.8000)</div>
          </div>
        </div>
      </div>

      {/* Row 1: DI Comparison & Injeksi Logic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Disparate Impact Drop Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Dampak Injeksi Bias Terhadap Disparate Impact</h2>
              <p className="text-xs text-slate-400">Perbandingan rasio persetujuan Jakarta vs Wilayah Lainnya</p>
            </div>
            <span className="text-xs text-amber-400 font-medium">Threshold 0.80</span>
          </div>

          <div className="space-y-4 pt-1">
            {/* Skenario 1: Asli */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">1. Data Asli (Sebelum Injeksi)</span>
                <span className="font-mono text-emerald-400 font-bold">DI = {data.di_sebelum.toFixed(3)} (Aman)</span>
              </div>
              <div className="w-full h-6 bg-slate-800 rounded-lg overflow-hidden relative">
                <div
                  className="h-full bg-emerald-500 rounded-lg flex items-center px-2 text-[10px] font-bold text-white transition-all duration-500"
                  style={{ width: `${(data.di_sebelum / 1.2) * 100}%` }}
                >
                  1.019
                </div>
              </div>
            </div>

            {/* Skenario 2: Terkontaminasi */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-rose-300">2. Data Terkontaminasi (Pasca Injeksi)</span>
                <span className="font-mono text-rose-400 font-bold">DI = {data.di_sesudah.toFixed(3)} (BIAS!)</span>
              </div>
              <div className="w-full h-6 bg-slate-800 rounded-lg overflow-hidden relative">
                <div
                  className="h-full bg-rose-500 rounded-lg flex items-center px-2 text-[10px] font-bold text-white transition-all duration-500"
                  style={{ width: `${(data.di_sesudah / 1.2) * 100}%` }}
                >
                  0.717 (Pelanggaran Regulasi)
                </div>
              </div>
            </div>

            {/* Skenario 3: Reweighed */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-blue-300">3. Pasca Mitigasi Reweighing (Pre-Processing)</span>
                <span className="font-mono text-blue-400 font-bold">DI = {data.di_reweighed.toFixed(3)} (Pulih)</span>
              </div>
              <div className="w-full h-6 bg-slate-800 rounded-lg overflow-hidden relative">
                <div
                  className="h-full bg-blue-500 rounded-lg flex items-center px-2 text-[10px] font-bold text-white transition-all duration-500"
                  style={{ width: `${(data.di_reweighed / 1.2) * 100}%` }}
                >
                  0.852 (Lolos Uji Kepatuhan)
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300">
            <strong className="text-white">Dampak Regulasi:</strong> Penurunan DI dari 1.019 ke 0.717 melanggar{' '}
            <span className="text-rose-400 font-semibold">Four-Fifths Rule (0.80)</span>. Nasabah wilayah 'Lainnya'
            mengalami tingkat penolakan kredit 28% lebih tinggi tanpa alasan finansial objektif.
          </div>
        </div>

        {/* Feature Importance Hijacking */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Pembajakan Feature Importance (Gain)</h2>
              <p className="text-xs text-slate-400">Kode Pos membajak posisi DPD sebagai fitur terpenting</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-semibold">
              Fitur Bias Dominan
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {data.top_features_bias.map((f, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={`font-mono ${f.isBiasProxy ? 'text-rose-400 font-bold flex items-center gap-1' : 'text-slate-300'}`}>
                    {f.isBiasProxy && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                    {f.feature} {f.isBiasProxy ? '(PROKSI BIAS)' : ''}
                  </span>
                  <span className="font-mono text-slate-300 font-semibold">
                    {(f.importance * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      f.isBiasProxy ? 'bg-rose-500 shadow-sm shadow-rose-500/40' : 'bg-blue-500'
                    }`}
                    style={{ width: `${(f.importance / 0.35) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 mt-3">
            Begitu label terkontaminasi, model XGBoost memprioritaskan kode pos wilayah dengan bobot gain 34.2%,
            mengabaikan riwayat penunggakan (`dpd`) dan kemampuan finansial (`income`).
          </p>
        </div>
      </div>

      {/* Row 2: Post-Processing Threshold Adjustment Comparison */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-white">
              Mitigasi Post-Processing: Penyesuaian Ambang Batas (Threshold Adjustment)
            </h2>
            <p className="text-xs text-slate-400">
              Menyetarakan tingkat persetujuan kredit (*Acceptance Rate*) antar wilayah tanpa melatih ulang model
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-semibold">
            Solusi Cepat Operasional
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1 */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <div className="text-xs font-semibold text-slate-400">Jakarta (Privileged)</div>
            <div className="text-lg font-black text-white mt-1">Threshold: 0.50</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">84.8%</div>
            <div className="text-[11px] text-slate-400 mt-1">Acceptance Rate (Baseline)</div>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-center">
            <div className="text-xs font-semibold text-rose-300">Lainnya (Tanpa Koreksi)</div>
            <div className="text-lg font-black text-white mt-1">Threshold: 0.50</div>
            <div className="text-2xl font-black text-rose-400 mt-1">78.5%</div>
            <div className="text-[11px] text-rose-300 font-bold mt-1">Kesenjangan: -6.3% (Timpang)</div>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/50 text-center">
            <div className="text-xs font-semibold text-blue-300">Lainnya (Disesuaikan ke 0.42)</div>
            <div className="text-lg font-black text-white mt-1">Threshold: 0.42</div>
            <div className="text-2xl font-black text-blue-400 mt-1">84.8%</div>
            <div className="text-[11px] text-emerald-400 font-bold mt-1">Kesenjangan: 0.0% (Setara)</div>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <strong>Rekomendasi Implementasi di Bank BRI:</strong> Penurunan ambang batas menjadi 0.42 untuk wilayah
            non-metropolitan berhasil menyamakan tingkat persetujuan menjadi 84.8%, sehingga menghindarkan Bank BRI
            dari potensi sanksi diskriminasi regional OJK.
          </div>
        </div>
      </div>
    </div>
  );
};
