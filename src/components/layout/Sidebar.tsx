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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Futures Arb', icon: <BarChart3 size={20} /> },
  { href: '/spot', label: 'Spot Arb', icon: <Zap size={20} /> },
  { href: '/funding', label: 'Funding Rates', icon: <TrendingUp size={20} /> },
  { href: '/alerts', label: 'Alerts', icon: <Bell size={20} /> },
  { href: '/whales', label: 'Whale Tracker', icon: <Wallet size={20} />, badge: 'Soon' },
  { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
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
          'fixed top-0 left-0 z-40 h-full flex flex-col',
          'bg-bg-surface/95 backdrop-blur-xl border-r border-border',
          'transition-all duration-300 ease-in-out',
          isOpen ? 'w-[260px]' : 'w-[80px]',
          mobileOpen ? 'translate-x-0' : 'lg:translate-x-0 -translate-x-full'
        )}
      >
        <div className={clsx(
          "flex items-center border-b border-border transition-all duration-300",
          isOpen ? "justify-between px-6 py-6" : "justify-center px-0 py-6"
        )}>
          <div className={clsx("flex items-center gap-3 transition-opacity duration-200", !isOpen && "w-0 overflow-hidden opacity-0 invisible")}>
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-500/15 text-primary-400 shrink-0">
              <Zap size={20} />
            </div>
            {isOpen && (
              <div className="whitespace-nowrap">
                <h1 className="text-lg font-bold tracking-tight gradient-text">
                  CryptoTracker
                </h1>
                <p className="text-[11px] text-text-muted font-medium tracking-wider uppercase">
                  Spreads & Funding
                </p>
              </div>
            )}
          </div>
          
          {!isOpen && (
             <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-500/15 text-primary-400">
               <Zap size={20} />
             </div>
          )}

          {/* Desktop Collapse Button */}
          <button
            onClick={onToggle}
            className={clsx(
              "hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors",
              !isOpen && "absolute -right-4 top-20 bg-bg-surface border border-border shadow-xl z-50 rounded-full"
            )}
            title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={14} />}
          </button>
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
                  'group flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                  isOpen ? 'gap-3 px-4 py-2.5' : 'justify-center p-2.5',
                  isActive
                    ? 'bg-primary-500/12 text-primary-400 shadow-[inset_0_0_20px_rgba(6,182,212,0.08)]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                )}
                title={!isOpen ? item.label : undefined}
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
                {isOpen && (
                  <>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted border border-border">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse-glow" />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={clsx("px-4 py-4 border-t border-border transition-all duration-300", !isOpen && "flex justify-center")}>
          <div className={clsx(
            "flex items-center gap-2 rounded-lg bg-bg-elevated/50 border border-border transition-all",
            isOpen ? "px-3 py-2" : "p-2"
          )}>
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse shrink-0" />
            {isOpen && <span className="text-xs text-text-muted whitespace-nowrap">Live data streaming</span>}
          </div>
        </div>
      </aside>
    </>
  );
}
