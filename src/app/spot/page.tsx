'use client';

import {
  ArrowRightLeft,
  Activity,
  BarChart3,
  Network,
} from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import { RefreshControl } from '@/components/ui/RefreshControl';
import { SpotTable } from '@/components/dashboard/SpotTable';
import { useSpotData } from '@/hooks/useSpotData';

export default function SpotArbitragePage() {
  const {
    spreads,
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
  } = useSpotData();

  // Computed stats
  const bestSpread = spreads.length > 0 ? spreads[0] : null;

  return (
    <>
      {/* Header row with title + refresh controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Spot Arbitrage</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Cross-exchange spot arbitrage with network routing and fee calculation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-2 flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider">Active Pairs</span>
              <span className="text-sm font-bold text-text-primary">{spreads.length}</span>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider">Best Spread</span>
              <span className="text-sm font-bold text-accent-green">
                {spreads.length > 0 ? `${Math.max(...spreads.map(s => s.spreadPercent)).toFixed(2)}%` : '0.00%'}
              </span>
            </div>
          </div>
          <RefreshControl
            config={refreshConfig}
            onToggleAutoRefresh={setAutoRefresh}
            onSetInterval={setRefreshInterval}
            onManualRefresh={refresh}
            dataAgeSec={dataAgeSec}
            loading={loading}
            // Discovery not implemented for spot yet
            discoveryDone={true}
            discoveryLoading={false}
            onRunDiscovery={() => {}}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Active Pairs"
          value={symbolCount}
          subtitle={`On ${exchangeCount} exchanges`}
          icon={<BarChart3 size={20} />}
          accentColor="primary"
          animationDelay={0}
        />
        <StatsCard
          title="Opportunities"
          value={spreads.length}
          subtitle={bestSpread ? `Max: ${bestSpread.spreadPercent.toFixed(2)}%` : 'No data'}
          icon={<ArrowRightLeft size={20} />}
          accentColor="green"
          animationDelay={1}
        />
        <StatsCard
          title="Networks & Fees"
          value="Verified"
          subtitle="Automatic routing"
          icon={<Network size={20} />}
          accentColor="amber"
          animationDelay={2}
        />
        <StatsCard
          title="Status"
          value={loading ? 'Scanning...' : !refreshConfig.autoRefresh ? 'Paused' : 'Online'}
          subtitle={loading ? 'Fetching market data' : 'Real-time updates'}
          icon={<Activity size={20} />}
          accentColor={loading ? 'primary' : !refreshConfig.autoRefresh ? 'muted' : 'green'}
          animationDelay={3}
        />
      </div>

      {/* Spot Table */}
      <div className="mb-6">
        <SpotTable
          spreads={spreads}
          loading={loading}
          changedIds={changedSpreadIds}
        />
      </div>

      <div className="glass-card p-4 text-xs text-text-muted">
        <h4 className="font-semibold text-text-secondary mb-2 uppercase tracking-wider">Важное примечание:</h4>
        <p>
          Данный модуль сканирует только те биржи, которые предоставляют публичную информацию о сетях и комиссиях вывода (например, KuCoin, OKX).
          Для отображения данных по Binance, Bybit и MEXC в будущем потребуется добавление API-ключей для доступа к кошелькам.
        </p>
      </div>
    </>
  );
}
