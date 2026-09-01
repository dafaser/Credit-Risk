export interface RawCreditRecord {
  [key: string]: string | number | null | undefined;
}

export interface CreditRecord {
  id_nasabah: string;
  nama_nasabah?: string;
  usia: number;
  pendapatan: number;
  pinjaman: number;
  tenor_bulan: number;
  skor_kredit: number;
  status_kredit: 'Lancar' | 'Macet' | string;
  nama_cabang: string;
  tanggal_akad?: string;
  tanggal_pengajuan?: string;
  EAD: number;
  LGD: number;
  pd_score: number; // Probability of Default (0.0000 - 1.0000)
  segmen: 'Mikro' | 'Kecil' | 'Menengah' | string;
  kategori_risiko: 'Rendah' | 'Menengah' | 'Tinggi' | string;
  kolektibilitas: 'Lancar' | 'Macet' | string;
  // Computed fields
  cicilan_bulanan: number;
  dsr: number;
  flag_npl: 'Rendah' | 'Sedang-Rendah' | 'Sedang-Tinggi' | 'Tinggi' | 'Tidak Diketahui';
  expected_loss?: number;
  pinjaman_raw?: number;
  pendapatan_raw?: number;
  [key: string]: any;
}

export interface IQROutlierReport {
  column: string;
  columnLabel: string;
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  outliersBeforeCap: number;
  minBefore: number;
  maxBefore: number;
  minAfter: number;
  maxAfter: number;
}

export interface CleaningStats {
  rowsBefore: number;
  rowsAfter: number;
  duplicatesRemoved: number;
  missingScoresImputed: number;
  missingBranchesImputed: number;
  missingNumericImputed: number;
  missingCategoricalImputed: number;
  invalidRowsRemoved: number;
  nullIdOrLoanRemoved: number;
  missingValuesBefore: { [column: string]: number };
  missingValuesAfter: { [column: string]: number };
  iqrReports: IQROutlierReport[];
}

export interface ValidationItem {
  id: string;
  title: string;
  description: string;
  isValid: boolean;
}

export interface DatasetSummary {
  fileName: string;
  fileSize: number;
  totalRows: number;
  totalColumns: number;
  columnNames: string[];
  columnTypes: { [column: string]: string };
  missingValues: { [column: string]: number };
  uniqueValues: { [column: string]: number };
  branches: string[];
  statuses: string[];
  segments: string[];
  hasEAD: boolean;
  hasLGD: boolean;
  hasPD?: boolean;
  hasDate: boolean;
  dateColumnName?: string;
}

export interface PortfolioRiskAggregate {
  kategori_risiko: string;
  jumlah_nasabah: number;
  total_pinjaman: number;
  persentase_nasabah: number;
  rata_rata_skor: number;
  rata_rata_pd: number;
  rata_rata_pinjaman: number;
  rata_rata_dsr: number;
  rata_rata_el?: number;
  total_el?: number;
}

export interface SegmentELAggregate {
  segmen: string;
  jumlah_nasabah: number;
  total_ead: number;
  rata_rata_ead: number;
  rata_rata_lgd: number;
  rata_rata_pd: number;
  rata_rata_el: number;
  total_el: number;
}

export interface BranchSegmentAggregate {
  nama_cabang: string;
  segmen: string;
  jumlah_nasabah: number;
  rata_rata_pd: number;
  rata_rata_lgd: number;
  total_ead: number;
  total_pinjaman: number;
  rata_rata_pendapatan: number;
}

export interface SegmentPivotPD {
  segmen: string;
  rata_rata_pd: number;
  jumlah_nasabah: number;
  total_pinjaman: number;
  total_ead: number;
}

export interface BoxplotStats {
  category: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  lowerWhisker: number;
  upperWhisker: number;
  outliers: number[];
  count: number;
  mean: number;
}

export interface CorrelationMatrix {
  variables: string[];
  labels: string[];
  matrix: number[][];
}

export interface CrosstabData {
  segmen: string;
  Lancar: number;
  Macet: number;
  Total: number;
  nplRate: number;
}

export type ActivePage = 
  | 'dashboard' 
  | 'visualisasi-risiko' 
  | 'risk-analysis'
  | 'risiko'
  | 'data-cleaning' 
  | 'data-explorer' 
  | 'portfolio-analysis' 
  | 'export-data';

