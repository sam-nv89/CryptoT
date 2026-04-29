'use client';

import { useState, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  ArrowRightLeft, ArrowUpDown, ArrowUp, ArrowDown,
  Search, X, ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';
import type {
  SpotSpreadEntry, ExchangeId,
  SpreadSortKey, SortDirection, SpreadSortConfig, SpreadFilterConfig,
} from '@/types';
import { EXCHANGES, formatSymbol } from '@/config/exchanges';
import { DEFAULT_SPREAD_FILTERS } from '@/types';

interface SpotTableProps {
  spreads: SpotSpreadEntry[];
  loading?: boolean;
  changedIds?: Set<string>;
}

function spreadUid(s: SpotSpreadEntry): string {
  return `${s.symbol}::${s.buyExchange}->${s.sellExchange}`;
}

// === Sort comparator ===
function compareSpreads(a: SpotSpreadEntry, b: SpotSpreadEntry, key: SpreadSortKey, dir: SortDirection): number {
  let cmp = 0;
  switch (key) {
    case 'spreadPercent': cmp = a.spreadPercent - b.spreadPercent; break;
    case 'spreadAbsolute': cmp = a.netProfit - b.netProfit; break; // Use net profit for absolute
    case 'volume24h': cmp = a.volume24h - b.volume24h; break;
    case 'buyPrice': cmp = a.buyPrice - b.buyPrice; break;
    case 'sellPrice': cmp = a.sellPrice - b.sellPrice; break;
    case 'symbol': cmp = a.symbol.localeCompare(b.symbol); break;
    case 'buyExchange': cmp = a.buyExchange.localeCompare(b.buyExchange); break;
    case 'sellExchange': cmp = a.sellExchange.localeCompare(b.sellExchange); break;
  }
  return dir === 'desc' ? -cmp : cmp;
}

// === Sortable Header Cell ===
function SortableHeader({
  label, sortKey, currentSort, onSort, align = 'left',
}: {
  label: string; sortKey: SpreadSortKey;
  currentSort: SpreadSortConfig; onSort: (key: SpreadSortKey) => void;
  align?: 'left' | 'right';
}) {
  const isActive = currentSort.key === sortKey;
  return (
    <th
      className={clsx(
        'px-3 py-2.5 text-xs font-medium uppercase tracking-wider cursor-pointer select-none',
        'hover:text-primary-400 transition-colors group',
        align === 'right' ? 'text-right' : 'text-left',
        isActive ? 'text-primary-400' : 'text-text-muted',
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentSort.direction === 'desc'
            ? <ArrowDown size={11} />
            : <ArrowUp size={11} />
        ) : (
          <ArrowUpDown size={11} className="opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </span>
    </th>
  );
}

// === Filter Bar ===
function FilterBar({
  filters, onChange, availableExchanges, totalCount, filteredCount,
}: {
  filters: SpreadFilterConfig;
  onChange: (f: Partial<SpreadFilterConfig>) => void;
  availableExchanges: ExchangeId[];
  totalCount: number;
  filteredCount: number;
}) {
  const [showExchanges, setShowExchanges] = useState(false);
  const hasFilters = filters.search || filters.exchanges.length > 0
    || filters.minSpreadPercent > 0 || filters.minVolume > 0;

  return (
    <div className="px-4 py-3 border-b border-border/50 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[120px] max-w-[240px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            id="input-symbol-search"
            type="text"
            placeholder="Поиск монеты..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="w-full pl-8 pr-8 py-1.5 rounded-lg text-xs bg-bg-elevated border border-border
              text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-500/40
              transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Exchange filter toggle */}
        <div className="relative">
          <button
            id="btn-exchange-filter"
            onClick={() => setShowExchanges(!showExchanges)}
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
              filters.exchanges.length > 0
                ? 'bg-primary-500/15 text-primary-400 border border-primary-500/25'
                : 'bg-bg-elevated text-text-muted border border-border hover:text-text-secondary',
            )}
          >
            <Filter size={12} />
            Биржи {filters.exchanges.length > 0 && `(${filters.exchanges.length})`}
          </button>

          {showExchanges && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExchanges(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 bg-bg-surface border border-border rounded-xl shadow-xl p-2 min-w-[180px] max-h-[320px] overflow-y-auto">
                <button
                  onClick={() => onChange({ exchanges: [] })}
                  className="w-full text-left text-xs text-primary-400 px-2 py-1 mb-1 hover:bg-bg-hover rounded"
                >
                  Все биржи
                </button>
                {availableExchanges.map((exId) => {
                  const ex = EXCHANGES[exId];
                  if (!ex) return null;
                  const selected = filters.exchanges.includes(exId);
                  return (
                    <button
                      key={exId}
                      onClick={() => {
                        const next = selected
                          ? filters.exchanges.filter((e) => e !== exId)
                          : [...filters.exchanges, exId];
                        onChange({ exchanges: next });
                      }}
                      className={clsx(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors',
                        selected ? 'bg-primary-500/10 text-text-primary' : 'text-text-secondary hover:bg-bg-hover',
                      )}
                    >
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

        {/* Min spread */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-muted">Мин%:</span>
          <input
            id="input-min-spread"
            type="number"
            min="0"
            step="0.01"
            value={filters.minSpreadPercent || ''}
            placeholder="0"
            onChange={(e) => onChange({ minSpreadPercent: parseFloat(e.target.value) || 0 })}
            className="w-16 px-2 py-1.5 rounded-lg text-xs mono-number bg-bg-elevated border border-border
              text-text-primary focus:outline-none focus:border-primary-500/40 transition-colors"
          />
        </div>

        {/* Min volume */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-muted">Мин Vol:</span>
          <input
            id="input-min-volume"
            type="number"
            min="0"
            step="1000"
            value={filters.minVolume || ''}
            placeholder="0"
            onChange={(e) => onChange({ minVolume: parseFloat(e.target.value) || 0 })}
            className="w-20 px-2 py-1.5 rounded-lg text-xs mono-number bg-bg-elevated border border-border
              text-text-primary focus:outline-none focus:border-primary-500/40 transition-colors"
          />
        </div>

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={() => onChange({ ...DEFAULT_SPREAD_FILTERS })}
            className="text-[10px] text-accent-red hover:text-accent-red/80 px-1"
          >
            Сбросить
          </button>
        )}

        {/* Counter */}
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
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-3 py-2.5">
          <div className="skeleton h-4 w-16 rounded" />
        </td>
      ))}
    </tr>
  );
}

// === Main Table ===
export function SpotTable({ spreads, loading, changedIds }: SpotTableProps) {
  const [sort, setSort] = useState<SpreadSortConfig>({ key: 'spreadPercent', direction: 'desc' });
  const [filters, setFilters] = useState<SpreadFilterConfig>({ ...DEFAULT_SPREAD_FILTERS });
  const [page, setPage] = useState(0);

  const handleSort = useCallback((key: SpreadSortKey) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  const handleFilterChange = useCallback((partial: Partial<SpreadFilterConfig>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(0); // Reset pagination on filter change
  }, []);

  // Available exchanges from config (enabled only)
  const availableExchanges = useMemo(() => {
    return (Object.keys(EXCHANGES) as ExchangeId[])
      .filter((id) => EXCHANGES[id].enabled)
      .sort((a, b) => EXCHANGES[a].name.localeCompare(EXCHANGES[b].name));
  }, []);

  // Filter + Sort + Paginate
  const { displayed, totalFiltered } = useMemo(() => {
    let filtered = spreads;

    // Symbol search
    if (filters.search) {
      const q = filters.search.toUpperCase();
      filtered = filtered.filter((s) => formatSymbol(s.symbol).toUpperCase().includes(q));
    }

    // Exchange filter
    if (filters.exchanges.length > 0) {
      const exSet = new Set(filters.exchanges);
      filtered = filtered.filter((s) => exSet.has(s.buyExchange) || exSet.has(s.sellExchange));
    }

    // Min spread
    if (filters.minSpreadPercent > 0) {
      filtered = filtered.filter((s) => s.spreadPercent >= filters.minSpreadPercent);
    }

    // Min volume
    if (filters.minVolume > 0) {
      filtered = filtered.filter((s) => s.volume24h >= filters.minVolume);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => compareSpreads(a, b, sort.key, sort.direction));

    // Paginate
    const start = page * filters.pageSize;
    const displayed = sorted.slice(start, start + filters.pageSize);

    return { displayed, totalFiltered: filtered.length };
  }, [spreads, filters, sort, page]);

  const totalPages = Math.ceil(totalFiltered / filters.pageSize);

  // --- Render ---

  if (loading && !spreads.length) {
    return (
      <div className="glass-card overflow-hidden animate-fade-in">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <ArrowRightLeft size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-text-primary">Межбиржевой Спот</h3>
        </div>
        <div className="table-wrapper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70">
                <th className="px-3 py-2.5 text-left text-xs text-text-muted">Пара</th>
                <th className="px-3 py-2.5 text-left text-xs text-text-muted">Покупка</th>
                <th className="px-3 py-2.5 text-left text-xs text-text-muted">Продажа</th>
                <th className="px-3 py-2.5 text-right text-xs text-text-muted">Макс. сделка</th>
                <th className="px-3 py-2.5 text-right text-xs text-text-muted">Сеть Вывода</th>
                <th className="px-3 py-2.5 text-right text-xs text-text-muted">Спред %</th>
                <th className="px-3 py-2.5 text-right text-xs text-text-muted">Чистая Прибыль</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRightLeft size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-text-primary">Spot Arbitrage</h3>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        availableExchanges={availableExchanges}
        totalCount={spreads.length}
        filteredCount={totalFiltered}
      />

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="p-8 text-center">
          <ArrowRightLeft size={32} className="mx-auto text-text-muted mb-2" />
          <p className="text-text-secondary text-sm font-medium">
            {spreads.length === 0 ? 'Связки не обнаружены' : 'Нет результатов по фильтру'}
          </p>
          <p className="text-text-muted text-xs mt-1">
            {spreads.length === 0
              ? 'Возможно, биржи не отдают данные о сетях'
              : 'Попробуйте изменить параметры фильтрации'}
          </p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border/70">
                  <SortableHeader label="Pair" sortKey="symbol" currentSort={sort} onSort={handleSort} />
                  <SortableHeader label="Buy" sortKey="buyExchange" currentSort={sort} onSort={handleSort} />
                  <SortableHeader label="Sell" sortKey="sellExchange" currentSort={sort} onSort={handleSort} />
                  <SortableHeader label="Max Deal" sortKey="volume24h" currentSort={sort} onSort={handleSort} align="right" />
                  <SortableHeader label="Network" sortKey="symbol" currentSort={sort} onSort={handleSort} align="right" />
                  <SortableHeader label="Spread %" sortKey="spreadPercent" currentSort={sort} onSort={handleSort} align="right" />
                  <SortableHeader label="Net Profit" sortKey="spreadAbsolute" currentSort={sort} onSort={handleSort} align="right" />
                </tr>
              </thead>
              <tbody>
                {displayed.map((spread, idx) => {
                  const buyEx = EXCHANGES[spread.buyExchange];
                  const sellEx = EXCHANGES[spread.sellExchange];
                  const isHigh = spread.spreadPercent > 0.1;
                  const uid = spreadUid(spread);
                  const isChanged = changedIds?.has(uid);

                  return (
                    <tr
                      key={uid + '-' + idx}
                      className={clsx(
                        'border-b border-border/20 transition-all hover:bg-bg-hover/40',
                        isChanged && 'bg-primary-500/5 ring-1 ring-inset ring-primary-500/20',
                      )}
                    >
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary mono-number">
                          {formatSymbol(spread.symbol)}
                        </span>
                        <span className="text-text-muted text-[10px] ml-1">/USDT</span>
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: buyEx?.color }} />
                            <span className="text-text-secondary text-[11px] font-medium">{buyEx?.name}</span>
                            <span className="mono-number text-text-primary text-xs">
                              ${spread.buyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                            </span>
                          </div>
                          <span className="text-[10px] text-text-muted mono-number">Доступно: {spread.buyVolume?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'} шт.</span>
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sellEx?.color }} />
                            <span className="text-text-secondary text-[11px] font-medium">{sellEx?.name}</span>
                            <span className="mono-number text-text-primary text-xs">
                              ${spread.sellPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                            </span>
                          </div>
                          <span className="text-[10px] text-text-muted mono-number">Доступно: {spread.sellVolume?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'} шт.</span>
                        </div>
                      </td>

                      <td className="px-3 py-2 text-right">
                        <div className="flex flex-col gap-0.5 items-end">
                          <span className="mono-number text-text-primary text-xs">
                            {spread.maxQuantity?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'} шт.
                          </span>
                          <span className="text-[10px] text-text-muted mono-number">
                            ${((spread.maxQuantity || 0) * spread.buyPrice).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2 text-right">
                        <div className="flex flex-col gap-0.5 items-end">
                          <span className="mono-number text-text-primary text-xs bg-bg-elevated px-1.5 py-0.5 rounded border border-border/50">
                            {spread.withdrawNetwork || 'Неизвестно'}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            Комиссия: ${(spread.withdrawFeeUsd || 0).toFixed(2)}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2 text-right">
                        <span className={clsx('mono-number font-semibold', isHigh ? 'text-accent-green' : 'text-text-secondary')}>
                          {spread.spreadPercent.toFixed(4)}%
                        </span>
                      </td>

                      <td className="px-3 py-2 text-right">
                        <span className="mono-number text-accent-green text-xs font-semibold">
                          ${spread.netProfit < 0.01
                            ? (spread.netProfit || 0).toFixed(4)
                            : (spread.netProfit || 0).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50">
              <span className="text-[11px] text-text-muted">
                Стр. {page + 1} из {totalPages} ({totalFiltered} записей)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-1.5 rounded-lg hover:bg-bg-hover disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={14} className="text-text-secondary" />
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="p-1.5 rounded-lg hover:bg-bg-hover disabled:opacity-30 transition-colors"
                >
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
