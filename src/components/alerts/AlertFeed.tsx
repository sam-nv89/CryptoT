'use client';

import { clsx } from 'clsx';
import { Clock, ArrowRightLeft, TrendingUp, Flame } from 'lucide-react';
import type { ArbitrageSignal } from '@/services/alert-engine';
import { EXCHANGES, formatSymbol } from '@/config/exchanges';

interface AlertFeedProps {
  history: ArbitrageSignal[];
  loading?: boolean;
}

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}с назад`;
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}м назад`;
  return new Date(ts).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const tierDot = {
  hot: 'bg-orange-400',
  warm: 'bg-amber-400',
  cold: 'bg-sky-400',
};

export function AlertFeed({ history, loading }: AlertFeedProps) {
  if (loading) {
    return (
      <div className="glass-card overflow-hidden animate-fade-in">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Clock size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            История сигналов
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <div className="skeleton w-2 h-2 rounded-full" />
              <div className="skeleton h-4 w-12 rounded" />
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-4 w-16 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="glass-card p-8 text-center animate-fade-in">
        <Clock size={36} className="mx-auto text-text-muted mb-3" />
        <p className="text-text-secondary font-medium">
          Нет записей за последний час
        </p>
        <p className="text-text-muted text-sm mt-1">
          Сигналы появятся, когда спред превысит установленный порог
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            История сигналов
          </h3>
        </div>
        <span className="text-xs text-text-muted">
          {history.length} за последний час
        </span>
      </div>

      <div className="max-h-[480px] overflow-y-auto">
        {history.map((signal, idx) => {
          const buyEx = EXCHANGES[signal.buyExchange];
          const sellEx = EXCHANGES[signal.sellExchange];
          const isNetPositive = signal.netSpreadPercent > 0;

          return (
            <div
              key={`${signal.id}-${signal.timestamp}-${idx}`}
              className={clsx(
                'flex items-center gap-3 px-5 py-3 border-b border-border/20',
                'hover:bg-bg-hover/30 transition-colors',
                'animate-slide-up opacity-0'
              )}
              style={{
                animationDelay: `${idx * 0.03}s`,
                animationFillMode: 'forwards',
              }}
            >
              {/* Tier dot */}
              <span
                className={clsx(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  tierDot[signal.tier]
                )}
              />

              {/* Symbol */}
              <span className="mono-number text-sm font-semibold text-text-primary w-14">
                {formatSymbol(signal.symbol)}
              </span>

              {/* Flow */}
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: buyEx?.color }}
                />
                <span>{buyEx?.name}</span>
                <ArrowRightLeft size={10} className="text-text-muted mx-0.5" />
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: sellEx?.color }}
                />
                <span>{sellEx?.name}</span>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Spread */}
              <span
                className={clsx(
                  'mono-number text-xs font-semibold',
                  isNetPositive ? 'text-accent-green' : 'text-text-muted'
                )}
              >
                {signal.netSpreadPercent >= 0 ? '+' : ''}
                {signal.netSpreadPercent.toFixed(3)}%
              </span>

              {/* Timestamp */}
              <span className="text-[10px] text-text-muted w-14 text-right">
                {formatTimestamp(signal.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
