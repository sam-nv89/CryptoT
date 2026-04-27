'use client';

import { clsx } from 'clsx';
import type { TickerData } from '@/types';
import type { ExchangeId } from '@/types';
import { EXCHANGES, formatSymbol, TRACKED_SYMBOLS } from '@/config/exchanges';
import { DollarSign } from 'lucide-react';

interface PriceGridProps {
  tickers: TickerData[];
  loading?: boolean;
}

export function PriceGrid({ tickers, loading }: PriceGridProps) {
  // Group tickers by symbol
  const bySymbol = new Map<string, TickerData[]>();
  for (const t of tickers) {
    const group = bySymbol.get(t.symbol) ?? [];
    group.push(t);
    bySymbol.set(t.symbol, group);
  }

  const symbols = TRACKED_SYMBOLS.filter((s) => bySymbol.has(s));

  if (loading || !tickers.length) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="glass-card p-4">
            <div className="skeleton h-4 w-12 rounded mb-3" />
            <div className="skeleton h-7 w-24 rounded mb-2" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {symbols.map((symbol, idx) => {
        const symbolTickers = bySymbol.get(symbol) ?? [];
        if (!symbolTickers.length) return null;

        // Use the first available ticker for display
        const primary = symbolTickers[0];
        const avgPrice =
          symbolTickers.reduce((sum, t) => sum + t.last, 0) / symbolTickers.length;
        const totalVolume = symbolTickers.reduce((sum, t) => sum + t.volume24h, 0);

        // Max price diff across exchanges
        const prices = symbolTickers.map((t) => t.last);
        const maxDiff = prices.length > 1
          ? ((Math.max(...prices) - Math.min(...prices)) / Math.min(...prices)) * 100
          : 0;

        return (
          <div
            key={symbol}
            className={clsx(
              'glass-card p-4 animate-slide-up opacity-0 group cursor-default',
              maxDiff > 0.05 && 'ring-1 ring-primary-500/20'
            )}
            style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'forwards' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-text-primary">
                {formatSymbol(symbol)}
              </span>
              <div className="flex -space-x-1">
                {symbolTickers.map((t) => (
                  <span
                    key={t.exchange}
                    className="w-3 h-3 rounded-full border border-bg-surface"
                    style={{ backgroundColor: EXCHANGES[t.exchange]?.color }}
                    title={EXCHANGES[t.exchange]?.name}
                  />
                ))}
              </div>
            </div>

            <p className="text-xl font-bold mono-number text-text-primary mb-1">
              ${avgPrice.toLocaleString('en-US', {
                minimumFractionDigits: avgPrice >= 100 ? 0 : 2,
                maximumFractionDigits: avgPrice >= 100 ? 0 : 2,
              })}
            </p>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted">
                {symbolTickers.length} биржи
              </span>
              {maxDiff > 0 && (
                <span
                  className={clsx(
                    'mono-number font-medium',
                    maxDiff > 0.05 ? 'text-accent-green' : 'text-text-muted'
                  )}
                >
                  Δ {maxDiff.toFixed(3)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
