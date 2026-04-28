import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// db: { schema: 'public' } forces schema cache refresh on every request
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'public' },
  auth: { persistSession: false },
});

export type SalesRecord = {
  id?: string;
  date: string;
  product: string;
  category: string;
  region: string;
  salesperson: string;
  quantity: number;
  unit_price: number;
  revenue: number;
  cost: number;
  profit: number;
  created_at?: string;
};
