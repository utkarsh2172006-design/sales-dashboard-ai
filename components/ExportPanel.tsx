'use client';
import { useState } from 'react';
import { Download, FileText, Table2, Loader2 } from 'lucide-react';
import { KPIData } from '@/lib/kpiEngine';

type Props = { kpis: KPIData; };

export default function ExportPanel({ kpis }: Props) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Revenue', kpis.totalRevenue.toFixed(2)],
      ['Total Orders', kpis.totalOrders.toString()],
      ['Total Profit', kpis.totalProfit.toFixed(2)],
      ['Profit Margin %', kpis.profitMargin.toFixed(2)],
      ['Avg Order Value', kpis.avgOrderValue.toFixed(2)],
      [''],
      ['Top Products', 'Revenue', 'Quantity'],
      ...kpis.topProducts.map(p => [p.name, p.revenue.toFixed(2), p.quantity.toString()]),
      [''],
      ['Region', 'Revenue', 'Orders'],
      ...kpis.regionPerformance.map(r => [r.region, r.revenue.toFixed(2), r.orders.toString()]),
      [''],
      ['Salesperson', 'Revenue', 'Orders'],
      ...kpis.salespersonPerformance.map(s => [s.name, s.revenue.toFixed(2), s.orders.toString()]),
      [''],
      ['Month', 'Revenue', 'Profit', 'Orders'],
      ...kpis.salesTrend.map(t => [t.date, t.revenue.toFixed(2), t.profit.toFixed(2), t.orders.toString()]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `salesiq-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportPDF = async () => {
    setExporting(true);
    setOpen(false);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      const dashboard = document.querySelector('.main-content') as HTMLElement;
      if (!dashboard) return;
      const canvas = await html2canvas(dashboard, {
        scale: 1.5, backgroundColor: '#080b14', useCORS: true, logging: false,
      });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`salesiq-dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-wrapper">
      <button className="btn-ghost" onClick={() => setOpen(v => !v)} disabled={exporting}>
        {exporting ? <Loader2 size={14} className="spinning" /> : <Download size={14} />}
        {exporting ? 'Exporting…' : 'Export'}
      </button>

      {open && (
        <div className="export-dropdown">
          <button className="export-option" onClick={exportCSV}>
            <Table2 size={15} />
            <div>
              <strong>Export CSV</strong>
              <span>KPIs, products, regions, trend data</span>
            </div>
          </button>
          <button className="export-option" onClick={exportPDF}>
            <FileText size={15} />
            <div>
              <strong>Export PDF</strong>
              <span>Full dashboard screenshot</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
