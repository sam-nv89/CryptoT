'use client';

import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, BarChart3, Percent } from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import { WhaleGlobalStats } from '@/types/whales';

export const WhaleStatsOverview: React.FC = () => {
  const [stats, setStats] = useState<WhaleGlobalStats | null>(null);

  useEffect(() => {
    fetch('/api/whales/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 animate-fade-in">
      <StatsCard
        title="Tracked Wallets"
        value={stats?.totalTracked?.toString() || '...'}
        icon={<Activity />}
        accentColor="primary"
      />
      <StatsCard
        title="Avg Win Rate"
        value={stats ? `${stats.avgWinRate.toFixed(1)}%` : '...'}
        icon={<TrendingUp />}
        accentColor="green"
      />
      <StatsCard
        title="Total Realized PnL"
        value={stats ? `$${stats.totalProfit > 1_000_000 ? (stats.totalProfit / 1_000_000).toFixed(1) + 'M' : stats.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '...'}
        icon={<BarChart3 />}
        accentColor="amber"
        subtitle="Across all tracked wallets"
      />
      <StatsCard
        title="Avg ROI"
        value={stats ? `${stats.avgROI >= 0 ? '+' : ''}${stats.avgROI.toFixed(1)}%` : '...'}
        icon={<Percent />}
        accentColor="red"
        subtitle="Return on Investment"
      />
    </div>
  );
};
