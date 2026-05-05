'use client';

import {
  ArrowRightLeft, Activity, BarChart3, Flame, Shield,
  AlertTriangle, Volume2, VolumeX, TrendingUp,
} from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import { RefreshControl } from '@/components/ui/RefreshControl';
import { SpotTable } from '@/components/dashboard/SpotTable';
import { useSpotData } from '@/hooks/useSpotData';

export default function SpotArbitragePage() {
  const {
    spreads, loading, lastUpdated, dataAgeSec, refresh,
    refreshConfig, setAutoRefresh, setRefreshInterval,
    changedSpreadIds, stats, soundEnabled, setSoundEnabled,
  } = useSpotData();

  return (
    <>
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary">Spot Arbitrage</h1>
            {stats.hotCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-accent-red/15 text-accent-red border border-accent-red/25 animate-pulse">
                <Flame size={10} /> {stats.hotCount} HOT
              </span>
            )}
          </div>
          <p className="text-text-muted text-sm mt-0.5">
            Real-time cross-exchange spot spreads with fee-adjusted profitability
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sound toggle */}
          <button
            id="spot-sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-primary-500/15 border-primary-500/25 text-primary-400'
                : 'bg-bg-elevated border-border text-text-muted hover:text-text-secondary'
            }`}
            title={soundEnabled ? 'Sound ON' : 'Sound OFF'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Live stats pill */}
          <div className="glass-card px-4 py-2 flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider">Spreads</span>
              <span className="text-sm font-bold text-text-primary">{stats.totalSpreads}</span>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider">Best</span>
              <span className="text-sm font-bold text-accent-green">
                {stats.bestSpreadPct > 0 ? `${stats.bestSpreadPct.toFixed(2)}%` : '—'}
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
          value={stats.uniqueSymbols}
          subtitle={`On ${stats.activeExchanges} exchanges`}
          icon={<BarChart3 size={20} />}
          accentColor="primary"
          animationDelay={0}
        />
        <StatsCard
          title="Opportunities"
          value={stats.totalSpreads}
          subtitle={stats.hotCount > 0 ? `${stats.hotCount} HOT, ${stats.warmCount} WARM` : `${stats.warmCount} warm signals`}
          icon={<TrendingUp size={20} />}
          accentColor="green"
          animationDelay={1}
        />
        <StatsCard
          title="Data Quality"
          value={`${stats.verifiedCount + stats.estimatedCount}`}
          subtitle={`${stats.verifiedCount} verified, ${stats.estimatedCount} est.`}
          icon={<Shield size={20} />}
          accentColor="amber"
          animationDelay={2}
        />
        <StatsCard
          title="Best Profit"
          value={stats.bestProfitPer1000 > 0 ? `+$${stats.bestProfitPer1000.toFixed(2)}` : '—'}
          subtitle="Per $1,000 capital"
          icon={<Activity size={20} />}
          accentColor={stats.bestProfitPer1000 > 0 ? 'green' : 'primary'}
          animationDelay={3}
        />
      </div>

      {/* Confidence Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 px-1">
        <div className="flex items-center gap-1.5 text-[10px]">
          <Shield size={10} className="text-accent-green" />
          <span className="text-text-muted"><strong className="text-accent-green">Verified</strong> — real network fees from exchange API</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <AlertTriangle size={10} className="text-accent-amber" />
          <span className="text-text-muted"><strong className="text-accent-amber">Estimated</strong> — using average withdrawal fees</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <ArrowRightLeft size={10} className="text-text-muted" />
          <span className="text-text-muted"><strong>Raw</strong> — price difference only, verify fees manually</span>
        </div>
      </div>

      {/* Spot Table */}
      <div className="mb-6">
        <SpotTable
          spreads={spreads}
          loading={loading}
          changedIds={changedSpreadIds}
        />
      </div>

      {/* Disclaimer */}
      <div className="glass-card p-4 text-xs text-text-muted">
        <h4 className="font-semibold text-text-secondary mb-2 uppercase tracking-wider">Important Notice</h4>
        <p>
          This tool scans 9 exchanges (Binance, Bybit, OKX, KuCoin, Gate.io, MEXC, Bitget, HTX, CoinEx) for spot price
          differences. &quot;Verified&quot; spreads use real withdrawal fee data from exchange APIs. &quot;Estimated&quot; spreads
          use statistical averages — always verify fees before executing trades. Prices update every 30 seconds.
        </p>
      </div>
    </>
  );
}
