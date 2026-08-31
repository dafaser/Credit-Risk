import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  Layers, 
  ShieldAlert, 
  PieChart, 
  Table,
  FileCheck2,
  Share2
} from 'lucide-react';
import Papa from 'papaparse';
import { CreditRecord, DatasetSummary } from '../types';
import { 
  getPortfolioRiskAggregates, 
  getSegmentELAggregates, 
  applyFilter1, 
  applyFilter2, 
  applyFilter3 
} from '../utils/creditEngine';

interface ExportDataViewProps {
  records: CreditRecord[];
  summary: DatasetSummary | null;
}

export const ExportDataView: React.FC<ExportDataViewProps> = ({ records, summary }) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // Prepare Cleaned Dataset
  const handleDownloadCleaned = () => {
    downloadCSV(records, 'credit_data_cleaned.csv');
  };

  // Prepare Risk Analysis Dataset (combining filtered items + risk metrics)
  const handleDownloadRiskAnalysis = () => {
    const riskData = records.map(r => ({
      id_nasabah: r.id_nasabah,
      nama_nasabah: r.nama_nasabah,
      skor_kredit: r.skor_kredit,
      flag_npl: r.flag_npl,
      pinjaman: r.pinjaman,
      kategori_risiko: r.kategori_risiko,
      cicilan_bulanan: r.cicilan_bulanan,
      dsr: r.dsr,
      status_kredit: r.status_kredit,
      nama_cabang: r.nama_cabang,
      is_filter_1_high_risk: r.skor_kredit < 550 && r.pinjaman > 50_000_000,
      is_filter_3_age_or_score: (r.usia >= 25 && r.usia <= 60) || r.skor_kredit < 500
    }));
    downloadCSV(riskData, 'risk_analysis.csv');
  };

  // Prepare Portfolio Analysis Dataset
  const handleDownloadPortfolio = () => {
    const riskAgg = getPortfolioRiskAggregates(records);
    const segmentAgg = getSegmentELAggregates(records);

    const portfolioExport = riskAgg.map(r => ({
      kategori_risiko: r.kategori_risiko,
      jumlah_nasabah: r.jumlah_nasabah,
      porsi_persen: r.persentase_nasabah.toFixed(2),
      total_pinjaman: r.total_pinjaman,
      rata_rata_skor: r.rata_rata_skor.toFixed(1),
      rata_rata_pinjaman: r.rata_rata_pinjaman.toFixed(0),
      rata_rata_dsr: r.rata_rata_dsr.toFixed(2),
      rata_rata_expected_loss: r.rata_rata_el !== undefined ? r.rata_rata_el.toFixed(0) : 'N/A'
    }));

    downloadCSV(portfolioExport, 'portfolio_analysis.csv');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Export & Report Generation
          </span>
          <span className="text-xs text-slate-400 font-mono">st.download_button() Engine</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 mt-1">
          Export Hasil Analisis Risiko Kredit
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Unduh hasil data cleaning, agregasi portofolio, dan evaluasi segmentasi risiko dalam format CSV terstruktur.
        </p>
      </div>

      {/* Download Alert Toast */}
      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>File <strong>{downloadSuccess}</strong> berhasil diunduh ke komputer Anda.</span>
        </div>
      )}

      {/* 3 Download Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Cleaned Dataset */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-colors">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Dataset Bersih</span>
            <h3 className="text-base font-bold text-slate-900 mt-1">credit_data_cleaned.csv</h3>
            <p className="text-xs text-slate-500 mt-2">
              Berisi seluruh baris nasabah yang telah dibersihkan (imputasi median skor, ffill cabang, bebas duplikat, kalkulasi cicilan, DSR, kategori risiko, &amp; flag NPL).
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-mono">
              Total Baris: {records.length} Baris
            </div>
          </div>

          <button
            id="btn-download-cleaned"
            onClick={handleDownloadCleaned}
            className="mt-6 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Cleaned CSV</span>
          </button>
        </div>

        {/* Card 2: Risk Analysis */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-rose-300 transition-colors">
          <div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">Analisis Risiko</span>
            <h3 className="text-base font-bold text-slate-900 mt-1">risk_analysis.csv</h3>
            <p className="text-xs text-slate-500 mt-2">
              Berisi hasil evaluasi skor kredit, flag NPL, rasio DSR, status kredit, dan indikator flag 3 filter tugas BFLP.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-mono">
              Total Evaluasi: {records.length} Rekord
            </div>
          </div>

          <button
            id="btn-download-risk"
            onClick={handleDownloadRiskAnalysis}
            className="mt-6 w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Risk Analysis CSV</span>
          </button>
        </div>

        {/* Card 3: Portfolio Analysis */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <PieChart className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Ringkasan Portofolio</span>
            <h3 className="text-base font-bold text-slate-900 mt-1">portfolio_analysis.csv</h3>
            <p className="text-xs text-slate-500 mt-2">
              Tabel agregasi ringkasan portofolio per kategori risiko plafon pinjaman (groupby dan agg skor, pinjaman, DSR, EL).
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-mono">
              Total Kategori: 4 Bucket Plafon
            </div>
          </div>

          <button
            id="btn-download-portfolio"
            onClick={handleDownloadPortfolio}
            className="mt-6 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Portfolio CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
