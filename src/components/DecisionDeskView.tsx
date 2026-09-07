import React, { useState } from 'react';
import {
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  History,
  Sliders,
  Sparkles,
  ShieldCheck,
  Save,
  Search
} from 'lucide-react';
import { DebtorRecord, AuditLogEntry } from '../types';
import {
  formatRupiah,
  formatPercent,
  computeLimeExplanation,
  calculateDebtorPD,
  INITIAL_AUDIT_LOGS
} from '../utils/aiEthicsEngine';

interface DecisionDeskViewProps {
  debtors: DebtorRecord[];
  thresholdAccept: number;
  thresholdReject: number;
  currentUser?: string;
  onUpdateDebtorDecision?: (
    debtorId: string,
    decision: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT',
    notes: string,
    officer: string
  ) => void;
}

export const DecisionDeskView: React.FC<DecisionDeskViewProps> = ({
  debtors,
  thresholdAccept,
  thresholdReject,
  currentUser = 'Barnacle Boy',
  onUpdateDebtorDecision
}) => {
  // Currently reviewed debtor
  const [selectedId, setSelectedId] = useState<string>(
    debtors.length > 0 ? debtors[2]?.id_nasabah || debtors[0].id_nasabah : 'CIF-010003'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [officerName, setOfficerName] = useState(currentUser);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // What-If Simulator State
  const [simIncome, setSimIncome] = useState(8500000);
  const [simDsr, setSimDsr] = useState(0.25);
  const [simLtv, setSimLtv] = useState(0.30);
  const [simDpd, setSimDpd] = useState(4);
  const [simDurasi, setSimDurasi] = useState(36);
  const [simUsia, setSimUsia] = useState(32);
  const [simPekerjaan, setSimPekerjaan] = useState('PNS');
  const [simKodePos, setSimKodePos] = useState('Surabaya');

  const selectedDebtor =
    debtors.find((d) => d.id_nasabah === selectedId) || debtors[0];
  const lime = computeLimeExplanation(selectedDebtor);

  // Dynamic recommendation based on current thresholds
  const getAiRecommendation = (pd: number) => {
    if (pd < thresholdAccept) return 'ACCEPT';
    if (pd > thresholdReject) return 'REJECT';
    return 'MANUAL_REVIEW';
  };

  const currentAiRec = getAiRecommendation(selectedDebtor.proba_default);

  // Handle Human Decision Execution
  const handleExecuteDecision = (decision: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT') => {
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      debtor_id: selectedDebtor.id_nasabah,
      debtor_name: selectedDebtor.nama_nasabah,
      score_pd: selectedDebtor.proba_default,
      ai_recommendation: currentAiRec,
      final_decision: decision,
      officer_id: officerName || 'OFFICER-BFLP-BRI',
      justification:
        decisionNotes.trim() ||
        `Keputusan ${decision} dieksekusi oleh petugas kredit dengan pertimbangan skor PD ${(selectedDebtor.proba_default * 100).toFixed(1)}%.`,
      threshold_used: { accept: thresholdAccept, reject: thresholdReject }
    };

    setAuditLogs([newLog, ...auditLogs]);

    if (onUpdateDebtorDecision) {
      onUpdateDebtorDecision(selectedDebtor.id_nasabah, decision, newLog.justification, officerName);
    }

    if (decision === 'ACCEPT') {
      setFeedbackMsg({
        type: 'success',
        text: `Keputusan ACCEPT dicatat untuk ${selectedDebtor.id_nasabah}. Berkas pinjaman dialihkan ke pencairan.`
      });
    } else if (decision === 'MANUAL_REVIEW') {
      setFeedbackMsg({
        type: 'warning',
        text: `Debitur ${selectedDebtor.id_nasabah} dipindahkan ke antrean peninjauan mendalam analis kredit senior.`
      });
    } else {
      setFeedbackMsg({
        type: 'error',
        text: `Keputusan REJECT dicatat untuk ${selectedDebtor.id_nasabah}. Notifikasi dan hak penjelasan LIME disiapkan.`
      });
    }

    setDecisionNotes('');
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // What-If Simulator Output
  const simResult = calculateDebtorPD(simDpd, simUsia, simIncome, simDurasi, simDsr, simLtv);
  const simAiRec = getAiRecommendation(simResult.probaDefault);

  const filteredDebtors = debtors
    .filter(
      (d) =>
        d.id_nasabah.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.nama_nasabah.toLowerCase().includes(searchQuery.toLowerCase())
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
                TUGAS 4: MEJA KEPUTUSAN HITL
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> POJK No. 11/2022 Pasal 29
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Human-in-the-Loop Credit Approval Desk
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
              Prinsip <strong>Accountability</strong> OJK mewajibkan setiap persetujuan dan penolakan kredit material
              dikawal oleh pertimbangan analis manusia, didukung rekomendasi AI transparan dan pencatatan jejak audit (Audit Trail).
            </p>
          </div>

          <div className="bg-blue-950/70 border border-blue-800/60 px-4 py-2.5 rounded-xl shrink-0">
            <div className="text-xs text-blue-300 font-medium">Petugas Bertugas</div>
            <div className="text-base font-extrabold text-white">{officerName}</div>
            <div className="text-[10px] text-blue-400">NIP: BFLP-BRI-2026</div>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
              : feedbackMsg.type === 'warning'
              ? 'bg-amber-950/80 border-amber-800 text-amber-300'
              : 'bg-rose-950/80 border-rose-800 text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : feedbackMsg.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400" />
          )}
          {feedbackMsg.text}
        </div>
      )}

      {/* Main Grid: Decision Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Debitur Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Antrean Tinjauan Debitur</h2>
            <span className="text-[11px] text-slate-400">Pilih Nasabah</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama / CIF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {filteredDebtors.map((d) => {
              const isSelected = d.id_nasabah === selectedId;
              const rec = getAiRecommendation(d.proba_default);

              return (
                <button
                  key={d.id_nasabah}
                  onClick={() => setSelectedId(d.id_nasabah)}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{d.nama_nasabah}</div>
                    <div className="text-[10px] text-slate-400">
                      {d.id_nasabah} • {d.status_pekerjaan}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        rec === 'ACCEPT'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : rec === 'REJECT'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {rec}
                    </span>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {(d.proba_default * 100).toFixed(1)}% PD
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center & Right Column (2 spans): Active Case File & 3 Action Buttons */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          {/* Debtor Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  {selectedDebtor.nama_nasabah}
                </h3>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-xs">
                  {selectedDebtor.id_nasabah}
                </span>
                <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-800/60 rounded text-xs font-semibold">
                  {selectedDebtor.status_pekerjaan}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Lokasi: {selectedDebtor.kode_pos} • Usia: {selectedDebtor.usia} thn • Pendapatan:{' '}
                <strong className="text-slate-200">{formatRupiah(selectedDebtor.income)}</strong>
              </p>
            </div>

            {/* AI Recommendation Badge */}
            <div className="text-left sm:text-right">
              <div className="text-[11px] text-slate-400">Rekomendasi Model AI:</div>
              <div
                className={`text-sm font-black px-3 py-1 rounded-xl inline-block mt-0.5 border ${
                  currentAiRec === 'ACCEPT'
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                    : currentAiRec === 'REJECT'
                    ? 'bg-rose-950/80 border-rose-800 text-rose-400'
                    : 'bg-amber-950/80 border-amber-800 text-amber-400'
                }`}
              >
                {currentAiRec === 'ACCEPT' && 'AUTO-ACCEPT (Risiko Rendah)'}
                {currentAiRec === 'MANUAL_REVIEW' && 'MANUAL REVIEW (Borderline)'}
                {currentAiRec === 'REJECT' && 'AUTO-REJECT (Risiko Tinggi)'}
              </div>
            </div>
          </div>

          {/* Key Financial Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400">Tunggakan (DPD)</div>
              <div className="text-base font-black text-white">{selectedDebtor.dpd} Hari</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400">Debt Service Ratio</div>
              <div className="text-base font-black text-white">{selectedDebtor.dsr}</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400">Loan to Value (LTV)</div>
              <div className="text-base font-black text-white">{selectedDebtor.ltv}</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400">Tenor Kredit</div>
              <div className="text-base font-black text-white">
                {selectedDebtor.durasi_pinjaman} Bulan
              </div>
            </div>
          </div>

          {/* Quick LIME Explanation Snippet */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <div className="font-bold text-white mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Alasan Skor LIME:
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">{lime.summary_text}</p>
          </div>

          {/* Officer Input & Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-blue-400" />
              Catatan Justifikasi Analis Kredit (Wajib Diisi untuk Audit Trail OJK):
            </label>
            <textarea
              rows={3}
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="Contoh: DPD 8 hari telah terverifikasi sebagai kegagalan sistem transfer payroll. Jaminan sertifikat tanah bernilai 1.8x plafon mencukupi..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 3 Large Action Buttons (Assignment Core) */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Eksekusi Keputusan Petugas:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* ACCEPT Button */}
              <button
                onClick={() => handleExecuteDecision('ACCEPT')}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4" /> ACCEPT (Setujui)
              </button>

              {/* MANUAL REVIEW Button */}
              <button
                onClick={() => handleExecuteDecision('MANUAL_REVIEW')}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-extrabold text-xs shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition"
              >
                <AlertTriangle className="w-4 h-4" /> MANUAL REVIEW
              </button>

              {/* REJECT Button */}
              <button
                onClick={() => handleExecuteDecision('REJECT')}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition"
              >
                <XCircle className="w-4 h-4" /> REJECT (Tolak)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* What-If Credit Scoring Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              Simulator Kredit Interaktif (What-If Analysis)
            </h2>
            <p className="text-xs text-slate-400">
              Uji coba profil calon debitur baru secara real-time untuk melihat kalkulasi probabilitas default (PD) dan rekomendasi keputusan AI
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-indigo-950 text-indigo-400 border border-indigo-800 rounded-full font-semibold">
            Real-time Inference
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Sliders 1 & 2 */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Income Bulanan</span>
                <span className="font-bold text-white">{formatRupiah(simIncome)}</span>
              </div>
              <input
                type="range"
                min="1000000"
                max="25000000"
                step="500000"
                value={simIncome}
                onChange={(e) => setSimIncome(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">DSR (Beban Cicilan)</span>
                <span className="font-bold text-white">{simDsr.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.01"
                value={simDsr}
                onChange={(e) => setSimDsr(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Sliders 3 & 4 */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Hari Tunggakan (DPD)</span>
                <span className="font-bold text-white">{simDpd} Hari</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={simDpd}
                onChange={(e) => setSimDpd(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Tenor Pinjaman</span>
                <span className="font-bold text-white">{simDurasi} Bulan</span>
              </div>
              <input
                type="range"
                min="12"
                max="60"
                step="6"
                value={simDurasi}
                onChange={(e) => setSimDurasi(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Categoricals */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Status Pekerjaan</label>
              <select
                value={simPekerjaan}
                onChange={(e) => setSimPekerjaan(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="PNS">PNS (Privileged)</option>
                <option value="Wiraswasta">Wiraswasta</option>
                <option value="Buruh">Buruh</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Lokasi (Kode Pos)</label>
              <select
                value={simKodePos}
                onChange={(e) => setSimKodePos(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Jakarta">Jakarta</option>
                <option value="Bandung">Bandung</option>
                <option value="Surabaya">Surabaya</option>
                <option value="Medan">Medan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Simulator Output Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between text-center">
            <div>
              <div className="text-xs text-slate-400 font-semibold">Prediksi Skor PD</div>
              <div className="text-2xl font-black text-white mt-1">
                {(simResult.probaDefault * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400">Risk Score: {simResult.riskScore}</div>
            </div>

            <div
              className={`py-1.5 px-2 rounded-lg text-xs font-bold border mt-2 ${
                simAiRec === 'ACCEPT'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : simAiRec === 'REJECT'
                  ? 'bg-rose-950 text-rose-400 border-rose-800'
                  : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}
            >
              {simAiRec}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail Log History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              Riwayat Jejak Audit Keputusan Resmi (Audit Trail Log)
            </h2>
            <p className="text-xs text-slate-400">
              Dokumentasi akuntabilitas keputusan kredit sesuai regulasi Bank Indonesia & OJK
            </p>
          </div>
          <span className="text-xs text-slate-400">{auditLogs.length} Catatan Tersimpan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-slate-300 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3 rounded-l">Waktu</th>
                <th className="py-2.5 px-3">Debitur</th>
                <th className="py-2.5 px-3 text-right">Skor PD</th>
                <th className="py-2.5 px-3 text-center">Rekomendasi AI</th>
                <th className="py-2.5 px-3 text-center">Keputusan Akhir</th>
                <th className="py-2.5 px-3">Petugas</th>
                <th className="py-2.5 px-3 rounded-r">Justifikasi / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white">{log.debtor_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.debtor_id}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                    {(log.score_pd * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {log.ai_recommendation}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.final_decision === 'ACCEPT'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : log.final_decision === 'REJECT'
                          ? 'bg-rose-950 text-rose-400 border-rose-800'
                          : 'bg-amber-950 text-amber-400 border-amber-800'
                      }`}
                    >
                      {log.final_decision}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-medium whitespace-nowrap">
                    {log.officer_id}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate" title={log.justification}>
                    {log.justification}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
