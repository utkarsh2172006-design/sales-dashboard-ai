'use client';
import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X, Filter, RotateCcw } from 'lucide-react';

export type Filters = {
  dateFrom: string;
  dateTo: string;
  region: string;
  product: string;
};

type Props = {
  filters: Filters;
  regions: string[];
  products: string[];
  onFiltersChange: (f: Filters) => void;
};

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 12 months', days: 365 },
];

function toISO(d: Date) { return d.toISOString().split('T')[0]; }

export default function FilterBar({ filters, regions, products, onFiltersChange }: Props) {
  const [open, setOpen] = useState<'date' | 'region' | 'product' | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onFiltersChange({ ...filters, dateFrom: toISO(from), dateTo: toISO(to) });
    setOpen(null);
  };

  const clearAll = () => onFiltersChange({ dateFrom: '', dateTo: '', region: '', product: '' });

  const activeCount = [filters.dateFrom, filters.region, filters.product].filter(Boolean).length;

  const dateLabel = filters.dateFrom
    ? `${filters.dateFrom} → ${filters.dateTo || 'now'}`
    : 'All dates';

  return (
    <div className="filter-bar" ref={ref}>
      <div className="filter-bar-inner">
        <div className="filter-label">
          <Filter size={13} />
          <span>Filters</span>
          {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
        </div>

        {/* Date Picker */}
        <div className="filter-group">
          <button className={`filter-btn ${filters.dateFrom ? 'active' : ''}`}
            onClick={() => setOpen(open === 'date' ? null : 'date')}>
            <Calendar size={13} />
            {dateLabel}
            <ChevronDown size={12} className={`chevron ${open === 'date' ? 'open' : ''}`} />
          </button>

          {open === 'date' && (
            <div className="filter-dropdown date-dropdown">
              <div className="dropdown-section-title">Quick Select</div>
              <div className="preset-grid">
                {PRESETS.map(p => (
                  <button key={p.label} className="preset-btn" onClick={() => applyPreset(p.days)}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="dropdown-section-title" style={{ marginTop: 12 }}>Custom Range</div>
              <div className="date-inputs">
                <div className="date-input-group">
                  <label>From</label>
                  <input type="date" value={filters.dateFrom}
                    onChange={e => onFiltersChange({ ...filters, dateFrom: e.target.value })} />
                </div>
                <div className="date-input-group">
                  <label>To</label>
                  <input type="date" value={filters.dateTo}
                    onChange={e => onFiltersChange({ ...filters, dateTo: e.target.value })} />
                </div>
              </div>
              <button className="apply-btn" onClick={() => setOpen(null)}>Apply</button>
            </div>
          )}
        </div>

        {/* Region Filter */}
        <div className="filter-group">
          <button className={`filter-btn ${filters.region ? 'active' : ''}`}
            onClick={() => setOpen(open === 'region' ? null : 'region')}>
            {filters.region || 'All Regions'}
            <ChevronDown size={12} className={`chevron ${open === 'region' ? 'open' : ''}`} />
          </button>

          {open === 'region' && (
            <div className="filter-dropdown">
              <button className={`filter-option ${!filters.region ? 'selected' : ''}`}
                onClick={() => { onFiltersChange({ ...filters, region: '' }); setOpen(null); }}>
                All Regions
              </button>
              {regions.map(r => (
                <button key={r} className={`filter-option ${filters.region === r ? 'selected' : ''}`}
                  onClick={() => { onFiltersChange({ ...filters, region: r }); setOpen(null); }}>
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Filter */}
        <div className="filter-group">
          <button className={`filter-btn ${filters.product ? 'active' : ''}`}
            onClick={() => setOpen(open === 'product' ? null : 'product')}>
            {filters.product ? (filters.product.length > 18 ? filters.product.slice(0, 18) + '…' : filters.product) : 'All Products'}
            <ChevronDown size={12} className={`chevron ${open === 'product' ? 'open' : ''}`} />
          </button>

          {open === 'product' && (
            <div className="filter-dropdown product-dropdown">
              <button className={`filter-option ${!filters.product ? 'selected' : ''}`}
                onClick={() => { onFiltersChange({ ...filters, product: '' }); setOpen(null); }}>
                All Products
              </button>
              {products.map(p => (
                <button key={p} className={`filter-option ${filters.product === p ? 'selected' : ''}`}
                  onClick={() => { onFiltersChange({ ...filters, product: p }); setOpen(null); }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active Filter Chips */}
        {activeCount > 0 && (
          <div className="active-chips">
            {filters.dateFrom && (
              <span className="chip">
                📅 {filters.dateFrom}{filters.dateTo ? ` → ${filters.dateTo}` : ''}
                <X size={10} onClick={() => onFiltersChange({ ...filters, dateFrom: '', dateTo: '' })} />
              </span>
            )}
            {filters.region && (
              <span className="chip">
                🌍 {filters.region}
                <X size={10} onClick={() => onFiltersChange({ ...filters, region: '' })} />
              </span>
            )}
            {filters.product && (
              <span className="chip">
                📦 {filters.product}
                <X size={10} onClick={() => onFiltersChange({ ...filters, product: '' })} />
              </span>
            )}
          </div>
        )}

        {activeCount > 0 && (
          <button className="clear-filters-btn" onClick={clearAll}>
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
