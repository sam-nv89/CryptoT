'use client';

import {
  ArrowRightLeft,
  Percent,
  Activity,
  BarChart3,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/ui/StatsCard';
import { SpreadTable } from '@/components/dashboard/SpreadTable';
import { FundingTable } from '@/components/dashboard/FundingTable';
import { PriceGrid } from '@/components/dashboard/PriceGrid';
import { useMarketData } from '@/hooks/useMarketData';

export default function DashboardPage() {
  const {
    tickers,
    spreads,
    funding,
    loading,
    lastUpdated,
    refresh,
  } = useMarketData(15_000); // Poll every 15s

  // Computed stats
  const activePairs = new Set(tickers.map((t) => t.symbol)).size;
  const activeExchanges = new Set(tickers.map((t) => t.exchange)).size;
  const bestSpread = spreads.length > 0 ? spreads[0] : null;
  const avgFunding = funding.length > 0
    ? funding.reduce((sum, f) => sum + f.rate, 0) / funding.length
    : 0;

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Мониторинг спредов и фандингов в реальном времени"
        lastUpdated={lastUpdated}
        onRefresh={refresh}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Активных пар"
          value={activePairs}
          subtitle={`На ${activeExchanges} биржах`}
          icon={<BarChart3 size={20} />}
          accentColor="primary"
          animationDelay={0}
        />
        <StatsCard
          title="Найдено спредов"
          value={spreads.length}
          subtitle={bestSpread ? `Лучший: ${bestSpread.spreadPercent.toFixed(4)}%` : 'Нет данных'}
          icon={<ArrowRightLeft size={20} />}
          accentColor="green"
          animationDelay={1}
        />
        <StatsCard
          title="Ср. Фандинг"
          value={`${(avgFunding * 100).toFixed(4)}%`}
          subtitle={`Данных: ${funding.length} записей`}
          icon={<Percent size={20} />}
          accentColor="amber"
          animationDelay={2}
        />
        <StatsCard
          title="Статус"
          value={loading ? 'Загрузка...' : 'Online'}
          subtitle="Все системы работают"
          icon={<Activity size={20} />}
          accentColor={loading ? 'amber' : 'green'}
          animationDelay={3}
        />
      </div>

      {/* Price Grid */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          Котировки
        </h3>
        <PriceGrid tickers={tickers} loading={loading} />
      </div>

      {/* Spread Table */}
      <div className="mb-6">
        <SpreadTable spreads={spreads} loading={loading} />
      </div>

      {/* Funding Table */}
      <div className="mb-6">
        <FundingTable rates={funding} loading={loading} />
      </div>
    </>
  );
}
