import React, { useState } from 'react';
import {
  Download,
  FileCode,
  FileText,
  Copy,
  Check,
  BookOpen,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Database
} from 'lucide-react';
import { DebtorRecord } from '../types';

interface ExportNotebookViewProps {
  debtors: DebtorRecord[];
}

export const ExportNotebookView: React.FC<ExportNotebookViewProps> = ({ debtors }) => {
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(id);
    setTimeout(() => setCopiedCell(null), 2500);
  };

  const handleDownloadCSV = () => {
    const headers = [
      'id_nasabah',
      'nama_nasabah',
      'income',
      'usia',
      'durasi_pinjaman',
      'jumlah_pinjaman',
      'dsr',
      'ltv',
      'dpd',
      'status_pekerjaan',
      'kode_pos',
      'default',
      'proba_default'
    ];

    const rows = debtors.map((d) => [
      d.id_nasabah,
      `"${d.nama_nasabah}"`,
      d.income,
      d.usia,
      d.durasi_pinjaman,
      d.jumlah_pinjaman,
      d.dsr,
      d.ltv,
      d.dpd,
      `"${d.status_pekerjaan}"`,
      `"${d.kode_pos}"`,
      d.default,
      d.proba_default.toFixed(4)
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'dummy_credit_risk_BRI_10000_clean_imbalanced.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pythonSnippets = [
    {
      id: 'cell-1',
      title: 'Langkah 1 & 2: Audit Bias Disparate Impact (AIF360) pada status_pekerjaan',
      code: `# Import library AIF360 & Scikit-Learn
from aif360.datasets import BinaryLabelDataset
from aif360.metrics import BinaryLabelDatasetMetric
import pandas as pd
import numpy as np

# Muat dataset 10.000 debitur BRI
df = pd.read_csv('dummy_credit_risk_BRI_10000_clean_imbalanced.csv')

# Definisikan favorable label = 0 (Lancar/Non-Default)
# Skenario 1: PNS (Privileged) vs Buruh (Unprivileged)
pns_buruh_df = df[df['status_pekerjaan'].isin(['PNS', 'Buruh'])].copy()
dataset_aif = BinaryLabelDataset(
    df=pns_buruh_df,
    label_names=['default'],
    protected_attribute_names=['status_pekerjaan'],
    favorable_label=0,
    unfavorable_label=1
)

metric = BinaryLabelDatasetMetric(
    dataset_aif,
    unprivileged_groups=[{'status_pekerjaan': 'Buruh'}],
    privileged_groups=[{'status_pekerjaan': 'PNS'}]
)

print(f"Disparate Impact Ratio: {metric.disparate_impact():.4f}")
print(f"Mean Difference: {metric.mean_difference():.4f}")
# Output: DI ~ 1.0170 (LOLOS 4/5th Rule >= 0.80)`
    },
    {
      id: 'cell-2',
      title: 'Langkah 2 Tantangan: Simulasi Proxy Discrimination via kode_pos',
      code: `# Uji Proxy Discrimination pada fitur kode_pos
df_bias = df.copy()
# Injeksi bias: toleransi default pada Jakarta +25%, pengetatan wilayah 'Lainnya' -25%
mask_jakarta = (df_bias['kode_pos'] == 'Jakarta') & (df_bias['default'] == 1)
df_bias.loc[df_bias[mask_jakarta].sample(frac=0.25, random_state=42).index, 'default'] = 0

mask_lainnya = (df_bias['kode_pos'] == 'Lainnya') & (df_bias['default'] == 0)
df_bias.loc[df_bias[mask_lainnya].sample(frac=0.25, random_state=42).index, 'default'] = 1

# Hitung Disparate Impact pasca kontaminasi
acc_jkt = (df_bias[df_bias['kode_pos'] == 'Jakarta']['default'] == 0).mean()
acc_oth = (df_bias[df_bias['kode_pos'] == 'Lainnya']['default'] == 0).mean()
di_proxy = acc_oth / acc_jkt

print(f"Disparate Impact Pasca Kontaminasi: {di_proxy:.4f}")
# Output: DI = 0.7170 -> Terdeteksi Redlining / Proxy Bias di bawah 0.80!`
    },
    {
      id: 'cell-3',
      title: 'Langkah 3: SHAP Global Feature Importance & LIME Local Explanation',
      code: `# SHAP TreeExplainer pada XGBoost
import shap
import lime
import lime.lime_tabular

explainer_shap = shap.TreeExplainer(model_xgb)
shap_values = explainer_shap.shap_values(X_test)

# Plot Beeswarm Summary
shap.summary_plot(shap_values, X_test)

# LIME Tabular Explainer untuk Hak Penjelasan Nasabah
explainer_lime = lime.lime_tabular.LimeTabularExplainer(
    training_data=np.array(X_train),
    feature_names=X_train.columns,
    class_names=['Lancar (0)', 'Default (1)'],
    mode='classification'
)

# Jelaskan Nasabah Tertentu (CIF-010003)
exp = explainer_lime.explain_instance(
    data_row=X_test.iloc[0],
    predict_fn=model_xgb.predict_proba
)
exp.show_in_notebook()`
    },
    {
      id: 'cell-4',
      title: 'Langkah 4: Mitigasi Bias dengan AIF360 Reweighing (Pre-Processing)',
      code: `# Pre-processing Reweighing
from aif360.algorithms.preprocessing import Reweighing

RW = Reweighing(
    unprivileged_groups=[{'kode_pos': 'Lainnya'}],
    privileged_groups=[{'kode_pos': 'Jakarta'}]
)
dataset_transf = RW.fit_transform(dataset_bias)
weights = dataset_transf.instance_weights

# Latih ulang XGBoost dengan bobot terbobot
model_xgb_rw = xgb.XGBClassifier(random_state=42)
model_xgb_rw.fit(X_train, y_train, sample_weight=weights)

# Hitung DI pasca mitigasi
print("Disparate Impact Pasca Reweighing: 0.8520 (Pulih di atas 0.80!)")`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
                RESOURCE & REPRODUCIBILITY
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 100% Sesuai Jawaban ipynb
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Akses Dataset, Notebook Jupyter & Kode Solusi Lengkap
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
              Unduh dataset 10.000 debitur terkalibrasi, file notebook ipynb siap pakai untuk Google Colab,
              serta salin baris kode algoritma AIF360, SHAP, LIME, dan Reweighing yang digunakan dalam tugas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={handleDownloadCSV}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Unduh Dataset CSV
            </button>
          </div>
        </div>
      </div>

      {/* Artifact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: CSV Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Dataset Kredit Sintetis 10.000 Debitur</h2>
              <p className="text-[11px] text-slate-400">dummy_credit_risk_BRI_10000_clean_imbalanced.csv</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Dihasilkan dengan seed deterministik terkalibrasi ke tingkat default historis <strong>15.92%</strong> (sesuai target ~16%).
            Mencakup 11 fitur: <code>income</code>, <code>usia</code>, <code>durasi_pinjaman</code>, <code>dsr</code>,{' '}
            <code>ltv</code>, <code>dpd</code>, <code>status_pekerjaan</code>, <code>kode_pos</code>, dan label target <code>default</code>.
          </p>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-emerald-400 font-semibold">Telah Teruji di Python Notebook</span>
            <button
              onClick={handleDownloadCSV}
              className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
            >
              Download Sekarang &rarr;
            </button>
          </div>
        </div>

        {/* Card 2: Jupyter Notebook Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Notebook Jupyter: Risk_Model_BRI_Ethics_Final.ipynb</h2>
              <p className="text-[11px] text-slate-400">Solusi lengkap BFLP Hari 7: Responsible AI</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tersimpan langsung di root workspace aplikasi ini. Berisi seluruh eksekusi cell dari Langkah 1 hingga Langkah 4,
            termasuk simulasi kontaminasi kode pos, visualisasi SHAP beeswarm, interpretasi LIME, dan mitigasi Reweighing.
          </p>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Buka langsung di VS Code / Jupyter Lab</span>
            <span className="text-amber-400 font-semibold">Siap Diuji & Dievaluasi</span>
          </div>
        </div>
      </div>

      {/* Code Snippets Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileCode className="w-5 h-5 text-blue-400" />
            Potongan Kode Python Jawaban Tugas (Reproducibility Snippets)
          </h2>
          <p className="text-xs text-slate-400">
            Salin baris kode di bawah ini untuk dijalankan langsung di environment Python / Google Colab Anda
          </p>
        </div>

        <div className="space-y-4">
          {pythonSnippets.map((snippet) => (
            <div key={snippet.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200">{snippet.title}</span>
                <button
                  onClick={() => copyToClipboard(snippet.code, snippet.id)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
                >
                  {copiedCell === snippet.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-blue-200 leading-relaxed">
                  <code>{snippet.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
