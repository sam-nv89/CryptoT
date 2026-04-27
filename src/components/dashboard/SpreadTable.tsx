'use client';

import { clsx } from 'clsx';
import { ArrowRightLeft, TrendingUp, ExternalLink } from 'lucide-react';
import type { SpreadEntry } from '@/types';
import { EXCHANGES, formatSymbol } from '@/config/exchanges';

interface SpreadTableProps {
  spreads: SpreadEntry[];
  loading?: boolean;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-5 w-20 rounded" />
        </td>
      ))}
    </tr>
  );
}

export function SpreadTable({ spreads, loading }: SpreadTableProps) {
  if (loading) {
    return (
      <div className="glass-card overflow-hidden animate-fade-in">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <ArrowRightLeft size={18} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            Cross-Exchange Спреды
          </h3>
        </div>
        <div className="table-wrapper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Пара</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Покупка</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Продажа</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Спред %</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Спред $</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Объём 24ч</th>
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

  if (!spreads.length) {
    return (
      <div className="glass-card p-8 text-center animate-fade-in">
        <ArrowRightLeft size={40} className="mx-auto text-text-muted mb-3" />
        <p className="text-text-secondary font-medium">Спреды не обнаружены</p>
        <p className="text-text-muted text-sm mt-1">
          Рынки синхронизированы — арбитражные возможности отсутствуют
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRightLeft size={18} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            Cross-Exchange Спреды
          </h3>
        </div>
        <span className="text-xs text-text-muted">
          {spreads.length} возможностей
        </span>
      </div>

      <div className="table-wrapper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/70">
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Пара</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Покупка</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Продажа</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Спред %</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Спред $</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Объём 24ч</th>
            </tr>
          </thead>
          <tbody>
            {spreads.map((spread, idx) => {
              const buyExchange = EXCHANGES[spread.buyExchange];
              const sellExchange = EXCHANGES[spread.sellExchange];
              const isHighSpread = spread.spreadPercent > 0.1;

              return (
                <tr
                  key={`${spread.symbol}-${spread.buyExchange}-${spread.sellExchange}-${idx}`}
                  className={clsx(
                    'border-b border-border/30 transition-colors hover:bg-bg-hover/50',
                    'animate-slide-up opacity-0'
                  )}
                  style={{ animationDelay: `${idx * 0.04}s`, animationFillMode: 'forwards' }}
                >
                  {/* Symbol */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary mono-number">
                        {formatSymbol(spread.symbol)}
                      </span>
                      <span className="text-text-muted text-xs">/USDT</span>
                    </div>
                  </td>

                  {/* Buy Exchange */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: buyExchange?.color }}
                      />
                      <span className="text-text-secondary text-xs font-medium">
                        {buyExchange?.name}
                      </span>
                      <span className="mono-number text-text-primary">
                        ${spread.buyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </td>

                  {/* Sell Exchange */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sellExchange?.color }}
                      />
                      <span className="text-text-secondary text-xs font-medium">
                        {sellExchange?.name}
                      </span>
                      <span className="mono-number text-text-primary">
                        ${spread.sellPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </td>

                  {/* Spread % */}
                  <td className="px-4 py-3 text-right">
                    <span
                      className={clsx(
                        'mono-number font-semibold',
                        isHighSpread ? 'text-accent-green' : 'text-text-secondary'
                      )}
                    >
                      {spread.spreadPercent.toFixed(4)}%
                    </span>
                  </td>

                  {/* Spread $ */}
                  <td className="px-4 py-3 text-right">
                    <span className="mono-number text-text-secondary">
                      ${spread.spreadAbsolute.toFixed(2)}
                    </span>
                  </td>

                  {/* Volume */}
                  <td className="px-4 py-3 text-right">
                    <span className="mono-number text-text-muted text-xs">
                      ${(spread.volume24h / 1_000_000).toFixed(1)}M
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
