import React, { useState, useMemo } from 'react';
import { WhaleProfile } from '@/types/whales';
import { ArrowUpDown, ChevronRight, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface Props {
  whales: WhaleProfile[];
}

export const WhaleTable: React.FC<Props> = ({ whales }) => {
  const [sortKey, setSortKey] = useState<string>('totalPnL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedWhales = useMemo(() => {
    return [...whales].sort((a, b) => {
      let valA: number;
      let valB: number;
      
      if (sortKey === 'balanceUsd') {
        valA = a.balanceUsd;
        valB = b.balanceUsd;
      } else if (sortKey === 'avgProfit') {
        valA = a.analytics.totalPnL / (a.analytics.totalTrades || 1);
        valB = b.analytics.totalPnL / (b.analytics.totalTrades || 1);
      } else {
        valA = a.analytics[sortKey as keyof typeof a.analytics] as number;
        valB = b.analytics[sortKey as keyof typeof b.analytics] as number;
      }
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [whales, sortKey, sortOrder]);

  return (
    <div className="glass-panel overflow-hidden border border-white/[0.05] shadow-2xl relative rounded-2xl animate-fade-in animation-delay-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.05] bg-black/20 text-xs font-semibold text-text-muted uppercase tracking-wider">
              <th className="px-6 py-4">Whale / Address</th>
              <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('balanceUsd')}>
                <div className="flex items-center gap-2">
                  Balance <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('totalPnL')}>
                <div className="flex items-center gap-2">
                  Total PnL <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('avgProfit')}>
                <div className="flex items-center gap-2">
                  Avg Profit <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('winRate')}>
                <div className="flex items-center gap-2">
                  Win Rate <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="px-6 py-4">Strategy / Tags</th>
              <th className="px-6 py-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {sortedWhales.map((whale) => {
              const avgProfit = whale.analytics.totalPnL / (whale.analytics.totalTrades || 1);
              
              return (
                <tr key={whale.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400 font-bold text-xs shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                        {whale.network.substring(0, 3)}
                      </div>
                      <div>
                        <div className="font-mono text-sm text-text-primary">
                          {whale.address.substring(0, 6)}...{whale.address.substring(whale.address.length - 4)}
                        </div>
                        <div className="text-xs text-text-muted flex items-center gap-1 mt-1">
                          <Activity size={10} className={whale.analytics.totalTrades > 200 ? "text-primary-400" : "text-text-muted"} />
                          {whale.analytics.totalTrades} Trades
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm text-text-primary">
                      ${whale.balanceUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`font-mono text-sm font-medium ${whale.analytics.totalPnL >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                      {whale.analytics.totalPnL >= 0 ? '+' : ''}
                      ${Math.abs(whale.analytics.totalPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`font-mono text-sm ${avgProfit >= 0 ? 'text-success-400/80' : 'text-danger-400/80'}`}>
                      {avgProfit >= 0 ? '+' : ''}
                      ${Math.abs(avgProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${whale.analytics.winRate >= 60 ? 'bg-success-500' : whale.analytics.winRate >= 45 ? 'bg-warning-500' : 'bg-danger-500'}`}
                          style={{ width: `${whale.analytics.winRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono text-text-primary">
                        {whale.analytics.winRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {whale.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-500/10 text-primary-300 border border-primary-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/whales/${whale.id}`}>
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
};
