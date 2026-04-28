'use client';
import { KPIData } from '@/lib/kpiEngine';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, BarChart2, Percent, Minus } from 'lucide-react';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function getContext(metric: string, value: number, change: number | null): string {
  if (metric === 'margin') {
    if (value >= 30) return 'Excellent margin';
    if (value >= 20) return 'Healthy margin';
    if (value >= 10) return 'Below target (20%)';
    return 'Critical — review costs';
  }
  if (change === null) return 'No comparison data';
  if (change > 10) return 'Strong growth ↑';
  if (change > 0) return 'Growing steadily';
  if (change === 0) return 'Revenue stable →';
  if (change > -10) return 'Slight decline';
  return 'Declining — take action';
}

// Simple SVG sparkline from trend data
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  const w = 64; const h = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="sparkline">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type CardProps = {
  label: string; value: string; sub?: string;
  change?: number | null; icon: React.ReactNode;
  color: string; trend?: number[]; metric?: string; currentVal?: number;
};

function KPICard({ label, value, sub, change, icon, color, trend, metric, currentVal }: CardProps) {
  const context = metric !== undefined && currentVal !== undefined
    ? getContext(metric, currentVal, change ?? null)
    : sub;

  const isPositive = change !== null && change !== undefined && change > 0;
  const isNegative = change !== null && change !== undefined && change < 0;

  return (
    <div className="kpi-card" style={{ '--card-color': color } as React.CSSProperties}>
      <div className="kpi-icon-wrap">{icon}</div>
      <div className="kpi-content">
        <p className="kpi-label">{label}</p>
        <p className="kpi-value">{value}</p>

        {/* Comparison badge */}
        {change !== null && change !== undefined && (
          <div className="kpi-comparison">
            {isPositive && <TrendingUp size={11} />}
            {isNegative && <TrendingDown size={11} />}
            {!isPositive && !isNegative && <Minus size={11} />}
            <span className={`kpi-change ${isPositive ? 'pos' : isNegative ? 'neg' : 'neutral'}`}>
              {isPositive ? '+' : ''}{change.toFixed(1)}% vs prev period
            </span>
          </div>
        )}

        <p className={`kpi-sub ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
          {context}
        </p>
      </div>

      {/* Mini Sparkline */}
      {trend && trend.length > 1 && (
        <div className="kpi-sparkline">
          <Sparkline data={trend} color={color} />
        </div>
      )}
    </div>
  );
}

type Props = { kpis: KPIData; prevKpis?: KPIData | null };

function pctChange(curr: number, prev: number | undefined): number | null {
  if (!prev || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

export default function KPICards({ kpis, prevKpis }: Props) {
  const revTrend = kpis.salesTrend.map(t => t.revenue);
  const profitTrend = kpis.salesTrend.map(t => t.profit);

  return (
    <div className="kpi-grid">
      <KPICard label="Total Revenue" value={fmt(kpis.totalRevenue)}
        change={pctChange(kpis.totalRevenue, prevKpis?.totalRevenue)}
        icon={<DollarSign size={20} />} color="#6366f1"
        trend={revTrend} metric="revenue" currentVal={kpis.totalRevenue} />

      <KPICard label="Total Orders" value={kpis.totalOrders.toLocaleString()}
        sub={`Avg order: ${fmt(kpis.avgOrderValue)}`}
        change={pctChange(kpis.totalOrders, prevKpis?.totalOrders)}
        icon={<ShoppingCart size={20} />} color="#8b5cf6" />

      <KPICard label="Total Profit" value={fmt(kpis.totalProfit)}
        change={pctChange(kpis.totalProfit, prevKpis?.totalProfit)}
        icon={<BarChart2 size={20} />} color="#06b6d4"
        trend={profitTrend} metric="profit" currentVal={kpis.totalProfit} />

      <KPICard label="Profit Margin" value={`${kpis.profitMargin.toFixed(1)}%`}
        change={prevKpis ? kpis.profitMargin - prevKpis.profitMargin : null}
        icon={<Percent size={20} />} color="#10b981"
        metric="margin" currentVal={kpis.profitMargin} />
    </div>
  );
}
