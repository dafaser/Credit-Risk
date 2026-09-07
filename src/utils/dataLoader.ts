// ==============================================================================
// DATA LOADER & PARSER: 10,000 DEBTORS REPOSITORY
// ==============================================================================

import Papa from 'papaparse';
import { DebtorRecord } from '../types';
import { SAMPLE_DEBTORS } from '../data/sampleDebtors';
import { calculateDebtorPD } from './aiEthicsEngine';

export const loadInitialDebtors = async (): Promise<DebtorRecord[]> => {
  try {
    // Try fetching the 10k CSV from public folder
    const response = await fetch('/dummy_credit_risk_BRI_10000_clean_imbalanced.csv');
    if (!response.ok) {
      console.warn('Could not fetch CSV, falling back to sample debtors');
      return SAMPLE_DEBTORS;
    }
    const csvText = await response.text();
    return parseCsvToDebtors(csvText);
  } catch (err) {
    console.warn('Error loading CSV, falling back to sample debtors:', err);
    return SAMPLE_DEBTORS;
  }
};

export const parseCsvToDebtors = (csvString: string): DebtorRecord[] => {
  const result = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true
  });

  const records: DebtorRecord[] = [];

  for (let i = 0; i < result.data.length; i++) {
    const row: any = result.data[i];
    if (!row) continue;

    const id_nasabah = row.id_nasabah || `CIF-${String(10001 + i).padStart(6, '0')}`;
    const nama_nasabah = row.nama_nasabah || `Debitur BRI #${i + 1}`;
    const income = Number(row.income) || 7500000;
    const dsr = Number(row.dsr) || 0.20;
    const ltv = Number(row.ltv) || 0.22;
    const dpd = Number(row.dpd) || 0;
    const durasi_pinjaman = Number(row.durasi_pinjaman) || 36;
    const status_pekerjaan = row.status_pekerjaan || 'PNS';
    const usia = Number(row.usia) || 35;
    const kode_pos = row.kode_pos || 'Jakarta';
    const isDefault = Number(row.default) === 1 ? 1 : 0;

    const { riskScore, probaDefault } = calculateDebtorPD(dpd, usia, income, durasi_pinjaman, dsr, ltv);
    const pred_default = probaDefault >= 0.50 ? 1 : 0;

    let rec: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT' = 'ACCEPT';
    if (probaDefault > 0.65) rec = 'REJECT';
    else if (probaDefault >= 0.35) rec = 'MANUAL_REVIEW';

    records.push({
      id_nasabah,
      nama_nasabah,
      income,
      dsr,
      ltv,
      dpd,
      durasi_pinjaman,
      status_pekerjaan,
      usia,
      kode_pos,
      default: isDefault,
      risk_score: riskScore,
      proba_default: probaDefault,
      pred_default,
      decision_recommendation: rec,
      human_decision: 'PENDING'
    });
  }

  return records.length > 0 ? records : SAMPLE_DEBTORS;
};
