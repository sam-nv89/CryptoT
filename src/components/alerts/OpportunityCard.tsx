'use client';

import { clsx } from 'clsx';
import {
  Flame,
  Zap,
  Snowflake,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import type { ArbitrageSignal } from '@/services/alert-engine';
import { EXCHANGES, formatSymbol } from '@/config/exchanges';

interface OpportunityCardProps {
  signal: ArbitrageSignal;
  isNew?: boolean;
  index: number;
}

const tierConfig = {
  hot: {
    icon: <Flame size={16} />,
    label: 'HOT',
    gradient: 'from-red-500/20 via-orange-500/10 to-transparent',
    border: 'border-orange-500/40',
    textColor: 'text-orange-400',
    bgPulse: 'bg-orange-500/8',
    ringColor: 'ring-orange-500/30',
    glowClass: 'shadow-[0_0_30px_-5px_rgba(249,115,22,0.25)]',
  },
  warm: {
    icon: <Zap size={16} />,
    label: 'WARM',
    gradient: 'from-amber-500/15 via-yellow-500/5 to-transparent',
    border: 'border-amber-500/30',
    textColor: 'text-amber-400',
    bgPulse: 'bg-amber-500/8',
    ringColor: 'ring-amber-500/25',
    glowClass: 'shadow-[0_0_20px_-5px_rgba(245,158,11,0.15)]',
  },
  cold: {
    icon: <Snowflake size={16} />,
    label: 'COLD',
    gradient: 'from-sky-500/10 via-cyan-500/5 to-transparent',
    border: 'border-sky-500/20',
    textColor: 'text-sky-400',
    bgPulse: 'bg-sky-500/5',
    ringColor: 'ring-sky-500/15',
    glowClass: '',
  },
};

export function OpportunityCard({ signal, isNew, index }: OpportunityCardProps) {
  const tier = tierConfig[signal.tier];
  const buyExchange = EXCHANGES[signal.buyExchange];
  const sellExchange = EXCHANGES[signal.sellExchange];
  const isNetPositive = signal.netSpreadPercent > 0;

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl border transition-all duration-300',
        'bg-bg-glass backdrop-blur-xl',
        tier.border,
        tier.glowClass,
        isNew && 'animate-slide-up opacity-0',
        !isNew && 'animate-fade-in'
      )}
      style={{
        animationDelay: `${index * 0.06}s`,
        animationFillMode: 'forwards',
      }}
    >
      {/* Tier gradient accent at top */}
      <div
        className={clsx(
          'absolute inset-x-0 top-0 h-24 bg-gradient-to-b pointer-events-none',
          tier.gradient
        )}
      />

      {/* Header */}
      <div className="relative px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Symbol */}
          <span className="text-lg font-bold mono-number text-text-primary">
            {formatSymbol(signal.symbol)}
          </span>
          <span className="text-xs text-text-muted">/USDT</span>
        </div>

        {/* Tier Badge */}
        <div
          className={clsx(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider',
            tier.bgPulse,
            tier.textColor,
            signal.tier === 'hot' && 'animate-pulse'
          )}
        >
          {tier.icon}
          {tier.label}
        </div>
      </div>

      {/* Exchange Flow */}
      <div className="relative px-5 pb-4">
        <div className="flex items-center justify-between gap-2 mb-4">
          {/* Buy Side */}
          <div className="flex-1 bg-bg-elevated/60 rounded-xl p-3">
            <p className="text-[10px] text-accent-green font-semibold uppercase tracking-wider mb-1.5">
              Покупка
            </p>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: buyExchange?.color }}
              />
              <span className="text-sm font-medium text-text-primary">
                {buyExchange?.name}
              </span>
            </div>
            <p className="mono-number text-lg font-bold text-text-primary">
              ${signal.buyPrice.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">
              Fee: {signal.buyFeePercent}%
            </p>
          </div>

          {/* Arrow */}
          <div className={clsx('flex items-center justify-center w-8 h-8 rounded-full', tier.bgPulse)}>
            <ArrowRight size={16} className={tier.textColor} />
          </div>

          {/* Sell Side */}
          <div className="flex-1 bg-bg-elevated/60 rounded-xl p-3">
            <p className="text-[10px] text-accent-red font-semibold uppercase tracking-wider mb-1.5">
              Продажа
            </p>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: sellExchange?.color }}
              />
              <span className="text-sm font-medium text-text-primary">
                {sellExchange?.name}
              </span>
            </div>
            <p className="mono-number text-lg font-bold text-text-primary">
              ${signal.sellPrice.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">
              Fee: {signal.sellFeePercent}%
            </p>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Gross Spread */}
          <div className="bg-bg-elevated/40 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
              Спред (gross)
            </p>
            <p className="mono-number text-sm font-bold text-text-primary">
              {signal.grossSpreadPercent.toFixed(4)}%
            </p>
            <p className="mono-number text-[10px] text-text-muted">
              ${signal.grossSpreadAbsolute.toFixed(2)}
            </p>
          </div>

          {/* Net Spread */}
          <div
            className={clsx(
              'rounded-lg p-2.5 text-center',
              isNetPositive
                ? 'bg-accent-green/8 ring-1 ring-accent-green/20'
                : 'bg-accent-red/8 ring-1 ring-accent-red/20'
            )}
          >
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
              Нетто
            </p>
            <p
              className={clsx(
                'mono-number text-sm font-bold',
                isNetPositive ? 'text-accent-green' : 'text-accent-red'
              )}
            >
              {signal.netSpreadPercent >= 0 ? '+' : ''}
              {signal.netSpreadPercent.toFixed(4)}%
            </p>
            <p className="text-[10px] text-text-muted">после комиссий</p>
          </div>

          {/* Profit Per $1000 */}
          <div className="bg-bg-elevated/40 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
              Профит / $1K
            </p>
            <p
              className={clsx(
                'mono-number text-sm font-bold',
                signal.netProfitPer1000 > 0 ? 'text-accent-green' : 'text-accent-red'
              )}
            >
              {signal.netProfitPer1000 >= 0 ? '+' : ''}${signal.netProfitPer1000.toFixed(2)}
            </p>
            <p className="text-[10px] text-text-muted">
              Vol: ${(signal.volume24h / 1e6).toFixed(1)}M
            </p>
          </div>
        </div>
      </div>

      {/* New indicator pulse */}
      {isNew && (
        <div className="absolute top-3 right-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-green" />
          </span>
        </div>
      )}
    </div>
  );
}
