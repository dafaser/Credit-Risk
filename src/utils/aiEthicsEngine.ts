// ==============================================================================
// AI ETHICS & CREDIT MODEL ENGINE (BANK BRI RESPONSIBLE AI - BFLP HARI 7)
// ==============================================================================

import {
  DebtorRecord,
  FairnessMetricItem,
  ProxyScenarioData,
  ShapFeatureContribution,
  LimeExplanation,
  ModelPerformanceMetrics,
  OJKCompliancePillar,
  AuditLogEntry
} from '../types';

// Format currency IDR
export const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
};

// Format percent
export const formatPercent = (val: number, decimals: number = 2): string => {
  return `${(val * 100).toFixed(decimals)}%`;
};

// Format numeric score
export const formatNumber = (val: number, decimals: number = 4): string => {
  return val.toFixed(decimals);
};

// Calculate PD score approximating XGBoost model from notebook
export const calculateDebtorPD = (
  dpd: number,
  usia: number,
  income: number,
  durasi: number,
  dsr: number,
  ltv: number
): { riskScore: number; probaDefault: number } => {
  const youngPenalty = usia < 30 ? 5 : 0;
  const riskScore = (dsr * 4) + (ltv * 3) + (dpd * 1.5) + youngPenalty;
  
  // XGBoost log-odds approximation
  const z = (
    (dpd - 8.0) * 0.26 +
    (35.0 - usia) * 0.025 +
    (7500000 - income) / 10000000 * 0.18 +
    (durasi - 35) * 0.015 +
    (dsr - 0.20) * 1.8 +
    (ltv - 0.22) * 1.5 -
    1.85
  );
  const proba = Math.max(0.015, Math.min(0.985, 1.0 / (1.0 + Math.exp(-z))));

  return {
    riskScore: parseFloat(riskScore.toFixed(2)),
    probaDefault: parseFloat(proba.toFixed(4))
  };
};

// Calculate LIME local explanation for a specific debtor
export const computeLimeExplanation = (debtor: DebtorRecord): LimeExplanation => {
  const dpdWeight = parseFloat(((debtor.dpd - 8.0) * 0.042).toFixed(4));
  const incomeWeight = parseFloat((((7500000 - debtor.income) / 10000000) * 0.035).toFixed(4));
  const ageWeight = parseFloat(((35 - debtor.usia) * 0.003).toFixed(4));
  const durasiWeight = parseFloat(((debtor.durasi_pinjaman - 35) * 0.002).toFixed(4));
  const dsrWeight = parseFloat(((debtor.dsr - 0.20) * 0.15).toFixed(4));

  const features = [
    {
      feature: 'dpd',
      condition: `dpd = ${debtor.dpd} hari (${debtor.dpd > 8 ? '> rata-rata 8 hari' : '≤ rata-rata 8 hari'})`,
      actual_value: `${debtor.dpd} hari`,
      weight: dpdWeight,
      effect: (dpdWeight >= 0 ? 'increases_default' : 'decreases_default') as 'increases_default' | 'decreases_default'
    },
    {
      feature: 'income',
      condition: `income = ${formatRupiah(debtor.income)} (${debtor.income < 7500000 ? '< rata-rata Rp 7.5jt' : '≥ rata-rata Rp 7.5jt'})`,
      actual_value: formatRupiah(debtor.income),
      weight: incomeWeight,
      effect: (incomeWeight >= 0 ? 'increases_default' : 'decreases_default') as 'increases_default' | 'decreases_default'
    },
    {
      feature: 'usia',
      condition: `usia = ${debtor.usia} tahun (${debtor.usia < 30 ? 'kategori muda <30 thn' : 'kategori dewasa ≥30 thn'})`,
      actual_value: `${debtor.usia} thn`,
      weight: ageWeight,
      effect: (ageWeight >= 0 ? 'increases_default' : 'decreases_default') as 'increases_default' | 'decreases_default'
    },
    {
      feature: 'durasi_pinjaman',
      condition: `durasi = ${debtor.durasi_pinjaman} bulan (${debtor.durasi_pinjaman > 36 ? 'tenor panjang >36 bln' : 'tenor moderat/pendek'})`,
      actual_value: `${debtor.durasi_pinjaman} bln`,
      weight: durasiWeight,
      effect: (durasiWeight >= 0 ? 'increases_default' : 'decreases_default') as 'increases_default' | 'decreases_default'
    },
    {
      feature: 'dsr',
      condition: `dsr = ${debtor.dsr} (${debtor.dsr > 0.35 ? 'DSR tinggi >35%' : 'DSR terkelola ≤35%'})`,
      actual_value: `${debtor.dsr}`,
      weight: dsrWeight,
      effect: (dsrWeight >= 0 ? 'increases_default' : 'decreases_default') as 'increases_default' | 'decreases_default'
    }
  ];

  // Sort by absolute impact
  features.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

  const topFactor = features[0];
  const summaryText = `Probabilitas default nasabah ini (${formatPercent(debtor.proba_default)}) paling kuat dipengaruhi oleh kondisi ${topFactor.condition} dengan kontribusi bobot lokal ${topFactor.weight > 0 ? '+' : ''}${topFactor.weight}.`;

  return {
    debtor_id: debtor.id_nasabah,
    nama_nasabah: debtor.nama_nasabah,
    actual_default: debtor.default,
    proba_default: debtor.proba_default,
    intercept: 0.1637,
    features,
    summary_text: summaryText
  };
};

// Precomputed Fairness Table from Notebook (Langkah 2)
export const FAIRNESS_STATUS_PEKERJAAN: FairnessMetricItem[] = [
  {
    grup: 'PNS vs Buruh',
    privileged: 'PNS (35%)',
    unprivileged: 'Buruh (25%)',
    protected_attr: 'status_pekerjaan',
    di_hist: 1.0170,
    di_pred: 1.0026,
    di_reweighed: 1.0010,
    md_hist: 0.0142,
    md_pred: 0.0025,
    spd: -0.0025,
    eod: 0.0062,
    aod: 0.0038,
    theil: 0.0892,
    status: 'COMPLIANT',
    keterangan: 'Lolos uji 4/5th Rule (DI > 0.8). Tidak ditemukan bias sistemik terhadap kelompok buruh.'
  },
  {
    grup: 'PNS vs Lainnya',
    privileged: 'PNS (35%)',
    unprivileged: 'Lainnya (10%)',
    protected_attr: 'status_pekerjaan',
    di_hist: 1.0117,
    di_pred: 1.0014,
    di_reweighed: 1.0008,
    md_hist: 0.0097,
    md_pred: 0.0013,
    spd: -0.0013,
    eod: 0.0034,
    aod: 0.0021,
    theil: 0.0895,
    status: 'COMPLIANT',
    keterangan: 'Lolos uji 4/5th Rule (DI > 0.8). Perlakuan model terhadap kelompok Lainnya setara dengan PNS.'
  },
  {
    grup: 'PNS vs Wiraswasta',
    privileged: 'PNS (35%)',
    unprivileged: 'Wiraswasta (30%)',
    protected_attr: 'status_pekerjaan',
    di_hist: 1.0033,
    di_pred: 1.0041,
    di_reweighed: 1.0020,
    md_hist: 0.0028,
    md_pred: 0.0041,
    spd: -0.0041,
    eod: 0.0051,
    aod: 0.0042,
    theil: 0.0891,
    status: 'COMPLIANT',
    keterangan: 'Lolos uji 4/5th Rule (DI > 0.8). Sektor wiraswasta tidak mengalami disparitas approval.'
  }
];

// Precomputed Proxy Discrimination Scenario Data (Langkah 2 Tantangan & Langkah 4)
export const PROXY_SCENARIO_DATA: ProxyScenarioData = {
  di_sebelum: 1.019,
  di_sesudah: 0.717, // Anjlok drastis < 0.80
  di_reweighed: 0.852, // Pulih di atas 0.80 setelah AIF360 Reweighing
  top_features_bias: [
    { feature: 'kode_pos_Lainnya', importance: 0.342, isBiasProxy: true },
    { feature: 'dpd', importance: 0.215, isBiasProxy: false },
    { feature: 'income', importance: 0.145, isBiasProxy: false },
    { feature: 'durasi_pinjaman', importance: 0.098, isBiasProxy: false },
    { feature: 'usia', importance: 0.076, isBiasProxy: false },
    { feature: 'dsr', importance: 0.054, isBiasProxy: false },
    { feature: 'ltv', importance: 0.041, isBiasProxy: false },
    { feature: 'kode_pos_Jakarta', importance: 0.029, isBiasProxy: true }
  ],
  threshold_jakarta: 0.50,
  threshold_lainnya_raw: 0.50,
  threshold_lainnya_adj: 0.42,
  acceptance_rate_jakarta: 0.848,
  acceptance_rate_lainnya_raw: 0.785,
  acceptance_rate_lainnya_adj: 0.848
};

// SHAP Global Feature Impact (Langkah 3)
export const SHAP_GLOBAL_SUMMARY: ShapFeatureContribution[] = [
  {
    feature: 'dpd',
    label: 'Hari Tunggakan (DPD)',
    mean_abs_shap: 0.245,
    direction: 'positive',
    impact_description: 'Pendorong risiko terbesar. Semakin lama hari tunggakan, probabilitas default naik signifikan.'
  },
  {
    feature: 'usia',
    label: 'Usia Debitur',
    mean_abs_shap: 0.118,
    direction: 'positive',
    impact_description: 'Debitur usia muda (< 30 tahun) memiliki kecenderungan risiko default lebih tinggi.'
  },
  {
    feature: 'income',
    label: 'Pendapatan Bulanan',
    mean_abs_shap: 0.104,
    direction: 'negative',
    impact_description: 'Pendapatan lebih tinggi menahan dan menurunkan probabilitas gagal bayar secara konsisten.'
  },
  {
    feature: 'durasi_pinjaman',
    label: 'Tenor Pinjaman (Bulan)',
    mean_abs_shap: 0.089,
    direction: 'positive',
    impact_description: 'Tenor kredit yang panjang meningkatkan eksposur risiko default kumulatif.'
  },
  {
    feature: 'dsr',
    label: 'Debt Service Ratio (DSR)',
    mean_abs_shap: 0.076,
    direction: 'positive',
    impact_description: 'Beban cicilan terhadap pendapatan bulanan yang tinggi memperbesar kemungkinan gagal bayar.'
  },
  {
    feature: 'ltv',
    label: 'Loan to Value (LTV)',
    mean_abs_shap: 0.068,
    direction: 'positive',
    impact_description: 'Rasio plafon pinjaman terhadap agunan yang tinggi meningkatkan risiko kredit macet.'
  },
  {
    feature: 'kode_pos_Bandung',
    label: 'Lokasi: Bandung',
    mean_abs_shap: 0.031,
    direction: 'neutral',
    impact_description: 'Kontribusi marjinal pada model bersih tanpa bias injeksi.'
  },
  {
    feature: 'kode_pos_Jakarta',
    label: 'Lokasi: Jakarta',
    mean_abs_shap: 0.027,
    direction: 'neutral',
    impact_description: 'Kontribusi marjinal pada model bersih tanpa bias injeksi.'
  },
  {
    feature: 'status_pekerjaan_PNS',
    label: 'Pekerjaan: PNS',
    mean_abs_shap: 0.022,
    direction: 'neutral',
    impact_description: 'Dampak bersih sangat kecil, menjamin tidak adanya diskriminasi langsung.'
  },
  {
    feature: 'status_pekerjaan_Buruh',
    label: 'Pekerjaan: Buruh',
    mean_abs_shap: 0.019,
    direction: 'neutral',
    impact_description: 'Dampak bersih sangat kecil, konsisten dengan hasil audit Disparate Impact > 1.00.'
  }
];

// Model Performance Metrics (Langkah 0.1 & Quick Review Hari 6)
export const MODEL_PERFORMANCE_DATA: ModelPerformanceMetrics = {
  rf_auc: 0.515,
  xgb_auc: 0.518,
  rf_ap: 0.178,
  xgb_ap: 0.184,
  accuracy: 0.836,
  precision: 0.462,
  recall: 0.285,
  f1_score: 0.352,
  confusion_matrix: {
    tn: 7905,
    fp: 458,
    fn: 1184,
    tp: 453
  },
  vif_data: [
    { feature: 'income', vif: 1.002, status: 'Sangat Aman (< 2.5)' },
    { feature: 'dsr', vif: 1.001, status: 'Sangat Aman (< 2.5)' },
    { feature: 'ltv', vif: 1.002, status: 'Sangat Aman (< 2.5)' },
    { feature: 'dpd', vif: 1.001, status: 'Sangat Aman (< 2.5)' },
    { feature: 'durasi_pinjaman', vif: 1.001, status: 'Sangat Aman (< 2.5)' },
    { feature: 'usia', vif: 1.001, status: 'Sangat Aman (< 2.5)' }
  ],
  correlation_matrix: {
    features: ['income', 'dsr', 'ltv', 'dpd', 'durasi', 'usia', 'default'],
    matrix: [
      [ 1.00,  0.01, -0.01, -0.02,  0.01,  0.02, -0.05],
      [ 0.01,  1.00,  0.02,  0.01, -0.01, -0.01,  0.06],
      [-0.01,  0.02,  1.00,  0.01,  0.01, -0.02,  0.04],
      [-0.02,  0.01,  0.01,  1.00,  0.02, -0.01,  0.18],
      [ 0.01, -0.01,  0.01,  0.02,  1.00,  0.01,  0.05],
      [ 0.02, -0.01, -0.02, -0.01,  0.01,  1.00, -0.08],
      [-0.05,  0.06,  0.04,  0.18,  0.05, -0.08,  1.00]
    ]
  },
  roc_curve: [
    { fpr: 0.00, tpr_rf: 0.00, tpr_xgb: 0.00 },
    { fpr: 0.10, tpr_rf: 0.14, tpr_xgb: 0.16 },
    { fpr: 0.25, tpr_rf: 0.31, tpr_xgb: 0.35 },
    { fpr: 0.40, tpr_rf: 0.48, tpr_xgb: 0.52 },
    { fpr: 0.60, tpr_rf: 0.67, tpr_xgb: 0.71 },
    { fpr: 0.80, tpr_rf: 0.86, tpr_xgb: 0.89 },
    { fpr: 1.00, tpr_rf: 1.00, tpr_xgb: 1.00 }
  ],
  calibration_curve: [
    { bin: 1, mean_pred: 0.05, actual_pos_rf: 0.06, actual_pos_xgb: 0.05 },
    { bin: 2, mean_pred: 0.12, actual_pos_rf: 0.13, actual_pos_xgb: 0.12 },
    { bin: 3, mean_pred: 0.18, actual_pos_rf: 0.19, actual_pos_xgb: 0.18 },
    { bin: 4, mean_pred: 0.25, actual_pos_rf: 0.23, actual_pos_xgb: 0.24 },
    { bin: 5, mean_pred: 0.35, actual_pos_rf: 0.33, actual_pos_xgb: 0.34 },
    { bin: 6, mean_pred: 0.48, actual_pos_rf: 0.45, actual_pos_xgb: 0.47 },
    { bin: 7, mean_pred: 0.62, actual_pos_rf: 0.59, actual_pos_xgb: 0.61 },
    { bin: 8, mean_pred: 0.78, actual_pos_rf: 0.74, actual_pos_xgb: 0.77 }
  ]
};

// OJK AI Governance 5 Pillars Checklist
export const OJK_COMPLIANCE_PILLARS: OJKCompliancePillar[] = [
  {
    id: 'pilar-1',
    pilar: 'Fairness',
    regulasi: 'OJK Tata Kelola AI Perbankan 2025 & POJK No. 11/2022',
    title: 'Keadilan Algoritma & Audit Non-Diskriminasi',
    description: 'Model kredit tidak boleh mendiskriminasi nasabah berdasarkan kelompok terproteksi (SARA, jenis pekerjaan, dll) dan lolos uji Disparate Impact (DI ≥ 0.80).',
    status: 'PASSED',
    evidence: 'Disparate Impact status pekerjaan PNS vs Buruh = 1.0026 (PASS), PNS vs Lainnya = 1.0014 (PASS). Simulasi proxy discrimination kode_pos termitigasi dengan Reweighing (DI naik ke 0.852).',
    recommendation: 'Jalankan pipeline audit fairness otomatis setiap retraining model kuartalan untuk mencegah bias drift.'
  },
  {
    id: 'pilar-2',
    pilar: 'Explainability',
    regulasi: 'POJK No. 11/2022 Bab IV Hak Nasabah atas Transparansi',
    title: 'Keterjelasan Model Global & Lokal (SHAP & LIME)',
    description: 'Bank wajib mampu memberikan penjelasan yang dapat dipahami mengenai alasan persetujuan atau penolakan kredit calon debitur.',
    status: 'PASSED',
    evidence: 'Fitur SHAP Global Summary menampilkan kontribusi 10 fitur utama. Fitur LIME Local Explanation menyediakan tombol "Explain Nasabah Ini" untuk setiap keputusan perorangan.',
    recommendation: 'Sediakan PDF ringkasan alasan penolakan berbasis LIME jika debitur mengajukan hak sanggah penolakan kredit.'
  },
  {
    id: 'pilar-3',
    pilar: 'Accountability',
    regulasi: 'OJK AI Governance April 2025 & Pedoman Manajemen Risiko Bank BRI',
    title: 'Tanggung Jawab Manusia (Human-in-the-Loop Safeguard)',
    description: 'Keputusan kredit tidak boleh 100% diputuskan oleh black-box AI. Kasus borderline atau berisiko tinggi wajib melalui meja review analis manusia.',
    status: 'PASSED',
    evidence: 'Tersedia 3 tombol keputusan resmi (Accept, Manual Review, Reject). Debitur pada rentang PD 0.35 - 0.65 otomatis dialihkan ke antrean verifikasi manual petugas.',
    recommendation: 'Terapkan otorisasi ganda (Maker-Checker) untuk penolakan kredit bernilai plafon di atas Rp 200.000.000.'
  },
  {
    id: 'pilar-4',
    pilar: 'Transparency',
    regulasi: 'POJK No. 11/2022 Pasal 29 Sistem Jejak Audit',
    title: 'Audit Trail Komprehensif & Versioning Model',
    description: 'Setiap penilaian skor kredit, tanggal pengajuan, versi algoritma, input data, dan justifikasi petugas wajib tercatat dalam log yang tidak dapat diubah.',
    status: 'PASSED',
    evidence: 'Sistem Audit Trail Log mencatat timestamp real-time, ID petugas, skor probabilitas default, serta catatan justifikasi peninjauan kredit.',
    recommendation: 'Arsipkan seluruh log keputusan kredit minimal 5 tahun sesuai regulasi retensi dokumen perbankan.'
  },
  {
    id: 'pilar-5',
    pilar: 'Privacy & Security',
    regulasi: 'BI No. 22/23/PBI/2020 & UU No. 27/2022 Pelindungan Data Pribadi',
    title: 'Pelindungan Data Pribadi & Keamanan Siber',
    description: 'Data pribadi nasabah wajib dienkripsi dan hanya digunakan sesuai persetujuan klausul pemrosesan data kredit.',
    status: 'PASSED',
    evidence: 'Masking CIF nasabah, pemisahan data kredensial, dan kepatuhan transfer data internal Bank BRI.',
    recommendation: 'Lakukan security penetration testing pada API scoring credit setidaknya dua kali setahun.'
  }
];

// Initial Audit Trail Logs
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-20260907-001',
    timestamp: '2026-09-07 09:14:22',
    debtor_id: 'CIF-010003',
    debtor_name: 'Agus Permana',
    score_pd: 0.1245,
    ai_recommendation: 'ACCEPT',
    final_decision: 'ACCEPT',
    officer_id: 'OFFICER-BFLP-7701',
    justification: 'Debitur PNS dengan DPD 4 hari dan DSR 0.20 sangat aman. Skor PD 12.45% di bawah batas risiko.',
    threshold_used: { accept: 0.35, reject: 0.65 }
  },
  {
    id: 'LOG-20260907-002',
    timestamp: '2026-09-07 10:28:45',
    debtor_id: 'CIF-010001',
    debtor_name: 'Budi Pratama',
    score_pd: 0.6672,
    ai_recommendation: 'REJECT',
    final_decision: 'MANUAL_REVIEW',
    officer_id: 'OFFICER-BFLP-7701',
    justification: 'AI merekomendasikan Reject karena DPD 9 hari dan DSR 0.50. Dilakukan manual review verifikasi jaminan tambahan toko wiraswasta.',
    threshold_used: { accept: 0.35, reject: 0.65 }
  },
  {
    id: 'LOG-20260907-003',
    timestamp: '2026-09-07 11:05:18',
    debtor_id: 'CIF-010018',
    debtor_name: 'Rudi Susanto',
    score_pd: 0.4820,
    ai_recommendation: 'MANUAL_REVIEW',
    final_decision: 'ACCEPT',
    officer_id: 'OFFICER-BFLP-8812',
    justification: 'Borderline PD 48.20%. DPD 6 hari karena kendala payroll kantor, namun rekening koran menunjukkan saldo mengendap memadai.',
    threshold_used: { accept: 0.35, reject: 0.65 }
  }
];
