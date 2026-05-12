'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border rounded-lg px-3 py-2 text-sm text-white flex items-center justify-between transition-all ${
          isOpen ? 'bg-white/10 border-primary-500/50' : 'bg-[#0d1117] border-white/10 hover:bg-white/[0.05]'
        }`}
      >
        <span className="font-medium">{value || 'All'}</span>
        <ChevronDown size={14} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0b0e14] border border-white/30 rounded-lg shadow-[0_12px_48px_rgba(0,0,0,0.9)] z-[110] overflow-hidden animate-fade-in ring-1 ring-white/10">
          <button 
            onClick={() => { onChange(undefined); setIsOpen(false); }} 
            className="w-full text-left px-3 py-2.5 text-sm text-text-secondary hover:bg-white/10 hover:text-white transition-colors border-b border-white/5"
          >
            All Networks
          </button>
          {NETWORKS.map(n => (
            <button
              key={n}
              onClick={() => { onChange(n); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between ${
                value === n ? 'bg-primary-500/20 text-primary-400 font-bold' : 'text-text-secondary hover:bg-white/10 hover:text-white'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
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
