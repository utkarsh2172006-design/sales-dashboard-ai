export default function SkeletonDashboard() {
  return (
    <div className="skeleton-wrapper">
      {/* KPI Skeletons */}
      <div className="kpi-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="kpi-card skeleton-card">
            <div className="skel-icon" />
            <div className="skel-content">
              <div className="skel skel-label" />
              <div className="skel skel-value" />
              <div className="skel skel-sub" />
            </div>
          </div>
        ))}
      </div>
      {/* Chart Skeletons */}
      <div className="dashboard-grid">
        <div className="charts-col">
          <div className="chart-card"><div className="skel skel-chart-full" /></div>
          <div className="charts-row-2">
            <div className="chart-card"><div className="skel skel-chart-half" /></div>
            <div className="chart-card"><div className="skel skel-chart-half" /></div>
          </div>
          <div className="chart-card"><div className="skel skel-chart-half" /></div>
        </div>
        <div className="insights-col">
          <div className="insights-card">
            <div className="skel skel-label" style={{ width: '40%' }} />
            <div className="skel" style={{ height: 80, borderRadius: 8 }} />
            <div className="skel skel-label" style={{ width: '60%' }} />
            <div className="skel skel-label" style={{ width: '80%' }} />
            <div className="skel skel-label" style={{ width: '50%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
