import { NextRequest, NextResponse } from 'next/server';
import { supabase, SalesRecord } from '@/lib/supabase';
import { computeKPIs } from '@/lib/kpiEngine';
import { generateInsights } from '@/lib/gemini';

function getPreviousPeriod(from: string, to: string): { prevFrom: string; prevTo: string } {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  const prevTo = new Date(fromDate); prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo); prevFrom.setDate(prevFrom.getDate() - days);
  return {
    prevFrom: prevFrom.toISOString().split('T')[0],
    prevTo: prevTo.toISOString().split('T')[0],
  };
}

async function handleInsightsRequest(req: NextRequest, activeDataset: SalesRecord[] | null) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const region = searchParams.get('region') || '';
    const product = searchParams.get('product') || '';

    // ── Current period query ─────────────────────────────────────────────────
    let data: any[] | null = null;
    
    if (activeDataset) {
      data = activeDataset.filter(r => {
        if (from && r.date < from) return false;
        if (to && r.date > to) return false;
        if (region && r.region !== region) return false;
        if (product && r.product !== product) return false;
        return true;
      });
    } else {
      let query = supabase.from('sales_data').select('*').order('date', { ascending: true });
      if (from) query = query.gte('date', from);
      if (to) query = query.lte('date', to);
      if (region) query = query.eq('region', region);
      if (product) query = query.eq('product', product);
      
      const { data: dbData, error } = await query.limit(5000);
      if (error) {
        console.warn('Supabase query warning:', error.message);
        const emptyKpis = computeKPIs([]);
        return NextResponse.json({ kpis: emptyKpis, prevKpis: null, insights: null, recordCount: 0, filterOptions: { regions: [], products: [] } });
      }
      data = dbData;
    }

    const kpis = computeKPIs(data || []);

    // ── Previous period (for comparison) ─────────────────────────────────────
    let prevKpis = null;
    if (from && to) {
      const { prevFrom, prevTo } = getPreviousPeriod(from, to);
      let prevData: any[] | null = null;
      
      if (activeDataset) {
        prevData = activeDataset.filter(r => {
          if (r.date < prevFrom || r.date > prevTo) return false;
          if (region && r.region !== region) return false;
          if (product && r.product !== product) return false;
          return true;
        });
      } else {
        let prevQuery = supabase.from('sales_data').select('*').gte('date', prevFrom).lte('date', prevTo);
        if (region) prevQuery = prevQuery.eq('region', region);
        if (product) prevQuery = prevQuery.eq('product', product);
        const { data: dbPrevData } = await prevQuery.limit(5000);
        prevData = dbPrevData;
      }
      prevKpis = computeKPIs(prevData || []);
    }

    // ── Filter options (distinct regions + products) ────────────────────────
    let regions: string[] = [];
    let products: string[] = [];
    
    if (activeDataset) {
      regions = [...new Set(activeDataset.map(r => r.region).filter(Boolean))].sort();
      products = [...new Set(activeDataset.map(r => r.product).filter(Boolean))].sort();
    } else {
      const { data: allData } = await supabase.from('sales_data').select('region, product').limit(5000);
      regions = [...new Set((allData || []).map(r => r.region).filter(Boolean))].sort();
      products = [...new Set((allData || []).map(r => r.product).filter(Boolean))].sort();
    }

    // ── AI Insights ──────────────────────────────────────────────────────────
    let insights = null;
    if (data && data.length > 0) {
      insights = await generateInsights(kpis);
    }

    return NextResponse.json({ kpis, prevKpis, insights, recordCount: data?.length || 0, filterOptions: { regions, products } });
  } catch (err) {
    console.error('Insights error:', err);
    const emptyKpis = computeKPIs([]);
    return NextResponse.json({ kpis: emptyKpis, prevKpis: null, insights: null, recordCount: 0, filterOptions: { regions: [], products: [] } });
  }
}

export async function GET(req: NextRequest) {
  return handleInsightsRequest(req, null);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const activeDataset = body.dataset || null;
    return handleInsightsRequest(req, activeDataset);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
