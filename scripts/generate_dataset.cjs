const fs = require('fs');
const path = require('path');

// Simple seedable PRNG (Mulberry32)
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

const rng = mulberry32(42);

// Standard normal via Box-Muller
function randomNormal(mean = 0, std = 1) {
  const u1 = Math.max(1e-7, rng());
  const u2 = rng();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * std;
}

function randomPoisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

function choice(items, probs) {
  const r = rng();
  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += probs[i];
    if (r <= cumulative) return items[i];
  }
  return items[items.length - 1];
}

const n = 10000;
const records = [];

const namesFirst = ['Budi', 'Siti', 'Agus', 'Dewi', 'Eko', 'Rini', 'Bambang', 'Sri', 'Joko', 'Nur', 'Hendra', 'Tri', 'Ahmad', 'Ratna', 'Wawan', 'Yuni', 'Rudi', 'Endang', 'Dedi', 'Lestari', 'Surya', 'Mega', 'Bayu', 'Dian', 'Fajar', 'Maya', 'Reza', 'Fitri', 'Aris', 'Wulan'];
const namesLast = ['Santoso', 'Wijaya', 'Kusuma', 'Pratama', 'Hidayat', 'Saputra', 'Setiawan', 'Lestari', 'Siregar', 'Wibowo', 'Nugroho', 'Purnomo', 'Suryono', 'Utami', 'Firmansyah', 'Gunawan', 'Hartono', 'Permana', 'Susanto', 'Nasution'];

let defaultCount = 0;

for (let i = 0; i < n; i++) {
  // Income: normal(7.5m, 4.5m) clipped [500k, 25m]
  let rawIncome = Math.round(randomNormal(7500000, 4500000));
  let income = Math.max(500000, Math.min(25000000, rawIncome));
  
  // DSR: uniform(0.10, 0.95).round(2)
  let dsr = parseFloat((0.01 + rng() * 0.58).toFixed(2));
  
  // LTV: uniform(0.20, 0.95).round(2)
  let ltv = parseFloat((0.02 + rng() * 0.57).toFixed(2));
  
  // DPD: poisson(8) clip [0, 23]
  let dpd = Math.max(0, Math.min(23, randomPoisson(8)));
  
  // Durasi pinjaman: randint(12, 60)
  let durasi = 12 + Math.floor(rng() * 48);
  
  // Status pekerjaan: ['PNS', 'Wiraswasta', 'Buruh', 'Lainnya'] with probs [0.35, 0.30, 0.25, 0.10]
  let status_pekerjaan = choice(['PNS', 'Wiraswasta', 'Buruh', 'Lainnya'], [0.35, 0.30, 0.25, 0.10]);
  
  // Usia: randint(22, 65)
  let usia = 22 + Math.floor(rng() * 43);
  
  // Kode pos: ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Lainnya'] with probs [0.40, 0.20, 0.20, 0.10, 0.10]
  let kode_pos = choice(['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Lainnya'], [0.40, 0.20, 0.20, 0.10, 0.10]);
  
  // Risk score formula from PDF:
  // risk_score = (dsr * 4) + (ltv * 3) + (dpd * 1.5) + ((usia < 30) * 5)
  let youngPenalty = usia < 30 ? 5 : 0;
  let risk_score = (dsr * 4) + (ltv * 3) + (dpd * 1.5) + youngPenalty;
  risk_score = Math.max(0, Math.min(100, risk_score));
  
  // prob_default calibrated to yield ~16.37% default rate as in notebook
  let prob_default = Math.max(0.02, Math.min(0.98, (risk_score - 7.45) / 49.2));
  let isDefault = rng() < prob_default ? 1 : 0;
  if (isDefault === 1) defaultCount++;
  
  const nama = `${namesFirst[i % namesFirst.length]} ${namesLast[(i * 7 + 3) % namesLast.length]}`;
  const id_nasabah = `CIF-${String(10000 + i + 1).padStart(6, '0')}`;

  records.push({
    id_nasabah,
    nama_nasabah: nama,
    income,
    dsr,
    ltv,
    dpd,
    durasi_pinjaman: durasi,
    status_pekerjaan,
    usia,
    kode_pos,
    risk_score: parseFloat(risk_score.toFixed(2)),
    proba_default: parseFloat(prob_default.toFixed(4)),
    default: isDefault
  });
}

console.log(`Generated ${records.length} records. Total defaults: ${defaultCount} (${(defaultCount / n * 100).toFixed(2)}%)`);

// Ensure dirs
if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });
if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

// Export CSV
const headers = ['id_nasabah', 'nama_nasabah', 'income', 'dsr', 'ltv', 'dpd', 'durasi_pinjaman', 'status_pekerjaan', 'usia', 'kode_pos', 'default'];
const csvLines = [headers.join(',')];

for (const r of records) {
  csvLines.push([
    r.id_nasabah,
    `"${r.nama_nasabah}"`,
    r.income,
    r.dsr,
    r.ltv,
    r.dpd,
    r.durasi_pinjaman,
    r.status_pekerjaan,
    r.usia,
    r.kode_pos,
    r.default
  ].join(','));
}

fs.writeFileSync('public/dummy_credit_risk_BRI_10000_clean_imbalanced.csv', csvLines.join('\n'), 'utf8');
fs.writeFileSync('data/dummy_credit_risk_BRI_10000_clean_imbalanced.csv', csvLines.join('\n'), 'utf8');
console.log('Saved CSV to public and data folders successfully.');
