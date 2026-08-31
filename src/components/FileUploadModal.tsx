import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Database,
  ArrowRight,
  Info
} from 'lucide-react';
import Papa from 'papaparse';
import { RawCreditRecord, DatasetSummary } from '../types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (raw: RawCreditRecord[], summary: DatasetSummary) => void;
  onLoadSample: () => void;
  isLoading: boolean;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
  onLoadSample,
  isLoading
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewInfo, setPreviewInfo] = useState<{
    fileName: string;
    fileSize: number;
    rows: number;
    cols: number;
    headers: string[];
    missingCols: string[];
    isBRIFile: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setErrorMsg(null);
    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Format file harus berupa CSV (.csv).');
      return;
    }

    const isBRIFile = file.name.toLowerCase().includes('data_kredit_bri') || file.name.toLowerCase().includes('kredit');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setErrorMsg('File CSV kosong atau tidak memiliki baris data.');
          return;
        }

        const rawData = results.data as RawCreditRecord[];
        const headers = results.meta.fields || Object.keys(rawData[0] || {});
        
        // Detect missing key columns
        const expectedCols = ['id_nasabah', 'pinjaman', 'skor_kredit', 'status_kredit', 'nama_cabang'];
        const missing = expectedCols.filter(col => !headers.some(h => h.trim().toLowerCase() === col));

        // Column types and missing value detection
        const columnTypes: { [col: string]: string } = {};
        const missingValues: { [col: string]: number } = {};
        const uniqueValues: { [col: string]: number } = {};

        headers.forEach(h => {
          let nullCount = 0;
          const valSet = new Set<string>();
          let numericCount = 0;

          rawData.forEach(row => {
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
          columnTypes[h] = numericCount > (rawData.length - nullCount) * 0.7 ? 'Float/Numeric' : 'Object/String';
        });

        // Detect branches & status
        const branchCol = headers.find(h => h.toLowerCase().includes('cabang')) || 'nama_cabang';
        const statusCol = headers.find(h => h.toLowerCase().includes('status')) || 'status_kredit';
        const segmentCol = headers.find(h => h.toLowerCase().includes('segmen')) || 'segmen';
        const dateCol = headers.find(h => h.toLowerCase().includes('tanggal') || h.toLowerCase().includes('date') || h.toLowerCase().includes('akad'));

        const branches = Array.from(new Set(rawData.map(r => String(r[branchCol] || '').trim()).filter(Boolean)));
        const statuses = Array.from(new Set(rawData.map(r => String(r[statusCol] || '').trim()).filter(Boolean)));
        const segments = Array.from(new Set(rawData.map(r => String(r[segmentCol] || '').trim()).filter(Boolean)));

        const summary: DatasetSummary = {
          fileName: file.name,
          fileSize: file.size,
          totalRows: rawData.length,
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

        setPreviewInfo({
          fileName: file.name,
          fileSize: file.size,
          rows: rawData.length,
          cols: headers.length,
          headers,
          missingCols: missing,
          isBRIFile
        });

        onDataLoaded(rawData, summary);
      },
      error: (err) => {
        setErrorMsg(`Gagal memproses file CSV: ${err.message}`);
      }
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Upload Dataset Kredit BRI</h2>
              <p className="text-xs text-slate-400">Mendukung format .csv (st.file_uploader)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Dropzone */}
          <div
            id="csv-dropzone"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-950/30 scale-[0.99]' 
                : 'border-slate-800 hover:border-blue-500/60 hover:bg-slate-900/60 bg-slate-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleChange}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">
              Klik untuk memilih file atau seret file CSV ke sini
            </p>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Target file: data_kredit_bri.csv
            </p>
          </div>

          {/* Quick Load Default Dataset Option */}
          <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-800/40 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Gunakan Dataset Default BFLP</p>
                <p className="text-[11px] text-blue-300">Muat data_kredit_bri.csv (Hari 2 Sesi 2 Pandas)</p>
              </div>
            </div>
            <button
              id="btn-modal-load-sample"
              onClick={() => {
                onLoadSample();
                onClose();
              }}
              disabled={isLoading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Memuat...' : 'Muat Dataset'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Status / Errors */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Error Pemrosesan Dataset</p>
                <p className="mt-0.5 text-rose-300/90">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Preview Info */}
          {previewInfo && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {previewInfo.isBRIFile ? 'Dataset berhasil dimuat' : 'Dataset CSV berhasil dibaca'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Nama File</span>
                  <span className="font-semibold text-white truncate block font-mono">{previewInfo.fileName}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Ukuran File</span>
                  <span className="font-semibold text-white">{(previewInfo.fileSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Jumlah Baris</span>
                  <span className="font-semibold text-white">{previewInfo.rows}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Jumlah Kolom</span>
                  <span className="font-semibold text-white">{previewInfo.cols}</span>
                </div>
              </div>

              {/* Warning if EAD or other columns are missing */}
              {previewInfo.missingCols.length > 0 && (
                <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2 text-amber-300 text-[11px]">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Kolom {previewInfo.missingCols.join(', ')} tidak ditemukan secara langsung pada header CSV.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
          {previewInfo && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-md cursor-pointer"
            >
              Mulai Analisis Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
