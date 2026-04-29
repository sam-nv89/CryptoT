'use client';

import { useState, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Percent, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { FundingRateEntry } from '@/types';
import { EXCHANGES, formatSymbol } from '@/config/exchanges';
import type { ExchangeId } from '@/types';

interface FundingTableProps {
  rates: FundingRateEntry[];
  loading?: boolean;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-5 w-16 rounded" />
        </td>
      ))}
    </tr>
  );
}

export function FundingTable({ rates, loading }: FundingTableProps) {
  const [sortColumn, setSortColumn] = useState<ExchangeId | 'symbol'>('symbol');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Group by symbol → exchange matrix
  const exchangeIds = useMemo(() => {
    return (Object.keys(EXCHANGES) as ExchangeId[])
      .filter(ex => EXCHANGES[ex].enabled && EXCHANGES[ex].id !== 'hyperliquid'); // Hyperliquid usually has different symbols or is dex
  }, []);

  const matrix = useMemo(() => {
    const m: Record<string, Partial<Record<ExchangeId, FundingRateEntry>>> = {};
    for (const rate of rates) {
      if (!m[rate.symbol]) m[rate.symbol] = {};
      m[rate.symbol][rate.exchange] = rate;
    }
    return m;
  }, [rates]);

  const sortedSymbols = useMemo(() => {
    const syms = Object.keys(matrix);
    
    return syms.sort((a, b) => {
      let valA: any = a;
      let valB: any = b;

      if (sortColumn !== 'symbol') {
        const rateA = matrix[a][sortColumn as ExchangeId]?.rate;
        const rateB = matrix[b][sortColumn as ExchangeId]?.rate;
        
        // Handle missing rates by pushing them to the bottom
        if (rateA === undefined && rateB === undefined) return 0;
        if (rateA === undefined) return 1;
        if (rateB === undefined) return -1;
        
        valA = rateA;
        valB = rateB;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [matrix, sortColumn, sortDirection]);

  const toggleSort = useCallback((column: ExchangeId | 'symbol') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc'); // Default to desc for rates
    }
  }, [sortColumn]);

  const SortIcon = ({ col }: { col: ExchangeId | 'symbol' }) => {
    if (sortColumn !== col) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  if (loading) {
    return (
      <div className="glass-card overflow-hidden animate-fade-in">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Percent size={18} className="text-accent-amber" />
          <h3 className="text-sm font-semibold text-text-primary">
            Ставки Финансирования (Funding Rates)
          </h3>
        </div>
        <div className="table-wrapper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Пара</th>
                {exchangeIds.map((ex) => (
                  <th key={ex} className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">
                    {EXCHANGES[ex].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!rates.length) {
    return (
      <div className="glass-card p-8 text-center animate-fade-in">
        <Percent size={40} className="mx-auto text-text-muted mb-3" />
        <p className="text-text-secondary font-medium">Данные о фандинге загружаются...</p>
        <p className="text-text-muted text-sm mt-1">
          Нажмите «Обновить» для загрузки данных с бирж
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent size={18} className="text-accent-amber" />
          <h3 className="text-sm font-semibold text-text-primary">
            Ставки Финансирования (Funding Rates)
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent-green" />
            Положительный (лонги платят)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent-red" />
            Отрицательный (шорты платят)
          </span>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/70">
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider w-[120px] cursor-pointer hover:text-text-primary transition-colors"
                onClick={() => toggleSort('symbol')}
              >
                <div className="flex items-center gap-1">
                  Пара <SortIcon col="symbol" />
                </div>
              </th>
              {exchangeIds.map((ex) => (
                <th 
                  key={ex} 
                  className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors"
                  onClick={() => toggleSort(ex)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: EXCHANGES[ex].color }}
                      />
                      {EXCHANGES[ex].name}
                      <SortIcon col={ex} />
                    </div>
                    <span className={clsx('badge', EXCHANGES[ex].type === 'cex' ? 'badge-cex' : 'badge-dex')}>
                      {EXCHANGES[ex].type}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedSymbols.map((symbol, idx) => {
              const row = matrix[symbol] ?? {};
              const allRates = Object.values(row).filter(Boolean).map((r) => r!.rate);
              const maxRate = Math.max(...allRates);
              const minRate = Math.min(...allRates);

              return (
                <tr
                  key={symbol}
                  className={clsx(
                    'border-b border-border/30 transition-colors hover:bg-bg-hover/50',
                    'animate-slide-up opacity-0'
                  )}
                  style={{ animationDelay: `${idx * 0.04}s`, animationFillMode: 'forwards' }}
                >
                  <td className="px-4 py-3">
                    <span className="font-semibold text-text-primary mono-number">
                      {formatSymbol(symbol)}
                    </span>
                  </td>

                  {exchangeIds.map((ex) => {
                    const entry = row[ex];
                    if (!entry) {
                      return (
                        <td key={ex} className="px-4 py-3 text-center">
                          <span className="text-text-muted">—</span>
                        </td>
                      );
                    }

                    const isPositive = entry.rate >= 0;
                    const isMax = entry.rate === maxRate && allRates.length > 1;
                    const isMin = entry.rate === minRate && allRates.length > 1;
                    const ratePercent = (entry.rate * 100).toFixed(4);

                    return (
                      <td key={ex} className="px-4 py-3 text-center">
                        <div
                          className={clsx(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg',
                            isPositive
                              ? 'bg-accent-green/8 text-accent-green'
                              : 'bg-accent-red/8 text-accent-red',
                            isMax && 'ring-1 ring-accent-green/30',
                            isMin && 'ring-1 ring-accent-red/30'
                          )}
                        >
                          {isPositive ? (
                            <TrendingUp size={12} />
                          ) : (
                            <TrendingDown size={12} />
                          )}
                          <span className="mono-number text-xs font-semibold">
                            {ratePercent}%
                          </span>
                        </div>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          ≈ {entry.annualizedRate.toFixed(1)}% APR
                        </p>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
