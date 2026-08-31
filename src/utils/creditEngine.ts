import { 
  RawCreditRecord, 
  CreditRecord, 
  CleaningStats, 
  DatasetSummary, 
  ValidationItem, 
  PortfolioRiskAggregate, 
  SegmentELAggregate 
} from '../types';

/**
 * Helper to clean numeric strings with 'Rp', '.', ',', whitespace, etc.
 */
export function parseCleanNumeric(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  let str = String(val).trim();
  if (!str) return null;
  // Remove BOM, quotes, 'Rp', 'RP', spaces
  str = str.replace(/^\uFEFF/, '').replace(/["']/g, '').replace(/rp/gi, '').replace(/\s+/g, '');
  
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
  const parsed = parseFloat(str);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Standardize status credit (e.g. 'LANCAR', 'MACET', '  lancar ' -> 'Lancar', 'Macet')
 */
export function standardizeStatus(status: any): string {
  if (!status) return 'Lancar';
  const trimmed = String(status).trim().toLowerCase();
  if (trimmed === 'lancar' || trimmed === '1' || trimmed === 'kol 1' || trimmed === 'kol-1' || trimmed === 'current') return 'Lancar';
  if (trimmed === 'macet' || trimmed === '5' || trimmed === 'kol 5' || trimmed === 'kol-5' || trimmed === 'npl' || trimmed === 'default') return 'Macet';
  if (trimmed === 'dpk' || trimmed === 'kurang lancar' || trimmed === 'diragukan') return 'Macet';
  // Title case fallback
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Calculate median of numeric array
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 620;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Categorize loan risk based on loan amount (pd.cut equivalent)
 * bins: 0, 25M, 100M, 500M, inf
 * labels: '0–25 Juta', '25–100 Juta', '100–500 Juta', '> 500 Juta'
 */
export function createRiskCategory(pinjaman: number): CreditRecord['kategori_risiko'] {
  if (pinjaman === null || pinjaman === undefined || isNaN(pinjaman) || pinjaman < 0) {
    return 'Tidak Terkategori';
  }
  if (pinjaman <= 25_000_000) {
    return '0–25 Juta';
  } else if (pinjaman <= 100_000_000) {
    return '25–100 Juta';
  } else if (pinjaman <= 500_000_000) {
    return '100–500 Juta';
  } else {
    return '> 500 Juta';
  }
}

/**
 * Create NPL flag based on credit score (np.select equivalent)
 * >= 700 -> Rendah
 * 600 - 699 -> Sedang-Rendah
 * 500 - 599 -> Sedang-Tinggi
 * < 500 -> Tinggi
 */
export function createNPLFlag(skorKredit: number): CreditRecord['flag_npl'] {
  if (skorKredit === null || skorKredit === undefined || isNaN(skorKredit)) {
    return 'Tidak Diketahui';
  }
  if (skorKredit >= 700) {
    return 'Rendah';
  } else if (skorKredit >= 600) {
    return 'Sedang-Rendah';
  } else if (skorKredit >= 500) {
    return 'Sedang-Tinggi';
  } else {
    return 'Tinggi';
  }
}

/**
 * Column aliases dictionary for intelligent field matching
 */
const COLUMN_ALIASES: { [standardKey: string]: string[] } = {
  id_nasabah: ['id_nasabah', 'id', 'idnasabah', 'no_nasabah', 'nonasabah', 'customer_id', 'cif', 'id_debitur', 'no_kontrak', 'nomor_nasabah', 'nasabah_id', 'nomor_kontrak', 'id_rekening', 'no_rekening', 'no'],
  nama_nasabah: ['nama_nasabah', 'nama', 'namanasabah', 'customer_name', 'name', 'nama_debitur', 'nama_lengkap', 'debitur', 'borrower_name'],
  usia: ['usia', 'umur', 'age', 'usia_nasabah', 'usia_debitur'],
  pendapatan: ['pendapatan', 'income', 'gaji', 'salary', 'penghasilan', 'pendapatan_bulanan', 'monthly_income', 'penghasilan_bulanan', 'omset'],
  pinjaman: ['pinjaman', 'plafon', 'plafon_pinjaman', 'loan_amount', 'kredit', 'besar_pinjaman', 'total_pinjaman', 'amount', 'nominal_pinjaman', 'plafon_kredit', 'baki_debet', 'limit_kredit', 'loan'],
  tenor_bulan: ['tenor_bulan', 'tenor', 'tenor_bln', 'jangka_waktu', 'tenor_kredit', 'loan_tenor', 'term', 'months', 'jw', 'tenor_bulan_pinjaman'],
  skor_kredit: ['skor_kredit', 'skor', 'credit_score', 'score', 'creditscore', 'skorkredit', 'nilai_kredit', 'scoring', 'score_kredit'],
  status_kredit: ['status_kredit', 'status', 'kolektibilitas', 'status_kol', 'kol', 'credit_status', 'status_kredit_nasabah', 'statuskredit', 'status_pinjaman', 'loan_status'],
  nama_cabang: ['nama_cabang', 'cabang', 'branch', 'unit_kerja', 'kantor_cabang', 'namacabang', 'lokasi_cabang', 'kanca', 'kc', 'unit', 'branch_name'],
  tanggal_akad: ['tanggal_akad', 'tgl_akad', 'tanggal', 'date', 'akad_date', 'tanggal_pinjaman', 'tgl_pencairan', 'tgl_pk', 'tgl_perjanjian'],
  EAD: ['ead', 'exposure_at_default', 'exposure_default', 'total_ead', 'ead_rp'],
  LGD: ['lgd', 'loss_given_default', 'loss_default', 'lgd_pct'],
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
 * Core Data Cleaning Engine
 * Replicates the complete Pandas data cleaning workflow:
 * - Normalizes column headers across various CSV naming variations
 * - Missing value imputation: skor_kredit (median), nama_cabang (ffill)
 * - Dropping rows without essential numeric loan data
 * - Duplicate removal on id_nasabah (keep last)
 * - Numeric and Date conversions
 * - Status standardization
 * - Outlier filtering: usia < 18, usia > 80, pendapatan < 0
 * - Feature Engineering: cicilan_bulanan, dsr, kategori_risiko, flag_npl, expected_loss
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

  // Step 0: Pre-normalize all rows to match standard columns
  const normalizedRaw: RawCreditRecord[] = rawRecords.map((r, idx) => normalizeRawRecord(r, idx));

  // Step 1: Forward fill nama_cabang
  let lastBranch: string = '';
  const branchFilled: RawCreditRecord[] = normalizedRaw.map(r => {
    let branch = r.nama_cabang ? String(r.nama_cabang).trim() : '';
    if (!branch && lastBranch) {
      branch = lastBranch;
    } else if (branch) {
      lastBranch = branch;
    }
    return { ...r, nama_cabang: branch || 'Cabang BRI Utama' };
  });

  const missingBranchesImputed = normalizedRaw.filter(r => !r.nama_cabang || String(r.nama_cabang).trim() === '').length;

  // Step 2: Compute median for skor_kredit from valid numbers
  const validScores: number[] = [];
  branchFilled.forEach(r => {
    const s = parseCleanNumeric(r.skor_kredit);
    if (s !== null && s > 0) {
      validScores.push(s);
    }
  });
  const medianScore = validScores.length > 0 ? calculateMedian(validScores) : 620;

  let missingScoresImputed = 0;
  const scoreImputed: RawCreditRecord[] = branchFilled.map(r => {
    const s = parseCleanNumeric(r.skor_kredit);
    if (s === null) {
      missingScoresImputed++;
      return { ...r, skor_kredit: medianScore };
    }
    return { ...r, skor_kredit: s };
  });

  // Step 3: Filter rows with valid loan values (fallback to any plausible numeric field if pinjaman was missing)
  let nullIdOrLoanRemoved = 0;
  const filteredMandatory: RawCreditRecord[] = scoreImputed.filter(r => {
    const id = r.id_nasabah ? String(r.id_nasabah).trim() : '';
    let pinjaman = parseCleanNumeric(r.pinjaman);

    // If pinjaman was not parsed directly, try to locate any numeric field > 0
    if (pinjaman === null || pinjaman <= 0) {
      for (const [k, v] of Object.entries(r)) {
        if (k !== 'id_nasabah' && k !== 'usia' && k !== 'tenor_bulan' && k !== 'skor_kredit') {
          const num = parseCleanNumeric(v);
          if (num !== null && num >= 1_000_000) {
            pinjaman = num;
            r.pinjaman = pinjaman;
            break;
          }
        }
      }
    }

    if (!id || pinjaman === null || pinjaman <= 0) {
      nullIdOrLoanRemoved++;
      return false;
    }
    return true;
  });

  // Step 4: Handle duplicates on id_nasabah (keep="last")
  const idLastIndexMap = new Map<string, number>();
  filteredMandatory.forEach((r, idx) => {
    const id = String(r.id_nasabah).trim();
    idLastIndexMap.set(id, idx);
  });

  let duplicatesRemoved = 0;
  const deduplicated: RawCreditRecord[] = filteredMandatory.filter((r, idx) => {
    const id = String(r.id_nasabah).trim();
    const lastIdx = idLastIndexMap.get(id);
    if (lastIdx !== idx) {
      duplicatesRemoved++;
      return false;
    }
    return true;
  });

  // Step 5: Convert types, standardize, filter outliers
  let invalidRowsRemoved = 0;
  const cleanedList: CreditRecord[] = [];

  deduplicated.forEach(r => {
    let usia = parseCleanNumeric(r.usia);
    if (usia === null || usia === 0) {
      usia = 35; // Default sensible age if absent
    } else if (usia < 18 || usia > 85) {
      invalidRowsRemoved++;
      return;
    }

    const pinjaman = parseCleanNumeric(r.pinjaman) ?? 10_000_000;
    
    let pendapatan = parseCleanNumeric(r.pendapatan);
    if (pendapatan === null || pendapatan <= 0) {
      // Sensible estimation if absent
      pendapatan = Math.max(pinjaman / 24, 4_500_000);
    }

    let tenor_bulan = parseCleanNumeric(r.tenor_bulan);
    if (tenor_bulan === null || tenor_bulan <= 0) {
      tenor_bulan = 12;
    }

    const skor_kredit = parseCleanNumeric(r.skor_kredit) ?? medianScore;
    const status_kredit = standardizeStatus(r.status_kredit);
    const nama_cabang = String(r.nama_cabang).trim() || 'Cabang BRI Utama';
    const id_nasabah = String(r.id_nasabah).trim();
    const nama_nasabah = r.nama_nasabah ? String(r.nama_nasabah).trim() : `Nasabah ${id_nasabah}`;

    // Outlier checking on income
    if (pendapatan < 0) {
      invalidRowsRemoved++;
      return;
    }

    // Perhitungan cicilan bulanan = pinjaman / tenor_bulan
    let cicilan_bulanan = 0;
    if (tenor_bulan > 0 && pinjaman > 0) {
      cicilan_bulanan = pinjaman / tenor_bulan;
    }

    // Perhitungan DSR = (cicilan_bulanan / pendapatan) * 100
    let dsr = 0;
    if (pendapatan > 0 && cicilan_bulanan > 0) {
      dsr = (cicilan_bulanan / pendapatan) * 100;
    }

    // Kategori risiko
    const kategori_risiko = createRiskCategory(pinjaman);

    // Flag NPL
    const flag_npl = createNPLFlag(skor_kredit);

    // Expected Loss (EL = EAD * LGD)
    let EAD = parseCleanNumeric(r.EAD);
    let LGD = parseCleanNumeric(r.LGD);
    let expected_loss: number | undefined = undefined;

    if (EAD !== null && LGD !== null) {
      const normalizedLGD = LGD > 1 ? LGD / 100 : LGD;
      expected_loss = EAD * normalizedLGD;
      LGD = normalizedLGD;
    }

    const record: CreditRecord = {
      ...r,
      id_nasabah,
      nama_nasabah,
      usia,
      pendapatan,
      pinjaman,
      tenor_bulan,
      skor_kredit,
      status_kredit,
      nama_cabang,
      tanggal_akad: r.tanggal_akad ? String(r.tanggal_akad).trim() : undefined,
      EAD: EAD !== null ? EAD : undefined,
      LGD: LGD !== null ? LGD : undefined,
      segmen: r.segmen ? String(r.segmen).trim() : undefined,
      cicilan_bulanan,
      dsr,
      kategori_risiko,
      flag_npl,
      expected_loss
    };

    cleanedList.push(record);
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
    invalidRowsRemoved,
    nullIdOrLoanRemoved,
    missingValuesBefore,
    missingValuesAfter
  };

  return { cleanedRecords: cleanedList, stats };
}

/**
 * Validate dataset rules and return checklist items
 */
export function validateData(df: CreditRecord[]): ValidationItem[] {
  const hasRecords = df.length > 0;
  
  // 1. ID Nasabah valid & not empty
  const allIdsValid = hasRecords && df.every(r => r.id_nasabah && String(r.id_nasabah).trim().length > 0);
  
  // 2. No duplicate IDs
  const idSet = new Set(df.map(r => r.id_nasabah));
  const noDuplicates = hasRecords && idSet.size === df.length;
  
  // 3. Skor kredit numeric & in valid range
  const validScores = hasRecords && df.every(r => typeof r.skor_kredit === 'number' && !isNaN(r.skor_kredit) && r.skor_kredit > 0);
  
  // 4. Pinjaman numeric & > 0
  const validLoans = hasRecords && df.every(r => typeof r.pinjaman === 'number' && !isNaN(r.pinjaman) && r.pinjaman >= 0);
  
  // 5. Usia valid (18-85)
  const validAges = hasRecords && df.every(r => typeof r.usia === 'number' && r.usia >= 18 && r.usia <= 85);
  
  // 6. Pendapatan >= 0
  const validIncomes = hasRecords && df.every(r => typeof r.pendapatan === 'number' && r.pendapatan >= 0);
  
  // 7. Status kredit standardized (Lancar / Macet)
  const validStatus = hasRecords && df.every(r => r.status_kredit === 'Lancar' || r.status_kredit === 'Macet');
  
  // 8. Kategori risiko & Flag NPL populated
  const populatedCategories = hasRecords && df.every(r => r.kategori_risiko && r.flag_npl);

  return [
    {
      id: 'val-id-presence',
      title: 'ID Nasabah Valid & Terisi',
      description: 'Semua baris memiliki ID nasabah yang terisi dan tidak kosong.',
      isValid: allIdsValid
    },
    {
      id: 'val-no-duplicates',
      title: 'Bebas Duplikasi ID',
      description: 'Seluruh ID nasabah bersifat unik (duplikasi telah dieliminasi dengan keep="last").',
      isValid: noDuplicates
    },
    {
      id: 'val-score-numeric',
      title: 'Skor Kredit Numerik & Terimputasi',
      description: 'Skor kredit bertipe numerik dan nilai kosong telah diisi dengan median.',
      isValid: validScores
    },
    {
      id: 'val-loan-numeric',
      title: 'Nilai Pinjaman Numerik',
      description: 'Nilai pinjaman valid bertipe numerik positif.',
      isValid: validLoans
    },
    {
      id: 'val-age-range',
      title: 'Rentang Usia Valid (18–85 Tahun)',
      description: 'Outlier usia di luar rentang produktif bank (< 18 atau > 85) telah dibersihkan.',
      isValid: validAges
    },
    {
      id: 'val-income-nonneg',
      title: 'Pendapatan Non-Negatif',
      description: 'Pendapatan bernilai riil dan tidak ada nilai negatif (< 0).',
      isValid: validIncomes
    },
    {
      id: 'val-status-standard',
      title: 'Status Kredit Terstandardisasi',
      description: 'Status kredit seragam dalam format Title Case ("Lancar" / "Macet").',
      isValid: validStatus
    },
    {
      id: 'val-features-ready',
      title: 'Fitur Risiko & NPL Siap',
      description: 'Kolom cicilan_bulanan, DSR, kategori_risiko, dan flag_npl berhasil dikalkulasi.',
      isValid: populatedCategories
    }
  ];
}

/**
 * Filter 1: Skor kredit < 550 DAN Pinjaman > Rp 50 Juta
 */
export function applyFilter1(records: CreditRecord[]): CreditRecord[] {
  return records.filter(r => r.skor_kredit < 550 && r.pinjaman > 50_000_000);
}

/**
 * Filter 2: Status kredit == 'Macet' DAN berasal dari cabang tertentu (.isin())
 */
export function applyFilter2(records: CreditRecord[], selectedBranches: string[]): CreditRecord[] {
  if (selectedBranches.length === 0) return [];
  const branchSet = new Set(selectedBranches);
  return records.filter(r => r.status_kredit === 'Macet' && branchSet.has(r.nama_cabang));
}

/**
 * Filter 3: Usia 25–60 ATAU Skor kredit < 500
 */
export function applyFilter3(records: CreditRecord[]): CreditRecord[] {
  return records.filter(r => (r.usia >= 25 && r.usia <= 60) || r.skor_kredit < 500);
}

/**
 * Grouping and Aggregations for Portfolio Analysis
 */
export function getPortfolioRiskAggregates(records: CreditRecord[]): PortfolioRiskAggregate[] {
  const order: CreditRecord['kategori_risiko'][] = ['0–25 Juta', '25–100 Juta', '100–500 Juta', '> 500 Juta'];
  const groups = new Map<string, CreditRecord[]>();

  order.forEach(k => groups.set(k, []));
  
  records.forEach(r => {
    const list = groups.get(r.kategori_risiko) || [];
    list.push(r);
    groups.set(r.kategori_risiko, list);
  });

  const totalNasabah = records.length;

  return order.map(kategori => {
    const items = groups.get(kategori) || [];
    const count = items.length;
    const totalLoan = items.reduce((acc, cur) => acc + (cur.pinjaman || 0), 0);
    const avgScore = count > 0 ? items.reduce((acc, cur) => acc + cur.skor_kredit, 0) / count : 0;
    const avgLoan = count > 0 ? totalLoan / count : 0;
    const avgDsr = count > 0 ? items.reduce((acc, cur) => acc + (cur.dsr || 0), 0) / count : 0;
    
    // EL aggregates if available
    const elItems = items.filter(i => i.expected_loss !== undefined);
    const totalEL = elItems.reduce((acc, cur) => acc + (cur.expected_loss || 0), 0);
    const avgEL = elItems.length > 0 ? totalEL / elItems.length : undefined;

    return {
      kategori_risiko: kategori,
      jumlah_nasabah: count,
      total_pinjaman: totalLoan,
      persentase_nasabah: totalNasabah > 0 ? (count / totalNasabah) * 100 : 0,
      rata_rata_skor: avgScore,
      rata_rata_pinjaman: avgLoan,
      rata_rata_dsr: avgDsr,
      rata_rata_el: avgEL,
      total_el: elItems.length > 0 ? totalEL : undefined
    };
  });
}

/**
 * Expected Loss by Segment (or fallback to Kategori Risiko)
 */
export function getSegmentELAggregates(records: CreditRecord[]): SegmentELAggregate[] {
  const segmentKey = records.some(r => r.segmen) ? 'segmen' : 'kategori_risiko';
  const groupMap = new Map<string, CreditRecord[]>();

  records.forEach(r => {
    const seg = (r[segmentKey] as string) || 'Tidak Terdefinisi';
    const list = groupMap.get(seg) || [];
    list.push(r);
    groupMap.set(seg, list);
  });

  const result: SegmentELAggregate[] = [];
  groupMap.forEach((items, seg) => {
    const count = items.length;
    const validEADItems = items.filter(i => i.EAD !== undefined);
    const validLGDItems = items.filter(i => i.LGD !== undefined);
    const validELItems = items.filter(i => i.expected_loss !== undefined);

    const totalEAD = validEADItems.reduce((acc, cur) => acc + (cur.EAD || 0), 0);
    const avgEAD = validEADItems.length > 0 ? totalEAD / validEADItems.length : 0;
    const avgLGD = validLGDItems.length > 0 ? validLGDItems.reduce((acc, cur) => acc + (cur.LGD || 0), 0) / validLGDItems.length : 0;
    const totalEL = validELItems.reduce((acc, cur) => acc + (cur.expected_loss || 0), 0);
    const avgEL = validELItems.length > 0 ? totalEL / validELItems.length : 0;

    result.push({
      segmen: seg,
      jumlah_nasabah: count,
      total_ead: totalEAD,
      rata_rata_ead: avgEAD,
      rata_rata_lgd: avgLGD,
      rata_rata_el: avgEL,
      total_el: totalEL
    });
  });

  return result.sort((a, b) => b.total_el - a.total_el);
}

/**
 * Indonesian Rupiah Formatter: e.g. Rp 50.000.000
 */
export function formatCurrencyIDR(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'Rp 0';
  const formatted = Math.round(value).toLocaleString('id-ID');
  return `Rp ${formatted}`;
}

/**
 * Indonesian Percentage Formatter: e.g. 12,50%
 */
export function formatPercentageIDR(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '0,00%';
  return `${value.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
}

/**
 * Indonesian Number Formatter: e.g. 1.250
 */
export function formatNumberIDR(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return value.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
