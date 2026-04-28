'use client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { KPIData } from '@/lib/kpiEngine';

const COLORS = ['#FFFFFF', '#E4E4E7', '#D4D4D8', '#A1A1AA', '#71717A', '#52525B', '#3F3F46'];

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

export default function TopProductsChart({ kpis }: { kpis: KPIData }) {
  const data = kpis.topProducts.slice(0, 7).map(p => ({
    name: p.name.length > 18 ? p.name.substring(0, 18) + '…' : p.name,
    revenue: Math.round(p.revenue),
    quantity: p.quantity,
    fullName: p.name,
  }));

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Top Products by Revenue</h3>
        <span className="chart-badge">Top {data.length}</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="none" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 10 }} angle={-30} textAnchor="end"
            axisLine={false} tickLine={false} interval={0} tickMargin={8} />
          <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickMargin={12}
            tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface2)' }} />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
