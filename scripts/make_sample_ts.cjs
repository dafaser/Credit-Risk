const fs = require('fs');

const csv = fs.readFileSync('public/dummy_credit_risk_BRI_10000_clean_imbalanced.csv', 'utf8');
const lines = csv.trim().split('\n');
const headers = lines[0].split(',');

// Take first 1000 records for immediate instant memory load
const records = [];
for (let i = 1; i < Math.min(1001, lines.length); i++) {
  const line = lines[i];
  if (!line) continue;
  // parse csv line safely
  const match = line.match(/^(CIF-\d+),"([^"]+)",(\d+),([\d.]+),([\d.]+),(\d+),(\d+),([^,]+),(\d+),([^,]+),(\d+)$/);
  if (!match) continue;
  
  const id_nasabah = match[1];
  const nama_nasabah = match[2];
  const income = parseInt(match[3]);
  const dsr = parseFloat(match[4]);
  const ltv = parseFloat(match[5]);
  const dpd = parseInt(match[6]);
  const durasi_pinjaman = parseInt(match[7]);
  const status_pekerjaan = match[8];
  const usia = parseInt(match[9]);
  const kode_pos = match[10];
  const isDefault = parseInt(match[11]);
  
  // calculate risk score and proba default
  const youngPenalty = usia < 30 ? 5 : 0;
  const risk_score = parseFloat(((dsr * 4) + (ltv * 3) + (dpd * 1.5) + youngPenalty).toFixed(2));
  
  const z = (
    (dpd - 8.0) * 0.26 +
    (35.0 - usia) * 0.025 +
    (7500000 - income) / 10000000 * 0.18 +
    (durasi_pinjaman - 35) * 0.015 +
    (dsr - 0.20) * 1.8 +
    (ltv - 0.22) * 1.5 -
    1.85
  );
  const proba_default = parseFloat(Math.max(0.015, Math.min(0.985, 1.0 / (1.0 + Math.exp(-z)))).toFixed(4));
  const pred_default = proba_default >= 0.50 ? 1 : 0;
  
  let rec = 'ACCEPT';
  if (proba_default > 0.65) rec = 'REJECT';
  else if (proba_default >= 0.35) rec = 'MANUAL_REVIEW';

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
    risk_score,
    proba_default,
    pred_default,
    decision_recommendation: rec,
    human_decision: 'PENDING'
  });
}

const outContent = `import { DebtorRecord } from '../types';

export const SAMPLE_DEBTORS: DebtorRecord[] = ${JSON.stringify(records, null, 2)};
`;

fs.writeFileSync('src/data/sampleDebtors.ts', outContent, 'utf8');
console.log(`Generated src/data/sampleDebtors.ts with ${records.length} records.`);
