'use client';

import {
  ArrowRightLeft,
  Percent,
  Activity,
  BarChart3,
} from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import { RefreshControl } from '@/components/ui/RefreshControl';
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
    dataAgeSec,
    refresh,
    refreshConfig,
    setAutoRefresh,
    setRefreshInterval,
    changedSpreadIds,
    symbolCount,
    exchangeCount,
    discoveryDone,
    discoveryLoading,
    runDiscovery,
  } = useMarketData();

  // Computed stats
  const bestSpread = spreads.length > 0 ? spreads[0] : null;
  const avgFunding = funding.length > 0
    ? funding.reduce((sum, f) => sum + f.rate, 0) / funding.length
    : 0;

  return (
    <>
      {/* Header row with title + refresh controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted">
            Мониторинг спредов и фандингов в реальном времени
          </p>
        </div>
        <RefreshControl
          config={refreshConfig}
          onToggleAutoRefresh={setAutoRefresh}
          onSetInterval={setRefreshInterval}
          onManualRefresh={refresh}
          dataAgeSec={dataAgeSec}
          loading={loading}
          discoveryDone={discoveryDone}
          discoveryLoading={discoveryLoading}
          onRunDiscovery={runDiscovery}
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Активных пар"
          value={symbolCount}
          subtitle={`На ${exchangeCount} биржах`}
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
          value={loading ? 'Загрузка...' : !refreshConfig.autoRefresh ? 'Пауза' : 'Online'}
          subtitle={
            !refreshConfig.autoRefresh
              ? `Данные: ${dataAgeSec}с назад`
              : 'Все системы работают'
          }
          icon={<Activity size={20} />}
          accentColor={loading ? 'amber' : !refreshConfig.autoRefresh ? 'red' : 'green'}
          animationDelay={3}
        />
      </div>

      {/* Price Grid — show top 10 by volume */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          Котировки {symbolCount > 10 && <span className="text-text-muted font-normal">(Топ-10 по объёму)</span>}
        </h3>
        <PriceGrid tickers={tickers} loading={loading} />
      </div>

      {/* Spread Table — full sorting/filtering/pagination */}
      <div className="mb-6">
        <SpreadTable
          spreads={spreads}
          loading={loading}
          changedIds={changedSpreadIds}
        />
      </div>

      {/* Funding Table */}
      <div className="mb-6">
        <FundingTable rates={funding} loading={loading} />
      </div>
    </>
  );
}
