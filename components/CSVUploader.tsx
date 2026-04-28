'use client';
import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Zap, Download, Eye, X, Table } from 'lucide-react';
import { generateSampleCSV, parseAndCleanCSV } from '@/lib/csvPipeline';
import * as XLSX from 'xlsx';

import { SalesRecord } from '@/lib/supabase';

type UploadResult = {
  success?: boolean; total?: number; inserted?: number;
  skipped?: number; errors?: string[]; error?: string;
};
type PreviewRow = Record<string, string>;
type Props = { onUploadComplete: (records?: SalesRecord[], filename?: string) => void };

export default function CSVUploader({ onUploadComplete }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<{ rows: PreviewRow[]; columns: string[] } | null>(null);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true); setResult(null); setFileName(file.name); setProgress(10);
    
    let csvText = '';
    let uploadFile = file;

    try {
      if (file.name.endsWith('.csv')) {
        csvText = await file.text();
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setProgress(20);
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        csvText = XLSX.utils.sheet_to_csv(worksheet);
        
        // Convert the Excel file into a CSV File object to send to the backend unchanged
        const newFileName = file.name.replace(/\.xlsx?$/, '.csv');
        uploadFile = new File([csvText], newFileName, { type: 'text/csv' });
      } else {
        setResult({ error: 'Unsupported file format. Please upload CSV or Excel.' });
        setUploading(false); setProgress(0);
        return;
      }
    } catch (err: any) {
      console.error("Excel parse error:", err);
      setResult({ error: `Failed to parse Excel: ${err?.message || err}` });
      setUploading(false); setProgress(0);
      return;
    }

    // Show preview of first 5 rows
    const { records } = parseAndCleanCSV(csvText);
    if (records.length > 0) {
      const cols = Object.keys(records[0]).filter(k => k !== 'id' && k !== 'created_at');
      const rows = records.slice(0, 5).map(r => {
        const row: PreviewRow = {};
        cols.forEach(c => { row[c] = String((r as Record<string, unknown>)[c] ?? ''); });
        return row;
      });
      setPreview({ rows, columns: cols });
    }
    setProgress(40);

    const fd = new FormData(); fd.append('file', uploadFile);
    try {
      setProgress(70);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      setProgress(100);
      setResult(data);
      if (data.success) setTimeout(() => onUploadComplete(records, file.name), 800);
    } catch {
      setResult({ error: 'Network error. Please try again.' });
    } finally {
      setUploading(false); setTimeout(() => setProgress(0), 1000);
    }
  };

  const loadSampleData = async () => {
    setSeeding(true); setResult(null); setPreview(null);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      setResult({ success: true, inserted: data.inserted, total: data.inserted, skipped: data.skipped });
      if (data.success) setTimeout(onUploadComplete, 800);
    } catch { setResult({ error: 'Failed to load sample data.' }); }
    finally { setSeeding(false); }
  };

  const downloadSample = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = 'sample_sales_data.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      upload(file);
    } else if (file) {
      setResult({ error: 'Unsupported file format. Please upload CSV or Excel.' });
    }
  };

  return (
    <div className="uploader-container">
      {/* Drop Zone */}
      <div className={`drop-zone ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept=".csv, .xlsx, .xls" className="hidden-input"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />

        {uploading ? (
          <div className="drop-content">
            <Loader2 size={36} className="spinning" style={{ color: 'var(--text)' }} />
            <p className="drop-title">Processing {fileName}…</p>
            <div className="upload-progress-bar">
              <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="drop-sub">{progress < 50 ? 'Parsing & cleaning data…' : progress < 80 ? 'Validating records…' : 'Uploading to database…'}</p>
          </div>
        ) : (
          <div className="drop-content">
            <Table size={36} style={{ color: 'var(--text)' }} />
            <p className="drop-title">Drop your CSV or Excel file here</p>
            <p className="drop-sub">Supported formats: .csv, .xlsx, .xls</p>
            <div className="drop-formats">
              <FileText size={12} /> date · product · region · salesperson · revenue · profit
            </div>
          </div>
        )}
      </div>

      {/* Progress bar overlay */}
      {uploading && progress > 0 && progress < 100 && (
        <div className="upload-progress-bar"><div className="upload-progress-fill" style={{ width: `${progress}%` }} /></div>
      )}

      <div className="uploader-actions">
        <button className="btn-secondary" onClick={downloadSample}><Download size={14} /> Download Sample CSV</button>
        <button className="btn-primary" onClick={loadSampleData} disabled={seeding}>
          {seeding ? <Loader2 size={14} className="spinning" /> : <Zap size={14} />}
          {seeding ? 'Loading…' : 'Load Demo Data'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`upload-result ${result.success ? 'success' : 'error'}`}>
          {result.success ? (
            <><CheckCircle size={16} />
              <span>✓ {result.inserted} records uploaded · {result.skipped} duplicates skipped
                {result.errors?.length ? ` · ${result.errors.length} warnings` : ''}
              </span>
            </>
          ) : (
            <><AlertCircle size={16} /><span>{result.error || 'Upload failed'}</span></>
          )}
        </div>
      )}

      {/* Warnings */}
      {result?.errors && result.errors.length > 0 && (
        <div className="upload-warnings">
          <p className="warnings-title">⚠ Warnings ({result.errors.length})</p>
          {result.errors.slice(0, 5).map((e, i) => <p key={i} className="warning-item">{e}</p>)}
        </div>
      )}

      {/* Data Preview */}
      {preview && (
        <div className="preview-section">
          <div className="preview-header">
            <Eye size={13} /> <span>Data Preview (first 5 rows)</span>
            <button className="preview-close" onClick={() => setPreview(null)}><X size={12} /></button>
          </div>
          <div className="preview-table-wrap">
            <table className="preview-table">
              <thead>
                <tr>{preview.columns.map(c => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i}>{preview.columns.map(c => <td key={c}>{row[c]}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
