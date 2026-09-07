import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calculator,
  Cpu,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Search,
  Check,
  X,
  Pencil,
  Trash2
} from 'lucide-react';
import { CreditApplication } from '../types';
import { formatRupiah, formatPercent } from '../utils/aiEthicsEngine';

const STORAGE_KEY_APPLICATIONS = 'bri_credit_applications_v1';
const OFFICER_NAME = 'Barnacle Boy';

// Helper pemisah nominal rupiah titik (contoh: 600000 -> 600.000, 1000000 -> 1.000.000)
export const formatRupiahInputValue = (val: number): string => {
  if (val === 0) return '';
  return val.toLocaleString('id-ID');
};

export const parseRupiahInputValue = (str: string): number => {
  const digitsOnly = str.replace(/\D/g, '');
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
};

// Helper format teks rekomendasi ML (menghilangkan underscore: MANUAL_REVIEW -> MANUAL REVIEW)
export const formatMLRecommendation = (rec: string): string => {
  if (rec === 'MANUAL_REVIEW') return 'MANUAL REVIEW';
  return rec;
};

// Modal Komponen untuk Edit Data Pengajuan & Keputusan Analis
interface EditModalProps {
  app: CreditApplication;
  onClose: () => void;
  onSave: (updated: CreditApplication) => void;
}

const EditApplicationModal: React.FC<EditModalProps> = ({ app, onClose, onSave }) => {
  const [nama, setNama] = useState(app.nama);
  const [cif, setCif] = useState(app.cif);
  const [income, setIncome] = useState(app.income);
  const [usia, setUsia] = useState(app.usia);
  const [jumlahPinjaman, setJumlahPinjaman] = useState(app.jumlah_pinjaman);
  const [durasiPinjaman, setDurasiPinjaman] = useState(app.durasi_pinjaman);
  const [bungaTahunan] = useState(app.bunga_tahunan || 8.5);
  const [nilaiAgunan, setNilaiAgunan] = useState(app.nilai_agunan);
  const [cicilanLain, setCicilanLain] = useState(app.cicilan_lain);
  const [dpd, setDpd] = useState(app.dpd);
  const [statusPekerjaan, setStatusPekerjaan] = useState(app.status_pekerjaan);
  const [kodePos, setKodePos] = useState(app.kode_pos);
  const [analystDecision, setAnalystDecision] = useState<'APPROVED' | 'REJECTED' | 'PENDING'>(app.analyst_decision);
  const [analystNotes, setAnalystNotes] = useState(app.analyst_notes || '');
  const [analystOfficer, setAnalystOfficer] = useState(app.analyst_officer || OFFICER_NAME);

  // Recalculations live
  const pokokBulanan = durasiPinjaman > 0 ? jumlahPinjaman / durasiPinjaman : 0;
  const bungaBulanan = durasiPinjaman > 0 ? (jumlahPinjaman * (bungaTahunan / 100)) / 12 : 0;
  const angsuranBulanan = Math.round(pokokBulanan + bungaBulanan);
  const totalKewajiban = angsuranBulanan + cicilanLain;
  const calculatedDSR = income > 0 ? parseFloat((totalKewajiban / income).toFixed(4)) : 0;
  const calculatedLTV = nilaiAgunan > 0 ? parseFloat((jumlahPinjaman / nilaiAgunan).toFixed(4)) : 0.8;
  const youngPenalty = usia < 30 ? 5 : 0;
  const calculatedRiskScore = parseFloat((calculatedDSR * 4 + calculatedLTV * 3 + dpd * 1.5 + youngPenalty).toFixed(2));

  const zScore =
    (dpd - 8.0) * 0.26 +
    (35.0 - usia) * 0.025 +
    ((7500000 - income) / 10000000) * 0.18 +
    (durasiPinjaman - 35) * 0.015 +
    (calculatedDSR - 0.2) * 1.8 +
    (calculatedLTV - 0.22) * 1.5 -
    1.85;

  const calculatedPD = parseFloat(
    Math.max(0.015, Math.min(0.985, 1.0 / (1.0 + Math.exp(-zScore)))).toFixed(4)
  );

  let mlRecommendation: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT' = 'ACCEPT';
  if (calculatedPD > 0.65) mlRecommendation = 'REJECT';
  else if (calculatedPD >= 0.35) mlRecommendation = 'MANUAL_REVIEW';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CreditApplication = {
      ...app,
      nama,
      cif,
      income,
      usia,
      jumlah_pinjaman: jumlahPinjaman,
      durasi_pinjaman: durasiPinjaman,
      bunga_tahunan: bungaTahunan,
      nilai_agunan: nilaiAgunan,
      cicilan_lain: cicilanLain,
      dpd,
      status_pekerjaan: statusPekerjaan,
      kode_pos: kodePos,
      angsuran_bulanan: angsuranBulanan,
      dsr: calculatedDSR,
      ltv: calculatedLTV,
      risk_score: calculatedRiskScore,
      proba_default: calculatedPD,
      ml_recommendation: mlRecommendation,
      analyst_decision: analystDecision,
      analyst_officer: analystOfficer,
      analyst_notes: analystNotes,
      decision_timestamp: new Date().toLocaleString('id-ID')
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Edit Berkas Pengajuan Kredit
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {app.id}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Ubah informasi debitur, parameter pinjaman, atau revisi keputusan analis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* 1. Informasi Debitur */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              1. Identitas Debitur & Wilayah
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nama Lengkap</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nomor CIF</label>
                <input
                  type="text"
                  value={cif}
                  onChange={(e) => setCif(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Usia (Tahun)</label>
                <input
                  type="number"
                  min="21"
                  max="65"
                  value={usia}
                  onChange={(e) => setUsia(Number(e.target.value) || 21)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Pekerjaan</label>
                <select
                  value={statusPekerjaan}
                  onChange={(e) => setStatusPekerjaan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="PNS">PNS / BUMN</option>
                  <option value="Wiraswasta">Wiraswasta</option>
                  <option value="Karyawan Swasta">Karyawan Swasta</option>
                  <option value="Buruh">Buruh / Pekerja Lepas</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Wilayah / Kode Pos</label>
                <select
                  value={kodePos}
                  onChange={(e) => setKodePos(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Jakarta">Jakarta (Wilayah 1)</option>
                  <option value="Bandung">Bandung (Wilayah 2)</option>
                  <option value="Surabaya">Surabaya (Wilayah 3)</option>
                  <option value="Medan">Medan (Wilayah 4)</option>
                  <option value="Makassar">Makassar (Wilayah 5)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Parameter Finansial */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              2. Parameter Finansial & Pinjaman
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Pendapatan Bulanan (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatRupiahInputValue(income)}
                  onChange={(e) => setIncome(parseRupiahInputValue(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">{formatRupiah(income)}</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Plafon Pinjaman (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatRupiahInputValue(jumlahPinjaman)}
                  onChange={(e) => setJumlahPinjaman(parseRupiahInputValue(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">{formatRupiah(jumlahPinjaman)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Tenor (Bulan)</label>
                <select
                  value={durasiPinjaman}
                  onChange={(e) => setDurasiPinjaman(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value={12}>12 Bulan</option>
                  <option value={24}>24 Bulan</option>
                  <option value={36}>36 Bulan</option>
                  <option value={48}>48 Bulan</option>
                  <option value={60}>60 Bulan</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nilai Agunan (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatRupiahInputValue(nilaiAgunan)}
                  onChange={(e) => setNilaiAgunan(parseRupiahInputValue(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">{formatRupiah(nilaiAgunan)}</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Cicilan Lain (Rp/bln)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatRupiahInputValue(cicilanLain)}
                  onChange={(e) => setCicilanLain(parseRupiahInputValue(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">{formatRupiah(cicilanLain)}</span>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-slate-400 mb-1 font-semibold">DPD (Hari Tunggakan)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={dpd}
                onChange={(e) => setDpd(Number(e.target.value) || 0)}
                className="w-full sm:w-1/3 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Live Preview Hasil Kalkulasi & ML */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Kalkulasi Otomatis & Prediksi ML (Live Recalculate)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 block">Angsuran / Bln</span>
                <span className="font-bold text-white font-mono text-xs">{formatRupiah(angsuranBulanan)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Rasio DSR / LTV</span>
                <span className="font-bold text-slate-200 font-mono text-xs">
                  {(calculatedDSR * 100).toFixed(1)}% / {(calculatedLTV * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Prediksi ML PD%</span>
                <span
                  className={`font-black font-mono text-xs ${
                    calculatedPD > 0.65 ? 'text-rose-400' : calculatedPD >= 0.35 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {(calculatedPD * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Rekomendasi AI</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                    mlRecommendation === 'ACCEPT'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : mlRecommendation === 'MANUAL_REVIEW'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {formatMLRecommendation(mlRecommendation)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Keputusan & Catatan Credit Analyst */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              3. Keputusan & Catatan Credit Analyst
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Pilih Keputusan Analis:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAnalystDecision('APPROVED')}
                    className={`py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${
                      analystDecision === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    APPROVE (DISETUJUI)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalystDecision('REJECTED')}
                    className={`py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${
                      analystDecision === 'REJECTED'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    REJECT (DITOLAK)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Petugas Analis</label>
                  <input
                    type="text"
                    value={analystOfficer}
                    onChange={(e) => setAnalystOfficer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Waktu Update Terakhir</label>
                  <input
                    type="text"
                    disabled
                    value={new Date().toLocaleString('id-ID')}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Catatan Justifikasi Analis</label>
                <textarea
                  rows={3}
                  value={analystNotes}
                  onChange={(e) => setAnalystNotes(e.target.value)}
                  placeholder="Masukkan catatan pertimbangan atau mitigasi risiko..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-950 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CreditApplicationView: React.FC = () => {
  // Form State
  const [cif, setCif] = useState<string>('CIF-2026-0891');
  const [nama, setNama] = useState<string>('Bambang Sutrisno');
  const [income, setIncome] = useState<number>(9500000);
  const [usia, setUsia] = useState<number>(34);
  const [jumlahPinjaman, setJumlahPinjaman] = useState<number>(35000000);
  const [durasiPinjaman, setDurasiPinjaman] = useState<number>(24);
  const [bungaTahunan, setBungaTahunan] = useState<number>(8.5);
  const [nilaiAgunan, setNilaiAgunan] = useState<number>(60000000);
  const [cicilanLain, setCicilanLain] = useState<number>(500000);
  const [dpd, setDpd] = useState<number>(0);
  const [statusPekerjaan, setStatusPekerjaan] = useState<string>('PNS');
  const [kodePos, setKodePos] = useState<string>('Jakarta');

  // Analyst Action Form State
  const [analystNotes, setAnalystNotes] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter / Search for History Table
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'APPROVED' | 'REJECTED' | 'PENDING'>('ALL');
  const [searchTable, setSearchTable] = useState<string>('');

  // Stored Applications
  const [applications, setApplications] = useState<CreditApplication[]>([]);

  // Edit & Delete Modal States
  const [editingApp, setEditingApp] = useState<CreditApplication | null>(null);
  const [appToDelete, setAppToDelete] = useState<CreditApplication | null>(null);

  // Load from localStorage or initialize with sensible sample
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setApplications(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Gagal membaca riwayat pengajuan kredit:', e);
    }

    // Default seed history
    const initialSeed: CreditApplication[] = [
      {
        id: 'APP-20260907-001',
        timestamp: '2026-09-07 09:30:15',
        cif: 'CIF-2026-0120',
        nama: 'Dewi Lestari',
        income: 12000000,
        usia: 38,
        jumlah_pinjaman: 50000000,
        durasi_pinjaman: 36,
        bunga_tahunan: 8.5,
        nilai_agunan: 90000000,
        cicilan_lain: 400000,
        dpd: 0,
        status_pekerjaan: 'PNS',
        kode_pos: 'Jakarta',
        angsuran_bulanan: 1743055,
        dsr: 0.178,
        ltv: 0.555,
        risk_score: 2.38,
        proba_default: 0.1245,
        ml_recommendation: 'ACCEPT',
        analyst_decision: 'APPROVED',
        analyst_officer: OFFICER_NAME,
        analyst_notes: 'DSR sangat rendah (17.8%), tanpa riwayat tunggakan, agunan kuat. Disetujui langsung.',
        decision_timestamp: '2026-09-07 09:35:10'
      },
      {
        id: 'APP-20260907-002',
        timestamp: '2026-09-07 10:15:40',
        cif: 'CIF-2026-0341',
        nama: 'Surya Kencana',
        income: 6000000,
        usia: 27,
        jumlah_pinjaman: 25000000,
        durasi_pinjaman: 24,
        bunga_tahunan: 9.0,
        nilai_agunan: 30000000,
        cicilan_lain: 800000,
        dpd: 12,
        status_pekerjaan: 'Wiraswasta',
        kode_pos: 'Surabaya',
        angsuran_bulanan: 1229166,
        dsr: 0.338,
        ltv: 0.833,
        risk_score: 24.85,
        proba_default: 0.4852,
        ml_recommendation: 'MANUAL_REVIEW',
        analyst_decision: 'APPROVED',
        analyst_officer: OFFICER_NAME,
        analyst_notes: 'Usia muda dan ada DPD 12 hari, namun omzet toko stabil dan LTV mencukupi setelah verifikasi lapangan.',
        decision_timestamp: '2026-09-07 10:45:00'
      },
      {
        id: 'APP-20260907-003',
        timestamp: '2026-09-07 11:20:00',
        cif: 'CIF-2026-0599',
        nama: 'Asep Saepuloh',
        income: 3800000,
        usia: 23,
        jumlah_pinjaman: 40000000,
        durasi_pinjaman: 48,
        bunga_tahunan: 9.5,
        nilai_agunan: 35000000,
        cicilan_lain: 1200000,
        dpd: 45,
        status_pekerjaan: 'Buruh',
        kode_pos: 'Bandung',
        angsuran_bulanan: 1150000,
        dsr: 0.618,
        ltv: 1.142,
        risk_score: 77.97,
        proba_default: 0.8241,
        ml_recommendation: 'REJECT',
        analyst_decision: 'REJECTED',
        analyst_officer: OFFICER_NAME,
        analyst_notes: 'DSR melampaui 60%, DPD 45 hari (kategori macet/kurang lancar), agunan di bawah plafon pinjaman.',
        decision_timestamp: '2026-09-07 11:32:45'
      }
    ];

    setApplications(initialSeed);
  }, []);

  // Save to localStorage when applications change
  const saveApplications = (newApps: CreditApplication[]) => {
    setApplications(newApps);
    try {
      localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(newApps));
    } catch (e) {
      console.warn('Gagal menyimpan aplikasi ke localStorage:', e);
    }
  };

  // --- RUMUS-RUMUS PERHITUNGAN YANG DITENTUKAN ---
  const pokokBulanan = durasiPinjaman > 0 ? jumlahPinjaman / durasiPinjaman : 0;
  const bungaBulanan = durasiPinjaman > 0 ? (jumlahPinjaman * (bungaTahunan / 100)) / 12 : 0;
  const angsuranBulanan = Math.round(pokokBulanan + bungaBulanan);
  const totalKewajibanBulanan = angsuranBulanan + cicilanLain;

  // Rasio DSR (Debt Service Ratio)
  const calculatedDSR = income > 0 ? parseFloat((totalKewajibanBulanan / income).toFixed(4)) : 0;

  // Rasio LTV (Loan-to-Value)
  const calculatedLTV = nilaiAgunan > 0 ? parseFloat((jumlahPinjaman / nilaiAgunan).toFixed(4)) : 0.8;

  // Rumus Tradisional Risk Score
  const youngPenalty = usia < 30 ? 5 : 0;
  const calculatedRiskScore = parseFloat(
    (calculatedDSR * 4 + calculatedLTV * 3 + dpd * 1.5 + youngPenalty).toFixed(2)
  );

  // Rumus Machine Learning Log-Odds & Probability of Default
  const zScore =
    (dpd - 8.0) * 0.26 +
    (35.0 - usia) * 0.025 +
    ((7500000 - income) / 10000000) * 0.18 +
    (durasiPinjaman - 35) * 0.015 +
    (calculatedDSR - 0.2) * 1.8 +
    (calculatedLTV - 0.22) * 1.5 -
    1.85;

  const calculatedPD = parseFloat(
    Math.max(0.015, Math.min(0.985, 1.0 / (1.0 + Math.exp(-zScore)))).toFixed(4)
  );

  // Machine Learning Recommendation
  let mlRecommendation: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT' = 'ACCEPT';
  if (calculatedPD > 0.65) {
    mlRecommendation = 'REJECT';
  } else if (calculatedPD >= 0.35) {
    mlRecommendation = 'MANUAL_REVIEW';
  } else {
    mlRecommendation = 'ACCEPT';
  }

  // Preset Handlers
  const handleApplyPreset = (presetType: 'LOW' | 'MED' | 'HIGH') => {
    if (presetType === 'LOW') {
      setCif(`CIF-${Math.floor(100000 + Math.random() * 900000)}`);
      setNama('Sri Wahyuni, S.Pd.');
      setIncome(11500000);
      setUsia(42);
      setJumlahPinjaman(45000000);
      setDurasiPinjaman(24);
      setNilaiAgunan(85000000);
      setCicilanLain(300000);
      setDpd(0);
      setStatusPekerjaan('PNS');
      setKodePos('Jakarta');
    } else if (presetType === 'MED') {
      setCif(`CIF-${Math.floor(100000 + Math.random() * 900000)}`);
      setNama('Hendra Gunawan');
      setIncome(7200000);
      setUsia(31);
      setJumlahPinjaman(30000000);
      setDurasiPinjaman(36);
      setNilaiAgunan(35000000);
      setCicilanLain(850000);
      setDpd(10);
      setStatusPekerjaan('Wiraswasta');
      setKodePos('Surabaya');
    } else {
      setCif(`CIF-${Math.floor(100000 + Math.random() * 900000)}`);
      setNama('Rian Firmansyah');
      setIncome(4200000);
      setUsia(24);
      setJumlahPinjaman(35000000);
      setDurasiPinjaman(48);
      setNilaiAgunan(30000000);
      setCicilanLain(1100000);
      setDpd(35);
      setStatusPekerjaan('Buruh');
      setKodePos('Bandung');
    }
  };

  // Submit Decision from Credit Analyst (Approval or Reject)
  const handleAnalystDecision = (decision: 'APPROVED' | 'REJECTED') => {
    const newApp: CreditApplication = {
      id: `APP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(
        applications.length + 1
      ).padStart(3, '0')}`,
      timestamp: new Date().toLocaleString('id-ID'),
      cif,
      nama,
      income,
      usia,
      jumlah_pinjaman: jumlahPinjaman,
      durasi_pinjaman: durasiPinjaman,
      bunga_tahunan: bungaTahunan,
      nilai_agunan: nilaiAgunan,
      cicilan_lain: cicilanLain,
      dpd,
      status_pekerjaan: statusPekerjaan,
      kode_pos: kodePos,
      angsuran_bulanan: angsuranBulanan,
      dsr: calculatedDSR,
      ltv: calculatedLTV,
      risk_score: calculatedRiskScore,
      proba_default: calculatedPD,
      ml_recommendation: mlRecommendation,
      analyst_decision: decision,
      analyst_officer: OFFICER_NAME,
      analyst_notes: analystNotes || (decision === 'APPROVED' ? 'Disetujui oleh analis kredit.' : 'Ditolak oleh analis kredit berdasarkan profil risiko.'),
      decision_timestamp: new Date().toLocaleString('id-ID')
    };

    saveApplications([newApp, ...applications]);
    setSuccessMessage(
      `Pengajuan ${newApp.cif} (${newApp.nama}) telah berhasil di-${decision === 'APPROVED' ? 'APPROVE (DISETUJUI)' : 'REJECT (DITOLAK)'} oleh ${OFFICER_NAME}!`
    );
    setAnalystNotes('');

    // Auto clear success message
    setTimeout(() => {
      setSuccessMessage(null);
    }, 6000);
  };

  // Handler simpan perubahan data pengajuan (Edit)
  const handleSaveEditedApp = (updatedApp: CreditApplication) => {
    const updatedList = applications.map((a) => (a.id === updatedApp.id ? updatedApp : a));
    saveApplications(updatedList);
    setEditingApp(null);
    setSuccessMessage(`Perubahan pengajuan ${updatedApp.id} (${updatedApp.nama}) berhasil disimpan.`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Handler hapus data pengajuan (Delete)
  const handleConfirmDeleteApp = (id: string) => {
    const target = applications.find((a) => a.id === id);
    const updatedList = applications.filter((a) => a.id !== id);
    saveApplications(updatedList);
    setAppToDelete(null);
    setSuccessMessage(`Data pengajuan ${target?.id || id} (${target?.nama || ''}) telah berhasil dihapus.`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Filtered History
  const filteredApps = applications.filter((app) => {
    const matchStatus = filterStatus === 'ALL' || app.analyst_decision === filterStatus;
    const matchSearch =
      app.nama.toLowerCase().includes(searchTable.toLowerCase()) ||
      app.cif.toLowerCase().includes(searchTable.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTable.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-indigo-800/40 p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-bold tracking-wide">
                FITUR 2: PENGAJUAN KREDIT
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 text-xs font-semibold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Analis: {OFFICER_NAME}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              Formulir Pengajuan Kredit, Rumus ML & Meja Approval Analis
            </h1>
            <p className="text-slate-300 text-xs lg:text-sm mt-1 max-w-3xl">
              Input data nasabah, otomatisasi rumus finansial (Angsuran, DSR, LTV), rekomendasi risiko berbasis Machine Learning, serta tombol persetujuan (Approval) atau penolakan (Reject) oleh Credit Analyst.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleApplyPreset('LOW')}
              className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 rounded-lg text-xs font-semibold transition"
            >
              Preset Risiko Rendah
            </button>
            <button
              onClick={() => handleApplyPreset('MED')}
              className="px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/50 rounded-lg text-xs font-semibold transition"
            >
              Preset Risiko Sedang
            </button>
            <button
              onClick={() => handleApplyPreset('HIGH')}
              className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/50 rounded-lg text-xs font-semibold transition"
            >
              Preset Risiko Tinggi
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-sm flex items-center justify-between shadow-lg shadow-emerald-950/50 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs underline ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main 2-Column: Input Form (Left) & Formula + ML Results + Approval Desk (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =========================================================================
            LEFT COLUMN: INPUT FORM NASABAH (5 cols)
           ========================================================================= */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">Input Data Calon Debitur</h2>
            </div>
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
              Formulir Pengajuan
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* CIF & Nama */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nomor CIF / ID</label>
                <input
                  type="text"
                  value={cif}
                  onChange={(e) => setCif(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nama Lengkap</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Income & Usia */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Pendapatan Bulanan (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatRupiahInputValue(income)}
                  onChange={(e) => setIncome(parseRupiahInputValue(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">{formatRupiah(income)}</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Usia (Tahun)</label>
                <input
                  type="number"
                  min="21"
                  max="65"
                  value={usia}
                  onChange={(e) => setUsia(Number(e.target.value) || 21)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {usia < 30 ? 'Kategori Usia Muda (<30)' : 'Kategori Usia Dewasa'}
                </span>
              </div>
            </div>

            {/* Plafon & Tenor */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Jumlah Pinjaman / Plafon (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatRupiahInputValue(jumlahPinjaman)}
                  onChange={(e) => setJumlahPinjaman(parseRupiahInputValue(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {formatRupiah(jumlahPinjaman)}
                </span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Tenor / Durasi (Bulan)</label>
                <select
                  value={durasiPinjaman}
                  onChange={(e) => setDurasiPinjaman(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value={12}>12 Bulan (1 Tahun)</option>
                  <option value={24}>24 Bulan (2 Tahun)</option>
                  <option value={36}>36 Bulan (3 Tahun)</option>
                  <option value={48}>48 Bulan (4 Tahun)</option>
                  <option value={60}>60 Bulan (5 Tahun)</option>
                </select>
              </div>
            </div>

            {/* Nilai Agunan & Cicilan Lain */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Nilai Agunan / Jaminan (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatRupiahInputValue(nilaiAgunan)}
                  onChange={(e) => setNilaiAgunan(parseRupiahInputValue(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {formatRupiah(nilaiAgunan)}
                </span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Cicilan Utang Lain (Rp/bln)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatRupiahInputValue(cicilanLain)}
                  onChange={(e) => setCicilanLain(parseRupiahInputValue(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {formatRupiah(cicilanLain)}
                </span>
              </div>
            </div>

            {/* Tunggakan DPD, Pekerjaan & Kode Pos */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">DPD (Hari Tunggakan)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={dpd}
                  onChange={(e) => setDpd(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {dpd === 0 ? 'Lancar (0 hari)' : `${dpd} hari macet`}
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Pekerjaan</label>
                <select
                  value={statusPekerjaan}
                  onChange={(e) => setStatusPekerjaan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="PNS">PNS / BUMN</option>
                  <option value="Wiraswasta">Wiraswasta</option>
                  <option value="Buruh">Buruh / Karyawan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Wilayah / Kode Pos</label>
                <select
                  value={kodePos}
                  onChange={(e) => setKodePos(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Jakarta">Jakarta</option>
                  <option value="Surabaya">Surabaya</option>
                  <option value="Bandung">Bandung</option>
                  <option value="Medan">Medan</option>
                  <option value="Lainnya">Lainnya / Luar Jawa</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: RUMUS FINANSIAL + HASIL ML + APPROVAL CREDIT ANALYST (7 cols)
           ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Hasil Perhitungan Rumus yang Ditentukan */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Hasil Rumus Finansial yang Ditentukan</h3>
              </div>
              <span className="text-[11px] text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                Formula Otomatis
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Angsuran Bulanan:</span>
                <span className="text-base font-black text-white mt-1 block">
                  {formatRupiah(angsuranBulanan)}
                </span>
                <span className="text-[10px] text-slate-500">Pokok + Bunga {bungaTahunan}%</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Total Beban Bulanan:</span>
                <span className="text-base font-black text-white mt-1 block">
                  {formatRupiah(totalKewajibanBulanan)}
                </span>
                <span className="text-[10px] text-slate-500">Inc. cicilan lain</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">DSR (Debt Service Ratio):</span>
                <span
                  className={`text-base font-black mt-1 block ${
                    calculatedDSR > 0.40 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {(calculatedDSR * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500">
                  {calculatedDSR <= 0.35 ? 'Sangat Aman (≤35%)' : 'Tinggi (>35%)'}
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">LTV (Loan to Value):</span>
                <span
                  className={`text-base font-black mt-1 block ${
                    calculatedLTV > 0.8 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {(calculatedLTV * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500">Plafon / Nilai Agunan</span>
              </div>
            </div>

            {/* Formula Detail Accordion / Footnote */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span>Formula Risk Score: (DSR × 4) + (LTV × 3) + (DPD × 1.5) + Penalti Usia</span>
                <strong className="text-white font-bold">{calculatedRiskScore}</strong>
              </div>
              <div className="flex items-center justify-between font-mono text-slate-500">
                <span>Machine Learning Log-Odds Logit z:</span>
                <span>z = {zScore.toFixed(3)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Hasil Machine Learning & Rekomendasi AI */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Hasil Prediksi Machine Learning</h3>
              </div>
              <span className="text-[11px] text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                XGBoost Probability Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mb-4">
              {/* Left: Probabilitas Default Meter */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Probability of Default (PD)
                </span>
                <div
                  className={`text-4xl font-black mt-2 font-mono ${
                    calculatedPD > 0.65
                      ? 'text-rose-400'
                      : calculatedPD >= 0.35
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {(calculatedPD * 100).toFixed(2)}%
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      calculatedPD > 0.65
                        ? 'bg-rose-500'
                        : calculatedPD >= 0.35
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${calculatedPD * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Ambang Batas: Lolos &lt;35% | Review 35-65% | Tolak &gt;65%
                </span>
              </div>

              {/* Right: AI Recommendation Card */}
              <div
                className={`p-5 rounded-xl border flex flex-col justify-between h-full ${
                  mlRecommendation === 'ACCEPT'
                    ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                    : mlRecommendation === 'MANUAL_REVIEW'
                    ? 'bg-amber-950/40 border-amber-700/60 text-amber-200'
                    : 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                }`}
              >
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                    Rekomendasi Machine Learning
                  </span>
                  <div className="text-2xl font-black mt-1 flex items-center gap-2">
                    {mlRecommendation === 'ACCEPT' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                    {mlRecommendation === 'MANUAL_REVIEW' && <Clock className="w-6 h-6 text-amber-400" />}
                    {mlRecommendation === 'REJECT' && <XCircle className="w-6 h-6 text-rose-400" />}
                    {formatMLRecommendation(mlRecommendation)}
                  </div>
                </div>

                <p className="text-xs mt-3 opacity-90 leading-relaxed">
                  {mlRecommendation === 'ACCEPT' &&
                    'Profil risiko sangat baik. Disarankan untuk disetujui secara otomatis atau dengan approval cepat.'}
                  {mlRecommendation === 'MANUAL_REVIEW' &&
                    'Kasus borderline atau memiliki tunggakan/DSR sedang. Membutuhkan verifikasi dokumen dan keputusan Credit Analyst.'}
                  {mlRecommendation === 'REJECT' &&
                    'Tingkat risiko gagal bayar tinggi. Model merekomendasikan penolakan kredit untuk menjaga NPL Bank BRI.'}
                </p>
              </div>
            </div>

            {/* Mini Factor Breakdown */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <span className="text-slate-400 font-semibold block text-[11px]">
                Faktor Penentu Utama Prediksi (Interpretasi Lokal):
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dampak DPD ({dpd} hari):</span>
                  <span className={dpd > 8 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {dpd > 8 ? `+${((dpd - 8) * 0.04).toFixed(3)} (Pendorong)` : 'Netral/Rendah'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dampak Income:</span>
                  <span className={income >= 7500000 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {income >= 7500000 ? '-0.035 (Peredam)' : '+0.020 (Pendorong)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Meja Keputusan Credit Analyst (APPROVAL / REJECT) */}
          <div className="bg-slate-900 border-2 border-indigo-700/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-bl-xl tracking-wide">
              HUMAN-IN-THE-LOOP DESK
            </div>

            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-base font-bold text-white">Review & Keputusan Credit Analyst</h3>
                <p className="text-xs text-slate-400">
                  Petugas Aktif: <strong className="text-indigo-300">{OFFICER_NAME}</strong> (Credit Risk Analyst)
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Catatan Pertimbangan / Justifikasi Analis Kredit:
                </label>
                <textarea
                  rows={2}
                  value={analystNotes}
                  onChange={(e) => setAnalystNotes(e.target.value)}
                  placeholder="Tuliskan alasan pertimbangan (misal: verifikasi mutasi rekening valid, agunan mencukupi, atau tunggakan melebihi toleransi)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons: APPROVAL vs REJECT */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleAnalystDecision('APPROVED')}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Check className="w-5 h-5" />
                  APPROVAL (Setujui Kredit)
                </button>

                <button
                  type="button"
                  onClick={() => handleAnalystDecision('REJECTED')}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <X className="w-5 h-5" />
                  REJECT (Tolak Kredit)
                </button>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Keputusan approval/reject akan langsung tersimpan secara permanen ke tabel riwayat audit di bawah ini.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TABEL RIWAYAT PENGAJUAN KREDIT & KEPUTUSAN ANALIS
         ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Riwayat Pengajuan Kredit & Keputusan Credit Analyst
            </h3>
            <p className="text-xs text-slate-400">
              Daftar seluruh berkas pengajuan, probabilitas default ML, dan catatan persetujuan petugas
            </p>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="Cari Nama / CIF..."
                className="bg-slate-950 border border-slate-700 text-xs text-white pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterStatus === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua ({applications.length})
              </button>
              <button
                onClick={() => setFilterStatus('APPROVED')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterStatus === 'APPROVED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilterStatus('REJECTED')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterStatus === 'REJECTED' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>
        </div>

        {/* Table Records */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <th className="p-3">ID & Waktu</th>
                <th className="p-3">Debitur</th>
                <th className="p-3">Plafon / Tenor</th>
                <th className="p-3">DSR / DPD</th>
                <th className="p-3">ML PD%</th>
                <th className="p-3">Rekomendasi AI</th>
                <th className="p-3">Keputusan Analis</th>
                <th className="p-3">Catatan Analis</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredApps.length > 0 ? (
                filteredApps.map((app) => {
                  const isApproved = app.analyst_decision === 'APPROVED';
                  const isRejected = app.analyst_decision === 'REJECTED';
                  return (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono text-[11px] text-slate-300">
                        <div className="font-bold text-white">{app.id}</div>
                        <div className="text-[10px] text-slate-500">{app.timestamp}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">{app.nama}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {app.cif} • {app.status_pekerjaan} ({app.kode_pos})
                        </div>
                      </td>
                      <td className="p-3 font-mono">
                        <div className="text-white font-semibold">{formatRupiah(app.jumlah_pinjaman)}</div>
                        <div className="text-[10px] text-slate-400">{app.durasi_pinjaman} Bulan</div>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <div>DSR: {(app.dsr * 100).toFixed(1)}%</div>
                        <div className={app.dpd > 0 ? 'text-amber-400' : 'text-slate-400'}>
                          DPD: {app.dpd} hari
                        </div>
                      </td>
                      <td className="p-3 font-mono">
                        <span
                          className={`font-black ${
                            app.proba_default > 0.65
                              ? 'text-rose-400'
                              : app.proba_default >= 0.35
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {(app.proba_default * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            app.ml_recommendation === 'ACCEPT'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : app.ml_recommendation === 'MANUAL_REVIEW'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {formatMLRecommendation(app.ml_recommendation)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-black inline-flex items-center gap-1 ${
                            isApproved
                              ? 'bg-emerald-600 text-white'
                              : isRejected
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {isApproved && <Check className="w-3.5 h-3.5" />}
                          {isRejected && <X className="w-3.5 h-3.5" />}
                          {app.analyst_decision}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">Oleh: {app.analyst_officer}</div>
                      </td>
                      <td className="p-3 text-slate-300 text-[11px] max-w-xs truncate" title={app.analyst_notes}>
                        {app.analyst_notes || '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setEditingApp(app)}
                            className="px-2.5 py-1 bg-blue-950/70 hover:bg-blue-900/90 text-blue-300 hover:text-white border border-blue-700/60 rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-sm"
                            title="Edit data pengajuan atau revisi keputusan analis"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => setAppToDelete(app)}
                            className="px-2.5 py-1 bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 hover:text-white border border-rose-700/60 rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-sm"
                            title="Hapus riwayat pengajuan kredit ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500">
                    Tidak ada data pengajuan kredit yang sesuai dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {appToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Data Pengajuan?</h3>
                <p className="text-xs text-slate-400 font-mono">{appToDelete.id}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Debitur:</span>
                <span className="font-bold text-white">{appToDelete.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plafon Pinjaman:</span>
                <span className="font-bold text-slate-200 font-mono">{formatRupiah(appToDelete.jumlah_pinjaman)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Keputusan Analis:</span>
                <span className={`font-bold ${appToDelete.analyst_decision === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {appToDelete.analyst_decision}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Apakah Anda yakin ingin menghapus data pengajuan ini dari riwayat? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAppToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteApp(appToDelete.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Application Modal */}
      {editingApp && (
        <EditApplicationModal
          app={editingApp}
          onClose={() => setEditingApp(null)}
          onSave={handleSaveEditedApp}
        />
      )}
    </div>
  );
};
