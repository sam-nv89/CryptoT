import React from 'react';
import { WhaleAnalytics } from '@/types/whales';
import { Target, TrendingUp, Clock, Scale } from 'lucide-react';

interface Props {
  analytics: WhaleAnalytics;
}

export const WhaleAnalyticsGrid: React.FC<Props> = ({ analytics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      
      {/* Win Rate Card */}
      <div className="glass-card p-6 relative overflow-hidden flex flex-col justify-between group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">Win Rate</h3>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-colors">
            <Target size={16} />
          </div>
        </div>
        
        <div className="flex items-end gap-3 mb-4">
          <span className="text-4xl font-bold text-text-primary">{analytics.winRate.toFixed(1)}%</span>
        </div>
        
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${analytics.winRate >= 60 ? 'bg-success-500' : analytics.winRate >= 45 ? 'bg-warning-500' : 'bg-danger-500'}`}
            style={{ width: `${analytics.winRate}%` }}
          />
        </div>
      </div>

      {/* Total Invested Card */}
      <div className="glass-card p-6 relative overflow-hidden flex flex-col justify-between group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Invested</h3>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-colors">
            <Scale size={16} />
          </div>
        </div>
        
        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-bold font-mono tracking-tight text-text-primary">
            ${analytics.totalUsdInvested > 1000000 
                ? (analytics.totalUsdInvested / 1000000).toFixed(2) + 'M' 
                : analytics.totalUsdInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        
        <p className="text-sm text-text-muted">
          Lifetime volume invested in tokens
        </p>
      </div>

      {/* Recent PnL Card */}
      <div className="glass-card p-6 relative overflow-hidden flex flex-col justify-between group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">Estimated 30D PnL</h3>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-colors">
            <TrendingUp size={16} />
          </div>
        </div>
        
        <div className="flex items-end gap-3 mb-2">
          <span className={`text-3xl font-bold font-mono tracking-tight ${analytics.recent30dPnL >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
            {analytics.recent30dPnL >= 0 ? '+' : ''}
            ${Math.abs(analytics.recent30dPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-text-muted mt-2">
          <span>7D:</span>
          <span className={`font-mono ${analytics.recent7dPnL >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
            {analytics.recent7dPnL >= 0 ? '+' : ''}
            ${Math.abs(analytics.recent7dPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Trading Activity Card */}
      <div className="glass-card p-6 relative overflow-hidden flex flex-col justify-between group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">Trading Activity</h3>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-colors">
            <Clock size={16} />
          </div>
        </div>
        
        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-bold text-text-primary">
            {analytics.totalTrades}
          </span>
          <span className="text-text-muted mb-1 pb-1">Trades</span>
        </div>
        
        <p className="text-sm text-text-muted">
          Profitable Tokens: <span className="text-success-400 font-medium">{analytics.profitableTokens}</span> / {analytics.totalTradedTokens}
        </p>
      </div>

    </div>
  );
};
