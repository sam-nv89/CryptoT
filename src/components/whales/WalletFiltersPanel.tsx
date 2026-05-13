'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { WalletSearchFilters, FILTER_PRESETS, DEFAULT_FILTERS, WhaleSortKey } from '@/types/whale-filters';
import { WhaleNetwork } from '@/types/whales';

interface Props {
  filters: WalletSearchFilters;
  onChange: (filters: WalletSearchFilters) => void;
}

const NETWORKS: WhaleNetwork[] = ['ETH', 'BSC', 'ARB', 'SOL', 'MANTLE', 'ZKSYNC'];
const SORT_OPTIONS: { value: WhaleSortKey; label: string }[] = [
  { value: 'pnl', label: 'Total PnL' },
  { value: 'winRate', label: 'Win Rate' },
  { value: 'roi', label: 'ROI %' },
  { value: 'balance', label: 'Balance' },
  { value: 'trades', label: 'Total Trades' },
  { value: 'avgProfit', label: 'Avg Profit/Token' },
];

const CustomNetworkSelect: React.FC<{ value?: WhaleNetwork; onChange: (net?: WhaleNetwork) => void }> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    if (btnRef.current) setDropRect(btnRef.current.getBoundingClientRect());
    setIsOpen(prev => !prev);
  }, []);

  const select = useCallback((net?: WhaleNetwork) => {
    onChange(net);
    setIsOpen(false);
  }, [onChange]);

  const portal = isOpen && dropRect && typeof document !== 'undefined'
    ? createPortal(
        <div
          style={{
            position: 'fixed',
            top: dropRect.bottom + 4,
            left: dropRect.left,
            minWidth: Math.max(dropRect.width, 160),
            zIndex: 9999,
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div style={{
            background: '#0b0e14',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '10px',
            boxShadow: '0 16px 56px rgba(0,0,0,0.95)',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => select(undefined)}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: '13px',
                background: !value ? 'rgba(6,182,212,0.15)' : 'transparent',
                color: !value ? '#22d3ee' : '#94a3b8',
                fontWeight: !value ? 700 : 400,
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'block',
              }}
              onMouseEnter={e => { if (value) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#fff'; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = !value ? 'rgba(6,182,212,0.15)' : 'transparent'; (e.currentTarget as HTMLElement).style.color = !value ? '#22d3ee' : '#94a3b8'; }}
            >
              All Networks
            </button>
            {NETWORKS.map(n => (
              <button
                key={n}
                onClick={() => select(n)}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: '13px',
                  background: value === n ? 'rgba(6,182,212,0.15)' : 'transparent',
                  color: value === n ? '#22d3ee' : '#94a3b8',
                  fontWeight: value === n ? 700 : 400,
                  cursor: 'pointer',
                  display: 'block',
                }}
                onMouseEnter={e => { if (value !== n) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#fff'; } }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = value === n ? 'rgba(6,182,212,0.15)' : 'transparent'; (e.currentTarget as HTMLElement).style.color = value === n ? '#22d3ee' : '#94a3b8'; }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`w-full border rounded-lg px-3 py-2 text-sm text-white flex items-center justify-between transition-all ${
          isOpen ? 'bg-white/10 border-primary-500/50' : 'bg-[#0d1117] border-white/10 hover:bg-white/[0.05]'
        }`}
      >
        <span className="font-medium">{value || 'All'}</span>
        <ChevronDown size={14} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {portal}
    </div>
  );
};

export const WalletFiltersPanel: React.FC<Props> = ({ filters, onChange }) => {
  const [expanded, setExpanded] = useState(false);

  const update = (patch: Partial<WalletSearchFilters>) => {
    onChange({ ...filters, ...patch, page: 1 });
  };

  const reset = () => onChange({ ...DEFAULT_FILTERS });

  const hasActive = filters.minWinRate !== undefined || filters.minPnL !== undefined ||
    filters.minBalance !== undefined || filters.minTrades !== undefined ||
    filters.minROI !== undefined || filters.network !== undefined;

  return (
    <div className="mb-6 animate-fade-in">
      {/* Preset Quick Buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {FILTER_PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => update({ ...DEFAULT_FILTERS, ...preset.filters })}
            className="px-3.5 py-2 rounded-xl text-sm font-medium bg-white/[0.04] border border-white/[0.08] text-text-secondary hover:bg-white/[0.08] hover:text-white hover:border-primary-500/30 transition-all active:scale-95"
          >
            <span className="mr-1.5">{preset.icon}</span>
            {preset.label}
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={() => setExpanded(!expanded)}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
            hasActive
              ? 'bg-primary-500/10 border border-primary-500/30 text-primary-400'
              : 'bg-white/[0.04] border border-white/[0.08] text-text-secondary hover:text-white'
          }`}
        >
          <SlidersHorizontal size={14} />
          Filters
          {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_6px_#22d3ee]" />}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {hasActive && (
          <button onClick={reset} className="px-3 py-2 rounded-xl text-sm text-text-muted hover:text-danger-400 transition-colors flex items-center gap-1.5">
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {expanded && (
        <div className="glass-card p-5 mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-fade-in">
          {/* Network */}
          <div className="relative">
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Network</label>
            <CustomNetworkSelect 
              value={filters.network} 
              onChange={net => update({ network: net })} 
            />
          </div>

          {/* Min Win Rate */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Min Win Rate %</label>
            <input
              type="number" min={0} max={100} step={5}
              value={filters.minWinRate ?? ''}
              onChange={e => update({ minWinRate: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="0"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary-500/50"
            />
          </div>

          {/* Min PnL */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Min PnL ($)</label>
            <input
              type="number" step={100}
              value={filters.minPnL ?? ''}
              onChange={e => update({ minPnL: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="0"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary-500/50"
            />
          </div>

          {/* Min ROI */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Min ROI %</label>
            <input
              type="number" step={10}
              value={filters.minROI ?? ''}
              onChange={e => update({ minROI: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="0"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary-500/50"
            />
          </div>

          {/* Min Balance */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Min Balance ($)</label>
            <input
              type="number" step={1000}
              value={filters.minBalance ?? ''}
              onChange={e => update({ minBalance: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="0"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary-500/50"
            />
          </div>

          {/* Min Trades */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Min Trades</label>
            <input
              type="number" min={0} step={10}
              value={filters.minTrades ?? ''}
              onChange={e => update({ minTrades: e.target.value ? parseInt(e.target.value, 10) : undefined })}
              placeholder="0"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary-500/50"
            />
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Sort:</span>
        <div className="flex flex-wrap gap-1.5">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                if (filters.sortBy === opt.value) {
                  update({ sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc' });
                } else {
                  update({ sortBy: opt.value, sortOrder: 'desc' });
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filters.sortBy === opt.value
                  ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                  : 'text-text-muted hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {opt.label}
              {filters.sortBy === opt.value && (
                <span className="ml-1">{filters.sortOrder === 'desc' ? '↓' : '↑'}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
