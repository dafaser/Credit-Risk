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
  FileCode,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { CreditRecord, DatasetSummary } from '../types';
import { 
  getPortfolioRiskAggregates, 
  calculateBranchSegmentAggregates,
  calculateSegmentPivotPD
} from '../utils/creditEngine';

interface ExportDataViewProps {
  records: CreditRecord[];
  summary: DatasetSummary | null;
}

export const ExportDataView: React.FC<ExportDataViewProps> = ({ records, summary }) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copiedPython, setCopiedPython] = useState<boolean>(false);

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

  // 1. Download Cleaned CSV
  const handleDownloadCleaned = () => {
    const cleanRows = records.map(r => ({
      id_nasabah: r.id_nasabah,
      nama_nasabah: r.nama_nasabah,
      usia: r.usia,
      pendapatan: r.pendapatan,
      pinjaman: r.pinjaman,
      tenor_bulan: r.tenor_bulan,
      skor_kredit: r.skor_kredit,
      pd_score: r.pd_score,
      lgd: r.LGD,
      ead: r.EAD,
      expected_loss: r.expected_loss,
      segmen: r.segmen,
      kategori_risiko: r.kategori_risiko,
      kolektibilitas: r.kolektibilitas,
      status_kredit: r.status_kredit,
      nama_cabang: r.nama_cabang,
      tanggal_pengajuan: r.tanggal_pengajuan
    }));
    downloadCSV(cleanRows, 'data_kredit_bri_clean.csv');
  };

  // 2. Download Multi-Sheet Excel (Tugas 3)
  const handleDownloadExcelMultiSheet = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Filtered_Data
    const dataSheet = records.map(r => ({
      'ID Nasabah': r.id_nasabah,
      'Nama Nasabah': r.nama_nasabah,
      'Usia': r.usia,
      'Pendapatan': r.pendapatan,
      'Pinjaman': r.pinjaman,
      'Tenor (Bulan)': r.tenor_bulan,
      'Skor Kredit': r.skor_kredit,
      'PD Score': r.pd_score,
      'LGD': r.LGD,
      'EAD': r.EAD,
      'Expected Loss': r.expected_loss,
      'Segmen': r.segmen,
      'Kategori Risiko': r.kategori_risiko,
      'Status Kredit': r.status_kredit,
      'Cabang': r.nama_cabang,
      'Tanggal Pengajuan': r.tanggal_pengajuan
    }));
    const ws1 = XLSX.utils.json_to_sheet(dataSheet);
    XLSX.utils.book_append_sheet(wb, ws1, 'Filtered_Data');

    // Sheet 2: Aggregation
    const branchAggs = calculateBranchSegmentAggregates(records);
    const aggSheet = branchAggs.map(a => ({
      'Nama Cabang': a.nama_cabang,
      'Segmen': a.segmen,
      'Jumlah Nasabah': a.jumlah_nasabah,
      'Rata-rata PD': a.rata_rata_pd,
      'Rata-rata LGD': a.rata_rata_lgd,
      'Total Pinjaman': a.total_pinjaman,
      'Total EAD': a.total_ead,
      'Rata-rata Pendapatan': a.rata_rata_pendapatan
    }));
    const ws2 = XLSX.utils.json_to_sheet(aggSheet);
    XLSX.utils.book_append_sheet(wb, ws2, 'Aggregation');

    // Sheet 3: Pivot_PD_Segmen
    const pivotPD = calculateSegmentPivotPD(records);
    const ws3 = XLSX.utils.json_to_sheet(pivotPD);
    XLSX.utils.book_append_sheet(wb, ws3, 'Pivot_PD_Segmen');

    XLSX.writeFile(wb, 'risk_dashboard_filtered.xlsx');
    setDownloadSuccess('risk_dashboard_filtered.xlsx');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 3. Download Streamlit Python Script (dashboard_risiko_bri.py)
  const pythonScriptContent = `# ==============================================================================
# DASHBOARD MANAJEMEN RISIKO KREDIT BANK BRI (v1.ipynb)
# Dikembangkan untuk Analisis Portofolio Risiko Kredit & Tugas BFLP
# ==============================================================================

import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import io

st.set_page_config(
    page_title="Dashboard Risiko Kredit BRI",
    page_icon="🏦",
    layout="wide"
)

# Custom Style
sns.set_theme(style="whitegrid")

@st.cache_data
def load_and_clean_data():
    # 1. Load Data
    try:
        df = pd.read_csv("data_kredit_bri.csv")
    except Exception:
        df = pd.read_csv("public/data_kredit_bri.csv")
    
    # 2. Missing Value Imputation
    df["skor_kredit"] = df["skor_kredit"].fillna(df["skor_kredit"].median())
    df["nama_cabang"] = df["nama_cabang"].ffill().fillna("Cabang BRI Sudirman")
    
    # 3. Deduplikasi keep="last"
    if "tanggal_pengajuan" in df.columns:
        df = df.sort_values("tanggal_pengajuan")
    df = df.drop_duplicates(subset=["id_nasabah"], keep="last")
    
    # 4. Outlier Capping (IQR)
    for col in ["pinjaman", "pendapatan"]:
        if col in df.columns:
            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            lower = max(0, q1 - 1.5 * iqr)
            upper = q3 + 1.5 * iqr
            df[col] = df[col].clip(lower=lower, upper=upper)
            
    # 5. Variabel Turunan
    # Segmen
    conditions_segmen = [
        df["pinjaman"] <= 50_000_000,
        (df["pinjaman"] > 50_000_000) & (df["pinjaman"] <= 200_000_000),
        df["pinjaman"] > 200_000_000
    ]
    choices_segmen = ["Mikro", "Kecil", "Menengah"]
    df["segmen"] = np.select(conditions_segmen, choices_segmen, default="Mikro")
    
    # PD calibration if not present
    if "pd" not in df.columns and "pd_score" not in df.columns:
        df["pd"] = 1 / (1 + np.exp((df["skor_kredit"] - 550) / 50))
        df["pd"] = df["pd"].clip(0.01, 0.30)
    elif "pd" not in df.columns and "pd_score" in df.columns:
        df["pd"] = df["pd_score"]
        
    # Kategori Risiko
    conditions_risk = [
        df["pd"] < 0.05,
        (df["pd"] >= 0.05) & (df["pd"] < 0.10),
        df["pd"] >= 0.10
    ]
    choices_risk = ["Rendah", "Menengah", "Tinggi"]
    df["kategori_risiko"] = np.select(conditions_risk, choices_risk, default="Menengah")
    
    # LGD & EAD
    if "lgd" not in df.columns:
        df["lgd"] = np.where(df["status_kredit"] == "Macet", 0.50, 0.40)
    if "ead" not in df.columns:
        df["ead"] = df["pinjaman"]
        
    df["expected_loss"] = df["ead"] * df["lgd"] * df["pd"]
    return df

df = load_and_clean_data()

# --- SIDEBAR FILTERS ---
st.sidebar.header("🔍 Filter Data Portofolio")

segmen_choice = st.sidebar.selectbox("Pilih Segmen:", ["Semua"] + list(df["segmen"].unique()))
cabang_choice = st.sidebar.multiselect("Pilih Cabang:", options=df["nama_cabang"].unique(), default=df["nama_cabang"].unique()[:3])
pd_range = st.sidebar.slider("Rentang Skor PD:", min_value=float(df["pd"].min()), max_value=float(df["pd"].max()), value=(float(df["pd"].min()), float(df["pd"].max())))
status_choice = st.sidebar.selectbox("Status Kredit:", ["Semua", "Lancar", "Macet"])

# Apply Filters
filtered_df = df.copy()
if segmen_choice != "Semua":
    filtered_df = filtered_df[filtered_df["segmen"] == segmen_choice]
if cabang_choice:
    filtered_df = filtered_df[filtered_df["nama_cabang"].isin(cabang_choice)]
filtered_df = filtered_df[(filtered_df["pd"] >= pd_range[0]) & (filtered_df["pd"] <= pd_range[1])]
if status_choice != "Semua":
    filtered_df = filtered_df[filtered_df["status_kredit"] == status_choice]

# --- MAIN DASHBOARD ---
st.title("🏦 Dashboard Manajemen Risiko Kredit — Bank BRI")
st.markdown("Visualisasi interaktif portofolio kredit, estimasi Probability of Default (PD), dan analisis kerugian (EAD & LGD).")

# 4 Key Metrics
k1, k2, k3, k4 = st.columns(4)
total_nasabah = len(filtered_df)
avg_pd = filtered_df["pd"].mean()
macet_count = len(filtered_df[filtered_df["status_kredit"] == "Macet"])
npl_rate = (macet_count / total_nasabah) if total_nasabah > 0 else 0
total_ead = filtered_df["ead"].sum()

k1.metric("Total Nasabah", f"{total_nasabah:,}")
k2.metric("Rata-rata PD", f"{avg_pd:,.4f}" if not pd.isna(avg_pd) else "N/A")
k3.metric("NPL Rate", f"{npl_rate:.2%}" if not pd.isna(npl_rate) else "N/A")
k4.metric("Total Eksposur (EAD)", f"Rp {total_ead:,.0f}" if not pd.isna(total_ead) else "N/A")

st.markdown("---")

# Visualizations Row 1
c1, c2 = st.columns(2)
with c1:
    st.subheader("1. Distribusi Probability of Default (PD)")
    fig1, ax1 = plt.subplots(figsize=(6, 4))
    sns.histplot(filtered_df["pd"], kde=True, bins=25, color="royalblue", ax=ax1)
    ax1.set_xlabel("Probability of Default (PD)")
    ax1.set_ylabel("Frekuensi")
    st.pyplot(fig1)

with c2:
    st.subheader("2. Bubble Chart PD vs LGD per Segmen")
    bubble_data = filtered_df.groupby("segmen").agg(
        avg_pd=("pd", "mean"),
        avg_lgd=("lgd", "mean"),
        total_ead=("ead", "sum")
    ).reset_index()
    
    fig2, ax2 = plt.subplots(figsize=(6, 4))
    scatter = ax2.scatter(
        bubble_data["avg_pd"], 
        bubble_data["avg_lgd"], 
        s=bubble_data["total_ead"] / 5_000_000, 
        alpha=0.6, 
        c=["#10B981", "#3B82F6", "#F59E0B"][:len(bubble_data)],
        edgecolors="black"
    )
    for i, row in bubble_data.iterrows():
        ax2.annotate(row["segmen"], (row["avg_pd"], row["avg_lgd"]), fontsize=9, fontweight="bold")
    ax2.set_xlabel("Rata-rata PD")
    ax2.set_ylabel("Rata-rata LGD")
    st.pyplot(fig2)

# Row 2: Boxplot & Correlation Heatmap
c3, c4 = st.columns(2)
with c3:
    st.subheader("3. Boxplot PD berdasarkan Kategori Risiko")
    fig3, ax3 = plt.subplots(figsize=(6, 4))
    sns.boxplot(data=filtered_df, x="kategori_risiko", y="pd", palette="Set2", ax=ax3)
    ax3.set_xlabel("Kategori Risiko")
    ax3.set_ylabel("PD Score")
    st.pyplot(fig3)

with c4:
    st.subheader("4. Heatmap Korelasi Variabel Risiko")
    fig4, ax4 = plt.subplots(figsize=(6, 4))
    numeric_cols = [c for c in ["pd", "lgd", "ead", "pinjaman", "pendapatan", "skor_kredit"] if c in filtered_df.columns]
    if len(numeric_cols) > 1:
        corr = filtered_df[numeric_cols].corr()
        sns.heatmap(corr, annot=True, cmap="vlag", fmt=".2f", ax=ax4)
    st.pyplot(fig4)

st.markdown("---")

# BONUS CHALLENGE: Top 10 High PD
st.subheader("⭐ Top 10 Nasabah dengan PD Tertinggi (Bonus Challenge)")
top10 = filtered_df.sort_values(by="pd", ascending=False).head(10)
st.dataframe(top10[["id_nasabah", "nama_nasabah", "pd", "lgd", "ead", "segmen", "status_kredit", "nama_cabang"]])

# Export Section
st.subheader("📥 Export Data")
col_exp1, col_exp2 = st.columns(2)
with col_exp1:
    csv_bytes = filtered_df.to_csv(index=False).encode('utf-8')
    st.download_button("Download CSV", data=csv_bytes, file_name="risk_dashboard_filtered.csv", mime="text/csv")
with col_exp2:
    excel_buffer = io.BytesIO()
    with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
        filtered_df.to_excel(writer, sheet_name='Filtered_Data', index=False)
        agg_table = filtered_df.groupby(['nama_cabang', 'segmen']).agg(
            jumlah_nasabah=('id_nasabah', 'count'),
            rata_rata_pd=('pd', 'mean'),
            total_pinjaman=('pinjaman', 'sum'),
            total_ead=('ead', 'sum')
        ).reset_index()
        agg_table.to_excel(writer, sheet_name='Aggregation', index=False)
    st.download_button("Download Excel (.xlsx)", data=excel_buffer.getvalue(), file_name="risk_dashboard_filtered.xlsx")
`;

  const handleDownloadPythonScript = () => {
    const blob = new Blob([pythonScriptContent], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard_risiko_bri.py';
    link.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess('dashboard_risiko_bri.py');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleCopyPythonCode = () => {
    navigator.clipboard.writeText(pythonScriptContent);
    setCopiedPython(true);
    setTimeout(() => setCopiedPython(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Export &amp; Artifact Generation
          </span>
          <span className="text-xs text-slate-500 font-mono">Tugas 3 &amp; Sesi 4</span>
        </div>
        <h2 className="text-lg font-bold text-white mt-1">
          Export Hasil Analisis &amp; Script Python Dashboard
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Unduh dataset bersih, laporan multi-sheet Excel, dan script Streamlit Python (`dashboard_risiko_bri.py`) untuk implementasi mandiri.
        </p>
      </div>

      {/* Download Alert Toast */}
      {downloadSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2.5 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>File <strong>{downloadSuccess}</strong> berhasil diunduh ke komputer Anda.</span>
        </div>
      )}

      {/* 3 Download Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Cleaned Dataset */}
        <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-4">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">Dataset Bersih</span>
            <h3 className="text-base font-bold text-white mt-1">data_kredit_bri_clean.csv</h3>
            <p className="text-xs text-slate-400 mt-2">
              Berisi seluruh baris nasabah yang telah dibersihkan (imputasi median/mode, deduplikasi keep='last', IQR Outlier Capping, &amp; variabel turunan segmen/PD).
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              Total Baris: <span className="text-white font-bold">{records.length} Baris</span>
            </div>
          </div>

          <button
            id="btn-download-cleaned"
            onClick={handleDownloadCleaned}
            className="mt-6 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Cleaned CSV</span>
          </button>
        </div>

        {/* Card 2: Multi-Sheet Excel */}
        <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Excel Multi-Sheet (Tugas 3)</span>
            <h3 className="text-base font-bold text-white mt-1">risk_dashboard_filtered.xlsx</h3>
            <p className="text-xs text-slate-400 mt-2">
              Berisi 2 sheet utama: <strong>'Filtered_Data'</strong> (detail nasabah terfilter) dan <strong>'Aggregation'</strong> (ringkasan per cabang &amp; segmen).
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              Format: <span className="text-emerald-400 font-bold">.xlsx Multi-Sheet</span>
            </div>
          </div>

          <button
            id="btn-download-excel"
            onClick={handleDownloadExcelMultiSheet}
            className="mt-6 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Multi-Sheet Excel</span>
          </button>
        </div>

        {/* Card 3: Streamlit Python Script */}
        <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4">
              <FileCode className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Python Source Code</span>
            <h3 className="text-base font-bold text-white mt-1">dashboard_risiko_bri.py</h3>
            <p className="text-xs text-slate-400 mt-2">
              Script Python lengkap berbasis Streamlit, Seaborn, dan Matplotlib siap dijalankan dengan perintah `streamlit run dashboard_risiko_bri.py`.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              Engine: <span className="text-amber-400 font-bold">Streamlit &amp; Pandas</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              id="btn-download-python"
              onClick={handleDownloadPythonScript}
              className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .py</span>
            </button>
            <button
              onClick={handleCopyPythonCode}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              title="Copy source code ke clipboard"
            >
              {copiedPython ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPython ? 'Tersalin' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
