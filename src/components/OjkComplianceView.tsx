import React from 'react';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Layers,
  Smartphone,
  Scale
} from 'lucide-react';
import { OJK_COMPLIANCE_PILLARS } from '../utils/aiEthicsEngine';

export const OjkComplianceView: React.FC = () => {
  const pillars = OJK_COMPLIANCE_PILLARS;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
                TUGAS 1 & TUGAS 4: REGULATORY COMPLIANCE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> POJK No. 11/2022 & BI
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Tata Kelola AI OJK & Laporan Kepatuhan 5 Pilar Bank BRI
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
              Audit menyeluruh keselarasan model prediktif machine learning Bank BRI terhadap Prinsip Etika Kecerdasan Artifisial
              Otoritas Jasa Keuangan (April 2025), Surat Edaran Bank Indonesia, dan UU Perlindungan Data Pribadi (UU PDP).
            </p>
          </div>

          <div className="bg-emerald-950/80 border border-emerald-800 px-4 py-2.5 rounded-xl text-center shrink-0">
            <div className="text-xs text-emerald-300 font-medium">Status Kepatuhan</div>
            <div className="text-lg font-black text-emerald-400">5 / 5 PILAR LOLOS</div>
            <div className="text-[10px] text-emerald-500">Audit Grade: A+ (Compliant)</div>
          </div>
        </div>
      </div>

      {/* 5 Pillars of Responsible AI at Bank BRI */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            5 Pilar Prinsip Etika ML Bank BRI (Tugas B-1)
          </h2>
          <p className="text-xs text-slate-400">
            Pilar tata kelola resmi yang wajib dipatuhi oleh seluruh inisiatif data science dan AI di Bank BRI
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {pillars.map((p) => (
            <div key={p.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                    {p.id.split('-')[1]}
                  </span>
                  <span className="font-extrabold text-white text-sm">{p.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {p.regulasi}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                    {p.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{p.description}</p>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="font-semibold text-emerald-400 block mb-0.5">Bukti Audit Kepatuhan:</span>
                  <span className="text-slate-300">{p.evidence}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="font-semibold text-blue-400 block mb-0.5">Rekomendasi Operasional:</span>
                  <span className="text-slate-300">{p.recommendation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Page Executive Report (Tugas 4 Tantangan) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <FileText className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-base font-extrabold text-white">
              Laporan Singkat Eksekutif (Tugas 4 Tantangan: Maksimal 2 Halaman)
            </h2>
            <p className="text-xs text-slate-400">
              Dokumen resmi analisis etika model risiko kredit untuk Dewan Direksi & Komite Risiko Bank BRI
            </p>
          </div>
        </div>

        {/* Section 1: Temuan Bias Terbesar */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            Temuan Bias Terbesar di Dataset BRI (Termasuk Proxy Discrimination)
          </h3>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              Hasil audit AIF360 terhadap fitur langsung <code>status_pekerjaan</code> membuktikan tidak ada bias sistemik
              terhadap kelompok Buruh, Wiraswasta, maupun Lainnya jika dibandingkan PNS (Disparate Impact berkisar{' '}
              <strong className="text-emerald-400">1.0014 - 1.0041</strong>).
            </p>
            <p>
              Namun, pengujian tantangan mengungkap kerentanan kritis pada <strong>Proxy Discrimination</strong> melalui
              fitur geografis <code>kode_pos</code>. Ketika data historis terkontaminasi oleh preferensi wilayah (nasabah Jakarta
              diberi toleransi 25% lebih tinggi), Disparate Impact untuk wilayah 'Lainnya' anjlok drastis ke angka{' '}
              <strong className="text-rose-400">0.7170</strong> (pelanggaran 4/5th Rule). Lebih membahayakan lagi, model XGBoost
              membajak fitur <code>kode_pos_Lainnya</code> menjadi <strong>fitur terpenting dengan gain 34.2%</strong>, mengalahkan
              riwayat penunggakan (DPD) dan pendapatan.
            </p>
            <p>
              <strong>Solusi Teruji:</strong> Penerapan <em>AIF360 Reweighing</em> memulihkan Disparate Impact ke angka{' '}
              <strong className="text-emerald-400">0.8520</strong> dengan penalti AUC hanya 0.003, sementara <em>Threshold Adjustment</em>{' '}
              (menurunkan batas cut-off wilayah Lainnya ke 0.42) menyamakan acceptance rate menjadi setara 84.8%.
            </p>
          </div>
        </div>

        {/* Section 2: Deployment Pipeline di BRImo / Scoring Ceria */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            Cara Deploy Dashboard Ini di Production BRImo / Scoring Ceria
          </h3>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              Untuk mengintegrasikan arsitektur ini ke dalam ekosistem digital Bank BRI (BRImo dan BRI Ceria Pinjaman Digital):
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li>
                <strong>Microservice Inference API:</strong> Model XGBoost diekspor ke format ONNX/Triton Server dengan
                latensi inferensi &lt; 150ms per pengajuan pinjaman digital.
              </li>
              <li>
                <strong>Dual-Score Real-time Pipeline:</strong> Setiap pengajuan menghasilkan dua output: skor probabilitas default (PD)
                dan vektor bobot lokal (LIME/TreeSHAP Fast).
              </li>
              <li>
                <strong>Automated Routing Engine:</strong> Debitur dengan PD &lt; 0.35 otomatis dialirkan ke <em>Instant Approval BRImo</em>;
                debitur dengan PD &gt; 0.65 otomatis ditolak dengan lampiran PDF ringkasan alasan LIME; sedangkan debitur pada zona
                0.35 &le; PD &le; 0.65 dialihkan ke antrean <em>Loan Officer Credit Workflow Dashboard</em> untuk ditinjau manusia.
              </li>
              <li>
                <strong>Drift & Disparity Sentinel:</strong> Pipeline otomatis menghitung Disparate Impact mingguan dan memicu alert
                ke tim Risk Management jika DI turun di bawah 0.8500.
              </li>
            </ul>
          </div>
        </div>

        {/* Section 3: Kasus Nyata Etika di Bank BRI */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            Contoh Kasus Nyata Mengapa Etika Sangat Penting di Bank BRI
          </h3>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              Bank BRI menyalurkan lebih dari <strong>80% portofolionya ke sektor UMKM dan Ultra Mikro</strong> (termasuk program KUR).
              Mayoritas nasabah adalah pedagang pasar tradisional, petani, nelayan, dan buruh harian lepas di pelosok 3T
              (Tertinggal, Terdepan, Terluar).
            </p>
            <p>
              Jika model scoring AI dibiarkan menggunakan data historis tanpa audit keadilan, algoritma akan secara sistemik
              menghukum nasabah daerah pelosok semata-mata karena kode pos atau status buruh non-formal mereka, meskipun rasio
              beban utang (DSR) dan catatan pembayarannya sangat baik. Hal ini bertentangan secara diametral dengan misi perseroan
              sebagai pendorong <strong>Inklusi Keuangan Nasional</strong>.
            </p>
            <p>
              Kepatuhan etika memastikan AI Bank BRI tidak hanya menghasilkan efisiensi operasional, tetapi juga menjaga marwah perseroan
              sebagai bank rakyat yang berkeadilan sosial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
