import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { 
  Building2, 
  Upload, 
  Database, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { RawCreditRecord, CreditRecord, CleaningStats, DatasetSummary, ActivePage } from './types';
import { cleanCreditData } from './utils/creditEngine';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FileUploadModal } from './components/FileUploadModal';
import { DashboardView } from './components/DashboardView';
import { DataExplorerView } from './components/DataExplorerView';
import { RiskAnalysisView } from './components/RiskAnalysisView';
import { PortfolioAnalysisView } from './components/PortfolioAnalysisView';
import { DataCleaningView } from './components/DataCleaningView';
import { ExportDataView } from './components/ExportDataView';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [rawRecords, setRawRecords] = useState<RawCreditRecord[]>([]);
  const [cleanedRecords, setCleanedRecords] = useState<CreditRecord[]>([]);
  const [cleaningStats, setCleaningStats] = useState<CleaningStats | null>(null);
  const [datasetSummary, setDatasetSummary] = useState<DatasetSummary | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Process raw records through data cleaning engine
  const handleDataLoaded = useCallback((raw: RawCreditRecord[], summary: DatasetSummary) => {
    setRawRecords(raw);
    setDatasetSummary(summary);
    
    // Run cleaning engine
    const { cleanedRecords: cleaned, stats } = cleanCreditData(raw);
    setCleanedRecords(cleaned);
    setCleaningStats(stats);
    setLoadError(null);
  }, []);

  // Load sample dataset (data_kredit_bri.csv)
  const handleLoadSample = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/data_kredit_bri.csv');
      if (!response.ok) {
        throw new Error('Gagal mengambil file sample dataset.');
      }
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: 'greedy',
        complete: (results) => {
          const raw = results.data as RawCreditRecord[];
          const headers = results.meta.fields || Object.keys(raw[0] || {});

          const columnTypes: { [col: string]: string } = {};
          const missingValues: { [col: string]: number } = {};
          const uniqueValues: { [col: string]: number } = {};

          headers.forEach(h => {
            let nullCount = 0;
            const valSet = new Set<string>();
            let numericCount = 0;

            raw.forEach(row => {
              const val = row[h];
              if (val === null || val === undefined || String(val).trim() === '') {
                nullCount++;
              } else {
                valSet.add(String(val));
                if (!isNaN(Number(String(val).replace(/rp/gi, '').replace(/\./g, '').replace(',', '.')))) {
                  numericCount++;
                }
              }
            });

            missingValues[h] = nullCount;
            uniqueValues[h] = valSet.size;
            columnTypes[h] = numericCount > (raw.length - nullCount) * 0.7 ? 'Float/Numeric' : 'Object/String';
          });

          const branchCol = headers.find(h => h.toLowerCase().includes('cabang')) || 'nama_cabang';
          const statusCol = headers.find(h => h.toLowerCase().includes('status')) || 'status_kredit';
          const segmentCol = headers.find(h => h.toLowerCase().includes('segmen')) || 'segmen';
          const dateCol = headers.find(h => h.toLowerCase().includes('tanggal') || h.toLowerCase().includes('akad'));

          const branches = Array.from(new Set(raw.map(r => String(r[branchCol] || '').trim()).filter(Boolean)));
          const statuses = Array.from(new Set(raw.map(r => String(r[statusCol] || '').trim()).filter(Boolean)));
          const segments = Array.from(new Set(raw.map(r => String(r[segmentCol] || '').trim()).filter(Boolean)));

          const summary: DatasetSummary = {
            fileName: 'data_kredit_bri.csv',
            fileSize: csvText.length,
            totalRows: raw.length,
            totalColumns: headers.length,
            columnNames: headers,
            columnTypes,
            missingValues,
            uniqueValues,
            branches,
            statuses,
            segments,
            hasEAD: headers.some(h => h.toUpperCase() === 'EAD'),
            hasLGD: headers.some(h => h.toUpperCase() === 'LGD'),
            hasDate: !!dateCol,
            dateColumnName: dateCol
          };

          handleDataLoaded(raw, summary);
          setIsLoading(false);
        },
        error: (err) => {
          setLoadError(`Gagal parse CSV: ${err.message}`);
          setIsLoading(false);
        }
      });
    } catch (err: any) {
      setLoadError(err.message || 'Terjadi kesalahan saat memuat dataset.');
      setIsLoading(false);
    }
  }, [handleDataLoaded]);

  // Automatically load the dataset on startup for immediate experience
  useEffect(() => {
    handleLoadSample();
  }, [handleLoadSample]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020617] font-sans text-slate-200 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        datasetSummary={datasetSummary}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#020617]">
        {/* Header */}
        <Header
          datasetSummary={datasetSummary}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onLoadSample={handleLoadSample}
          isLoading={isLoading}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {datasetSummary && cleanedRecords.length > 0 ? (
            <div className="max-w-7xl mx-auto space-y-6">
              {activePage === 'dashboard' && (
                <DashboardView
                  records={cleanedRecords}
                  summary={datasetSummary}
                  setActivePage={setActivePage}
                />
              )}
              {activePage === 'data-explorer' && (
                <DataExplorerView
                  records={cleanedRecords}
                  summary={datasetSummary}
                />
              )}
              {activePage === 'risk-analysis' && (
                <RiskAnalysisView
                  records={cleanedRecords}
                  summary={datasetSummary}
                />
              )}
              {activePage === 'portfolio-analysis' && (
                <PortfolioAnalysisView
                  records={cleanedRecords}
                  summary={datasetSummary}
                />
              )}
              {activePage === 'data-cleaning' && (
                <DataCleaningView
                  records={cleanedRecords}
                  stats={cleaningStats}
                  summary={datasetSummary}
                />
              )}
              {activePage === 'export-data' && (
                <ExportDataView
                  records={cleanedRecords}
                  summary={datasetSummary}
                />
              )}
            </div>
          ) : (
            /* Empty State: Dataset not loaded yet */
            <div className="max-w-3xl mx-auto mt-12 bg-[#0f172a] rounded-3xl p-10 border border-slate-800 shadow-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                <Database className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Silakan upload dataset terlebih dahulu
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                Untuk memulai analisis portofolio risiko kredit BFLP BRI, silakan upload file 
                <code className="font-mono text-blue-400 bg-slate-900 px-1.5 py-0.5 rounded mx-1 border border-slate-800">data_kredit_bri.csv</code> 
                atau gunakan dataset bawaan.
              </p>

              {loadError && (
                <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{loadError}</span>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  id="btn-empty-load-sample"
                  onClick={handleLoadSample}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isLoading ? 'Memuat Dataset...' : 'Muat Dataset data_kredit_bri.csv'}</span>
                </button>

                <button
                  id="btn-empty-upload"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload File CSV Sendiri</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDataLoaded={handleDataLoaded}
        onLoadSample={handleLoadSample}
        isLoading={isLoading}
      />
    </div>
  );
}
