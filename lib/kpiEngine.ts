import { SalesRecord } from './supabase';

export type KPIData = {
  totalRevenue: number;
  totalOrders: number;
  totalProfit: number;
  profitMargin: number;
  avgOrderValue: number;
  growthRate: number;
  topProducts: { name: string; revenue: number; quantity: number }[];
  regionPerformance: { region: string; revenue: number; orders: number }[];
  salespersonPerformance: { name: string; revenue: number; orders: number }[];
  salesTrend: { date: string; revenue: number; profit: number; orders: number }[];
  categoryBreakdown: { category: string; revenue: number; percentage: number }[];
  alerts: Alert[];
};

export type Alert = {
  type: 'spike' | 'drop' | 'info';
  message: string;
  severity: 'high' | 'medium' | 'low';
};

export function computeKPIs(records: SalesRecord[], prevRecords?: SalesRecord[]): KPIData {
  if (!records || records.length === 0) {
    return getEmptyKPIs();
  }

  // ── Core KPIs ──────────────────────────────────────────────────────────────
  const totalRevenue = records.reduce((sum, r) => sum + (r.revenue || 0), 0);
  const totalOrders = records.length;
  const totalProfit = records.reduce((sum, r) => sum + (r.profit || 0), 0);
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // ── Growth Rate ────────────────────────────────────────────────────────────
  let growthRate = 0;
  if (prevRecords && prevRecords.length > 0) {
    const prevRevenue = prevRecords.reduce((sum, r) => sum + (r.revenue || 0), 0);
    growthRate = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  }

  // ── Top Products ───────────────────────────────────────────────────────────
  const productMap = new Map<string, { revenue: number; quantity: number }>();
  records.forEach(r => {
    const key = r.product || 'Unknown';
    const existing = productMap.get(key) || { revenue: 0, quantity: 0 };
    productMap.set(key, {
      revenue: existing.revenue + (r.revenue || 0),
      quantity: existing.quantity + (r.quantity || 0),
    });
  });
  const topProducts = Array.from(productMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // ── Region Performance ─────────────────────────────────────────────────────
  const regionMap = new Map<string, { revenue: number; orders: number }>();
  records.forEach(r => {
    const key = r.region || 'Unknown';
    const existing = regionMap.get(key) || { revenue: 0, orders: 0 };
    regionMap.set(key, {
      revenue: existing.revenue + (r.revenue || 0),
      orders: existing.orders + 1,
    });
  });
  const regionPerformance = Array.from(regionMap.entries())
    .map(([region, data]) => ({ region, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── Salesperson Performance ────────────────────────────────────────────────
  const spMap = new Map<string, { revenue: number; orders: number }>();
  records.forEach(r => {
    const key = r.salesperson || 'Unknown';
    const existing = spMap.get(key) || { revenue: 0, orders: 0 };
    spMap.set(key, {
      revenue: existing.revenue + (r.revenue || 0),
      orders: existing.orders + 1,
    });
  });
  const salespersonPerformance = Array.from(spMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // ── Sales Trend (monthly) ──────────────────────────────────────────────────
  const trendMap = new Map<string, { revenue: number; profit: number; orders: number }>();
  records.forEach(r => {
    const date = r.date ? r.date.substring(0, 7) : 'Unknown'; // YYYY-MM
    const existing = trendMap.get(date) || { revenue: 0, profit: 0, orders: 0 };
    trendMap.set(date, {
      revenue: existing.revenue + (r.revenue || 0),
      profit: existing.profit + (r.profit || 0),
      orders: existing.orders + 1,
    });
  });
  const salesTrend = Array.from(trendMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Category Breakdown ─────────────────────────────────────────────────────
  const categoryMap = new Map<string, number>();
  records.forEach(r => {
    const key = r.category || 'Unknown';
    categoryMap.set(key, (categoryMap.get(key) || 0) + (r.revenue || 0));
  });
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, revenue]) => ({
      category,
      revenue,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── Alerts ─────────────────────────────────────────────────────────────────
  const alerts: Alert[] = [];
  if (salesTrend.length >= 2) {
    const last = salesTrend[salesTrend.length - 1];
    const prev = salesTrend[salesTrend.length - 2];
    const change = prev.revenue > 0 ? ((last.revenue - prev.revenue) / prev.revenue) * 100 : 0;
    if (change <= -20) {
      alerts.push({ type: 'drop', message: `Revenue dropped ${Math.abs(change).toFixed(1)}% vs last month`, severity: 'high' });
    } else if (change >= 30) {
      alerts.push({ type: 'spike', message: `Revenue spiked +${change.toFixed(1)}% vs last month`, severity: 'medium' });
    }
  }
  if (profitMargin < 10) {
    alerts.push({ type: 'info', message: `Low profit margin: ${profitMargin.toFixed(1)}%`, severity: 'high' });
  }

  return {
    totalRevenue,
    totalOrders,
    totalProfit,
    profitMargin,
    avgOrderValue,
    growthRate,
    topProducts,
    regionPerformance,
    salespersonPerformance,
    salesTrend,
    categoryBreakdown,
    alerts,
  };
}

function getEmptyKPIs(): KPIData {
  return {
    totalRevenue: 0, totalOrders: 0, totalProfit: 0, profitMargin: 0,
    avgOrderValue: 0, growthRate: 0, topProducts: [], regionPerformance: [],
    salespersonPerformance: [], salesTrend: [], categoryBreakdown: [], alerts: [],
  };
}
