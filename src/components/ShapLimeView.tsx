import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  User,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  Activity,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { DebtorRecord } from '../types';
import {
  SHAP_GLOBAL_SUMMARY,
  computeLimeExplanation,
  formatRupiah,
  formatPercent
} from '../utils/aiEthicsEngine';

interface ShapLimeViewProps {
  debtors: DebtorRecord[];
  onSelectForDecision?: (debtor: DebtorRecord) => void;
}

export const ShapLimeView: React.FC<ShapLimeViewProps> = ({ debtors, onSelectForDecision }) => {
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>(
    debtors.length > 0 ? debtors[0].id_nasabah : 'CIF-010001'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'global' | 'local'>('local');

  const selectedDebtor =
    debtors.find((d) => d.id_nasabah === selectedDebtorId) || debtors[0];
  const limeExplanation = computeLimeExplanation(selectedDebtor);

  // Filter debtors for selection
  const filteredDebtors = debtors
    .filter(
      (d) =>
        d.id_nasabah.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.nama_nasabah.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.status_pekerjaan.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 50);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
                LANGKAH 3: INTERPRETASI ALGORITMA
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> SHAP & LIME Dual-Explainer
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Model Explainability: Global (SHAP) & Lokal (LIME)
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
              Mewujudkan transparansi penuh sesuai POJK No. 11/2022. Memahami bobot risiko portofolio secara menyeluruh
              dan memberikan hak penjelasan rinci (*Right to Explanation*) kepada setiap calon debitur perorangan.
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/70 shrink-0">
            <button
              onClick={() => setActiveTab('local')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'local'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              LIME Lokal Per Nasabah
            </button>
            <button
              onClick={() => setActiveTab('global')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'global'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SHAP Global Portofolio
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'local' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Debitur Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Pilih Debitur untuk Dianalisis LIME</h2>
              <p className="text-xs text-slate-400">Pilih dari daftar atau cari berdasarkan CIF / Nama</p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari CIF, Nama, atau Pekerjaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  const target = debtors.find((d) => d.default === 1 && d.proba_default > 0.65);
                  if (target) setSelectedDebtorId(target.id_nasabah);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-[11px] font-semibold hover:bg-rose-900/60 transition"
              >
                Contoh: Debitur Macet (High PD)
              </button>
              <button
                onClick={() => {
                  const target = debtors.find((d) => d.default === 0 && d.proba_default < 0.25);
                  if (target) setSelectedDebtorId(target.id_nasabah);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-900/60 transition"
              >
                Contoh: Debitur Lancar (Low PD)
              </button>
            </div>

            {/* Debtor List */}
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {filteredDebtors.map((d) => {
                const isSelected = d.id_nasabah === selectedDebtorId;
                return (
                  <button
                    key={d.id_nasabah}
                    onClick={() => setSelectedDebtorId(d.id_nasabah)}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{d.nama_nasabah}</div>
                      <div className="text-[10px] text-slate-400">
                        {d.id_nasabah} • {d.status_pekerjaan} • {d.kode_pos}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs font-black ${
                          d.proba_default > 0.65
                            ? 'text-rose-400'
                            : d.proba_default < 0.35
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {(d.proba_default * 100).toFixed(1)}% PD
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {d.default === 1 ? 'Macet (1)' : 'Lancar (0)'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column (2 spans): LIME Local Breakdown */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
            {/* Header Profil & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">
                    {selectedDebtor.nama_nasabah}
                  </h3>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-xs">
                    {selectedDebtor.id_nasabah}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedDebtor.status_pekerjaan} • Lokasi: {selectedDebtor.kode_pos} • Usia:{' '}
                  {selectedDebtor.usia} Tahun
                </p>
              </div>

              {/* Explain Button */}
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-default"
                >
                  <Sparkles className="w-4 h-4 text-blue-200" /> Explain Nasabah Ini (LIME)
                </button>
                {onSelectForDecision && (
                  <button
                    onClick={() => onSelectForDecision(selectedDebtor)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    Bawa ke Meja Keputusan &rarr;
                  </button>
                )}
              </div>
            </div>

            {/* Debitur Metrics Snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400">Hari Tunggakan (DPD)</div>
                <div className="text-lg font-black text-white">{selectedDebtor.dpd} Hari</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400">Pendapatan Bulanan</div>
                <div className="text-sm font-bold text-white truncate">
                  {formatRupiah(selectedDebtor.income)}
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400">Tenor Kredit</div>
                <div className="text-lg font-black text-white">
                  {selectedDebtor.durasi_pinjaman} Bulan
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400">Probabilitas Default (PD)</div>
                <div
                  className={`text-lg font-black ${
                    selectedDebtor.proba_default > 0.65
                      ? 'text-rose-400'
                      : selectedDebtor.proba_default < 0.35
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {(selectedDebtor.proba_default * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* LIME 5-Feature Local Weights */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Kontribusi 5 Fitur Lokal LIME terhadap Prediksi Default
                </h4>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-rose-400 font-semibold">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" /> Mendorong Default (+)
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Menahan Default (-)
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {limeExplanation.features.map((feat, idx) => {
                  const isPositive = feat.weight >= 0;
                  const absWeight = Math.abs(feat.weight);
                  // Scale to max width (0.25 max weight)
                  const barWidth = Math.min(100, Math.max(12, (absWeight / 0.15) * 100));

                  return (
                    <div key={idx} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-slate-200">{feat.condition}</span>
                        <span
                          className={`font-mono font-bold ${
                            isPositive ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {feat.weight.toFixed(4)}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPositive
                              ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                              : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Summary Banner */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-bold text-white mb-1">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Ringkasan Penjelasan Otomatis (Hak Nasabah POJK No. 11/2022):
              </div>
              <p className="leading-relaxed">{limeExplanation.summary_text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Global SHAP Tab */}
      {activeTab === 'global' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">
                  SHAP Global Feature Importance (Beeswarm Impact Mean |SHAP|)
                </h2>
                <p className="text-xs text-slate-400">
                  Besaran pengaruh masing-masing fitur kredit di seluruh 10.000 portofolio debitur BRI
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-semibold">
                TreeExplainer (XGBoost)
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {SHAP_GLOBAL_SUMMARY.map((item, idx) => {
                const widthPercent = (item.mean_abs_shap / 0.26) * 100;

                return (
                  <div key={idx} className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs mb-1.5 gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{item.label}</span>
                        <code className="text-[11px] text-blue-400 font-mono bg-blue-950/60 px-1.5 py-0.5 rounded">
                          {item.feature}
                        </code>
                      </div>
                      <div className="font-mono text-slate-200 font-extrabold text-sm">
                        |SHAP| = {item.mean_abs_shap.toFixed(3)}
                      </div>
                    </div>

                    <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 leading-normal">
                      {item.impact_description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3 Business Insights from Notebook & Assignment */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">
            3 Insight Bisnis Resmi (Tugas 3 Tantangan: BFLP Hari 7)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Insight 1 */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> 1. Early Warning DPD
            </div>
            <h3 className="text-sm font-extrabold text-white">
              DPD Sebagai Indikator Perilaku Riil
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              <code>dpd</code> (hari tunggakan) adalah pendorong risiko utama di level global (SHAP |0.245|) maupun lokal (LIME).
              Tunggakan aktif membuktikan kendala likuiditas debitur. BRI disarankan memasang <em>early warning alert</em> saat DPD &gt; 7 hari.
            </p>
          </div>

          {/* Insight 2 */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> 2. Interaksi Tenor & Usia
            </div>
            <h3 className="text-sm font-extrabold text-white">
              Plafon & Tenor Nasabah Usia Muda
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Durasi pinjaman & income berinteraksi kuat dengan usia muda (&lt;30 tahun). Debitur muda dengan tenor panjang
              menunjukkan tingkat kegagalan lebih tinggi. Rekomendasi: batasi tenor produk mikro/KUR untuk umur muda maksimal 36 bulan.
            </p>
          </div>

          {/* Insight 3 */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 3. Kewaspadaan Proxy Bias
            </div>
            <h3 className="text-sm font-extrabold text-white">
              Audit Kuartalan Siklus Retraining
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Fitur lokasi & pekerjaan berkontribusi kecil pada model bersih, tetapi sangat rentan menjadi proksi bias diskriminatif
              jika data historis terkontaminasi. Rekomendasi: lakukan audit Disparate Impact secara otomatis pada setiap siklus retraining.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
