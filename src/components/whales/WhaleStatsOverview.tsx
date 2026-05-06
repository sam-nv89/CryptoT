import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, ShieldAlert, BarChart3 } from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';

export const WhaleStatsOverview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/whales/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 animate-fade-in">
      <StatsCard
        title="Active Whales"
        value={stats?.totalTracked?.toString() || '...'}
        icon={<Activity />}
        accentColor="primary"
      />
      <StatsCard
        title="Avg Win Rate"
        value={stats ? `${stats.avgWinRate.toFixed(1)}%` : '...'}
        icon={<TrendingUp />}
        accentColor="green"
        subtitle="+1.2% vs avg"
      />
      <StatsCard
        title="Total Tracked Profit"
        value={stats ? `$${(stats.totalProfit > 1000000 ? (stats.totalProfit / 1000000).toFixed(1) + 'M' : stats.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 }))}` : '...'}
        icon={<BarChart3 />}
        accentColor="amber"
        subtitle="Realized PnL"
      />
      <StatsCard
        title="Top Network"
        value={stats?.topNetwork || '...'}
        icon={<ShieldAlert />}
        accentColor="red"
      />
    </div>
  );
};
