'use client';

import { Header } from '@/components/layout/Header';
import { EXCHANGES, FALLBACK_SYMBOLS, formatSymbol } from '@/config/exchanges';
import { Settings, Globe, Clock, Zap, Radar } from 'lucide-react';
import type { ExchangeId } from '@/types';

export default function SettingsPage() {
  return (
    <>
      <Header title="Настройки" subtitle="Конфигурация трекера" />

      <div className="space-y-6 max-w-3xl">
        {/* Exchanges */}
        <div className="glass-card p-6 animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary-400" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Подключенные биржи ({Object.keys(EXCHANGES).length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Object.entries(EXCHANGES) as [ExchangeId, typeof EXCHANGES[ExchangeId]][]).map(
              ([id, exchange]) => (
                <div
                  key={id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated/50 border border-border"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: exchange.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{exchange.name}</p>
                    <p className="text-xs text-text-muted capitalize">{exchange.type}</p>
                  </div>
                  <span className={`badge ${exchange.type === 'cex' ? 'badge-cex' : 'badge-dex'}`}>
                    {exchange.type}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-accent-green" title="Подключено" />
                </div>
              )
            )}
          </div>
        </div>

        {/* Tracked Pairs */}
        <div
          className="glass-card p-6 animate-slide-up opacity-0"
          style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-accent-amber" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Стартовые пары (Fallback)
            </h3>
          </div>

          <p className="text-xs text-text-muted mb-3">
            При первом запуске используются эти пары. Нажмите «Найти все монеты» на Dashboard для автоматического обнаружения всех пар.
          </p>

          <div className="flex flex-wrap gap-2">
            {FALLBACK_SYMBOLS.map((sym) => (
              <span
                key={sym}
                className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border text-sm mono-number text-text-secondary"
              >
                {formatSymbol(sym)}/USDT
              </span>
            ))}
          </div>
        </div>

        {/* Refresh Settings */}
        <div
          className="glass-card p-6 animate-slide-up opacity-0"
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-accent-green" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Интервалы обновления
            </h3>
          </div>

          <p className="text-xs text-text-muted mb-3">
            Частоту обновления можно настроить на Dashboard через панель управления.
          </p>

          <div className="space-y-3">
            {[
              { label: 'Тикеры (цены)', value: 'Настраивается (5–60с)' },
              { label: 'Фандинг-рейты', value: '60 секунд' },
              { label: 'Whale-транзакции', value: '30 секунд' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated/50 border border-border"
              >
                <span className="text-sm text-text-secondary">{item.label}</span>
                <span className="text-sm mono-number text-text-primary font-medium">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div
          className="glass-card p-6 animate-slide-up opacity-0"
          style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings size={18} className="text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              О проекте
            </h3>
          </div>

          <div className="space-y-2 text-sm text-text-muted">
            <p>
              <strong className="text-text-secondary">CryptoTracker v0.2.0</strong> —
              Мониторинг спредов и фандинг-рейтов с расширенной фильтрацией
            </p>
            <p>Стек: Next.js 16 + CCXT + TypeScript</p>
            <p>Данные: 12 бирж (11 CEX + Hyperliquid DEX)</p>
          </div>
        </div>
      </div>
    </>
  );
}
