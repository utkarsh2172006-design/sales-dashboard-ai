import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseAndCleanCSV } from '@/lib/csvPipeline';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    let csvText = '';

    if (file) {
      csvText = await file.text();
    } else {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const { records, skipped, errors, total } = parseAndCleanCSV(csvText);

    if (records.length === 0) {
      return NextResponse.json({ error: 'No valid records found', errors }, { status: 400 });
    }

    // Batch insert into Supabase in chunks of 100
    const chunkSize = 100;
    let inserted = 0;
    const insertErrors: string[] = [];

    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const { error } = await supabase.from('sales_data').insert(chunk);
      if (error) {
        insertErrors.push(error.message);
      } else {
        inserted += chunk.length;
      }
    }

    return NextResponse.json({
      success: true,
      total,
      inserted,
      skipped,
      errors: [...errors, ...insertErrors].slice(0, 10),
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
