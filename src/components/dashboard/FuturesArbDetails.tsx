'use client';

import React, { useState } from 'react';

import { 
  TrendingDown, 
  TrendingUp, 
  ExternalLink, 
  Clock, 
  Info,
  DollarSign,
  Activity,
  Copy,
  Check
} from 'lucide-react';
import { clsx } from 'clsx';
import { FuturesArbitrageReport } from '@/types';
import { EXCHANGES, formatSymbol } from '@/config/exchanges';

interface FuturesArbDetailsProps {
  report: FuturesArbitrageReport;
  className?: string;
}

export function FuturesArbDetails({ report, className }: FuturesArbDetailsProps) {
  const { shortPosition, longPosition, symbol } = report;
  const shortEx = EXCHANGES[shortPosition.exchange];
  const longEx = EXCHANGES[longPosition.exchange];
  const [copied, setCopied] = useState(false);

  const formatCountdown = (timestamp: number) => {
    if (!timestamp) return '--:--:--';
    const diff = timestamp - Date.now();
    if (diff <= 0) return '00:00:00';
    
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    return `${h}ч ${m}м ${s}с`;
  };

  const copyToTelegram = async () => {
    const fmt = `
💰 **${formatSymbol(symbol)} Арбитраж фьючерсов**

🔴 **Short (${shortEx?.name})**
🏦 ${shortPosition.fundingRate.toFixed(4)}%
🔗 [URL](${shortPosition.url})
📕 Ask: ${shortPosition.ask}
📗 Bid: ${shortPosition.bid}
💰 Комиссия: ${shortPosition.takerFee}%

🟢 **Long (${longEx?.name})**
🏦 ${longPosition.fundingRate.toFixed(4)}%
🔗 [URL](${longPosition.url})
📕 Ask: ${longPosition.ask}
📗 Bid: ${longPosition.bid}
💰 Комиссия: ${longPosition.takerFee}%

**💰 Сумм. комиссия тейкера: ${report.avgTakerFee.toFixed(4)}%**

**Спреды:**
💰 Курсовой спред входа: ${report.entrySpread.toFixed(3)}%
💰 Курсовой спред выхода: ${report.exitSpread.toFixed(3)}%
🔥 Ставки: ${report.fundingDiff.toFixed(3)}%
    `.trim();

    await navigator.clipboard.writeText(fmt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={clsx(
      "w-full max-w-lg bg-bg-glass backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl",
      className
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary tracking-tight">
              {formatSymbol(symbol)} <span className="text-text-muted text-sm font-medium">Арбитраж</span>
            </h3>
            <p className="text-[10px] text-text-muted uppercase tracking-[0.2em]">Futures Perpetual</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-text-muted mb-1">ROK ✍️</span>
          <span className="text-xl font-bold text-accent-green">0</span>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Short Leg */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-accent-red flex items-center gap-2">
              <TrendingDown size={16} /> Short
            </h4>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md" style={{ backgroundColor: shortEx?.color }} />
                <span className="text-base font-bold text-text-primary">{shortEx?.name}</span>
                <span className={clsx(
                  "text-sm font-bold mono-number",
                  shortPosition.fundingRate < 0 ? "text-accent-red" : "text-accent-green"
                )}>
                  {shortPosition.fundingRate > 0 ? '+' : ''}{shortPosition.fundingRate.toFixed(4)}%
                </span>
              </div>
              <p className="text-xs text-text-muted">Прогноз: -</p>
            </div>

            <a 
              href={shortPosition.url} 
              target="_blank" 
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-4 truncate"
            >
              {shortPosition.url} <ExternalLink size={10} />
            </a>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-text-muted" />
                <span className="text-xs text-text-secondary">До начисления: {formatCountdown(shortPosition.nextFundingTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-text-muted" />
                <span className="text-xs text-text-secondary">Таймфрейм: {shortPosition.timeframe}</span>
              </div>
              <div className="flex items-center gap-2">
                <Info size={14} className="text-accent-red" />
                <span className="text-xs text-text-secondary">Ask: <span className="text-text-primary mono-number font-medium">{shortPosition.ask}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Info size={14} className="text-accent-green" />
                <span className="text-xs text-text-secondary">Bid: <span className="text-text-primary mono-number font-medium">{shortPosition.bid}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-text-muted" />
                <span className="text-xs text-text-secondary">Комиссия: {shortPosition.takerFee}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-yellow-400" />
                <span className="text-xs text-text-secondary">Оборот 24ч: {(shortPosition.volume24h / 1e6).toFixed(2)}M</span>
              </div>
            </div>
          </div>
        </section>

        {/* Long Leg */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-accent-green flex items-center gap-2">
              <TrendingUp size={16} /> Long
            </h4>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md" style={{ backgroundColor: longEx?.color }} />
                <span className="text-base font-bold text-text-primary">{longEx?.name}</span>
                <span className={clsx(
                  "text-sm font-bold mono-number",
                  longPosition.fundingRate < 0 ? "text-accent-red" : "text-accent-green"
                )}>
                  {longPosition.fundingRate > 0 ? '+' : ''}{longPosition.fundingRate.toFixed(4)}%
                </span>
              </div>
              <p className="text-xs text-text-muted">Прогноз: {longPosition.fundingForecast?.toFixed(4)}%</p>
            </div>

            <a 
              href={longPosition.url} 
              target="_blank" 
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-4 truncate"
            >
              {longPosition.url} <ExternalLink size={10} />
            </a>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-text-muted" />
                <span className="text-xs text-text-secondary">До начисления: {formatCountdown(longPosition.nextFundingTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-text-muted" />
                <span className="text-xs text-text-secondary">Таймфрейм: {longPosition.timeframe}</span>
              </div>
              <div className="flex items-center gap-2">
                <Info size={14} className="text-accent-red" />
                <span className="text-xs text-text-secondary">Ask: <span className="text-text-primary mono-number font-medium">{longPosition.ask}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Info size={14} className="text-accent-green" />
                <span className="text-xs text-text-secondary">Bid: <span className="text-text-primary mono-number font-medium">{longPosition.bid}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-text-muted" />
                <span className="text-xs text-text-secondary">Комиссия: {longPosition.takerFee}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-yellow-400" />
                <span className="text-xs text-text-secondary">Оборот 24ч: {(longPosition.volume24h / 1e6).toFixed(2)}M</span>
              </div>
            </div>
          </div>
        </section>

        {/* Summary Footer */}
        <footer className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted flex items-center gap-1">
              <DollarSign size={12} /> Сумм. комиссия тейкера:
            </span>
            <span className="text-sm font-bold text-text-primary mono-number">{report.avgTakerFee.toFixed(4)}%</span>
          </div>

          <div className="space-y-3 bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-text-muted uppercase tracking-wider">Спреды:</h5>
              <button 
                onClick={copyToTelegram}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-text-muted hover:text-text-primary transition-all"
                title="Копировать для Telegram"
              >
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                {copied ? 'Скопировано' : 'Для TG'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary flex items-center gap-2">💰 Курсовой спред входа:</span>
              <span className="text-sm font-bold text-text-primary mono-number">{report.entrySpread.toFixed(3)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary flex items-center gap-2">💰 Курсовой спред выхода:</span>
              <span className="text-sm font-bold text-text-primary mono-number">{report.exitSpread.toFixed(3)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary flex items-center gap-2">🔥 Ставки:</span>
              <span className="text-sm font-bold text-accent-green mono-number">{report.fundingDiff.toFixed(3)}%</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 border-t border-white/10">
        <button className="py-4 text-sm font-bold text-text-secondary hover:bg-white/5 transition-colors flex items-center justify-center gap-2 border-r border-white/10">
          👁️ Отслеживание
        </button>
        <button className="py-4 text-sm font-bold text-accent-blue hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2">
          🔄 Обновить
        </button>
      </div>
    </div>
  );
}
