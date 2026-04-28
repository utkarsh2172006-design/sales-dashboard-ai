'use client';
import { InsightResponse } from '@/lib/gemini';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Trophy, ShieldAlert, RefreshCw } from 'lucide-react';

type Props = {
  insights: InsightResponse | null;
  loading: boolean;
  onRefresh: () => void;
};

export default function AIInsightsPanel({ insights, loading, onRefresh }: Props) {
  if (loading) {
    return (
      <div className="insights-card">
        <div className="insights-header">
          <div className="insights-title-row">
            <Sparkles size={18} className="sparkle-icon spinning" />
            <h3 className="chart-title">AI Insights</h3>
          </div>
        </div>
        <div className="insights-loading">
          <div className="loading-shimmer" />
          <div className="loading-shimmer short" />
          <div className="loading-shimmer" />
          <div className="loading-shimmer short" />
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="insights-card">
        <div className="insights-header">
          <div className="insights-title-row">
            <Sparkles size={18} className="sparkle-icon" />
            <h3 className="chart-title">AI Insights</h3>
          </div>
        </div>
        <div className="no-insights">
          <p>Upload data to generate AI insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-card">
      <div className="insights-header">
        <div className="insights-title-row">
          <Sparkles size={18} className="sparkle-icon" />
          <h3 className="chart-title">AI Insights</h3>
          <span className="gemini-badge">Gemini</span>
        </div>
        <button className="refresh-btn" onClick={onRefresh} title="Refresh insights">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="insights-list">
        {insights.insights?.map((insight, i) => (
          <div key={i} className="insight-item" style={{ marginBottom: '20px' }}>
            <div className="insight-headline" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px', lineHeight: 1.2 }}>{insight.icon}</span>
              <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px', lineHeight: 1.4 }}>{insight.headline}</p>
            </div>
            <div className="insight-details" style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '26px' }}>
              <div style={{ display: 'flex', gap: '8px', color: 'var(--text2)', fontSize: '13px' }}>
                <span style={{ color: 'var(--text3)' }}>→</span>
                <p><strong>Cause:</strong> {insight.cause}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', color: 'var(--text2)', fontSize: '13px' }}>
                <span style={{ color: 'var(--green)' }}>→</span>
                <p><strong>Action:</strong> {insight.action}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
