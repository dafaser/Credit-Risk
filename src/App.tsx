import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { ActivePage, DebtorRecord } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ModelEthicsDashboardView } from './components/ModelEthicsDashboardView';
import { CreditApplicationView } from './components/CreditApplicationView';
import { loadInitialDebtors } from './utils/dataLoader';
import { SAMPLE_DEBTORS } from './data/sampleDebtors';
import { calculateDebtorPD } from './utils/aiEthicsEngine';

const STORAGE_KEY_CUSTOM_DEBTORS = 'bri_custom_debtors_dataset_v1';
const DEFAULT_OFFICER_NAME = 'Barnacle Boy';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [debtors, setDebtors] = useState<DebtorRecord[]>(SAMPLE_DEBTORS);
  const [thresholdAccept, setThresholdAccept] = useState<number>(0.35);
  const [thresholdReject, setThresholdReject] = useState<number>(0.65);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCustomLoaded, setIsCustomLoaded] = useState<boolean>(false);

  // Load dataset on initial mount
  useEffect(() => {
    async function initData() {
      setIsLoading(true);
      // Check localStorage first for uploaded dataset
      try {
        const cached = localStorage.getItem(STORAGE_KEY_CUSTOM_DEBTORS);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDebtors(parsed);
            setIsCustomLoaded(true);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Gagal membaca custom dataset dari localStorage:', err);
      }

      // Load full 10,000 dataset
      try {
        const loaded = await loadInitialDebtors();
        if (loaded && loaded.length > 0) {
          setDebtors(loaded);
        }
      } catch (err) {
        console.error('Gagal memuat dataset utama, fallback ke sample:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initData();
  }, []);

  // Handle custom CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          const raw = results.data as any[];
          if (!raw || raw.length === 0) return;

          const parsedDebtors: DebtorRecord[] = raw.map((row, idx) => {
            const income = Number(row.income) || 5000000;
            const usia = Number(row.usia) || 35;
            const durasi = Number(row.durasi_pinjaman) || 24;
            const pinjaman = Number(row.jumlah_pinjaman) || 25000000;
            const dsr = Number(row.dsr) || 0.25;
            const ltv = Number(row.ltv) || 0.45;
            const dpd = Number(row.dpd) || 0;
            const status_pekerjaan = row.status_pekerjaan || 'Lainnya';
            const kode_pos = row.kode_pos || 'Lainnya';
            const default_val = row.default !== undefined ? Number(row.default) : 0;

            const res = calculateDebtorPD(dpd, usia, income, durasi, dsr, ltv);
            let proba = Number(row.proba_default);
            if (isNaN(proba) || proba === 0) {
              proba = res.probaDefault;
            }

            const rec: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT' =
              proba > 0.65 ? 'REJECT' : proba >= 0.35 ? 'MANUAL_REVIEW' : 'ACCEPT';

            return {
              id_nasabah: row.id_nasabah || `CIF-UP-${String(idx + 1).padStart(5, '0')}`,
              nama_nasabah: row.nama_nasabah || `Nasabah Upload #${idx + 1}`,
              income,
              usia,
              durasi_pinjaman: durasi,
              jumlah_pinjaman: pinjaman,
              dsr,
              ltv,
              dpd,
              status_pekerjaan,
              kode_pos,
              default: default_val,
              risk_score: res.riskScore,
              proba_default: proba,
              pred_default: proba >= 0.50 ? 1 : 0,
              decision_recommendation: rec,
              human_decision: 'PENDING'
            };
          });

          setDebtors(parsedDebtors);
          setIsCustomLoaded(true);

          // Persist in localStorage so it does not reset on browser reload
          try {
            localStorage.setItem(STORAGE_KEY_CUSTOM_DEBTORS, JSON.stringify(parsedDebtors));
          } catch (err) {
            console.warn('Penyimpanan localStorage penuh:', err);
          }
        } catch (err) {
          alert('Format CSV tidak sesuai. Pastikan memiliki kolom income, usia, durasi_pinjaman, dll.');
        }
      },
      error: (err) => {
        alert(`Gagal parse CSV: ${err.message}`);
      }
    });

    e.target.value = '';
  };

  // Reset to default 10,000 dataset
  const handleResetData = async () => {
    try {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_DEBTORS);
    } catch (err) {
      console.warn(err);
    }
    setIsCustomLoaded(false);
    setIsLoading(true);
    const loaded = await loadInitialDebtors();
    setDebtors(loaded);
    setIsLoading(false);
  };

  // Metrics for Sidebar Threshold Distribution
  const acceptCount = debtors.filter((d) => d.proba_default < thresholdAccept).length;
  const manualCount = debtors.filter(
    (d) => d.proba_default >= thresholdAccept && d.proba_default <= thresholdReject
  ).length;
  const rejectCount = debtors.filter((d) => d.proba_default > thresholdReject).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        totalDebtors={debtors.length}
        activePage={activePage}
        onNavigate={(page) => setActivePage(page)}
        onResetData={handleResetData}
        onFileUpload={handleFileUpload}
        currentUser={DEFAULT_OFFICER_NAME}
        isCustomLoaded={isCustomLoaded}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Left Sidebar */}
        <Sidebar
          activePage={activePage}
          onSelectPage={(p) => setActivePage(p)}
          thresholdAccept={thresholdAccept}
          setThresholdAccept={setThresholdAccept}
          thresholdReject={thresholdReject}
          setThresholdReject={setThresholdReject}
          acceptCount={acceptCount}
          manualCount={manualCount}
          rejectCount={rejectCount}
        />

        {/* Center Main Content Body */}
        <main className="flex-1 min-w-0">
          {activePage === 'dashboard' && (
            <ModelEthicsDashboardView
              debtors={debtors}
              onNavigateToCreditApp={() => setActivePage('pengajuan-kredit')}
            />
          )}

          {activePage === 'pengajuan-kredit' && (
            <CreditApplicationView />
          )}
        </main>
      </div>
    </div>
  );
}
