// ==============================================================================
// TYPES DEFINITION: RESPONSIBLE AI, SHAP, LIME, BIAS ML & OJK GOVERNANCE
// ==============================================================================

export interface DebtorRecord {
  id_nasabah: string;
  nama_nasabah: string;
  income: number;
  dsr: number;
  ltv: number;
  dpd: number;
  durasi_pinjaman: number;
  status_pekerjaan: 'PNS' | 'Wiraswasta' | 'Buruh' | 'Lainnya' | string;
  usia: number;
  kode_pos: 'Jakarta' | 'Bandung' | 'Surabaya' | 'Medan' | 'Lainnya' | string;
  default: number; // 0 = Non-Default, 1 = Default
  risk_score: number;
  proba_default: number;
  pred_default: number;
  decision_recommendation: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT';
  human_decision?: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT' | 'PENDING';
  decision_officer?: string;
  decision_notes?: string;
  decision_timestamp?: string;
  [key: string]: any;
}

export interface FairnessMetricItem {
  grup: string;
  privileged: string;
  unprivileged: string;
  protected_attr: string;
  di_hist: number;
  di_pred: number;
  di_reweighed?: number;
  md_hist: number;
  md_pred: number;
  spd: number; // Statistical Parity Difference
  eod: number; // Equal Opportunity Difference
  aod: number; // Average Odds Difference
  theil: number; // Theil Index
  status: 'COMPLIANT' | 'WARNING' | 'BIASED';
  keterangan: string;
}

export interface ProxyScenarioData {
  di_sebelum: number;
  di_sesudah: number;
  di_reweighed: number;
  top_features_bias: { feature: string; importance: number; isBiasProxy?: boolean }[];
  threshold_jakarta: number;
  threshold_lainnya_raw: number;
  threshold_lainnya_adj: number;
  acceptance_rate_jakarta: number;
  acceptance_rate_lainnya_raw: number;
  acceptance_rate_lainnya_adj: number;
}

export interface ShapFeatureContribution {
  feature: string;
  label: string;
  mean_abs_shap: number;
  direction: 'positive' | 'negative' | 'neutral';
  impact_description: string;
}

export interface LimeFeatureContribution {
  feature: string;
  condition: string;
  actual_value: string | number;
  weight: number;
  effect: 'increases_default' | 'decreases_default';
}

export interface LimeExplanation {
  debtor_id: string;
  nama_nasabah: string;
  actual_default: number;
  proba_default: number;
  intercept: number;
  features: LimeFeatureContribution[];
  summary_text: string;
}

export interface ModelPerformanceMetrics {
  rf_auc: number;
  xgb_auc: number;
  rf_ap: number;
  xgb_ap: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
  vif_data: {
    feature: string;
    vif: number;
    status: string;
  }[];
  correlation_matrix: {
    features: string[];
    matrix: number[][];
  };
  roc_curve: {
    fpr: number;
    tpr_rf: number;
    tpr_xgb: number;
  }[];
  calibration_curve: {
    bin: number;
    mean_pred: number;
    actual_pos_rf: number;
    actual_pos_xgb: number;
  }[];
}

export interface OJKCompliancePillar {
  id: string;
  pilar: 'Fairness' | 'Explainability' | 'Accountability' | 'Transparency' | 'Privacy & Security';
  regulasi: string;
  title: string;
  description: string;
  status: 'PASSED' | 'IN_PROGRESS' | 'ACTION_REQUIRED';
  evidence: string;
  recommendation: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  debtor_id: string;
  debtor_name: string;
  score_pd: number;
  ai_recommendation: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT';
  final_decision: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT';
  officer_id: string;
  justification: string;
  threshold_used: {
    accept: number;
    reject: number;
  };
}

export interface CreditApplication {
  id: string;
  timestamp: string;
  cif: string;
  nama: string;
  income: number;
  usia: number;
  jumlah_pinjaman: number;
  durasi_pinjaman: number;
  bunga_tahunan: number;
  nilai_agunan: number;
  cicilan_lain: number;
  dpd: number;
  status_pekerjaan: string;
  kode_pos: string;
  // Computed values
  angsuran_bulanan: number;
  dsr: number;
  ltv: number;
  risk_score: number;
  proba_default: number;
  ml_recommendation: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT';
  // Analyst Decision
  analyst_decision: 'PENDING' | 'APPROVED' | 'REJECTED';
  analyst_officer: string;
  analyst_notes: string;
  decision_timestamp?: string;
}

export type ActivePage = 'dashboard' | 'pengajuan-kredit';
