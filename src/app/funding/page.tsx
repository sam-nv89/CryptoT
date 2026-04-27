'use client';

import { Header } from '@/components/layout/Header';
import { FundingTable } from '@/components/dashboard/FundingTable';
import { useMarketData } from '@/hooks/useMarketData';
import { StatsCard } from '@/components/ui/StatsCard';
import { TrendingUp, TrendingDown, Percent, BarChart3 } from 'lucide-react';

export default function FundingPage() {
  const { funding, loading, lastUpdated, refresh } = useMarketData(30_000);

  // Stats
  const positiveCount = funding.filter((f) => f.rate >= 0).length;
  const negativeCount = funding.filter((f) => f.rate < 0).length;
  const maxRate = funding.length > 0 ? Math.max(...funding.map((f) => f.rate)) : 0;
  const minRate = funding.length > 0 ? Math.min(...funding.map((f) => f.rate)) : 0;

  return (
    <>
      <Header
        title="Funding Rates"
        subtitle="Сравнение ставок финансирования между биржами"
        lastUpdated={lastUpdated}
        onRefresh={refresh}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Всего записей"
          value={funding.length}
          icon={<BarChart3 size={20} />}
          accentColor="primary"
          animationDelay={0}
        />
        <StatsCard
          title="Положительных"
          value={positiveCount}
          subtitle="Лонги платят шортам"
          icon={<TrendingUp size={20} />}
          accentColor="green"
          animationDelay={1}
        />
        <StatsCard
          title="Отрицательных"
          value={negativeCount}
          subtitle="Шорты платят лонгам"
          icon={<TrendingDown size={20} />}
          accentColor="red"
          animationDelay={2}
        />
        <StatsCard
          title="Макс. спред фандинга"
          value={`${((maxRate - minRate) * 100).toFixed(4)}%`}
          subtitle="Между биржами"
          icon={<Percent size={20} />}
          accentColor="amber"
          animationDelay={3}
        />
      </div>

      <FundingTable rates={funding} loading={loading} />
    </>
  );
}
