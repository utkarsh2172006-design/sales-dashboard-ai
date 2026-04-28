'use client';
import CSVUploader from '@/components/CSVUploader';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function UploadPage() {
  const router = useRouter();

  return (
    <div className="app-shell">
      <div className="upload-page-header">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="page-title">Upload Sales Data</h1>
        <p className="page-sub">Your CSV will be cleaned, validated, and stored automatically.</p>
      </div>

      <main className="upload-main">
        <div className="upload-layout">
          <div className="upload-left">
            <CSVUploader onUploadComplete={() => setTimeout(() => router.push('/'), 1500)} />
          </div>

          <div className="upload-right">
            <div className="upload-guide">
              <h3>Expected CSV Format</h3>
              <div className="schema-table">
                {[
                  { col: 'date', type: 'YYYY-MM-DD', req: true },
                  { col: 'product', type: 'text', req: true },
                  { col: 'category', type: 'text', req: false },
                  { col: 'region', type: 'text', req: false },
                  { col: 'salesperson', type: 'text', req: false },
                  { col: 'quantity', type: 'number', req: false },
                  { col: 'unit_price', type: 'decimal', req: false },
                  { col: 'revenue', type: 'decimal', req: true },
                  { col: 'cost', type: 'decimal', req: false },
                  { col: 'profit', type: 'decimal', req: false },
                ].map(row => (
                  <div key={row.col} className="schema-row">
                    <code>{row.col}</code>
                    <span className="schema-type">{row.type}</span>
                    {row.req ? <span className="schema-req">required</span> : <span className="schema-opt">optional</span>}
                  </div>
                ))}
              </div>

              <div className="upload-notes">
                <h4>Auto-handling</h4>
                <ul>
                  <li><CheckCircle size={12} /> Missing values filled with defaults</li>
                  <li><CheckCircle size={12} /> Duplicates automatically removed</li>
                  <li><CheckCircle size={12} /> Revenue derived if quantity × price provided</li>
                  <li><CheckCircle size={12} /> Cost estimated at 60% if missing</li>
                  <li><CheckCircle size={12} /> Flexible date formats supported</li>
                  <li><CheckCircle size={12} /> Column aliases detected automatically</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
