'use client';
import { BarChart2, Upload, MessageCircle, Moon, Sun, Bell } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type Props = {
  onChatOpen: () => void;
  alertCount?: number;
};

export default function Navbar({ onChatOpen, alertCount = 0 }: Props) {
  const [dark, setDark] = useState(true);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">
          <BarChart2 size={20} />
        </div>
        <div>
          <span className="navbar-title">SalesIQ</span>
          <span className="navbar-sub">AI Analytics</span>
        </div>
      </div>

      <div className="navbar-links">
        <Link href="/" className="nav-link active">Dashboard</Link>
        <Link href="/upload" className="nav-link">Upload</Link>
      </div>

      <div className="navbar-actions">
        {alertCount > 0 && (
          <button className="nav-btn alert-btn" title={`${alertCount} active alerts`}>
            <Bell size={16} />
            <span className="alert-dot">{alertCount}</span>
          </button>
        )}
        <button className="nav-btn" onClick={onChatOpen} title="Open AI Chat">
          <MessageCircle size={16} />
          <span className="nav-btn-label">Chat</span>
        </button>
      </div>
    </nav>
  );
}
