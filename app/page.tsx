'use client';
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import KPICards from '@/components/KPICards';
import SalesTrendChart from '@/components/SalesTrendChart';
import TopProductsChart from '@/components/TopProductsChart';
import RegionPieChart from '@/components/RegionPieChart';
import SalespersonChart from '@/components/SalespersonChart';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import AlertBanner from '@/components/AlertBanner';
import CSVUploader from '@/components/CSVUploader';
import ChatPanel from '@/components/ChatPanel';
import FilterBar, { Filters } from '@/components/FilterBar';
import ExportPanel from '@/components/ExportPanel';
import { KPIData } from '@/lib/kpiEngine';
import { SalesRecord } from '@/lib/supabase';
import SkeletonDashboard from '@/components/SkeletonDashboard';
import { InsightResponse } from '@/lib/gemini';
import { RefreshCw, Loader2, UploadCloud, Sparkles, BarChart2, ShieldAlert, Cpu } from 'lucide-react';

const EMPTY_FILTERS: Filters = { dateFrom: '', dateTo: '', region: '', product: '' };

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [prevKpis, setPrevKpis] = useState<KPIData | null>(null);
  const [insights, setInsights] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterOptions, setFilterOptions] = useState<{ regions: string[]; products: string[] }>({ regions: [], products: [] });
  const [activeDataset, setActiveDataset] = useState<SalesRecord[] | null>(null);
  const [activeFilename, setActiveFilename] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (f: Filters = filters, dataset = activeDataset) => {
    setLoading(true);
    setInsightsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (f.dateFrom) params.set('from', f.dateFrom);
      if (f.dateTo) params.set('to', f.dateTo);
      if (f.region) params.set('region', f.region);
      if (f.product) params.set('product', f.product);
      
      const res = await fetch(`/api/insights?${params.toString()}`, {
        method: dataset ? 'POST' : 'GET',
        headers: dataset ? { 'Content-Type': 'application/json' } : undefined,
        body: dataset ? JSON.stringify({ dataset }) : undefined,
      });
      
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setKpis(data.kpis);
      setPrevKpis(data.prevKpis || null);
      setInsights(data.insights);
      setFilterOptions(data.filterOptions || { regions: [], products: [] });
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setError('Failed to load data. Upload data first or try refreshing.');
    } finally {
      setLoading(false);
      setInsightsLoading(false);
    }
  }, [filters]);

  // ENFORCE FRESH START RULE: Do NOT fetch from DB on mount!
  // useEffect(() => { fetchDashboard(EMPTY_FILTERS, activeDataset); }, []);

  const handleFiltersChange = (f: Filters) => {
    setFilters(f);
    fetchDashboard(f, activeDataset);
  };

  const hasData = kpis && kpis.totalOrders > 0;
  const activeFilterCount = [filters.dateFrom, filters.region, filters.product].filter(Boolean).length;

  if (!activeDataset) {
    return (
      <div className="landing-page">
        <nav className="landing-nav">
          <div className="logo"><Sparkles size={20} className="text-blue" /> SalesIQ Analyst</div>
          <div className="nav-links">
            <span className="badge-premium">Enterprise Grade AI</span>
          </div>
        </nav>
        
        <header className="hero-section">
          <h1 className="hero-title">Transform Raw Sales Data Into <span className="text-gradient">Decisions.</span></h1>
          <p className="hero-sub">Upload your dataset to instantly generate a deep-dive analytics dashboard powered by an elite AI Data Scientist.</p>
          
          <div className="hero-upload-box">
            <CSVUploader onUploadComplete={(records, filename) => { 
              if (records && records.length > 0) {
                setActiveDataset(records);
                setActiveFilename(filename || null);
                setToastMessage("New dataset loaded successfully");
                setTimeout(() => setToastMessage(null), 4000);
                fetchDashboard(EMPTY_FILTERS, records);
              }
            }} />
          </div>
        </header>

        <section className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><BarChart2 size={24} /></div>
            <h3>Real-Time Analysis</h3>
            <p>Upload any raw CSV or Excel dataset. The AI immediately parses, cleans, and structures it into decision-ready insights.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><ShieldAlert size={24} /></div>
            <h3>Root Cause Detection</h3>
            <p>No generic reporting. The engine detects exact anomalies and highlights critical risks affecting your margins.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Cpu size={24} /></div>
            <h3>Adaptive Dashboard</h3>
            <p>The system intelligently builds charts that actually matter based on the statistical distribution of your specific data.</p>
          </div>
        </section>

        <footer className="landing-footer">
          <p>© 2026 SalesIQ Analyst. Advanced Data Science Engine.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar onChatOpen={() => setChatOpen(true)} alertCount={kpis?.alerts?.length || 0} />

      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Sales Dashboard</h1>
            <p className="page-sub">
              {activeFilename ? `Current Dataset: ${activeFilename}` : (lastUpdated ? `Updated ${lastUpdated}` : 'AI-powered analytics')}
              {kpis && ` · ${kpis.totalOrders.toLocaleString()} orders`}
              {activeFilterCount > 0 && <span className="filtered-badge">Filtered</span>}
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-ghost" onClick={() => setShowUploader(v => !v)}>
              <UploadCloud size={15} />{showUploader ? 'Hide Uploader' : 'Upload Data'}
            </button>
            {hasData && <ExportPanel kpis={kpis} />}
            <button className="btn-ghost" onClick={() => fetchDashboard(filters, activeDataset)} disabled={loading}>
              {loading ? <Loader2 size={15} className="spinning" /> : <RefreshCw size={15} />}
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          regions={filterOptions.regions}
          products={filterOptions.products}
          onFiltersChange={handleFiltersChange}
        />

        {toastMessage && (
          <div className="toast-notification">
            <Sparkles size={16} /> {toastMessage}
          </div>
        )}

        {/* Alerts */}
        {kpis?.alerts && kpis.alerts.length > 0 && <AlertBanner alerts={kpis.alerts} />}

        {/* Uploader */}
        {showUploader && (
          <div className="uploader-section">
            <CSVUploader onUploadComplete={(records, filename) => { 
              setShowUploader(false); 
              if (records && records.length > 0) {
                // RESET STATE FOR NEW UPLOAD
                setKpis(null);
                setInsights(null);
                setFilters(EMPTY_FILTERS);
                setActiveDataset(records);
                if (filename) setActiveFilename(filename);
                setToastMessage("New dataset loaded successfully");
                setTimeout(() => setToastMessage(null), 4000);
                fetchDashboard(EMPTY_FILTERS, records);
              }
            }} />
          </div>
        )}

        {/* Skeleton loading */}
        {loading && !hasData && <SkeletonDashboard />}

        {/* Error State */}
        {error && !loading && (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => fetchDashboard(filters)}>Try Again</button>
          </div>
        )}

        {/* Dashboard */}
        {hasData && (() => {
          const recommendedCharts = insights?.recommendedCharts || ['trend', 'products', 'regions', 'salespersons'];
          const showTrend = recommendedCharts.includes('trend');
          const showProducts = recommendedCharts.includes('products');
          const showRegions = recommendedCharts.includes('regions');
          const showSalespersons = recommendedCharts.includes('salespersons');

          return (
            <>
              <KPICards kpis={kpis} prevKpis={prevKpis} />
              <div className="dashboard-grid">
                <div className="charts-col">
                  {showTrend && <SalesTrendChart kpis={kpis} />}
                  
                  {(showProducts || showRegions) && (
                    <div className="charts-row-2">
                      {showProducts && <TopProductsChart kpis={kpis} />}
                      {showRegions && <RegionPieChart kpis={kpis} />}
                    </div>
                  )}
                  
                  {showSalespersons && <SalespersonChart kpis={kpis} />}
                </div>
                <div className="insights-col">
                  <AIInsightsPanel insights={insights} loading={insightsLoading} onRefresh={() => fetchDashboard(filters, activeDataset)} />
                </div>
              </div>
            </>
          );
        })()}
      </main>

      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {!chatOpen && (
        <button className="chat-fab" onClick={() => setChatOpen(true)}>
          <span className="chat-fab-icon">✨</span>
          <span className="chat-fab-label">AI Sales Analyst</span>
        </button>
      )}
    </div>
  );
}
