import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SalesIQ — AI Sales Dashboard',
  description: 'Real-time AI-powered sales analytics. Upload CSV data, get instant KPIs and Gemini AI insights.',
  keywords: ['sales dashboard', 'AI analytics', 'sales KPI', 'business intelligence'],
  openGraph: {
    title: 'SalesIQ — AI Sales Dashboard',
    description: 'Transform your sales data into actionable AI insights.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
