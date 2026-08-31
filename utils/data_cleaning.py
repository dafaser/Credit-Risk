import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any

def clean_credit_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Fungsi pembersihan data kredit sesuai tugas BFLP Hari 2 Sesi 2:
    - Missing value: skor_kredit (median), nama_cabang (ffill), drop jika id_nasabah / pinjaman null.
    - Duplicate: hapus duplikasi id_nasabah dengan keep='last'.
    - Numeric Conversion: membersihkan string 'Rp', '.', ',', spasi lalu pd.to_numeric(errors='coerce').
    - Date Conversion: pd.to_datetime(errors='coerce') pada kolom tanggal jika ada.
    - Status Standardization: str.strip().str.title() ('Lancar' / 'Macet').
    - Outlier Filtering: usia < 18 atau usia > 75, pendapatan < 0.
    - Feature Engineering: cicilan_bulanan, dsr, kategori_risiko, flag_npl, expected_loss.
    """
    df_clean = df.copy()
    rows_before = len(df_clean)
    
    # Audit missing values sebelum cleaning
    missing_before = df_clean.isnull().sum().to_dict()

    # 1. Standardisasi nama kolom (hilangkan spasi berlebih)
    df_clean.columns = [c.strip() for c in df_clean.columns]

    # 2. Pembersihan format numerik pada kolom string (menghapus Rp, titik ribuan, spasi)
    numeric_candidates = ["pinjaman", "skor_kredit", "pendapatan", "tenor_bulan", "EAD", "LGD", "usia"]
    for col in numeric_candidates:
        if col in df_clean.columns:
            if df_clean[col].dtype == "object":
                # Bersihkan Rp, spasi
                cleaned_str = (
                    df_clean[col]
                    .astype(str)
                    .str.replace(r"[rR][pP]", "", regex=True)
                    .str.replace(r"\s+", "", regex=True)
                )
                # Tangani separator ribuan '.' dan desimal ',' jika ada
                if cleaned_str.str.contains(r"\.").any() and cleaned_str.str.contains(r",").any():
                    cleaned_str = cleaned_str.str.replace(".", "", regex=False).str.replace(",", ".", regex=False)
                elif cleaned_str.str.contains(r"\.").any() and not cleaned_str.str.contains(r",").any():
                    # Jika ada format seperti 50.000.000
                    cleaned_str = cleaned_str.apply(
                        lambda s: s.replace(".", "") if s.count(".") > 1 or (len(s.split(".")) == 2 and len(s.split(".")[1]) == 3) else s
                    )
                elif cleaned_str.str.contains(r",").any():
                    cleaned_str = cleaned_str.str.replace(",", ".", regex=False)
                
                df_clean[col] = pd.to_numeric(cleaned_str, errors="coerce")
            else:
                df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce")

    # 3. Missing Value Handling
    # A. nama_cabang -> Forward Fill
    missing_branches = 0
    if "nama_cabang" in df_clean.columns:
        missing_branches = int(df_clean["nama_cabang"].isnull().sum())
        df_clean["nama_cabang"] = df_clean["nama_cabang"].ffill()
        df_clean["nama_cabang"] = df_clean["nama_cabang"].fillna("Cabang Pusat")

    # B. skor_kredit -> Median Imputation
    missing_scores = 0
    if "skor_kredit" in df_clean.columns:
        missing_scores = int(df_clean["skor_kredit"].isnull().sum())
        median_score = df_clean["skor_kredit"].median()
        if pd.isna(median_score):
            median_score = 600.0
        df_clean["skor_kredit"] = df_clean["skor_kredit"].fillna(median_score)

    # C. Hapus baris jika id_nasabah atau pinjaman null
    mandatory_cols = []
    if "id_nasabah" in df_clean.columns:
        mandatory_cols.append("id_nasabah")
    if "pinjaman" in df_clean.columns:
        mandatory_cols.append("pinjaman")
    
    null_mandatory_count = 0
    if mandatory_cols:
        before_drop = len(df_clean)
        df_clean = df_clean.dropna(subset=mandatory_cols)
        null_mandatory_count = before_drop - len(df_clean)

    # 4. Duplicate Handling pada id_nasabah (keep="last")
    duplicates_removed = 0
    if "id_nasabah" in df_clean.columns:
        before_dedup = len(df_clean)
        df_clean = df_clean.drop_duplicates(subset=["id_nasabah"], keep="last")
        duplicates_removed = before_dedup - len(df_clean)

    # 5. Date Conversion jika ada kolom tanggal
    date_cols = [c for c in df_clean.columns if "tanggal" in c.lower() or "date" in c.lower() or "akad" in c.lower()]
    for d_col in date_cols:
        df_clean[d_col] = pd.to_datetime(df_clean[d_col], errors="coerce")

    # 6. Status Standardization (LANCAR -> Lancar, MACET -> Macet)
    if "status_kredit" in df_clean.columns:
        df_clean["status_kredit"] = (
            df_clean["status_kredit"]
            .astype(str)
            .str.strip()
            .str.title()
        )
        # Handle nan string
        df_clean["status_kredit"] = df_clean["status_kredit"].replace({"Nan": "Tidak Diketahui", "None": "Tidak Diketahui"})

    # 7. Outlier / Invalid Data Filtering
    # usia < 18 atau usia > 75, pendapatan < 0
    invalid_rows_removed = 0
    before_outliers = len(df_clean)
    
    valid_conditions = pd.Series(True, index=df_clean.index)
    if "usia" in df_clean.columns:
        valid_conditions = valid_conditions & (df_clean["usia"] >= 18) & (df_clean["usia"] <= 75)
    if "pendapatan" in df_clean.columns:
        valid_conditions = valid_conditions & (df_clean["pendapatan"] >= 0)
    
    df_clean = df_clean[valid_conditions]
    invalid_rows_removed = before_outliers - len(df_clean)

    # 8. Feature Engineering
    # A. Cicilan Bulanan: pinjaman / tenor_bulan (handle tenor = 0 atau kosong)
    if "pinjaman" in df_clean.columns and "tenor_bulan" in df_clean.columns:
        # replace 0 with np.nan to avoid division by zero
        tenor_safe = df_clean["tenor_bulan"].replace(0, np.nan)
        df_clean["cicilan_bulanan"] = df_clean["pinjaman"] / tenor_safe
        df_clean["cicilan_bulanan"] = df_clean["cicilan_bulanan"].fillna(0)

    # B. DSR (Debt Service Ratio): cicilan_bulanan / pendapatan * 100
    if "cicilan_bulanan" in df_clean.columns and "pendapatan" in df_clean.columns:
        pendapatan_safe = df_clean["pendapatan"].replace(0, np.nan)
        df_clean["dsr"] = (df_clean["cicilan_bulanan"] / pendapatan_safe) * 100
        df_clean["dsr"] = df_clean["dsr"].fillna(0)

    # C. Kategori Risiko (pd.cut pada pinjaman):
    # bins: 0, 25M, 100M, 500M, inf
    # labels: '0–25 Juta', '25–100 Juta', '100–500 Juta', '> 500 Juta'
    if "pinjaman" in df_clean.columns:
        bins = [0, 25_000_000, 100_000_000, 500_000_000, np.inf]
        labels = ["0–25 Juta", "25–100 Juta", "100–500 Juta", "> 500 Juta"]
        df_clean["kategori_risiko"] = pd.cut(df_clean["pinjaman"], bins=bins, labels=labels, right=True)

    # D. Flag NPL (np.select pada skor_kredit):
    # skor >= 700 -> Rendah
    # 600 <= skor < 700 -> Sedang-Rendah
    # 500 <= skor < 600 -> Sedang-Tinggi
    # skor < 500 -> Tinggi
    if "skor_kredit" in df_clean.columns:
        kondisi = [
            df_clean["skor_kredit"] >= 700,
            (df_clean["skor_kredit"] >= 600) & (df_clean["skor_kredit"] < 700),
            (df_clean["skor_kredit"] >= 500) & (df_clean["skor_kredit"] < 600),
            df_clean["skor_kredit"] < 500
        ]
        pilihan = ["Rendah", "Sedang-Rendah", "Sedang-Tinggi", "Tinggi"]
        df_clean["flag_npl"] = np.select(kondisi, pilihan, default="Tidak Diketahui")

    # E. Expected Loss: EL = EAD * LGD (jika EAD dan LGD tersedia)
    if "EAD" in df_clean.columns and "LGD" in df_clean.columns:
        lgd_val = df_clean["LGD"].copy()
        # Normalisasi jika LGD berupa persentase (> 1)
        lgd_normalized = np.where(lgd_val > 1, lgd_val / 100.0, lgd_val)
        df_clean["expected_loss"] = df_clean["EAD"] * lgd_normalized

    # Audit missing values setelah cleaning
    missing_after = df_clean.isnull().sum().to_dict()

    stats = {
        "rows_before": rows_before,
        "rows_after": len(df_clean),
        "duplicates_removed": duplicates_removed,
        "missing_scores_imputed": missing_scores,
        "missing_branches_imputed": missing_branches,
        "null_mandatory_removed": null_mandatory_count,
        "invalid_rows_removed": invalid_rows_removed,
        "missing_before": missing_before,
        "missing_after": missing_after
    }

    return df_clean, stats


def validate_data(df: pd.DataFrame) -> Dict[str, bool]:
    """
    Validasi integritas data hasil cleaning
    """
    checks = {}
    if df.empty:
        return {
            "ID Nasabah valid": False,
            "Tidak ada duplicate ID": False,
            "Skor kredit numeric": False,
            "Pinjaman numeric": False,
            "Usia valid (18-75)": False,
            "Pendapatan >= 0": False,
            "Status kredit standardized": False
        }

    checks["ID Nasabah valid"] = bool("id_nasabah" in df.columns and df["id_nasabah"].notnull().all())
    checks["Tidak ada duplicate ID"] = bool("id_nasabah" in df.columns and df["id_nasabah"].is_unique)
    checks["Skor kredit numeric"] = bool("skor_kredit" in df.columns and pd.api.types.is_numeric_dtype(df["skor_kredit"]) and df["skor_kredit"].notnull().all())
    checks["Pinjaman numeric"] = bool("pinjaman" in df.columns and pd.api.types.is_numeric_dtype(df["pinjaman"]) and (df["pinjaman"] >= 0).all())
    
    if "usia" in df.columns:
        checks["Usia valid (18-75)"] = bool(((df["usia"] >= 18) & (df["usia"] <= 75)).all())
    else:
        checks["Usia valid (18-75)"] = True

    if "pendapatan" in df.columns:
        checks["Pendapatan >= 0"] = bool((df["pendapatan"] >= 0).all())
    else:
        checks["Pendapatan >= 0"] = True

    if "status_kredit" in df.columns:
        valid_statuses = {"Lancar", "Macet"}
        checks["Status kredit standardized"] = bool(set(df["status_kredit"].unique()).issubset(valid_statuses))
    else:
        checks["Status kredit standardized"] = True

    return checks
