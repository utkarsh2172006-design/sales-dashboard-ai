'use client';
import { Alert } from '@/lib/kpiEngine';
import { AlertTriangle, TrendingDown, TrendingUp, Info, X } from 'lucide-react';
import { useState } from 'react';

export default function AlertBanner({ alerts }: { alerts: Alert[] }) {
  const [dismissed, setDismissed] = useState<number[]>([]);
  const visible = alerts.filter((_, i) => !dismissed.includes(i));
  if (visible.length === 0) return null;

  return (
    <div className="alert-banner-container">
      {visible.map((alert, i) => (
        <div key={i} className={`alert-banner ${alert.type} ${alert.severity}`}>
          <div className="alert-icon">
            {alert.type === 'drop' && <TrendingDown size={14} />}
            {alert.type === 'spike' && <TrendingUp size={14} />}
            {alert.type === 'info' && <Info size={14} />}
          </div>
          <p>{alert.message}</p>
          <button className="alert-dismiss" onClick={() => setDismissed(prev => [...prev, i])}>
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
