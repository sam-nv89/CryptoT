'use client';

import {
  Flame,
  Zap,
  ArrowRightLeft,
  Clock,
  Target,
  Activity,
  Download,
} from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/ui/StatsCard';
import { OpportunityCard } from '@/components/alerts/OpportunityCard';
import { AlertFeed } from '@/components/alerts/AlertFeed';
import { SpreadAlertPanel } from '@/components/alerts/SpreadAlertPanel';
import { useSpreadAlerts } from '@/hooks/useSpreadAlerts';

export default function AlertsPage() {
  const {
    signals,
    history,
    loading,
    thresholds,
    setThresholds,
    hotCount,
    warmCount,
    totalCount,
    lastChecked,
    newSignalIds,
    refresh,
  } = useSpreadAlerts(10_000); // Poll every 10s

  // Best current opportunity
  const bestSignal = signals.length > 0 ? signals[0] : null;

  return (
    <>
      <Header
        title="Арбитраж Спредов"
        subtitle="Автоматическое обнаружение ценовых разниц между биржами"
        lastUpdated={lastChecked}
        onRefresh={refresh}
        action={
          <button
            onClick={() => window.open('/api/export?format=csv', '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-xl transition-all font-semibold text-sm group"
          >
            <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
            Выгрузить CSV
          </button>
        }
      />


      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Всего сигналов"
          value={totalCount}
          subtitle="Текущий цикл"
          icon={<ArrowRightLeft size={20} />}
          accentColor="primary"
          animationDelay={0}
        />
        <StatsCard
          title="HOT сигналы"
          value={hotCount}
          subtitle="Нетто спред ≥ 0.15%"
          icon={<Flame size={20} />}
          accentColor="red"
          animationDelay={1}
        />
        <StatsCard
          title="WARM сигналы"
          value={warmCount}
          subtitle="Нетто спред ≥ 0.05%"
          icon={<Zap size={20} />}
          accentColor="amber"
          animationDelay={2}
        />
        <StatsCard
          title="Лучший нетто"
          value={
            bestSignal
              ? `${bestSignal.netSpreadPercent >= 0 ? '+' : ''}${bestSignal.netSpreadPercent.toFixed(3)}%`
              : '—'
          }
          subtitle={
            bestSignal
              ? `$${bestSignal.netProfitPer1000.toFixed(2)} / $1K`
              : 'Нет данных'
          }
          icon={<Target size={20} />}
          accentColor="green"
          animationDelay={3}
        />
      </div>

      {/* Alert Settings Panel */}
      <div className="mb-6">
        <SpreadAlertPanel
          thresholds={thresholds}
          onThresholdChange={setThresholds}
        />
      </div>

      {/* Signals Grid + History Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Opportunity Cards */}
        <div className="xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-primary-400" />
            <h3 className="text-sm font-semibold text-text-primary">
              Текущие арбитражные возможности
            </h3>
            {totalCount > 0 && (
              <span className="text-xs text-text-muted ml-auto">
                {totalCount} шт.
              </span>
            )}
          </div>

          {loading && !signals.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card p-6">
                  <div className="skeleton h-5 w-16 rounded mb-4" />
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <div className="skeleton h-3 w-12 rounded mb-2" />
                      <div className="skeleton h-6 w-24 rounded" />
                    </div>
                    <div className="flex-1">
                      <div className="skeleton h-3 w-12 rounded mb-2" />
                      <div className="skeleton h-6 w-24 rounded" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="skeleton h-16 rounded" />
                    <div className="skeleton h-16 rounded" />
                    <div className="skeleton h-16 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : signals.length === 0 ? (
            <div className="glass-card p-12 text-center animate-fade-in">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/15 text-primary-400 mx-auto mb-4">
                <ArrowRightLeft size={28} />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                Рынки синхронизированы
              </h3>
              <p className="text-text-muted text-sm max-w-md mx-auto leading-relaxed">
                Арбитражные возможности не обнаружены при текущих фильтрах.
                Попробуйте снизить порог «Мин. Gross Спред» или подождите — система
                проверяет биржи каждые 10 секунд.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {signals.map((signal, idx) => (
                <OpportunityCard
                  key={signal.id}
                  signal={signal}
                  isNew={newSignalIds.has(signal.id)}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: History Feed */}
        <div className="xl:col-span-1">
          <AlertFeed history={history} loading={loading && !history.length} />
        </div>
      </div>
    </>
  );
}
