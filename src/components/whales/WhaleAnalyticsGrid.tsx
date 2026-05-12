import React from 'react';
import { WhaleAnalytics } from '@/types/whales';
import { Target, TrendingUp, BarChart3, Percent } from 'lucide-react';

interface Props {
  analytics: WhaleAnalytics;
}

export const WhaleAnalyticsGrid: React.FC<Props> = ({ analytics }) => {
  const roiColor = analytics.roi >= 0 ? 'text-success-400' : 'text-danger-400';
  const pnlColor = analytics.totalPnL >= 0 ? 'text-success-400' : 'text-danger-400';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
      {/* Win Rate */}
      <div className="glass-card p-5 group">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">Win Rate</h3>
          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-colors">
            <Target size={14} />
          </div>
        </div>
        <div className="text-3xl font-bold text-text-primary mb-3">{analytics.winRate.toFixed(1)}%</div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              analytics.winRate >= 60 ? 'bg-success-500' : analytics.winRate >= 45 ? 'bg-warning-500' : 'bg-danger-500'
            }`}
            style={{ width: `${analytics.winRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-text-muted">
          <span>Win: <span className="text-success-400 font-medium">{analytics.profitableTokens}</span></span>
          <span>Loss: <span className="text-danger-400 font-medium">{analytics.totalTradedTokens - analytics.profitableTokens}</span></span>
        </div>
      </div>

      {/* Total PnL */}
      <div className="glass-card p-5 group">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">Realized PnL</h3>
          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-colors">
            <TrendingUp size={14} />
          </div>
        </div>
        <div className={`text-2xl font-bold font-mono tracking-tight ${pnlColor}`}>
          {analytics.totalPnL >= 0 ? '+' : ''}
          ${Math.abs(analytics.totalPnL) > 1_000_000
            ? (Math.abs(analytics.totalPnL) / 1_000_000).toFixed(2) + 'M'
            : Math.abs(analytics.totalPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
        <p className="text-xs text-text-muted mt-2">
          Invested: ${analytics.totalUsdInvested > 1_000_000
            ? (analytics.totalUsdInvested / 1_000_000).toFixed(1) + 'M'
            : analytics.totalUsdInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
      </div>

      {/* ROI */}
      <div className="glass-card p-5 group">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">ROI</h3>
          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-colors">
            <Percent size={14} />
          </div>
        </div>
        <div className={`text-3xl font-bold font-mono ${roiColor}`}>
          {analytics.roi >= 0 ? '+' : ''}{analytics.roi.toFixed(1)}%
        </div>
        <p className="text-xs text-text-muted mt-2">Return on Investment</p>
      </div>

      {/* Trading Activity */}
      <div className="glass-card p-5 group">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">Trading Activity</h3>
          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-colors">
            <BarChart3 size={14} />
          </div>
        </div>
        <div className="text-3xl font-bold text-text-primary">{analytics.totalTrades}</div>
        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
          <span>{analytics.totalTradedTokens} tokens</span>
          <span>·</span>
          <span>Avg ${Math.abs(analytics.avgProfitPerToken).toLocaleString(undefined, { maximumFractionDigits: 0 })}/token</span>
        </div>
      </div>
    </div>
  );
};
