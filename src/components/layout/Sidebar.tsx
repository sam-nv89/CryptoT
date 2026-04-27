'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  Bell,
  Wallet,
  Settings,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <BarChart3 size={20} /> },
  { href: '/funding', label: 'Funding', icon: <TrendingUp size={20} /> },
  { href: '/alerts', label: 'Alerts', icon: <Bell size={20} />, badge: 'Soon' },
  { href: '/whales', label: 'Whales', icon: <Wallet size={20} />, badge: 'Soon' },
  { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        id="sidebar-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-lg bg-bg-elevated border border-border text-text-secondary hover:text-text-primary transition-colors lg:hidden"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-40 h-full w-[260px] flex flex-col',
          'bg-bg-surface/95 backdrop-blur-xl border-r border-border',
          'transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-500/15 text-primary-400">
            <Zap size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight gradient-text">
              CryptoTracker
            </h1>
            <p className="text-[11px] text-text-muted font-medium tracking-wider uppercase">
              Spreads & Funding
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-${item.label.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-500/12 text-primary-400 shadow-[inset_0_0_20px_rgba(6,182,212,0.08)]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                )}
              >
                <span
                  className={clsx(
                    'transition-colors',
                    isActive
                      ? 'text-primary-400'
                      : 'text-text-muted group-hover:text-text-secondary'
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted border border-border">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated/50 border border-border">
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span className="text-xs text-text-muted">Live data streaming</span>
          </div>
        </div>
      </aside>
    </>
  );
}
