import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import os
import io

from utils.data_cleaning import clean_credit_data, validate_data
from utils.risk_analysis import get_filter_1, get_filter_2, get_filter_3
from utils.portfolio_analysis import (
    get_risk_category_counts,
    get_expected_loss_metrics,
    get_el_by_segment,
    get_risk_aggregation
)

# ----------------------------------------------------
# 1. PAGE CONFIGURATION
# ----------------------------------------------------
st.set_page_config(
    page_title="BRI Credit Risk Management Dashboard",
    page_icon="🏦",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ----------------------------------------------------
# 2. CUSTOM CSS STYLING (BRI CORPORATE THEME)
# ----------------------------------------------------
st.markdown("""
<style>
    /* Global Font and Styles */
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif;
    }
    
    /* Main container background */
    .stApp {
        background-color: #F8FAFC;
    }
    
    /* Header branding */
    .bri-header {
        background: linear-gradient(135deg, #00529C 0%, #003366 100%);
        color: white;
        padding: 24px;
        border-radius: 16px;
        margin-bottom: 24px;
        box-shadow: 0 4px 12px rgba(0, 82, 156, 0.15);
    }
    
    /* Metric Cards */
    .metric-card {
        background: white;
        padding: 20px;
        border-radius: 14px;
        border: 1px solid #E2E8F0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        margin-bottom: 12px;
    }
    .metric-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748B;
        letter-spacing: 0.5px;
    }
    .metric-value {
        font-size: 22px;
        font-weight: 800;
        color: #0F172A;
        margin-top: 4px;
        font-family: 'Courier New', Courier, monospace;
    }
    .metric-sub {
        font-size: 11px;
        color: #94A3B8;
        margin-top: 4px;
    }
    
    /* Status Badges */
    .badge-clean {
        background-color: #ECFDF5;
        color: #065F46;
        padding: 6px 12px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 700;
        border: 1px solid #A7F3D0;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    
    /* Sidebar Styling */
    section[data-testid="stSidebar"] {
        background-color: #FFFFFF;
        border-right: 1px solid #E2E8F0;
    }
</style>
""", unsafe_allow_html=True)


# ----------------------------------------------------
# 3. HELPER FUNCTIONS
# ----------------------------------------------------
def format_idr(value):
    if pd.isna(value) or value is None:
        return "Rp 0"
    if abs(value) >= 1_000_000_000:
        return f"Rp {value/1_000_000_000:,.2f} Miliar".replace(",", "X").replace(".", ",").replace("X", ".")
    if abs(value) >= 1_000_000:
        return f"Rp {value/1_000_000:,.1f} Juta".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"Rp {value:,.0f}".replace(",", ".")

def format_pct(value):
    if pd.isna(value) or value is None:
        return "0.0%"
    return f"{value:.1f}%"

@st.cache_data
def load_default_dataset():
    paths = ["data/data_kredit_bri.csv", "public/data_kredit_bri.csv", "data_kredit_bri.csv"]
    for p in paths:
        if os.path.exists(p):
            return pd.read_csv(p)
    return None


# ----------------------------------------------------
# 4. SIDEBAR NAVIGATION & UPLOAD
# ----------------------------------------------------
with st.sidebar:
    st.markdown("""
    <div style="text-align: center; padding-bottom: 12px; border-bottom: 1px solid #E2E8F0;">
        <div style="background: #00529C; color: white; border-radius: 12px; padding: 12px; font-weight: 900; font-size: 20px; letter-spacing: 1px;">
            🏦 BANK BRI
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #64748B; margin-top: 6px; text-transform: uppercase;">
            Risk Management Dashboard
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("### 📁 Dataset Kredit")
    uploaded_file = st.file_uploader(
        "Upload dataset (data_kredit_bri.csv)", 
        type=["csv"],
        help="Upload file CSV data kredit untuk dianalisis."
    )
    
    st.markdown("---")
    st.markdown("### 🧭 Menu Navigasi")
    menu_options = [
        "📊 Dashboard Overview",
        "🔍 Data Explorer",
        "🛡️ Analisis Risiko & 3 Filter",
        "📈 Analisis Portofolio & Expected Loss",
        "🧹 Data Cleaning Pipeline",
        "📥 Export Data"
    ]
    selected_page = st.radio("Pilih Halaman:", menu_options, label_visibility="collapsed")
    
    st.markdown("---")
    # User Profile Box
    st.markdown("""
    <div style="background: #F1F5F9; border-radius: 12px; padding: 12px; border: 1px solid #CBD5E1;">
        <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Analyst Profile</div>
        <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-top: 2px;">Anandafa Syukur Rizky</div>
        <div style="font-size: 11px; color: #00529C; font-weight: 600;">BFLP Risk Management</div>
        <div style="font-size: 10px; color: #64748B; margin-top: 4px;">Hari 2 Sesi 2: Pandas Risk Analytics</div>
    </div>
    """, unsafe_allow_html=True)


# ----------------------------------------------------
# 5. DATA INGESTION & PIPELINE
# ----------------------------------------------------
if uploaded_file is not None:
    try:
        raw_df = pd.read_csv(uploaded_file)
        file_name = uploaded_file.name
    except Exception as e:
        st.error(f"Gagal membaca file CSV: {str(e)}")
        st.stop()
else:
    raw_df = load_default_dataset()
    file_name = "data_kredit_bri.csv (Default Dataset)"

if raw_df is None or raw_df.empty:
    st.warning("⚠️ Dataset belum tersedia. Silakan upload file `data_kredit_bri.csv` melalui sidebar.")
    st.stop()

# Run Data Cleaning Pipeline
df_clean, cleaning_stats = clean_credit_data(raw_df)
validation_checks = validate_data(df_clean)


# ----------------------------------------------------
# 6. HEADER BAR
# ----------------------------------------------------
st.markdown(f"""
<div class="bri-header">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
        <div>
            <div style="font-size: 12px; font-weight: 700; color: #93C5FD; text-transform: uppercase; letter-spacing: 1px;">
                PT Bank Rakyat Indonesia (Persero) Tbk • Risk Analytics Unit
            </div>
            <h1 style="margin: 4px 0 0 0; font-size: 26px; font-weight: 800; color: white;">
                Credit Risk Management Dashboard
            </h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #E2E8F0;">
                Program BFLP Risk Management • Pipeline Analisis Risiko & Evaluasi Kualitas Kredit
            </p>
        </div>
        <div style="background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 12px; font-size: 12px; border: 1px solid rgba(255,255,255,0.2);">
            📄 <strong>{file_name}</strong> | 👥 <strong>{len(df_clean)}</strong> Nasabah Terverifikasi
        </div>
    </div>
</div>
""", unsafe_allow_html=True)


# ====================================================
# PAGE 1: DASHBOARD OVERVIEW
# ====================================================
if selected_page == "📊 Dashboard Overview":
    st.markdown("### 📌 Key Performance Indicators (KPI) Portofolio Kredit")
    
    # KPIs Calculation
    total_nasabah = len(df_clean)
    total_pinjaman = df_clean["pinjaman"].sum() if "pinjaman" in df_clean.columns else 0
    macet_count = len(df_clean[df_clean["status_kredit"] == "Macet"]) if "status_kredit" in df_clean.columns else 0
    npl_rate = (macet_count / total_nasabah * 100) if total_nasabah > 0 else 0
    avg_score = df_clean["skor_kredit"].mean() if "skor_kredit" in df_clean.columns else 0
    avg_dsr = df_clean["dsr"].mean() if "dsr" in df_clean.columns else 0
    avg_tenor = df_clean["tenor_bulan"].mean() if "tenor_bulan" in df_clean.columns else 0

    col1, col2, col3, col4, col5, col6 = st.columns(6)
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Total Nasabah</div>
            <div class="metric-value">{total_nasabah:,}</div>
            <div class="metric-sub">Debitur Aktif</div>
        </div>
        """, unsafe_allow_html=True)
    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Total Pinjaman</div>
            <div class="metric-value">{format_idr(total_pinjaman)}</div>
            <div class="metric-sub">Outstanding Portfolio</div>
        </div>
        """, unsafe_allow_html=True)
    with col3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">NPL Rate</div>
            <div class="metric-value" style="color: {'#EF4444' if npl_rate > 5 else '#10B981'};">{npl_rate:.2f}%</div>
            <div class="metric-sub">{macet_count} Debitur Macet</div>
        </div>
        """, unsafe_allow_html=True)
    with col4:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Rata-rata Skor</div>
            <div class="metric-value" style="color: #00529C;">{avg_score:.1f}</div>
            <div class="metric-sub">Skala Kredit (300-850)</div>
        </div>
        """, unsafe_allow_html=True)
    with col5:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Rata-rata DSR</div>
            <div class="metric-value" style="color: {'#EF4444' if avg_dsr > 40 else '#10B981'};">{avg_dsr:.1f}%</div>
            <div class="metric-sub">Batas Aman: ≤ 40%</div>
        </div>
        """, unsafe_allow_html=True)
    with col6:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Rata-rata Tenor</div>
            <div class="metric-value">{avg_tenor:.1f} Bln</div>
            <div class="metric-sub">Durasi Angsuran</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")
    
    # 2 Charts Overview
    chart_col1, chart_col2 = st.columns(2)
    
    with chart_col1:
        st.markdown("##### 📊 Distribusi Flag NPL Portofolio")
        if "flag_npl" in df_clean.columns:
            npl_summary = df_clean["flag_npl"].value_counts().reset_index()
            npl_summary.columns = ["Flag NPL", "Jumlah Nasabah"]
            
            color_map = {
                "Rendah": "#10B981",
                "Sedang-Rendah": "#3B82F6",
                "Sedang-Tinggi": "#F59E0B",
                "Tinggi": "#EF4444"
            }
            fig_npl = px.bar(
                npl_summary,
                x="Flag NPL",
                y="Jumlah Nasabah",
                color="Flag NPL",
                color_discrete_map=color_map,
                text="Jumlah Nasabah"
            )
            fig_npl.update_layout(showlegend=False, margin=dict(t=10, b=10, l=10, r=10), height=280)
            st.plotly_chart(fig_npl, use_container_width=True)
            
    with chart_col2:
        st.markdown("##### 🥧 Komposisi Kategori Risiko Plafon")
        if "kategori_risiko" in df_clean.columns:
            risk_summary = df_clean["kategori_risiko"].value_counts().reset_index()
            risk_summary.columns = ["Kategori Risiko", "Jumlah Nasabah"]
            fig_risk = px.pie(
                risk_summary,
                names="Kategori Risiko",
                values="Jumlah Nasabah",
                color_discrete_sequence=["#10B981", "#3B82F6", "#F59E0B", "#EF4444"],
                hole=0.45
            )
            fig_risk.update_layout(margin=dict(t=10, b=10, l=10, r=10), height=280)
            st.plotly_chart(fig_risk, use_container_width=True)

    # Top High Risk Debtor Section
    st.markdown("##### ⚠️ Debitur Risiko Tertinggi (High DSR & Low Score)")
    high_risk_df = df_clean[(df_clean["dsr"] > 40) | (df_clean["skor_kredit"] < 550)].sort_values(by="dsr", ascending=False).head(5)
    
    display_cols = [c for c in ["id_nasabah", "nama_nasabah", "pinjaman", "cicilan_bulanan", "dsr", "skor_kredit", "status_kredit", "flag_npl", "nama_cabang"] if c in high_risk_df.columns]
    st.dataframe(high_risk_df[display_cols], use_container_width=True)


# ====================================================
# PAGE 2: DATA EXPLORER
# ====================================================
elif selected_page == "🔍 Data Explorer":
    st.markdown("### 🔍 Data Explorer & Customer Lookup")
    st.markdown("Pencarian interaktif, filtering multi-dimensi, dan inspeksi profil debitur individual.")

    exp_col1, exp_col2, exp_col3, exp_col4 = st.columns(4)
    with exp_col1:
        search_query = st.text_input("🔍 Cari ID / Nama Nasabah:", placeholder="Contoh: BRI-1001 / Budi")
    with exp_col2:
        status_options = ["Semua"] + list(df_clean["status_kredit"].unique()) if "status_kredit" in df_clean.columns else ["Semua"]
        sel_status = st.selectbox("Status Kredit:", status_options)
    with exp_col3:
        branch_options = ["Semua"] + sorted(list(df_clean["nama_cabang"].dropna().unique())) if "nama_cabang" in df_clean.columns else ["Semua"]
        sel_branch = st.selectbox("Kantor Cabang:", branch_options)
    with exp_col4:
        risk_options = ["Semua"] + list(df_clean["kategori_risiko"].dropna().unique().astype(str)) if "kategori_risiko" in df_clean.columns else ["Semua"]
        sel_risk = st.selectbox("Kategori Risiko Plafon:", risk_options)

    # Sliders
    sl_col1, sl_col2 = st.columns(2)
    with sl_col1:
        min_score = st.slider("Filter Minimal Skor Kredit:", min_value=300, max_value=850, value=300, step=10)
    with sl_col2:
        max_loan_jt = st.slider("Maksimal Plafon Pinjaman (Juta Rp):", min_value=25, max_value=1500, value=1500, step=25)

    # Apply Filters
    filtered_df = df_clean.copy()
    if search_query:
        mask_id = filtered_df["id_nasabah"].astype(str).str.contains(search_query, case=False, na=False)
        mask_name = filtered_df["nama_nasabah"].astype(str).str.contains(search_query, case=False, na=False) if "nama_nasabah" in filtered_df.columns else mask_id
        filtered_df = filtered_df[mask_id | mask_name]
    if sel_status != "Semua":
        filtered_df = filtered_df[filtered_df["status_kredit"] == sel_status]
    if sel_branch != "Semua":
        filtered_df = filtered_df[filtered_df["nama_cabang"] == sel_branch]
    if sel_risk != "Semua":
        filtered_df = filtered_df[filtered_df["kategori_risiko"].astype(str) == sel_risk]
    if "skor_kredit" in filtered_df.columns:
        filtered_df = filtered_df[filtered_df["skor_kredit"] >= min_score]
    if "pinjaman" in filtered_df.columns:
        filtered_df = filtered_df[filtered_df["pinjaman"] <= max_loan_jt * 1_000_000]

    st.markdown(f"Menampilkan **{len(filtered_df)}** dari **{len(df_clean)}** data nasabah:")
    st.dataframe(filtered_df, use_container_width=True, height=400)


# ====================================================
# PAGE 3: ANALISIS RISIKO & 3 FILTER
# ====================================================
elif selected_page == "🛡️ Analisis Risiko & 3 Filter":
    st.markdown("### 🛡️ Analisis Risiko Kredit & 3 Filter Tugas Pandas")
    st.markdown("Evaluasi 3 skenario filtering risiko sesuai penugasan Data Driven Risk Management BFLP.")

    tab_filters, tab_charts = st.tabs(["🎯 3 Filter Tugas Pandas", "📊 5 Grafik Visualisasi Risiko"])

    with tab_filters:
        # FILTER 1
        st.markdown("#### 1️⃣ FILTER 1: Skor Kredit < 550 DAN Pinjaman > Rp 50 Juta")
        st.code('df[(df["skor_kredit"] < 550) & (df["pinjaman"] > 50_000_000)]', language="python")
        f1_df = get_filter_1(df_clean)
        st.info(f"Ditemukan **{len(f1_df)}** nasabah pada kriteria Filter 1.")
        if not f1_df.empty:
            st.dataframe(f1_df, use_container_width=True)

        st.markdown("---")

        # FILTER 2
        st.markdown("#### 2️⃣ FILTER 2: Status Kredit 'Macet' DAN Cabang Terpilih (.isin())")
        st.code('df[(df["status_kredit"] == "Macet") & (df["nama_cabang"].isin(selected_branches))]', language="python")
        all_branches = sorted(list(df_clean["nama_cabang"].dropna().unique())) if "nama_cabang" in df_clean.columns else []
        selected_branches = st.multiselect("Pilih Cabang untuk Evaluasi Kredit Macet:", all_branches, default=all_branches[:3] if len(all_branches) >= 3 else all_branches)
        
        f2_df = get_filter_2(df_clean, selected_branches)
        st.warning(f"Ditemukan **{len(f2_df)}** nasabah kredit macet pada cabang yang dipilih.")
        if not f2_df.empty:
            st.dataframe(f2_df, use_container_width=True)

        st.markdown("---")

        # FILTER 3
        st.markdown("#### 3️⃣ FILTER 3: Usia 25–60 Tahun ATAU Skor Kredit < 500")
        st.code('df[((df["usia"] >= 25) & (df["usia"] <= 60)) | (df["skor_kredit"] < 500)]', language="python")
        f3_df = get_filter_3(df_clean)
        st.success(f"Ditemukan **{len(f3_df)}** nasabah pada kriteria Filter 3.")
        if not f3_df.empty:
            st.dataframe(f3_df, use_container_width=True)

    with tab_charts:
        st.markdown("#### 📊 5 Grafik Visualisasi Risiko Portofolio")
        
        c1, c2 = st.columns(2)
        with c1:
            st.markdown("##### 1. Distribusi Kategori Risiko (Plafon)")
            if "kategori_risiko" in df_clean.columns:
                fig1 = px.bar(df_clean["kategori_risiko"].value_counts().reset_index(), x="kategori_risiko", y="count", color="kategori_risiko", text_auto=True)
                fig1.update_layout(showlegend=False, height=280)
                st.plotly_chart(fig1, use_container_width=True)

        with c2:
            st.markdown("##### 2. Distribusi Flag NPL")
            if "flag_npl" in df_clean.columns:
                fig2 = px.bar(df_clean["flag_npl"].value_counts().reset_index(), x="flag_npl", y="count", color="flag_npl", text_auto=True)
                fig2.update_layout(showlegend=False, height=280)
                st.plotly_chart(fig2, use_container_width=True)

        c3, c4 = st.columns(2)
        with c3:
            st.markdown("##### 3. Distribusi Status Kredit")
            if "status_kredit" in df_clean.columns:
                fig3 = px.pie(df_clean["status_kredit"].value_counts().reset_index(), names="status_kredit", values="count", color="status_kredit", color_discrete_map={"Lancar": "#10B981", "Macet": "#EF4444"})
                fig3.update_layout(height=280)
                st.plotly_chart(fig3, use_container_width=True)

        with c4:
            st.markdown("##### 4. Rata-rata Skor Kredit per Kategori Risiko")
            if "kategori_risiko" in df_clean.columns and "skor_kredit" in df_clean.columns:
                score_agg = df_clean.groupby("kategori_risiko", observed=False)["skor_kredit"].mean().reset_index()
                fig4 = px.bar(score_agg, x="kategori_risiko", y="skor_kredit", color="kategori_risiko", text_auto=".1f")
                fig4.update_layout(showlegend=False, yaxis_range=[300, 850], height=280)
                st.plotly_chart(fig4, use_container_width=True)

        st.markdown("##### 5. Rata-rata DSR Berdasarkan Kategori Risiko")
        if "kategori_risiko" in df_clean.columns and "dsr" in df_clean.columns:
            dsr_agg = df_clean.groupby("kategori_risiko", observed=False)["dsr"].mean().reset_index()
            fig5 = px.bar(dsr_agg, x="kategori_risiko", y="dsr", color="dsr", color_continuous_scale="Reds", text_auto=".2f")
            fig5.update_layout(height=300)
            st.plotly_chart(fig5, use_container_width=True)


# ====================================================
# PAGE 4: ANALISIS PORTOFOLIO & EXPECTED LOSS
# ====================================================
elif selected_page == "📈 Analisis Portofolio & Expected Loss":
    st.markdown("### 📈 Analisis Portofolio & Expected Loss (EL) BRI")
    st.markdown("Pemodelan risiko kerugian penurunan nilai (CKPN) dan agregasi statistik portofolio.")

    # Section B: Expected Loss
    st.markdown("#### 🧮 B. Perhitungan Expected Loss (EL = EAD × LGD)")
    st.code('df["expected_loss"] = df["EAD"] * (df["LGD"] / 100 if df["LGD"] > 1 else df["LGD"])', language="python")
    el_metrics = get_expected_loss_metrics(df_clean)
    
    if el_metrics["has_el"]:
        el_c1, el_c2, el_c3, el_c4, el_c5 = st.columns(5)
        with el_c1:
            st.metric("Total EAD", format_idr(el_metrics["total_ead"]))
        with el_c2:
            st.metric("Rata-rata EAD", format_idr(el_metrics["avg_ead"]))
        with el_c3:
            st.metric("Rata-rata LGD", f"{el_metrics['avg_lgd']*100:.1f}%")
        with el_c4:
            st.metric("Total Expected Loss", format_idr(el_metrics["total_el"]))
        with el_c5:
            st.metric("Rata-rata EL", format_idr(el_metrics["avg_el"]))
    else:
        st.warning("Kolom EAD dan LGD tidak tersedia pada dataset.")

    st.markdown("---")

    col_a, col_c = st.columns(2)
    with col_a:
        st.markdown("#### 👥 A. Jumlah Nasabah per Kategori Risiko")
        st.code('df["kategori_risiko"].value_counts()', language="python")
        risk_counts = get_risk_category_counts(df_clean)
        st.dataframe(risk_counts, use_container_width=True)

    with col_c:
        st.markdown("#### 🏢 C. Expected Loss per Segmen Pinjaman")
        st.code('df.groupby("segmen")["expected_loss"].mean()', language="python")
        seg_el = get_el_by_segment(df_clean)
        if not seg_el.empty:
            st.dataframe(seg_el, use_container_width=True)
        else:
            st.info("Data segmentasi EL belum tersedia.")

    st.markdown("---")

    # Section D: Agregasi Risiko
    st.markdown("#### 📊 D. Agregasi Risiko Lengkap (groupby & agg)")
    st.code('df.groupby("kategori_risiko").agg({"skor_kredit": "mean", "pinjaman": "mean", "dsr": "mean"})', language="python")
    risk_agg = get_risk_aggregation(df_clean)
    if not risk_agg.empty:
        st.dataframe(risk_agg, use_container_width=True)


# ====================================================
# PAGE 5: DATA CLEANING PIPELINE
# ====================================================
elif selected_page == "🧹 Data Cleaning Pipeline":
    st.markdown("### 🧹 Monitoring Pembersihan Data (Data Cleaning Pipeline)")
    
    # Status Badge
    is_all_clean = all(validation_checks.values())
    if is_all_clean:
        st.markdown('<div class="badge-clean">🛡️ DATA CLEAN ✓ (Semua Aturan Validasi Terpenuhi)</div>', unsafe_allow_html=True)
    else:
        st.warning("⚠️ Terdapat beberapa aturan validasi yang memerlukan perhatian.")

    st.markdown("<br>", unsafe_allow_html=True)
    
    # KPI Counters
    k1, k2, k3, k4, k5 = st.columns(5)
    with k1:
        st.metric("Baris Sebelum", cleaning_stats["rows_before"])
    with k2:
        st.metric("Baris Sesudah", cleaning_stats["rows_after"])
    with k3:
        st.metric("Duplikasi Dihapus", cleaning_stats["duplicates_removed"])
    with k4:
        st.metric("Outlier / Invalid", cleaning_stats["invalid_rows_removed"] + cleaning_stats["null_mandatory_removed"])
    with k5:
        st.metric("Imputasi Missing", cleaning_stats["missing_scores_imputed"] + cleaning_stats["missing_branches_imputed"])

    st.markdown("---")

    cl_c1, cl_c2 = st.columns(2)
    with cl_c1:
        st.markdown("##### 📋 Perbandingan Missing Value Sebelum & Sesudah")
        missing_df = pd.DataFrame({
            "Kolom": list(cleaning_stats["missing_before"].keys()),
            "Missing Sebelum": list(cleaning_stats["missing_before"].values()),
            "Missing Sesudah": [cleaning_stats["missing_after"].get(k, 0) for k in cleaning_stats["missing_before"].keys()]
        })
        st.dataframe(missing_df, use_container_width=True)

    with cl_c2:
        st.markdown("##### ✅ Checklist Validasi Data (validate_data)")
        for rule, passed in validation_checks.items():
            if passed:
                st.success(f"✓ {rule}")
            else:
                st.error(f"✗ {rule}")


# ====================================================
# PAGE 6: EXPORT DATA
# ====================================================
elif selected_page == "📥 Export Data":
    st.markdown("### 📥 Export Hasil Analisis Portofolio Risiko")
    st.markdown("Unduh dataset hasil pembersihan dan tabel ringkasan agregasi dalam format CSV.")

    e_col1, e_col2, e_col3 = st.columns(3)
    
    with e_col1:
        st.markdown("#### 1. Dataset Bersih")
        st.markdown("`credit_data_cleaned.csv`")
        csv_clean = df_clean.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="⬇️ Download Cleaned CSV",
            data=csv_clean,
            file_name="credit_data_cleaned.csv",
            mime="text/csv",
            use_container_width=True
        )

    with e_col2:
        st.markdown("#### 2. Analisis Risiko")
        st.markdown("`risk_analysis.csv`")
        risk_cols = [c for c in ["id_nasabah", "skor_kredit", "flag_npl", "pinjaman", "kategori_risiko", "dsr", "status_kredit", "nama_cabang"] if c in df_clean.columns]
        csv_risk = df_clean[risk_cols].to_csv(index=False).encode('utf-8')
        st.download_button(
            label="⬇️ Download Risk CSV",
            data=csv_risk,
            file_name="risk_analysis.csv",
            mime="text/csv",
            use_container_width=True
        )

    with e_col3:
        st.markdown("#### 3. Ringkasan Portofolio")
        st.markdown("`portfolio_analysis.csv`")
        risk_agg = get_risk_aggregation(df_clean)
        csv_port = risk_agg.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="⬇️ Download Portfolio CSV",
            data=csv_port,
            file_name="portfolio_analysis.csv",
            mime="text/csv",
            use_container_width=True
        )
