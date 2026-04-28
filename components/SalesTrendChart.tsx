'use client';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';
import { KPIData } from '@/lib/kpiEngine';

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const revenue = payload.find(p => p.name === 'Revenue');
  const profit = payload.find(p => p.name === 'Profit');
  const margin = revenue?.value && profit?.value
    ? ((profit.value / revenue.value) * 100).toFixed(1) : null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontSize: '13px', fontWeight: 500, margin: '2px 0' }}>
          {p.name}: ${Number(p.value).toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </p>
      ))}
      {margin && <p style={{ color: 'var(--text3)', fontSize: '11px', marginTop: '6px' }}>Margin: {margin}%</p>}
    </div>
  );
};

export default function SalesTrendChart({ kpis }: { kpis: KPIData }) {
  const data = kpis.salesTrend.map(t => ({ ...t, date: t.date.substring(0, 7) }));

  // Find peak and min revenue months
  const maxRev = Math.max(...data.map(d => d.revenue));
  const minRev = Math.min(...data.map(d => d.revenue));
  const peakMonth = data.find(d => d.revenue === maxRev);
  const dropMonth = data.find(d => d.revenue === minRev && data.length > 1);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Revenue & Profit Trend</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {peakMonth && (
            <span className="chart-annotation peak">↑ Peak: {peakMonth.date}</span>
          )}
          {dropMonth && dropMonth.date !== peakMonth?.date && (
            <span className="chart-annotation drop">↓ Low: {dropMonth.date}</span>
          )}
          <span className="chart-badge">Monthly</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#71717A" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#71717A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="none" />
          <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickMargin={12} />
          <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickMargin={12}
            tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Legend wrapperStyle={{ color: 'var(--text2)', fontSize: 12, paddingTop: '16px' }} iconType="circle" iconSize={8} />

          {/* Peak annotation line */}
          {peakMonth && (
            <ReferenceLine x={peakMonth.date} stroke="var(--text3)" strokeDasharray="4 4" strokeOpacity={0.5}
              label={{ value: 'Peak', fill: 'var(--text3)', fontSize: 10, position: 'top' }} />
          )}

          <Area type="monotone" dataKey="revenue" stroke="#FFFFFF" strokeWidth={1.5}
            fill="url(#colorRevenue)" name="Revenue" dot={false} activeDot={{ r: 4, fill: '#FFFFFF', stroke: '#000', strokeWidth: 2 }} />
          <Area type="monotone" dataKey="profit" stroke="#71717A" strokeWidth={1.5}
            fill="url(#colorProfit)" name="Profit" dot={false} activeDot={{ r: 4, fill: '#71717A', stroke: '#000', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Chart insight footer */}
      {data.length >= 2 && (() => {
        const last = data[data.length - 1];
        const prev = data[data.length - 2];
        const chg = prev.revenue > 0 ? ((last.revenue - prev.revenue) / prev.revenue * 100) : 0;
        return (
          <div className="chart-footer">
            <span style={{ color: chg >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {chg >= 0 ? '▲' : '▼'} {Math.abs(chg).toFixed(1)}% vs previous month
            </span>
            <span>Latest month margin: {last.revenue > 0 ? ((last.profit / last.revenue) * 100).toFixed(1) : 0}%</span>
          </div>
        );
      })()}
    </div>
  );
}
