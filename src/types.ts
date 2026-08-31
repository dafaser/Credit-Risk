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
  EAD?: number;
  LGD?: number;
  segmen?: string;
  // Computed fields
  cicilan_bulanan: number;
  dsr: number;
  kategori_risiko: '0–25 Juta' | '25–100 Juta' | '100–500 Juta' | '> 500 Juta' | 'Tidak Terkategori';
  flag_npl: 'Rendah' | 'Sedang-Rendah' | 'Sedang-Tinggi' | 'Tinggi' | 'Tidak Diketahui';
  expected_loss?: number;
  [key: string]: any;
}

export interface CleaningStats {
  rowsBefore: number;
  rowsAfter: number;
  duplicatesRemoved: number;
  missingScoresImputed: number;
  missingBranchesImputed: number;
  invalidRowsRemoved: number; // age < 18 or > 75, income < 0
  nullIdOrLoanRemoved: number;
  missingValuesBefore: { [column: string]: number };
  missingValuesAfter: { [column: string]: number };
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
  hasDate: boolean;
  dateColumnName?: string;
}

export interface PortfolioRiskAggregate {
  kategori_risiko: string;
  jumlah_nasabah: number;
  total_pinjaman: number;
  persentase_nasabah: number;
  rata_rata_skor: number;
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
  rata_rata_el: number;
  total_el: number;
}

export type ActivePage = 
  | 'dashboard' 
  | 'data-explorer' 
  | 'risk-analysis' 
  | 'portfolio-analysis' 
  | 'data-cleaning' 
  | 'export-data';
