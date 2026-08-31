import pandas as pd
from typing import Dict, Any

def get_risk_category_counts(df: pd.DataFrame) -> pd.DataFrame:
    """
    A. Jumlah Nasabah per Risiko (value_counts / groupby)
    """
    if "kategori_risiko" not in df.columns:
        return pd.DataFrame(columns=["kategori_risiko", "jumlah_nasabah"])
    
    counts = df["kategori_risiko"].value_counts().reset_index()
    counts.columns = ["kategori_risiko", "jumlah_nasabah"]
    return counts

def get_expected_loss_metrics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    B. Metrik Expected Loss (EL = EAD * LGD)
    """
    if "expected_loss" not in df.columns:
        return {
            "has_el": False,
            "total_ead": 0,
            "avg_ead": 0,
            "avg_lgd": 0,
            "total_el": 0,
            "avg_el": 0
        }
    
    total_ead = df["EAD"].sum() if "EAD" in df.columns else 0
    avg_ead = df["EAD"].mean() if "EAD" in df.columns else 0
    
    avg_lgd = 0
    if "LGD" in df.columns:
        lgd_val = df["LGD"]
        avg_lgd = (lgd_val / 100.0 if (lgd_val > 1).any() else lgd_val).mean()

    total_el = df["expected_loss"].sum()
    avg_el = df["expected_loss"].mean()

    return {
        "has_el": True,
        "total_ead": total_ead,
        "avg_ead": avg_ead,
        "avg_lgd": avg_lgd,
        "total_el": total_el,
        "avg_el": avg_el
    }

def get_el_by_segment(df: pd.DataFrame) -> pd.DataFrame:
    """
    C. EL per Segmen: df.groupby('segmen')['expected_loss'].mean()
    """
    group_col = "segmen" if "segmen" in df.columns else ("kategori_risiko" if "kategori_risiko" in df.columns else None)
    if not group_col or "expected_loss" not in df.columns:
        return pd.DataFrame()

    seg_df = df.groupby(group_col).agg(
        rata_rata_el=("expected_loss", "mean"),
        total_el=("expected_loss", "sum"),
        jumlah_nasabah=("expected_loss", "count")
    ).reset_index()
    return seg_df

def get_risk_aggregation(df: pd.DataFrame) -> pd.DataFrame:
    """
    D. Agregasi Risiko:
    df.groupby('kategori_risiko').agg({
        'skor_kredit': 'mean',
        'pinjaman': 'mean',
        'dsr': 'mean'
    })
    """
    if "kategori_risiko" not in df.columns:
        return pd.DataFrame()

    agg_dict = {}
    if "skor_kredit" in df.columns:
        agg_dict["skor_kredit"] = "mean"
    if "pinjaman" in df.columns:
        agg_dict["pinjaman"] = "mean"
    if "dsr" in df.columns:
        agg_dict["dsr"] = "mean"
    if "expected_loss" in df.columns:
        agg_dict["expected_loss"] = "mean"

    if not agg_dict:
        return pd.DataFrame()

    agg_df = df.groupby("kategori_risiko", observed=False).agg(agg_dict).reset_index()
    return agg_df
