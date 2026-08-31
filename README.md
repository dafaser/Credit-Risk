# BRI Credit Risk Management Dashboard
### Tugas Data Driven Risk Management BFLP – Hari 2 Sesi 2: Pandas – Fondasi Data Analysis

**Analyst Profile:**
- **Nama:** Anandafa Syukur Rizky
- **Program:** BFLP Risk Management
- **Institusi:** PT Bank Rakyat Indonesia (Persero) Tbk

---

## 📌 Deskripsi Proyek

Aplikasi **BRI Credit Risk Management Dashboard** adalah dashboard analisis risiko kredit profesional yang dirancang untuk menganalisis portofolio pinjaman nasabah Bank BRI. Aplikasi ini mengotomatiskan seluruh pipeline data science perbankan, mulai dari *data ingestion*, *data cleaning*, *feature engineering (DSR, NPL Flag, Risk Category, Expected Loss)*, *filtering risiko multivariat*, hingga *visualisasi interaktif dan export data*.

---

## 🚀 Fitur Utama Dashboard

1. **📊 Dashboard Overview:**
   - 6 Kartu KPI Utama: Total Nasabah, Total Pinjaman Outstanding, NPL Rate (%), Rata-rata Skor Kredit, Rata-rata DSR (%), dan Rata-rata Tenor (Bulan).
   - Visualisasi ringkasan komposisi portofolio (Distribusi NPL & Kategori Plafon Risiko).
   - Early Warning System untuk nasabah berisiko tinggi.

2. **🔍 Data Explorer:**
   - Pencarian cepat berdasarkan `id_nasabah` dan nama debitur.
   - Multi-filtering berdasarkan Status Kredit, Kantor Cabang, Kategori Risiko, Minimal Skor Kredit, dan Plafon Pinjaman Maksimum.
   - Tabel interaktif dengan pengurutan kolom, pagination, dan modal inspeksi debitur individual.

3. **🛡️ Analisis Risiko & 3 Filter Tugas Pandas:**
   - **FILTER 1:** `df[(df["skor_kredit"] < 550) & (df["pinjaman"] > 50_000_000)]`
   - **FILTER 2:** `df[(df["status_kredit"] == "Macet") & (df["nama_cabang"].isin(selected_branches))]`
   - **FILTER 3:** `df[((df["usia"] >= 25) & (df["usia"] <= 60)) | (df["skor_kredit"] < 500)]`
   - **5 Grafik Interaktif:**
     1. Distribusi Kategori Risiko Plafon
     2. Distribusi Flag NPL
     3. Distribusi Status Kredit (Lancar vs Macet)
     4. Rata-rata Skor Kredit per Kategori Risiko
     5. Rata-rata DSR per Kategori Risiko

4. **📈 Analisis Portofolio & Expected Loss (Basel II / IFRS 9):**
   - **A. Jumlah Nasabah per Risiko:** Tabel `df["kategori_risiko"].value_counts()`.
   - **B. Expected Loss (EL = EAD × LGD):** Perhitungan Total EAD, Rata-rata EAD, Rata-rata LGD, Total EL, dan Rata-rata EL.
   - **C. EL per Segmen Pinjaman:** Tabel `df.groupby("segmen")["expected_loss"].mean()`.
   - **D. Agregasi Risiko Lengkap:** `df.groupby("kategori_risiko").agg({"skor_kredit": "mean", "pinjaman": "mean", "dsr": "mean"})`.

5. **🧹 Data Cleaning Pipeline & Quality Assurance:**
   - Imputasi nilai kosong: `skor_kredit` menggunakan median, `nama_cabang` menggunakan forward fill (`ffill`).
   - Deduplikasi `id_nasabah` dengan parameter `keep="last"`.
   - Konversi format numerik (pembersihan prefix 'Rp', titik, spasi).
   - Pemfilteran data invalid/outlier (`usia < 18` atau `> 75`, `pendapatan < 0`).
   - Audit missing value sebelum vs sesudah pembersihan.
   - Checklist `validate_data` dengan indikator status **DATA CLEAN ✓**.

6. **📥 Export Data:**
   - Download `credit_data_cleaned.csv`
   - Download `risk_analysis.csv`
   - Download `portfolio_analysis.csv`

---

## 🛠️ Panduan Menjalankan Aplikasi

### Opsi 1: Menjalankan Streamlit (Python)

1. Pastikan Python 3.9+ sudah terpasang.
2. Install dependensi:
   ```bash
   pip install -r requirements.txt
   ```
3. Jalankan aplikasi Streamlit:
   ```bash
   streamlit run app.py
   ```

### Opsi 2: Menjalankan Web Dashboard (React + Vite)

1. Install dependensi Node.js:
   ```bash
   npm install
   ```
2. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
3. Buka browser di `http://localhost:3000`.

---

## 📂 Struktur Direktori Proyek

```
├── app.py                      # File utama Streamlit
├── requirements.txt            # Dependensi Python
├── utils/                      # Modul utilitas analisis risiko Python
│   ├── __init__.py
│   ├── data_cleaning.py        # Pipeline clean_credit_data & validate_data
│   ├── risk_analysis.py        # Filter 1, 2, 3 logic
│   └── portfolio_analysis.py   # Agregasi & Expected Loss
├── data/
│   └── data_kredit_bri.csv     # Dataset kredit BRI
├── public/
│   └── data_kredit_bri.csv     # Asset dataset untuk browser
├── src/                        # Kode sumber frontend React + TypeScript
│   ├── components/             # Komponen visual dashboard & view
│   ├── utils/creditEngine.ts   # Core engine analisis risiko TypeScript
│   ├── types.ts                # Deklarasi tipe data TypeScript
│   ├── App.tsx                 # Controller aplikasi
│   └── main.tsx
└── README.md                   # Dokumentasi proyek
```
