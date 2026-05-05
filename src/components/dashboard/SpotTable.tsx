'use client';

import { useState, useMemo, useCallback, Fragment } from 'react';
import { clsx } from 'clsx';
import {
  ArrowRightLeft, ArrowUpDown, ArrowUp, ArrowDown,
  Search, X, ChevronLeft, ChevronRight, Filter,
  ChevronDown, Shield, AlertTriangle, HelpCircle,
  Flame, Zap,
} from 'lucide-react';
import type {
  SpotSpreadEntry, SpotConfidence, ExchangeId,
  SpreadSortKey, SortDirection, SpreadSortConfig, SpreadFilterConfig,
} from '@/types';
import { EXCHANGES, formatSymbol } from '@/config/exchanges';
import { DEFAULT_SPREAD_FILTERS } from '@/types';
import { HOT_SPREAD_THRESHOLD, WARM_SPREAD_THRESHOLD } from '@/config/spot-config';

interface SpotTableProps {
  spreads: SpotSpreadEntry[];
  loading?: boolean;
  changedIds?: Set<string>;
}

function spreadUid(s: SpotSpreadEntry): string {
  return `${s.symbol}::${s.buyExchange}->${s.sellExchange}`;
}

// === Confidence Badge ===
function ConfidenceBadge({ confidence }: { confidence: SpotConfidence }) {
  const config = {
    verified: { icon: <Shield size={10} />, label: 'Verified', cls: 'bg-accent-green/15 text-accent-green border-accent-green/25' },
    estimated: { icon: <AlertTriangle size={10} />, label: 'Est.', cls: 'bg-accent-amber/15 text-accent-amber border-accent-amber/25' },
    raw: { icon: <HelpCircle size={10} />, label: 'Raw', cls: 'bg-text-muted/15 text-text-muted border-text-muted/25' },
  }[confidence];

  return (
    <span className={clsx('inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border', config.cls)}>
      {config.icon} {config.label}
    </span>
  );
}

// === Tier Badge ===
function TierBadge({ spreadPct }: { spreadPct: number }) {
  if (spreadPct >= HOT_SPREAD_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-accent-red/15 text-accent-red border border-accent-red/25 animate-pulse">
        <Flame size={9} /> HOT
      </span>
    );
  }
  if (spreadPct >= WARM_SPREAD_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-accent-amber/15 text-accent-amber border border-accent-amber/25">
        <Zap size={9} /> WARM
      </span>
    );
  }
  return null;
}

// === Sort comparator ===
function compareSpreads(a: SpotSpreadEntry, b: SpotSpreadEntry, key: SpreadSortKey, dir: SortDirection): number {
  let cmp = 0;
  switch (key) {
    case 'spreadPercent': cmp = a.spreadPercent - b.spreadPercent; break;
    case 'spreadAbsolute': cmp = a.profitPer1000 - b.profitPer1000; break;
    case 'volume24h': cmp = a.volume24h - b.volume24h; break;
    case 'buyPrice': cmp = a.buyPrice - b.buyPrice; break;
    case 'sellPrice': cmp = a.sellPrice - b.sellPrice; break;
    case 'symbol': cmp = a.symbol.localeCompare(b.symbol); break;
    case 'buyExchange': cmp = a.buyExchange.localeCompare(b.buyExchange); break;
    case 'sellExchange': cmp = a.sellExchange.localeCompare(b.sellExchange); break;
  }
  return dir === 'desc' ? -cmp : cmp;
}

// === Sortable Header ===
function SortableHeader({ label, sortKey, currentSort, onSort, align = 'left' }: {
  label: string; sortKey: SpreadSortKey;
  currentSort: SpreadSortConfig; onSort: (key: SpreadSortKey) => void;
  align?: 'left' | 'right';
}) {
  const isActive = currentSort.key === sortKey;
  return (
    <th
      className={clsx(
        'px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider cursor-pointer select-none',
        'hover:text-primary-400 transition-colors group whitespace-nowrap',
        align === 'right' ? 'text-right' : 'text-left',
        isActive ? 'text-primary-400' : 'text-text-muted',
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentSort.direction === 'desc' ? <ArrowDown size={10} /> : <ArrowUp size={10} />
        ) : (
          <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </span>
    </th>
  );
}

// === Filter Bar ===
function FilterBar({ filters, onChange, availableExchanges, totalCount, filteredCount, confidenceFilter, onConfidenceChange }: {
  filters: SpreadFilterConfig;
  onChange: (f: Partial<SpreadFilterConfig>) => void;
  availableExchanges: ExchangeId[];
  totalCount: number;
  filteredCount: number;
  confidenceFilter: SpotConfidence | 'all';
  onConfidenceChange: (c: SpotConfidence | 'all') => void;
}) {
  const [showExchanges, setShowExchanges] = useState(false);
  const hasFilters = filters.search || filters.exchanges.length > 0
    || filters.minSpreadPercent > 0 || filters.minVolume > 0 || confidenceFilter !== 'all';

  return (
    <div className="px-4 py-3 border-b border-border/50 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[120px] max-w-[200px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            id="spot-search"
            type="text"
            placeholder="Search coin..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="w-full pl-8 pr-8 py-1.5 rounded-lg text-xs bg-bg-elevated border border-border
              text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-500/40 transition-colors"
          />
          {filters.search && (
            <button onClick={() => onChange({ search: '' })} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Confidence filter buttons */}
        <div className="flex items-center gap-1">
          {(['all', 'verified', 'estimated', 'raw'] as const).map((c) => (
            <button
              key={c}
              onClick={() => onConfidenceChange(c)}
              className={clsx(
                'px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider border transition-all',
                confidenceFilter === c
                  ? c === 'verified'  ? 'bg-accent-green/15 text-accent-green border-accent-green/30'
                  : c === 'estimated' ? 'bg-accent-amber/15 text-accent-amber border-accent-amber/30'
                  : c === 'raw'       ? 'bg-text-muted/20 text-text-secondary border-border'
                  : 'bg-primary-500/15 text-primary-400 border-primary-500/30'
                  : 'bg-bg-elevated text-text-muted border-border hover:text-text-secondary',
              )}
            >
              {c === 'all' ? 'All' : c === 'verified' ? '🟢' : c === 'estimated' ? '🟡' : '🔴'}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            id="spot-exchange-filter"
            onClick={() => setShowExchanges(!showExchanges)}
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
              filters.exchanges.length > 0
                ? 'bg-primary-500/15 text-primary-400 border border-primary-500/25'
                : 'bg-bg-elevated text-text-muted border border-border hover:text-text-secondary',
            )}
          >
            <Filter size={12} />
            Exchanges {filters.exchanges.length > 0 && `(${filters.exchanges.length})`}
          </button>
          {showExchanges && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExchanges(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 bg-bg-surface border border-border rounded-xl shadow-xl p-2 min-w-[180px] max-h-[320px] overflow-y-auto">
                <button onClick={() => onChange({ exchanges: [] })} className="w-full text-left text-xs text-primary-400 px-2 py-1 mb-1 hover:bg-bg-hover rounded">
                  All Exchanges
                </button>
                {availableExchanges.map((exId) => {
                  const ex = EXCHANGES[exId];
                  if (!ex) return null;
                  const selected = filters.exchanges.includes(exId);
                  return (
                    <button key={exId} onClick={() => {
                      const next = selected ? filters.exchanges.filter((e) => e !== exId) : [...filters.exchanges, exId];
                      onChange({ exchanges: next });
                    }} className={clsx(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors',
                      selected ? 'bg-primary-500/10 text-text-primary' : 'text-text-secondary hover:bg-bg-hover',
                    )}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ex.color }} />
                      <span>{ex.name}</span>
                      {selected && <span className="ml-auto text-primary-400">✓</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-muted">Min%:</span>
          <input id="spot-min-spread" type="number" min="0" step="0.01" value={filters.minSpreadPercent || ''}
            placeholder="0" onChange={(e) => onChange({ minSpreadPercent: parseFloat(e.target.value) || 0 })}
            className="w-16 px-2 py-1.5 rounded-lg text-xs mono-number bg-bg-elevated border border-border text-text-primary focus:outline-none focus:border-primary-500/40 transition-colors" />
        </div>

        {hasFilters && (
          <button onClick={() => { onChange({ ...DEFAULT_SPREAD_FILTERS }); onConfidenceChange('all'); }} className="text-[10px] text-accent-red hover:text-accent-red/80 px-1">
            Reset
          </button>
        )}

        <span className="ml-auto text-[10px] text-text-muted">
          {filteredCount === totalCount ? totalCount : `${filteredCount} / ${totalCount}`}
        </span>
      </div>
    </div>
  );
}

// === Skeleton ===
function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-3 py-3"><div className="skeleton h-4 w-16 rounded" /></td>
      ))}
    </tr>
  );
}

// === Expanded Row Details ===
function ExpandedDetails({ spread }: { spread: SpotSpreadEntry }) {
  const fmtUsd = (n: number) => `$${n < 0.01 ? n.toFixed(4) : n.toFixed(2)}`;
  return (
    <tr className="bg-bg-elevated/30">
      <td colSpan={9} className="px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-text-muted block mb-1">Gross Spread</span>
            <span className="mono-number text-text-primary font-semibold">{spread.spreadPercent.toFixed(4)}%</span>
          </div>
          <div>
            <span className="text-text-muted block mb-1">Trading Fees</span>
            <span className="mono-number text-accent-red">{fmtUsd(spread.tradingFeesUsd)}</span>
          </div>
          <div>
            <span className="text-text-muted block mb-1">Withdraw Fee</span>
            <span className="mono-number text-accent-red">{fmtUsd(spread.withdrawFeeUsd)}</span>
            {spread.confidence !== 'verified' && <span className="text-[9px] text-text-muted ml-1">(est.)</span>}
          </div>
          <div>
            <span className="text-text-muted block mb-1">Net Spread</span>
            <span className={clsx('mono-number font-semibold', spread.netSpreadPercent > 0 ? 'text-accent-green' : 'text-accent-red')}>
              {spread.netSpreadPercent.toFixed(4)}%
            </span>
          </div>
          <div>
            <span className="text-text-muted block mb-1">Executable Volume</span>
            <span className="mono-number text-text-primary">{spread.maxQuantity.toLocaleString('en-US', { maximumFractionDigits: 2 })} units</span>
            <span className="text-text-muted block">{fmtUsd(spread.maxQuantity * spread.buyPrice)}</span>
          </div>
          <div>
            <span className="text-text-muted block mb-1">Network Route</span>
            <span className="mono-number text-text-primary">{spread.withdrawNetwork || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-text-muted block mb-1">24h Volume</span>
            <span className="mono-number text-text-primary">${(spread.volume24h / 1000).toFixed(0)}K</span>
          </div>
          <div>
            <span className="text-text-muted block mb-1">Gross Profit</span>
            <span className="mono-number text-accent-green">{fmtUsd(spread.estimatedProfit)}</span>
          </div>
        </div>
      </td>
    </tr>
  );
}

// === Main Table ===
export function SpotTable({ spreads, loading, changedIds }: SpotTableProps) {
  const [sort, setSort] = useState<SpreadSortConfig>({ key: 'spreadPercent', direction: 'desc' });
  const [filters, setFilters] = useState<SpreadFilterConfig>({ ...DEFAULT_SPREAD_FILTERS });
  const [page, setPage] = useState(0);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState<SpotConfidence | 'all'>('all');

  const handleSort = useCallback((key: SpreadSortKey) => {
    setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  }, []);

  const handleFilterChange = useCallback((partial: Partial<SpreadFilterConfig>) => {
    setFilters(prev => ({ ...prev, ...partial }));
    setPage(0);
  }, []);

  const handleConfidenceChange = useCallback((c: SpotConfidence | 'all') => {
    setConfidenceFilter(c);
    setPage(0);
  }, []);

  const availableExchanges = useMemo(() => {
    return (Object.keys(EXCHANGES) as ExchangeId[])
      .filter(id => EXCHANGES[id].enabled)
      .sort((a, b) => EXCHANGES[a].name.localeCompare(EXCHANGES[b].name));
  }, []);

  const { displayed, totalFiltered } = useMemo(() => {
    let filtered = spreads;
    if (filters.search) {
      const q = filters.search.toUpperCase();
      filtered = filtered.filter(s => s.symbol.toUpperCase().includes(q));
    }
    if (filters.exchanges.length > 0) {
      const exSet = new Set(filters.exchanges);
      filtered = filtered.filter(s => exSet.has(s.buyExchange) || exSet.has(s.sellExchange));
    }
    if (confidenceFilter !== 'all') filtered = filtered.filter(s => s.confidence === confidenceFilter);
    if (filters.minSpreadPercent > 0) filtered = filtered.filter(s => s.spreadPercent >= filters.minSpreadPercent);
    if (filters.minVolume > 0) filtered = filtered.filter(s => s.volume24h >= filters.minVolume);
    const sorted = [...filtered].sort((a, b) => compareSpreads(a, b, sort.key, sort.direction));
    const start = page * filters.pageSize;
    return { displayed: sorted.slice(start, start + filters.pageSize), totalFiltered: filtered.length };
  }, [spreads, filters, confidenceFilter, sort, page]);

  const totalPages = Math.ceil(totalFiltered / filters.pageSize);

  if (loading && !spreads.length) {
    return (
      <div className="glass-card overflow-hidden animate-fade-in">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <ArrowRightLeft size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-text-primary">Spot Arbitrage Scanner</h3>
        </div>
        <div className="table-wrapper">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/70">
              {['Pair', 'Buy', 'Sell', 'Spread', 'Net', 'Per $1K', 'Confidence', ''].map((h, i) => (
                <th key={i} className="px-3 py-2.5 text-left text-xs text-text-muted">{h}</th>
              ))}
            </tr></thead>
            <tbody>{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRightLeft size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-text-primary">Spot Arbitrage Scanner</h3>
          {loading && <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />}
        </div>
      </div>

      <FilterBar filters={filters} onChange={handleFilterChange}
        availableExchanges={availableExchanges} totalCount={spreads.length} filteredCount={totalFiltered}
        confidenceFilter={confidenceFilter} onConfidenceChange={handleConfidenceChange} />

      {displayed.length === 0 ? (
        <div className="p-8 text-center">
          <ArrowRightLeft size={32} className="mx-auto text-text-muted mb-2" />
          <p className="text-text-secondary text-sm font-medium">
            {spreads.length === 0 ? 'Scanning exchanges...' : 'No results match your filters'}
          </p>
          <p className="text-text-muted text-xs mt-1">
            {spreads.length === 0 ? 'First scan takes 15-30 seconds' : 'Try adjusting filter parameters'}
          </p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border/70">
                  <SortableHeader label="Pair" sortKey="symbol" currentSort={sort} onSort={handleSort} />
                  <SortableHeader label="Buy → Sell" sortKey="buyExchange" currentSort={sort} onSort={handleSort} />
                  <SortableHeader label="Spread %" sortKey="spreadPercent" currentSort={sort} onSort={handleSort} align="right" />
                  <SortableHeader label="Net %" sortKey="spreadAbsolute" currentSort={sort} onSort={handleSort} align="right" />
                  <SortableHeader label="Per $1K" sortKey="spreadAbsolute" currentSort={sort} onSort={handleSort} align="right" />
                  <SortableHeader label="Volume" sortKey="volume24h" currentSort={sort} onSort={handleSort} align="right" />
                  <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-text-muted">Network</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-text-muted">Quality</th>
                  <th className="px-3 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {displayed.map((spread, idx) => {
                  const buyEx = EXCHANGES[spread.buyExchange];
                  const sellEx = EXCHANGES[spread.sellExchange];
                  const uid = spreadUid(spread);
                  const isChanged = changedIds?.has(uid);
                  const isExpanded = expandedUid === uid;
                  const isHot = spread.spreadPercent >= HOT_SPREAD_THRESHOLD;
                  const isWarm = spread.spreadPercent >= WARM_SPREAD_THRESHOLD;

                  return (
                    <Fragment key={uid + '-' + idx}>
                      <tr
                        onClick={() => setExpandedUid(isExpanded ? null : uid)}
                        className={clsx(
                          'border-b border-border/20 transition-all cursor-pointer',
                          'hover:bg-bg-hover/40',
                          isChanged && 'bg-primary-500/5 ring-1 ring-inset ring-primary-500/20',
                          isHot && 'bg-accent-red/[0.03]',
                          isExpanded && 'bg-bg-elevated/20',
                        )}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-primary mono-number">{spread.symbol}</span>
                            <TierBadge spreadPct={spread.spreadPercent} />
                          </div>
                          <span className="text-text-muted text-[10px]">/USDT</span>
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: buyEx?.color }} />
                            <span className="text-[11px] text-text-secondary">{buyEx?.name}</span>
                            <span className="text-text-muted mx-0.5">→</span>
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sellEx?.color }} />
                            <span className="text-[11px] text-text-secondary">{sellEx?.name}</span>
                          </div>
                          <div className="flex gap-2 mt-0.5 text-[10px] text-text-muted mono-number">
                            <span>${spread.buyPrice.toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>
                            <span>→</span>
                            <span>${spread.sellPrice.toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>
                          </div>
                        </td>

                        <td className="px-3 py-2.5 text-right">
                          <span className={clsx('mono-number font-bold text-sm', isHot ? 'text-accent-red' : isWarm ? 'text-accent-amber' : 'text-accent-green')}>
                            {spread.spreadPercent.toFixed(3)}%
                          </span>
                        </td>

                        <td className="px-3 py-2.5 text-right">
                          <span className={clsx('mono-number font-semibold text-xs', spread.netSpreadPercent > 0 ? 'text-accent-green' : 'text-accent-red')}>
                            {spread.netSpreadPercent > 0 ? '+' : ''}{spread.netSpreadPercent.toFixed(3)}%
                          </span>
                        </td>

                        <td className="px-3 py-2.5 text-right">
                          <span className={clsx('mono-number font-bold', spread.profitPer1000 > 0 ? 'text-accent-green' : 'text-text-muted')}>
                            {spread.profitPer1000 > 0 ? '+' : ''}${spread.profitPer1000.toFixed(2)}
                          </span>
                        </td>

                        <td className="px-3 py-2.5 text-right">
                          <span className="mono-number text-xs text-text-muted">
                            {spread.volume24h >= 1_000_000
                              ? `$${(spread.volume24h / 1_000_000).toFixed(1)}M`
                              : `$${(spread.volume24h / 1_000).toFixed(0)}K`}
                          </span>
                        </td>

                        <td className="px-3 py-2.5 text-right">
                          <span className="mono-number text-xs text-text-secondary bg-bg-elevated px-1.5 py-0.5 rounded border border-border/50">
                            {spread.withdrawNetwork || '—'}
                          </span>
                        </td>

                        <td className="px-3 py-2.5 text-center">
                          <ConfidenceBadge confidence={spread.confidence} />
                        </td>

                        <td className="px-3 py-2.5">
                          <ChevronDown size={14} className={clsx('text-text-muted transition-transform', isExpanded && 'rotate-180')} />
                        </td>
                      </tr>
                      {isExpanded && <ExpandedDetails spread={spread} />}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50">
              <span className="text-[11px] text-text-muted">
                Page {page + 1} of {totalPages} ({totalFiltered} entries)
              </span>
              <div className="flex items-center gap-1">
                <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
                  className="p-1.5 rounded-lg hover:bg-bg-hover disabled:opacity-30 transition-colors">
                  <ChevronLeft size={14} className="text-text-secondary" />
                </button>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  className="p-1.5 rounded-lg hover:bg-bg-hover disabled:opacity-30 transition-colors">
                  <ChevronRight size={14} className="text-text-secondary" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
