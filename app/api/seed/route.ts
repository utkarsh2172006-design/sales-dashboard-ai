import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSampleCSV } from '@/lib/csvPipeline';
import { parseAndCleanCSV } from '@/lib/csvPipeline';

export async function POST(req: NextRequest) {
  try {
    const csvText = generateSampleCSV();
    const { records, skipped } = parseAndCleanCSV(csvText);

    // Clear existing data first
    await supabase.from('sales_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const chunkSize = 100;
    let inserted = 0;
    for (let i = 0; i < records.length; i += chunkSize) {
      const { error } = await supabase.from('sales_data').insert(records.slice(i, i + chunkSize));
      if (!error) inserted += Math.min(chunkSize, records.length - i);
    }

    return NextResponse.json({ success: true, inserted, skipped });
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
