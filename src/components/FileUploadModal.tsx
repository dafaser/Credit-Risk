import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Database,
  ArrowRight,
  Info,
  ClipboardPaste,
  FileText,
  Sparkles
} from 'lucide-react';
import Papa from 'papaparse';
import { RawCreditRecord, DatasetSummary } from '../types';
import { normalizeRawRecord } from '../utils/creditEngine';

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
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'sample'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
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

  const parseAndApplyData = (content: string, fileName: string, fileSize: number) => {
    setErrorMsg(null);
    
    // Strip UTF-8 BOM if present
    const cleanContent = content.replace(/^\uFEFF/, '').trim();
    if (!cleanContent) {
      setErrorMsg('Konten file atau teks CSV kosong.');
      return;
    }

    Papa.parse(cleanContent, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      delimitersToGuess: [',', ';', '\t', '|'],
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setErrorMsg('File CSV tidak memiliki baris data yang valid.');
          return;
        }

        const rawRows = results.data as any[];
        const firstRow = rawRows[0] || {};
        const headers = results.meta.fields || Object.keys(firstRow);

        // Normalize rows to ensure standard attributes
        const normalizedRows = rawRows.map((r, idx) => normalizeRawRecord(r, idx));

        // Column types and missing value detection
        const columnTypes: { [col: string]: string } = {};
        const missingValues: { [col: string]: number } = {};
        const uniqueValues: { [col: string]: number } = {};

        headers.forEach(h => {
          let nullCount = 0;
          const valSet = new Set<string>();
          let numericCount = 0;

          rawRows.forEach(row => {
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
          columnTypes[h] = numericCount > (rawRows.length - nullCount) * 0.7 ? 'Float/Numeric' : 'Object/String';
        });

        // Detect branches & status
        const branchCol = headers.find(h => h.toLowerCase().includes('cabang')) || 'nama_cabang';
        const statusCol = headers.find(h => h.toLowerCase().includes('status')) || 'status_kredit';
        const segmentCol = headers.find(h => h.toLowerCase().includes('segmen')) || 'segmen';
        const dateCol = headers.find(h => h.toLowerCase().includes('tanggal') || h.toLowerCase().includes('date') || h.toLowerCase().includes('akad'));

        const branches = Array.from(new Set(normalizedRows.map(r => String(r.nama_cabang || '').trim()).filter(Boolean)));
        const statuses = Array.from(new Set(normalizedRows.map(r => String(r.status_kredit || '').trim()).filter(Boolean)));
        const segments = Array.from(new Set(normalizedRows.map(r => String(r.segmen || '').trim()).filter(Boolean)));

        const expectedCols = ['id_nasabah', 'pinjaman', 'skor_kredit', 'status_kredit', 'nama_cabang'];
        const missing = expectedCols.filter(col => !headers.some(h => h.toLowerCase().replace(/[\s\-_]+/g, '_').includes(col)));

        const isBRIFile = fileName.toLowerCase().includes('data_kredit_bri') || fileName.toLowerCase().includes('kredit');

        const summary: DatasetSummary = {
          fileName,
          fileSize,
          totalRows: normalizedRows.length,
          totalColumns: headers.length,
          columnNames: headers,
          columnTypes,
          missingValues,
          uniqueValues,
          branches,
          statuses,
          segments,
          hasEAD: headers.some(h => h.toUpperCase().includes('EAD')),
          hasLGD: headers.some(h => h.toUpperCase().includes('LGD')),
          hasDate: !!dateCol,
          dateColumnName: dateCol
        };

        setPreviewInfo({
          fileName,
          fileSize,
          rows: normalizedRows.length,
          cols: headers.length,
          headers,
          missingCols: missing,
          isBRIFile
        });

        onDataLoaded(normalizedRows, summary);
      },
      error: (err) => {
        setErrorMsg(`Gagal memproses data CSV: ${err.message}`);
      }
    });
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    const fileName = file.name.toLowerCase();
    const isCsvOrText = fileName.endsWith('.csv') || fileName.endsWith('.tsv') || fileName.endsWith('.txt') || file.type.includes('text') || file.type.includes('csv');
    
    if (!isCsvOrText) {
      setErrorMsg('Format file harus berupa CSV (.csv), TSV (.tsv), atau teks tabular.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        parseAndApplyData(text, file.name, file.size);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Gagal membaca file dari penyimpanan lokal.');
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Silakan masukkan atau tempel teks CSV terlebih dahulu.');
      return;
    }
    parseAndApplyData(pastedText, 'pasted_dataset.csv', new Blob([pastedText]).size);
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
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Upload Dataset Kredit BRI</h2>
              <p className="text-xs text-slate-400">Mendukung format .csv, .tsv, pemisah koma/titik koma, & teks langsung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Pilih / Drop File CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'paste'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Tempel Teks (Paste)</span>
          </button>

          <button
            onClick={() => setActiveTab('sample')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sample'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Dataset Bawaan</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Tab 1: File Upload / Dropzone */}
          {activeTab === 'upload' && (
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
                accept=".csv,.tsv,.txt,text/csv,text/plain,application/vnd.ms-excel"
                onChange={handleChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                Klik untuk memilih file CSV atau seret file ke area ini
              </p>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Mendukung file .csv, .tsv, .txt (contoh: data_kredit_bri.csv)
              </p>
            </div>
          )}

          {/* Tab 2: Paste Raw CSV Text */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tempel data CSV / Tabular di bawah:</span>
                </label>
                <button
                  onClick={() => setPastedText('')}
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Bersihkan
                </button>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={"id_nasabah,nama_nasabah,usia,pendapatan,pinjaman,tenor_bulan,skor_kredit,status_kredit,nama_cabang\nBRI-001,Andi,32,15000000,50000000,12,720,Lancar,KC Sudirman\nBRI-002,Budi,45,8000000,100000000,24,540,Macet,KC Thamrin"}
                rows={7}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handlePasteSubmit}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>Proses & Terapkan Teks CSV</span>
              </button>
            </div>
          )}

          {/* Tab 3: Default Dataset */}
          {activeTab === 'sample' && (
            <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-800/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Dataset BFLP BRI Resmi</p>
                  <p className="text-xs text-blue-300 mt-0.5">
                    Dataset standar Hari 2 Sesi 2 Pandas dengan 1.000 data nasabah, fitur EAD, LGD, dan DSR.
                  </p>
                </div>
              </div>
              <button
                id="btn-modal-load-sample"
                onClick={() => {
                  onLoadSample();
                  onClose();
                }}
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Memuat Dataset...' : 'Muat Dataset data_kredit_bri.csv'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

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
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Dataset &ldquo;{previewInfo.fileName}&rdquo; berhasil diproses ({previewInfo.rows} baris data)!
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Nama File</span>
                  <span className="font-semibold text-white truncate block font-mono">{previewInfo.fileName}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Ukuran</span>
                  <span className="font-semibold text-white">{(previewInfo.fileSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Total Baris</span>
                  <span className="font-semibold text-emerald-400 font-mono">{previewInfo.rows}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Total Kolom</span>
                  <span className="font-semibold text-white font-mono">{previewInfo.cols}</span>
                </div>
              </div>

              {previewInfo.missingCols.length > 0 && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2 text-amber-300 text-[11px]">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Kolom {previewInfo.missingCols.join(', ')} telah dinormalisasi atau diisi dengan nilai default yang sesuai secara otomatis.
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
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <span>{previewInfo ? 'Terapkan & Buka Dashboard' : 'Selesai'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
