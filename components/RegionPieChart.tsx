'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { KPIData } from '@/lib/kpiEngine';

const COLORS = ['#FFFFFF', '#D4D4D8', '#A1A1AA', '#71717A', '#52525B', '#3F3F46'];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string; payload: { percentage: number } }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label" style={{ marginBottom: '6px' }}>{payload[0].name}</p>
        <p style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 500, margin: '2px 0' }}>
          Revenue: ${payload[0].value.toLocaleString()}
        </p>
        <p style={{ color: 'var(--text3)', fontSize: '11px', marginTop: '6px' }}>
          {payload[0].payload.percentage.toFixed(1)}% of total
        </p>
      </div>
    );
  }
  return null;
};

export default function RegionPieChart({ kpis }: { kpis: KPIData }) {
  const data = kpis.regionPerformance.map(r => ({
    name: r.region,
    value: Math.round(r.revenue),
    percentage: kpis.totalRevenue > 0 ? (r.revenue / kpis.totalRevenue) * 100 : 0,
  }));

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Revenue by Region</h3>
        <span className="chart-badge">{data.length} Regions</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
            innerRadius={65} outerRadius={100} paddingAngle={3}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span style={{ color: 'var(--text2)', fontSize: 12 }}>{value}</span>}
            iconSize={8} iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
