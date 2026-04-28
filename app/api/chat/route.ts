import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { computeKPIs } from '@/lib/kpiEngine';
import { chatWithData } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const { data, error } = await supabase.from('sales_data').select('*').limit(5000);
    if (error) throw error;

    const kpis = computeKPIs(data || []);
    const answer = await chatWithData(question, kpis);

    return NextResponse.json({ answer });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
