'use client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { KPIData } from '@/lib/kpiEngine';

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { name: string } }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label" style={{ marginBottom: '6px' }}>{payload[0].payload.name}</p>
        <p style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 500 }}>
          Revenue: ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function SalespersonChart({ kpis }: { kpis: KPIData }) {
  const data = kpis.salespersonPerformance.slice(0, 8).map(s => ({
    name: s.name.split(' ')[0],
    revenue: Math.round(s.revenue),
    orders: s.orders,
    fullName: s.name,
  }));

  const max = data[0]?.revenue || 1;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Salesperson Performance</h3>
        <span className="chart-badge">By Revenue</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="none" horizontal={false} />
          <XAxis type="number" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickMargin={12}
            tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} />
          <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 12, fontWeight: 500 }}
            axisLine={false} tickLine={false} width={55} tickMargin={8} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface2)' }} />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((entry, i) => (
              <Cell key={i}
                fill={`rgba(255, 255, 255, ${0.15 + 0.85 * (entry.revenue / max)})`}
                stroke={i === 0 ? "var(--border2)" : "transparent"}
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
