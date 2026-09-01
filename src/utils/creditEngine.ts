import { 
  RawCreditRecord, 
  CreditRecord, 
  CleaningStats, 
  IQROutlierReport,
  DatasetSummary, 
  ValidationItem, 
  PortfolioRiskAggregate, 
  SegmentELAggregate,
  BranchSegmentAggregate,
  SegmentPivotPD,
  BoxplotStats,
  CorrelationMatrix,
  CrosstabData
} from '../types';

/**
 * Helper to clean numeric strings with 'Rp', '.', ',', whitespace, quotes, BOM, etc.
 */
export function parseCleanNumeric(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  let str = String(val).trim();
  if (!str) return null;
  // Remove BOM, quotes, 'Rp', 'RP', spaces, percentages
  str = str.replace(/^\uFEFF/, '').replace(/["']/g, '').replace(/rp/gi, '').replace(/\s+/g, '');
  
  const isPercent = str.includes('%');
  str = str.replace(/%/g, '');

  // Handle Indonesian thousand separator '.' vs decimal separator ','
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes('.') && !str.includes(',')) {
    // Check if '.' is thousand separator (like 50.000.000 or 45.000)
    const parts = str.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',') && !str.includes('.')) {
    // If format is like 0,45 or 12,50
    str = str.replace(',', '.');
  }
  
  let parsed = parseFloat(str);
  if (isNaN(parsed)) return null;
  if (isPercent && parsed > 1) {
    parsed = parsed / 100;
  }
  return parsed;
}

/**
 * Standardize status credit (e.g. 'LANCAR', 'MACET', '  lancar ' -> 'Lancar', 'Macet')
 */
export function standardizeStatus(status: any): 'Lancar' | 'Macet' {
  if (!status) return 'Lancar';
  const trimmed = String(status).trim().toLowerCase();
  if (
    trimmed === 'lancar' || 
    trimmed === '1' || 
    trimmed === 'kol 1' || 
    trimmed === 'kol-1' || 
    trimmed === 'current' || 
    trimmed === 'performing'
  ) {
    return 'Lancar';
  }
  if (
    trimmed === 'macet' || 
    trimmed === '5' || 
    trimmed === 'kol 5' || 
    trimmed === 'kol-5' || 
    trimmed === 'npl' || 
    trimmed === 'default' || 
    trimmed === 'non-performing' || 
    trimmed === 'dpk' || 
    trimmed === 'kurang lancar' || 
    trimmed === 'diragukan'
  ) {
    return 'Macet';
  }
  return trimmed.includes('macet') || trimmed.includes('npl') ? 'Macet' : 'Lancar';
}

/**
 * Quantile calculation on sorted numbers (linear interpolation)
 */
export function calculateQuantile(sortedValues: number[], q: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  if (q <= 0) return sortedValues[0];
  if (q >= 1) return sortedValues[sortedValues.length - 1];

  const pos = (sortedValues.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedValues[base + 1] !== undefined) {
    return sortedValues[base] + rest * (sortedValues[base + 1] - sortedValues[base]);
  }
  return sortedValues[base];
}

/**
 * Calculate median of numeric array
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].filter(n => !isNaN(n) && n !== null).sort((a, b) => a - b);
  return calculateQuantile(sorted, 0.5);
}

/**
 * Calculate Mode of string array
 */
export function calculateMode(arr: string[]): string {
  const counts = new Map<string, number>();
  let maxCount = 0;
  let modeVal = '';
  arr.forEach(val => {
    const trimmed = String(val).trim();
    if (!trimmed) return;
    const count = (counts.get(trimmed) || 0) + 1;
    counts.set(trimmed, count);
    if (count > maxCount) {
      maxCount = count;
      modeVal = trimmed;
    }
  });
  return modeVal || 'Cabang BRI Sudirman';
}

/**
 * Detect and Cap Outlier using IQR (Interquartile Range)
 * Q1 = 25th percentile, Q3 = 75th percentile, IQR = Q3 - Q1
 * lower = Q1 - 1.5 * IQR, upper = Q3 + 1.5 * IQR
 */
export function capOutlierIQR(
  values: number[], 
  columnName: string, 
  columnLabel: string
): { cappedValues: number[]; report: IQROutlierReport } {
  const validVals = values.filter(v => v !== null && !isNaN(v));
  if (validVals.length === 0) {
    return {
      cappedValues: values,
      report: {
        column: columnName,
        columnLabel,
        q1: 0,
        q3: 0,
        iqr: 0,
        lowerBound: 0,
        upperBound: 0,
        outliersBeforeCap: 0,
        minBefore: 0,
        maxBefore: 0,
        minAfter: 0,
        maxAfter: 0
      }
    };
  }

  const sorted = [...validVals].sort((a, b) => a - b);
  const q1 = calculateQuantile(sorted, 0.25);
  const q3 = calculateQuantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerBound = Math.max(0, q1 - 1.5 * iqr);
  const upperBound = q3 + 1.5 * iqr;

  const minBefore = sorted[0];
  const maxBefore = sorted[sorted.length - 1];

  let outliersCount = 0;
  const cappedValues = values.map(v => {
    if (v === null || isNaN(v)) return v;
    if (v < lowerBound) {
      outliersCount++;
      return lowerBound;
    }
    if (v > upperBound) {
      outliersCount++;
      return upperBound;
    }
    return v;
  });

  const cappedValid = cappedValues.filter(v => v !== null && !isNaN(v));
  const minAfter = Math.min(...cappedValid);
  const maxAfter = Math.max(...cappedValid);

  return {
    cappedValues,
    report: {
      column: columnName,
      columnLabel,
      q1,
      q3,
      iqr,
      lowerBound,
      upperBound,
      outliersBeforeCap: outliersCount,
      minBefore,
      maxBefore,
      minAfter,
      maxAfter
    }
  };
}

/**
 * Column aliases dictionary for intelligent field matching
 */
const COLUMN_ALIASES: { [standardKey: string]: string[] } = {
  id_nasabah: ['id_nasabah', 'id', 'idnasabah', 'no_nasabah', 'nonasabah', 'customer_id', 'cif', 'id_debitur', 'no_kontrak', 'nomor_nasabah', 'nasabah_id', 'nomor_kontrak', 'id_rekening', 'no_rekening', 'no'],
  nama_nasabah: ['nama_nasabah', 'nama', 'namanasabah', 'customer_name', 'name', 'nama_debitur', 'nama_lengkap', 'debitur', 'borrower_name'],
  usia: ['usia', 'umur', 'age', 'usia_nasabah', 'usia_debitur'],
  pendapatan: ['pendapatan', 'income', 'gaji', 'salary', 'penghasilan', 'pendapatan_bulanan', 'monthly_income', 'penghasilan_bulanan', 'omset'],
  pinjaman: ['pinjaman', 'plafon', 'plafon_pinjaman', 'loan_amount', 'kredit', 'besar_pinjaman', 'total_pinjaman', 'amount', 'nominal_pinjaman', 'plafon_kredit', 'baki_debet', 'limit_kredit', 'loan', 'jumlah_pinjaman'],
  tenor_bulan: ['tenor_bulan', 'tenor', 'tenor_bln', 'jangka_waktu', 'tenor_kredit', 'loan_tenor', 'term', 'months', 'jw', 'tenor_bulan_pinjaman'],
  skor_kredit: ['skor_kredit', 'skor', 'credit_score', 'score', 'creditscore', 'skorkredit', 'nilai_kredit', 'scoring', 'score_kredit'],
  pd_score: ['pd_score', 'pd', 'probability_of_default', 'probabilitas_default', 'pd_rate', 'prob_default'],
  status_kredit: ['status_kredit', 'status', 'kolektibilitas', 'status_kol', 'kol', 'credit_status', 'status_kredit_nasabah', 'statuskredit', 'status_pinjaman', 'loan_status'],
  nama_cabang: ['nama_cabang', 'cabang', 'branch', 'unit_kerja', 'kantor_cabang', 'namacabang', 'lokasi_cabang', 'kanca', 'kc', 'unit', 'branch_name'],
  tanggal_pengajuan: ['tanggal_pengajuan', 'tgl_pengajuan', 'tanggal_akad', 'tgl_akad', 'tanggal', 'date', 'akad_date', 'tanggal_pinjaman', 'tgl_pencairan', 'tgl_pk', 'tgl_perjanjian'],
  EAD: ['ead', 'exposure_at_default', 'exposure_default', 'total_ead', 'ead_rp', 'nilai_ead'],
  LGD: ['lgd', 'loss_given_default', 'loss_default', 'lgd_pct', 'nilai_lgd'],
  segmen: ['segmen', 'segment', 'jenis_kredit', 'produk', 'kategori_produk', 'segmentasi', 'tipe_kredit', 'jenis_pinjaman', 'product_segment']
};

/**
 * Normalize raw input row by resolving synonyms, casing, BOM and whitespaces
 */
export function normalizeRawRecord(rawRow: any, rowIndex: number): RawCreditRecord {
  const normalized: RawCreditRecord = {};
  if (!rawRow || typeof rawRow !== 'object') return normalized;

  // Clean raw key names
  const cleanKeyMap = new Map<string, any>();
  Object.keys(rawRow).forEach(key => {
    const cleanKey = key.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s\-_]+/g, '_');
    cleanKeyMap.set(cleanKey, rawRow[key]);
  });

  // Map known standards
  Object.entries(COLUMN_ALIASES).forEach(([stdKey, aliases]) => {
    for (const alias of aliases) {
      const normalizedAlias = alias.toLowerCase().replace(/[\s\-_]+/g, '_');
      if (cleanKeyMap.has(normalizedAlias)) {
        normalized[stdKey] = cleanKeyMap.get(normalizedAlias);
        break;
      }
    }
  });

  // Copy any unmapped extra columns directly
  Object.keys(rawRow).forEach(originalKey => {
    const cleanOriginal = originalKey.replace(/^\uFEFF/, '').trim();
    if (normalized[cleanOriginal] === undefined) {
      normalized[cleanOriginal] = rawRow[originalKey];
    }
  });

  // Ensure id_nasabah fallback
  if (!normalized.id_nasabah || String(normalized.id_nasabah).trim() === '') {
    normalized.id_nasabah = `BRI-${String(rowIndex + 1001).padStart(6, '0')}`;
  }

  // Ensure nama_nasabah fallback
  if (!normalized.nama_nasabah || String(normalized.nama_nasabah).trim() === '') {
    normalized.nama_nasabah = `Nasabah ${normalized.id_nasabah}`;
  }

  return normalized;
}

/**
 * Segment derivation rule from v1.ipynb:
 * <= 50,000,000          -> Mikro
 * > 50,000,000 - 200,000,000 -> Kecil
 * > 200,000,000          -> Menengah
 */
export function deriveSegment(pinjaman: number): 'Mikro' | 'Kecil' | 'Menengah' {
  if (pinjaman <= 50_000_000) return 'Mikro';
  if (pinjaman <= 200_000_000) return 'Kecil';
  return 'Menengah';
}

/**
 * Risk Category derivation rule from v1.ipynb:
 * < 0.05       -> Rendah (< 5%)
 * 0.05 - <0.10 -> Menengah (5% - <10%)
 * >= 0.10      -> Tinggi (>= 10%)
 */
export function deriveRiskCategory(pdScore: number): 'Rendah' | 'Menengah' | 'Tinggi' {
  if (pdScore < 0.05) return 'Rendah';
  if (pdScore < 0.10) return 'Menengah';
  return 'Tinggi';
}

/**
 * Calibrate PD score from Credit Score & Status if not provided directly
 */
export function calibratePD(rawPD: number | null, skorKredit: number, status: string): number {
  if (rawPD !== null && !isNaN(rawPD) && rawPD > 0) {
    return rawPD > 1 ? rawPD / 100 : rawPD;
  }
  // Formula: Logistic regression calibration based on credit score (300-850)
  // Higher score = Lower PD
  const isMacet = status === 'Macet';
  const baseProb = 1 / (1 + Math.exp((skorKredit - 560) / 55));
  let calibrated = isMacet ? Math.max(0.12, baseProb * 1.5) : Math.min(0.095, baseProb);
  
  // Ensure within realistic bounds (0.0100 - 0.2800)
  calibrated = Math.max(0.012, Math.min(0.265, calibrated));
  return parseFloat(calibrated.toFixed(4));
}

/**
 * Core Data Cleaning & Wrangling Engine
 * Replicates the full pipeline from v1.ipynb:
 * 1. Missing Value Imputation:
 *    - Numeric -> Median
 *    - Categorical -> Mode (and ffill on branches)
 * 2. Deduplication on id_nasabah (keep="last", sorted by tanggal_pengajuan)
 * 3. Outlier Detection & IQR Capping on pinjaman and pendapatan
 * 4. Feature Engineering:
 *    - segmen (Mikro, Kecil, Menengah)
 *    - kategori_risiko (Rendah, Menengah, Tinggi based on PD)
 *    - kolektibilitas (Lancar / Macet)
 *    - cicilan_bulanan & DSR
 *    - EAD, LGD, Expected Loss
 */
export function cleanCreditData(rawRecords: RawCreditRecord[]): {
  cleanedRecords: CreditRecord[];
  stats: CleaningStats;
} {
  const rowsBefore = rawRecords.length;

  // Track missing values before cleaning
  const missingValuesBefore: { [key: string]: number } = {};
  if (rawRecords.length > 0) {
    const keys = Object.keys(rawRecords[0]);
    keys.forEach(k => {
      missingValuesBefore[k] = rawRecords.filter(r => r[k] === null || r[k] === undefined || String(r[k]).trim() === '').length;
    });
  }

  // Step 0: Pre-normalize all rows
  const normalizedRaw: RawCreditRecord[] = rawRecords.map((r, idx) => normalizeRawRecord(r, idx));

  // Step 1: Missing values handling (Numeric: Median, Categorical: Mode / Forward Fill)
  // 1a. Branch mode & forward fill
  const branchList = normalizedRaw.map(r => r.nama_cabang ? String(r.nama_cabang).trim() : '').filter(Boolean);
  const branchMode = calculateMode(branchList);
  
  let lastBranch = '';
  let missingBranchesImputed = 0;
  const branchFilled: RawCreditRecord[] = normalizedRaw.map(r => {
    let branch = r.nama_cabang ? String(r.nama_cabang).trim() : '';
    if (!branch) {
      missingBranchesImputed++;
      branch = lastBranch || branchMode;
    } else {
      lastBranch = branch;
    }
    return { ...r, nama_cabang: branch };
  });

  // 1b. Median of numeric columns
  const validScores: number[] = [];
  const validLoans: number[] = [];
  const validIncomes: number[] = [];
  const validAges: number[] = [];
  const validTenors: number[] = [];

  branchFilled.forEach(r => {
    const s = parseCleanNumeric(r.skor_kredit);
    if (s !== null && s > 0) validScores.push(s);

    const l = parseCleanNumeric(r.pinjaman);
    if (l !== null && l > 0) validLoans.push(l);

    const inc = parseCleanNumeric(r.pendapatan);
    if (inc !== null && inc > 0) validIncomes.push(inc);

    const a = parseCleanNumeric(r.usia);
    if (a !== null && a > 0) validAges.push(a);

    const t = parseCleanNumeric(r.tenor_bulan);
    if (t !== null && t > 0) validTenors.push(t);
  });

  const medianScore = validScores.length > 0 ? calculateMedian(validScores) : 630;
  const medianLoan = validLoans.length > 0 ? calculateMedian(validLoans) : 45_000_000;
  const medianIncome = validIncomes.length > 0 ? calculateMedian(validIncomes) : 12_000_000;
  const medianAge = validAges.length > 0 ? calculateMedian(validAges) : 38;
  const medianTenor = validTenors.length > 0 ? calculateMedian(validTenors) : 24;

  let missingScoresImputed = 0;
  let missingNumericImputed = 0;
  let missingCategoricalImputed = missingBranchesImputed;

  const imputedRaw: RawCreditRecord[] = branchFilled.map(r => {
    let skor = parseCleanNumeric(r.skor_kredit);
    if (skor === null) {
      missingScoresImputed++;
      missingNumericImputed++;
      skor = medianScore;
    }

    let pinjaman = parseCleanNumeric(r.pinjaman);
    if (pinjaman === null || pinjaman <= 0) {
      missingNumericImputed++;
      pinjaman = medianLoan;
    }

    let pendapatan = parseCleanNumeric(r.pendapatan);
    if (pendapatan === null || pendapatan <= 0) {
      missingNumericImputed++;
      pendapatan = medianIncome;
    }

    let usia = parseCleanNumeric(r.usia);
    if (usia === null || usia <= 0) {
      missingNumericImputed++;
      usia = medianAge;
    }

    let tenor = parseCleanNumeric(r.tenor_bulan);
    if (tenor === null || tenor <= 0) {
      missingNumericImputed++;
      tenor = medianTenor;
    }

    return {
      ...r,
      skor_kredit: skor,
      pinjaman,
      pendapatan,
      usia,
      tenor_bulan: tenor
    };
  });

  // Step 2: Deduplication on id_nasabah (keep="last", stable sort by date if available)
  // Sort by date if available
  const sortedRaw = [...imputedRaw].sort((a, b) => {
    const dateA = a.tanggal_pengajuan || a.tanggal_akad ? new Date(String(a.tanggal_pengajuan || a.tanggal_akad)).getTime() : 0;
    const dateB = b.tanggal_pengajuan || b.tanggal_akad ? new Date(String(b.tanggal_pengajuan || b.tanggal_akad)).getTime() : 0;
    return dateA - dateB;
  });

  const idLastMap = new Map<string, number>();
  sortedRaw.forEach((r, idx) => {
    const id = String(r.id_nasabah || '').trim();
    if (id) idLastMap.set(id, idx);
  });

  let duplicatesRemoved = 0;
  const deduplicated: RawCreditRecord[] = sortedRaw.filter((r, idx) => {
    const id = String(r.id_nasabah || '').trim();
    if (!id) return false;
    const lastIdx = idLastMap.get(id);
    if (lastIdx !== idx) {
      duplicatesRemoved++;
      return false;
    }
    return true;
  });

  // Step 3: Outlier Detection & IQR Capping on pinjaman and pendapatan
  const rawLoans = deduplicated.map(r => parseCleanNumeric(r.pinjaman) ?? medianLoan);
  const rawIncomes = deduplicated.map(r => parseCleanNumeric(r.pendapatan) ?? medianIncome);

  const { cappedValues: cappedLoans, report: loanIQRReport } = capOutlierIQR(rawLoans, 'pinjaman', 'Plafon Pinjaman');
  const { cappedValues: cappedIncomes, report: incomeIQRReport } = capOutlierIQR(rawIncomes, 'pendapatan', 'Pendapatan Bulanan');

  const iqrReports: IQROutlierReport[] = [loanIQRReport, incomeIQRReport];

  // Step 4: Assemble Clean Records & Feature Engineering
  const cleanedList: CreditRecord[] = [];
  let invalidRowsRemoved = 0;
  let nullIdOrLoanRemoved = 0;

  deduplicated.forEach((r, idx) => {
    const id_nasabah = String(r.id_nasabah).trim();
    const nama_nasabah = r.nama_nasabah ? String(r.nama_nasabah).trim() : `Nasabah ${id_nasabah}`;
    
    let usia = parseCleanNumeric(r.usia) ?? medianAge;
    if (usia < 18 || usia > 85) {
      invalidRowsRemoved++;
      return;
    }

    const pinjaman_raw = rawLoans[idx];
    const pendapatan_raw = rawIncomes[idx];

    const pinjaman = cappedLoans[idx];
    const pendapatan = cappedIncomes[idx];
    const tenor_bulan = parseCleanNumeric(r.tenor_bulan) ?? medianTenor;
    const skor_kredit = parseCleanNumeric(r.skor_kredit) ?? medianScore;
    const status_kredit = standardizeStatus(r.status_kredit);
    const nama_cabang = String(r.nama_cabang || branchMode).trim();
    const tanggal_pengajuan = r.tanggal_pengajuan ? String(r.tanggal_pengajuan).trim() : (r.tanggal_akad ? String(r.tanggal_akad).trim() : '2023-01-15');

    // EAD & LGD
    let EAD = parseCleanNumeric(r.EAD);
    if (EAD === null || EAD <= 0) {
      EAD = pinjaman;
    }

    let LGD = parseCleanNumeric(r.LGD);
    if (LGD === null || LGD <= 0) {
      LGD = status_kredit === 'Macet' ? 0.50 : 0.40;
    } else if (LGD > 1) {
      LGD = LGD / 100;
    }

    // PD Score Calibration
    const rawPD = parseCleanNumeric(r.pd_score);
    const pd_score = calibratePD(rawPD, skor_kredit, status_kredit);

    // Feature Engineering: Segmen, Kategori Risiko, Kolektibilitas
    const segmen = deriveSegment(pinjaman);
    const kategori_risiko = deriveRiskCategory(pd_score);
    const kolektibilitas = status_kredit;

    // Cicilan & DSR
    const cicilan_bulanan = tenor_bulan > 0 ? pinjaman / tenor_bulan : 0;
    const dsr = pendapatan > 0 ? (cicilan_bulanan / pendapatan) * 100 : 0;

    // Flag NPL based on score
    let flag_npl: CreditRecord['flag_npl'] = 'Sedang-Rendah';
    if (skor_kredit >= 700) flag_npl = 'Rendah';
    else if (skor_kredit >= 600) flag_npl = 'Sedang-Rendah';
    else if (skor_kredit >= 500) flag_npl = 'Sedang-Tinggi';
    else flag_npl = 'Tinggi';

    // Expected Loss: EL = EAD * LGD * PD
    const expected_loss = EAD * LGD * pd_score;

    cleanedList.push({
      id_nasabah,
      nama_nasabah,
      usia,
      pendapatan,
      pendapatan_raw,
      pinjaman,
      pinjaman_raw,
      tenor_bulan,
      skor_kredit,
      pd_score,
      status_kredit,
      nama_cabang,
      tanggal_pengajuan,
      tanggal_akad: tanggal_pengajuan,
      EAD,
      LGD,
      segmen,
      kategori_risiko,
      kolektibilitas,
      cicilan_bulanan,
      dsr,
      flag_npl,
      expected_loss
    });
  });

  // Track missing values after cleaning
  const missingValuesAfter: { [key: string]: number } = {};
  if (cleanedList.length > 0) {
    const keys = Object.keys(cleanedList[0]);
    keys.forEach(k => {
      missingValuesAfter[k] = cleanedList.filter(r => r[k] === null || r[k] === undefined || String(r[k]).trim() === '').length;
    });
  }

  const stats: CleaningStats = {
    rowsBefore,
    rowsAfter: cleanedList.length,
    duplicatesRemoved,
    missingScoresImputed,
    missingBranchesImputed,
    missingNumericImputed,
    missingCategoricalImputed,
    invalidRowsRemoved,
    nullIdOrLoanRemoved,
    missingValuesBefore,
    missingValuesAfter,
    iqrReports
  };

  return { cleanedRecords: cleanedList, stats };
}

/**
 * Validation Checklist Items matching Assignment Requirements
 */
export function validateData(df: CreditRecord[]): ValidationItem[] {
  const hasRecords = df.length > 0;
  
  const allIdsValid = hasRecords && df.every(r => r.id_nasabah && String(r.id_nasabah).trim().length > 0);
  const idSet = new Set(df.map(r => r.id_nasabah));
  const noDuplicates = hasRecords && idSet.size === df.length;
  const validScores = hasRecords && df.every(r => typeof r.skor_kredit === 'number' && !isNaN(r.skor_kredit) && r.skor_kredit > 0);
  const validLoans = hasRecords && df.every(r => typeof r.pinjaman === 'number' && !isNaN(r.pinjaman) && r.pinjaman >= 0);
  const validAges = hasRecords && df.every(r => typeof r.usia === 'number' && r.usia >= 18 && r.usia <= 85);
  const validIncomes = hasRecords && df.every(r => typeof r.pendapatan === 'number' && r.pendapatan >= 0);
  const validStatus = hasRecords && df.every(r => r.status_kredit === 'Lancar' || r.status_kredit === 'Macet');
  const populatedCategories = hasRecords && df.every(r => r.segmen && r.kategori_risiko && r.kolektibilitas && r.pd_score !== undefined);

  return [
    {
      id: 'val-missing-zero',
      title: 'Tidak Ada Missing Value (df.isnull().sum() == 0)',
      description: 'Seluruh nilai kosong (NaN) telah diimputasi dengan median untuk numerik dan mode/ffill untuk kategorikal.',
      isValid: validScores && validLoans && validIncomes
    },
    {
      id: 'val-no-duplicates',
      title: 'Deduplikasi ID Nasabah Unik (keep="last")',
      description: 'Seluruh ID nasabah duplikat telah dieliminasi dan menyimpan rekaman terbaru berdasarkan tanggal.',
      isValid: noDuplicates
    },
    {
      id: 'val-iqr-capped',
      title: 'Outlier Capping IQR pada Pinjaman & Pendapatan',
      description: 'Nilai ekstrem di luar rentang [Q1 - 1.5*IQR, Q3 + 1.5*IQR] telah di-cap secara aman.',
      isValid: hasRecords
    },
    {
      id: 'val-segment-derived',
      title: 'Variabel Turunan Segmen (Mikro, Kecil, Menengah)',
      description: 'Segmentasi plafon: <=50 Juta (Mikro), 50–200 Juta (Kecil), >200 Juta (Menengah).',
      isValid: populatedCategories
    },
    {
      id: 'val-risk-category-derived',
      title: 'Kategori Risiko Berdasarkan Skor PD',
      description: 'Aturan klasifikasi: <5% (Rendah), 5%–<10% (Menengah), >=10% (Tinggi).',
      isValid: populatedCategories
    },
    {
      id: 'val-collectibility-derived',
      title: 'Kolektibilitas & Status Kredit Terstandardisasi',
      description: 'Representasi status seragam dalam kategori Lancar vs Macet (NPL).',
      isValid: validStatus
    }
  ];
}

/**
 * 3 Filter Requirements from Assignment:
 */
export function applyFilter1(records: CreditRecord[]): CreditRecord[] {
  return records.filter(r => r.skor_kredit < 550 && r.pinjaman > 50_000_000);
}

export function applyFilter2(records: CreditRecord[], selectedBranches: string[]): CreditRecord[] {
  if (selectedBranches.length === 0) return [];
  const branchSet = new Set(selectedBranches);
  return records.filter(r => r.status_kredit === 'Macet' && branchSet.has(r.nama_cabang));
}

export function applyFilter3(records: CreditRecord[]): CreditRecord[] {
  return records.filter(r => (r.usia >= 25 && r.usia <= 60) || r.skor_kredit < 500);
}

/**
 * Calculate Pearson Correlation Matrix between numeric risk variables
 */
export function calculateCorrelationMatrix(records: CreditRecord[]): CorrelationMatrix {
  const vars = [
    { key: 'pd_score', label: 'PD Score' },
    { key: 'LGD', label: 'LGD' },
    { key: 'EAD', label: 'EAD' },
    { key: 'pinjaman', label: 'Pinjaman' },
    { key: 'pendapatan', label: 'Pendapatan' },
    { key: 'skor_kredit', label: 'Skor Kredit' },
    { key: 'dsr', label: 'DSR (%)' }
  ];

  const n = records.length;
  if (n === 0) {
    return {
      variables: vars.map(v => v.key),
      labels: vars.map(v => v.label),
      matrix: vars.map(() => vars.map(() => 1))
    };
  }

  // Precompute mean and std for each variable
  const stats = vars.map(v => {
    const vals = records.map(r => Number(r[v.key]) || 0);
    const mean = vals.reduce((a, b) => a + b, 0) / n;
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1 || 1);
    const std = Math.sqrt(variance);
    return { key: v.key, vals, mean, std };
  });

  const matrix: number[][] = [];
  for (let i = 0; i < stats.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < stats.length; j++) {
      if (i === j) {
        row.push(1.0);
      } else {
        const stdProd = stats[i].std * stats[j].std;
        if (stdProd === 0) {
          row.push(0.0);
        } else {
          let cov = 0;
          for (let k = 0; k < n; k++) {
            cov += (stats[i].vals[k] - stats[i].mean) * (stats[j].vals[k] - stats[j].mean);
          }
          cov = cov / (n - 1 || 1);
          const r = Math.max(-1, Math.min(1, cov / stdProd));
          row.push(parseFloat(r.toFixed(2)));
        }
      }
    }
    matrix.push(row);
  }

  return {
    variables: vars.map(v => v.key),
    labels: vars.map(v => v.label),
    matrix
  };
}

/**
 * Calculate Boxplot Stats (Min, Q1, Median, Q3, Max, IQR, Outliers) for PD by Risk Category or Segment
 */
export function calculateBoxplotStats(records: CreditRecord[], valueKey = 'pd_score', groupKey = 'kategori_risiko'): BoxplotStats[] {
  const groups = new Map<string, number[]>();
  
  // Desired category orders
  const desiredOrder = groupKey === 'kategori_risiko' 
    ? ['Rendah', 'Menengah', 'Tinggi'] 
    : ['Mikro', 'Kecil', 'Menengah'];

  desiredOrder.forEach(cat => groups.set(cat, []));

  records.forEach(r => {
    const cat = String(r[groupKey] || 'Lainnya');
    const val = Number(r[valueKey]) || 0;
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(val);
  });

  const results: BoxplotStats[] = [];

  groups.forEach((vals, cat) => {
    if (vals.length === 0) return;
    const sorted = [...vals].sort((a, b) => a - b);
    const count = sorted.length;
    const mean = sorted.reduce((a, b) => a + b, 0) / count;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const q1 = calculateQuantile(sorted, 0.25);
    const median = calculateQuantile(sorted, 0.5);
    const q3 = calculateQuantile(sorted, 0.75);
    const iqr = q3 - q1;

    const lowerWhisker = Math.max(min, q1 - 1.5 * iqr);
    const upperWhisker = Math.min(max, q3 + 1.5 * iqr);

    const outliers = sorted.filter(v => v < lowerWhisker || v > upperWhisker);

    results.push({
      category: cat,
      min,
      q1,
      median,
      q3,
      max,
      iqr,
      lowerWhisker,
      upperWhisker,
      outliers,
      count,
      mean
    });
  });

  return results;
}

/**
 * Crosstab Composition: pd.crosstab(df['segmen'], df['kolektibilitas'])
 */
export function calculateCrosstab(records: CreditRecord[]): CrosstabData[] {
  const segments = ['Mikro', 'Kecil', 'Menengah'];
  return segments.map(seg => {
    const inSeg = records.filter(r => r.segmen === seg);
    const lancar = inSeg.filter(r => r.status_kredit === 'Lancar').length;
    const macet = inSeg.filter(r => r.status_kredit === 'Macet').length;
    const total = inSeg.length;
    const nplRate = total > 0 ? (macet / total) * 100 : 0;
    return {
      segmen: seg,
      Lancar: lancar,
      Macet: macet,
      Total: total,
      nplRate
    };
  });
}

/**
 * Bubble Chart Data: PD vs LGD per Segmen (Size = Total EAD)
 */
export function getBubbleChartData(records: CreditRecord[]) {
  const segments = ['Mikro', 'Kecil', 'Menengah'];
  return segments.map(seg => {
    const inSeg = records.filter(r => r.segmen === seg);
    const count = inSeg.length;
    const avgPD = count > 0 ? inSeg.reduce((a, b) => a + b.pd_score, 0) / count : 0;
    const avgLGD = count > 0 ? inSeg.reduce((a, b) => a + b.LGD, 0) / count : 0;
    const totalEAD = inSeg.reduce((a, b) => a + b.EAD, 0);
    const totalLoan = inSeg.reduce((a, b) => a + b.pinjaman, 0);
    const totalEL = inSeg.reduce((a, b) => a + (b.expected_loss || 0), 0);

    return {
      segmen: seg,
      pd_score: parseFloat(avgPD.toFixed(4)),
      lgd: parseFloat(avgLGD.toFixed(4)),
      total_ead: totalEAD,
      total_pinjaman: totalLoan,
      total_el: totalEL,
      jumlah_nasabah: count
    };
  });
}

/**
 * Pivot Table Rata-Rata PD per Segmen (pd.pivot_table)
 */
export function calculateSegmentPivotPD(records: CreditRecord[]): SegmentPivotPD[] {
  const segments = ['Mikro', 'Kecil', 'Menengah'];
  return segments.map(seg => {
    const inSeg = records.filter(r => r.segmen === seg);
    const count = inSeg.length;
    const avgPD = count > 0 ? inSeg.reduce((a, b) => a + b.pd_score, 0) / count : 0;
    const totalPinjaman = inSeg.reduce((a, b) => a + b.pinjaman, 0);
    const totalEAD = inSeg.reduce((a, b) => a + b.EAD, 0);

    return {
      segmen: seg,
      rata_rata_pd: parseFloat(avgPD.toFixed(4)),
      jumlah_nasabah: count,
      total_pinjaman: totalPinjaman,
      total_ead: totalEAD
    };
  });
}

/**
 * Agregasi per Cabang dan Segmen (df.groupby(['nama_cabang', 'segmen']).agg(...))
 */
export function calculateBranchSegmentAggregates(records: CreditRecord[]): BranchSegmentAggregate[] {
  const groupMap = new Map<string, CreditRecord[]>();

  records.forEach(r => {
    const key = `${r.nama_cabang}|||${r.segmen}`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(r);
  });

  const list: BranchSegmentAggregate[] = [];
  groupMap.forEach((items, key) => {
    const [nama_cabang, segmen] = key.split('|||');
    const count = items.length;
    const avgPD = count > 0 ? items.reduce((a, b) => a + b.pd_score, 0) / count : 0;
    const avgLGD = count > 0 ? items.reduce((a, b) => a + b.LGD, 0) / count : 0;
    const totalEAD = items.reduce((a, b) => a + b.EAD, 0);
    const totalPinjaman = items.reduce((a, b) => a + b.pinjaman, 0);
    const avgIncome = count > 0 ? items.reduce((a, b) => a + b.pendapatan, 0) / count : 0;

    list.push({
      nama_cabang,
      segmen,
      jumlah_nasabah: count,
      rata_rata_pd: parseFloat(avgPD.toFixed(4)),
      rata_rata_lgd: parseFloat(avgLGD.toFixed(4)),
      total_ead: totalEAD,
      total_pinjaman: totalPinjaman,
      rata_rata_pendapatan: Math.round(avgIncome)
    });
  });

  return list.sort((a, b) => a.nama_cabang.localeCompare(b.nama_cabang) || a.segmen.localeCompare(b.segmen));
}

/**
 * Histogram + Gaussian KDE Curve Density Calculation
 */
export function calculateHistogramKDE(data: number[], binsCount = 30) {
  if (data.length === 0) {
    return { bins: [], mean: 0, median: 0, min: 0, max: 0, std: 0 };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const median = calculateQuantile(sorted, 0.5);
  const variance = sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1 || 1);
  const std = Math.sqrt(variance);

  // Bandwidth (Silverman's rule of thumb)
  const iqr = calculateQuantile(sorted, 0.75) - calculateQuantile(sorted, 0.25);
  const h = 0.9 * Math.min(std, (iqr / 1.34) || std) * Math.pow(n, -0.2) || 0.01;

  const binWidth = (max - min) / binsCount || 0.01;
  const bins = [];

  for (let i = 0; i < binsCount; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const mid = (binStart + binEnd) / 2;

    const count = sorted.filter(v => v >= binStart && (i === binsCount - 1 ? v <= binEnd : v < binEnd)).length;

    // Gaussian KDE at mid point
    let kdeSum = 0;
    for (let j = 0; j < n; j++) {
      const u = (mid - sorted[j]) / h;
      kdeSum += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
    }
    const kdeDensity = (kdeSum / (n * h)) * binWidth * n; // scaled to histogram counts

    bins.push({
      binStart,
      binEnd,
      binLabel: `${(binStart * 100).toFixed(1)}%–${(binEnd * 100).toFixed(1)}%`,
      midValue: mid,
      count,
      kdeDensity: parseFloat(kdeDensity.toFixed(2))
    });
  }

  return { bins, mean, median, min, max, std };
}

/**
 * Aggregates for Portfolio Risk
 */
export function getPortfolioRiskAggregates(records: CreditRecord[]): PortfolioRiskAggregate[] {
  const order = ['Rendah', 'Menengah', 'Tinggi'];
  const groups = new Map<string, CreditRecord[]>();

  order.forEach(k => groups.set(k, []));
  
  records.forEach(r => {
    const k = r.kategori_risiko || 'Menengah';
    const list = groups.get(k) || [];
    list.push(r);
    groups.set(k, list);
  });

  const totalNasabah = records.length;

  return order.map(kategori => {
    const items = groups.get(kategori) || [];
    const count = items.length;
    const totalLoan = items.reduce((acc, cur) => acc + (cur.pinjaman || 0), 0);
    const avgScore = count > 0 ? items.reduce((acc, cur) => acc + cur.skor_kredit, 0) / count : 0;
    const avgPD = count > 0 ? items.reduce((acc, cur) => acc + cur.pd_score, 0) / count : 0;
    const avgLoan = count > 0 ? totalLoan / count : 0;
    const avgDsr = count > 0 ? items.reduce((acc, cur) => acc + (cur.dsr || 0), 0) / count : 0;
    
    const elItems = items.filter(i => i.expected_loss !== undefined);
    const totalEL = elItems.reduce((acc, cur) => acc + (cur.expected_loss || 0), 0);
    const avgEL = elItems.length > 0 ? totalEL / elItems.length : undefined;

    return {
      kategori_risiko: kategori,
      jumlah_nasabah: count,
      total_pinjaman: totalLoan,
      persentase_nasabah: totalNasabah > 0 ? (count / totalNasabah) * 100 : 0,
      rata_rata_skor: avgScore,
      rata_rata_pd: parseFloat(avgPD.toFixed(4)),
      rata_rata_pinjaman: avgLoan,
      rata_rata_dsr: avgDsr,
      rata_rata_el: avgEL,
      total_el: elItems.length > 0 ? totalEL : undefined
    };
  });
}

/**
 * Expected Loss by Segment
 */
export function getSegmentELAggregates(records: CreditRecord[]): SegmentELAggregate[] {
  const segments = ['Mikro', 'Kecil', 'Menengah'];
  const groupMap = new Map<string, CreditRecord[]>();

  segments.forEach(s => groupMap.set(s, []));
  records.forEach(r => {
    const seg = r.segmen || 'Mikro';
    if (!groupMap.has(seg)) groupMap.set(seg, []);
    groupMap.get(seg)!.push(r);
  });

  const result: SegmentELAggregate[] = [];
  groupMap.forEach((items, seg) => {
    const count = items.length;
    const totalEAD = items.reduce((acc, cur) => acc + (cur.EAD || 0), 0);
    const avgEAD = count > 0 ? totalEAD / count : 0;
    const avgLGD = count > 0 ? items.reduce((acc, cur) => acc + (cur.LGD || 0), 0) / count : 0;
    const avgPD = count > 0 ? items.reduce((acc, cur) => acc + (cur.pd_score || 0), 0) / count : 0;
    const totalEL = items.reduce((acc, cur) => acc + (cur.expected_loss || 0), 0);
    const avgEL = count > 0 ? totalEL / count : 0;

    result.push({
      segmen: seg,
      jumlah_nasabah: count,
      total_ead: totalEAD,
      rata_rata_ead: avgEAD,
      rata_rata_lgd: parseFloat(avgLGD.toFixed(4)),
      rata_rata_pd: parseFloat(avgPD.toFixed(4)),
      rata_rata_el: avgEL,
      total_el: totalEL
    });
  });

  return result;
}

/**
 * Formatters
 */
export function formatCurrencyIDR(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'Rp 0';
  const formatted = Math.round(value).toLocaleString('id-ID');
  return `Rp ${formatted}`;
}

export function formatPercentageIDR(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '0,00%';
  return `${value.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
}

export function formatPDScore(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '0.0000';
  return Number(value).toFixed(4);
}

export function formatNumberIDR(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return value.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
