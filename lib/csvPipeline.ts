import Papa from 'papaparse';
import { SalesRecord } from './supabase';

type RawRow = Record<string, string>;

// ── Column name normalization map ──────────────────────────────────────────
const COLUMN_ALIASES: Record<string, keyof SalesRecord> = {
  date: 'date', 'order date': 'date', 'sale date': 'date', 'transaction date': 'date',
  product: 'product', 'product name': 'product', item: 'product', 'product/service': 'product',
  category: 'category', 'product category': 'category', type: 'category',
  region: 'region', territory: 'region', area: 'region', location: 'region',
  salesperson: 'salesperson', 'sales rep': 'salesperson', rep: 'salesperson', agent: 'salesperson',
  quantity: 'quantity', qty: 'quantity', units: 'quantity', 'units sold': 'quantity',
  unit_price: 'unit_price', 'unit price': 'unit_price', price: 'unit_price', 'price/unit': 'unit_price',
  revenue: 'revenue', sales: 'revenue', 'total revenue': 'revenue', amount: 'revenue', 'total sales': 'revenue',
  cost: 'cost', 'total cost': 'cost', cogs: 'cost', 'cost of goods': 'cost',
  profit: 'profit', 'gross profit': 'profit', 'net profit': 'profit', margin: 'profit',
};

function normalizeKey(key: string): keyof SalesRecord | null {
  const lower = key.toLowerCase().trim();
  return COLUMN_ALIASES[lower] || null;
}

function parseDate(val: string): string {
  if (!val) return new Date().toISOString().split('T')[0];
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  // Try MM/DD/YYYY or DD/MM/YYYY
  const parts = val.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (c.length === 4) {
      // MM/DD/YYYY or DD/MM/YYYY — assume MM/DD/YYYY
      return `${c}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
    }
    if (a.length === 4) return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return new Date().toISOString().split('T')[0];
}

function parseNumber(val: string): number {
  if (!val) return 0;
  const cleaned = val.toString().replace(/[$,€£\s%]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

function cleanString(val: string): string {
  if (!val) return 'Unknown';
  return val.toString().trim().replace(/\s+/g, ' ');
}

function isDuplicate(record: SalesRecord, seen: Set<string>): boolean {
  const key = `${record.date}|${record.product}|${record.salesperson}|${record.revenue}`;
  if (seen.has(key)) return true;
  seen.add(key);
  return false;
}

export type ParseResult = {
  records: SalesRecord[];
  skipped: number;
  errors: string[];
  total: number;
};

export function parseAndCleanCSV(csvText: string): ParseResult {
  const errors: string[] = [];
  let skipped = 0;

  const parsed = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    parsed.errors.slice(0, 5).forEach(e => errors.push(`Parse error row ${e.row}: ${e.message}`));
  }

  const total = parsed.data.length;
  const seen = new Set<string>();
  const records: SalesRecord[] = [];

  parsed.data.forEach((row: RawRow, idx: number) => {
    // Map raw row columns to known fields
    const mapped: Partial<SalesRecord> = {};
    Object.entries(row).forEach(([key, val]) => {
      const normalized = normalizeKey(key);
      if (normalized) {
        (mapped as Record<string, unknown>)[normalized] = val;
      }
    });

    // Skip completely empty rows
    if (Object.values(mapped).every(v => !v)) {
      skipped++;
      return;
    }

    // Build the clean record
    const date = parseDate(String(mapped.date || ''));
    const product = cleanString(String(mapped.product || ''));
    const category = cleanString(String(mapped.category || 'General'));
    const region = cleanString(String(mapped.region || 'Unknown'));
    const salesperson = cleanString(String(mapped.salesperson || 'Unknown'));
    const quantity = parseNumber(String(mapped.quantity || '1'));
    const unit_price = parseNumber(String(mapped.unit_price || '0'));
    let revenue = parseNumber(String(mapped.revenue || '0'));
    let cost = parseNumber(String(mapped.cost || '0'));
    let profit = parseNumber(String(mapped.profit || '0'));

    // Derive missing values
    if (revenue === 0 && quantity > 0 && unit_price > 0) revenue = quantity * unit_price;
    if (cost === 0 && revenue > 0) cost = revenue * 0.6; // assume 60% COGS if missing
    if (profit === 0) profit = revenue - cost;

    const record: SalesRecord = { date, product, category, region, salesperson, quantity, unit_price, revenue, cost, profit };

    // Validate required fields
    if (!product || product === 'Unknown') {
      errors.push(`Row ${idx + 2}: Missing product name`);
      skipped++;
      return;
    }

    // Deduplicate
    if (isDuplicate(record, seen)) {
      skipped++;
      return;
    }

    records.push(record);
  });

  return { records, skipped, errors: errors.slice(0, 10), total };
}

// Generate sample CSV for demo
export function generateSampleCSV(): string {
  const products = ['Laptop Pro X', 'Wireless Mouse', 'USB-C Hub', 'Monitor 4K', 'Mechanical Keyboard', 'Webcam HD', 'Headphones Pro', 'Standing Desk'];
  const categories = ['Electronics', 'Accessories', 'Office Furniture', 'Peripherals'];
  const regions = ['North America', 'Europe', 'Asia Pacific', 'Middle East', 'Latin America'];
  const salespeople = ['Alice Johnson', 'Bob Martinez', 'Carol White', 'David Kim', 'Emma Davis', 'Frank Brown'];

  const rows: string[] = ['date,product,category,region,salesperson,quantity,unit_price,revenue,cost,profit'];
  const now = new Date();

  for (let i = 0; i < 200; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 365));
    const product = products[Math.floor(Math.random() * products.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const salesperson = salespeople[Math.floor(Math.random() * salespeople.length)];
    const qty = Math.floor(Math.random() * 20) + 1;
    const price = Math.floor(Math.random() * 500) + 50;
    const revenue = qty * price;
    const cost = Math.floor(revenue * (0.45 + Math.random() * 0.2));
    const profit = revenue - cost;
    rows.push(`${date.toISOString().split('T')[0]},${product},${category},${region},${salesperson},${qty},${price},${revenue},${cost},${profit}`);
  }

  return rows.join('\n');
}
