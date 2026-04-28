-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Create the sales_data table
CREATE TABLE IF NOT EXISTS public.sales_data (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date        DATE NOT NULL,
  product     VARCHAR(255) NOT NULL DEFAULT 'Unknown',
  category    VARCHAR(255) NOT NULL DEFAULT 'General',
  region      VARCHAR(255) NOT NULL DEFAULT 'Unknown',
  salesperson VARCHAR(255) NOT NULL DEFAULT 'Unknown',
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  DECIMAL(12,2) NOT NULL DEFAULT 0,
  revenue     DECIMAL(12,2) NOT NULL DEFAULT 0,
  cost        DECIMAL(12,2) NOT NULL DEFAULT 0,
  profit      DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.sales_data ENABLE ROW LEVEL SECURITY;

-- 3. Allow full access for anon key (for this demo)
CREATE POLICY "Allow all for anon"
  ON public.sales_data
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 4. Index for fast date queries
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_region ON public.sales_data(region);
CREATE INDEX IF NOT EXISTS idx_sales_product ON public.sales_data(product);

-- 5. Verify
SELECT COUNT(*) FROM public.sales_data;
