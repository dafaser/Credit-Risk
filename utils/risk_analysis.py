import pandas as pd
from typing import List

def get_filter_1(df: pd.DataFrame) -> pd.DataFrame:
    """
    FILTER 1: Nasabah skor_kredit < 550 DAN pinjaman > Rp 50 Juta
    df[(df["skor_kredit"] < 550) & (df["pinjaman"] > 50_000_000)]
    """
    if "skor_kredit" not in df.columns or "pinjaman" not in df.columns:
        return pd.DataFrame()
    return df[(df["skor_kredit"] < 550) & (df["pinjaman"] > 50_000_000)]

def get_filter_2(df: pd.DataFrame, selected_branches: List[str]) -> pd.DataFrame:
    """
    FILTER 2: Nasabah status_kredit == 'Macet' DAN berasal dari cabang tertentu menggunakan .isin()
    df[(df["status_kredit"] == "Macet") & (df["nama_cabang"].isin(selected_branches))]
    """
    if "status_kredit" not in df.columns or "nama_cabang" not in df.columns:
        return pd.DataFrame()
    if not selected_branches:
        return pd.DataFrame()
    return df[(df["status_kredit"] == "Macet") & (df["nama_cabang"].isin(selected_branches))]

def get_filter_3(df: pd.DataFrame) -> pd.DataFrame:
    """
    FILTER 3: Nasabah usia 25-60 ATAU skor_kredit < 500
    df[((df["usia"] >= 25) & (df["usia"] <= 60)) | (df["skor_kredit"] < 500)]
    """
    cond_age = (df["usia"] >= 25) & (df["usia"] <= 60) if "usia" in df.columns else pd.Series(False, index=df.index)
    cond_score = (df["skor_kredit"] < 500) if "skor_kredit" in df.columns else pd.Series(False, index=df.index)
    return df[cond_age | cond_score]
