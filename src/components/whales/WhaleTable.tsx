'use client';

import React, { useState, useMemo } from 'react';
import { WhaleProfile } from '@/types/whales';
import { ArrowUpDown, ChevronRight, Activity, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  whales: WhaleProfile[];
  totalCount: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

type ColKey = 'balanceUsd' | 'totalPnL' | 'winRate' | 'roi' | 'totalTrades' | 'avgProfit';

const NET_COLORS: Record<string, string> = {
  ETH: 'from-blue-500/20 to-blue-600/10 text-blue-400',
  BSC: 'from-yellow-500/20 to-yellow-600/10 text-yellow-400',
  ARB: 'from-cyan-500/20 to-cyan-600/10 text-cyan-400',
  SOL: 'from-purple-500/20 to-purple-600/10 text-purple-400',
  MANTLE: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400',
  ZKSYNC: 'from-indigo-500/20 to-indigo-600/10 text-indigo-400',
};

export const WhaleTable: React.FC<Props> = ({ whales, totalCount, page, totalPages, onPageChange }) => {
  const [sortKey, setSortKey] = useState<ColKey>('totalPnL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: ColKey) => {
    if (sortKey === key) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('desc'); }
  };

  const sorted = useMemo(() => {
    return [...whales].sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      const valMap: Record<ColKey, (p: WhaleProfile) => number> = {
        balanceUsd: p => p.balanceUsd,
        totalPnL: p => p.analytics.totalPnL,
        winRate: p => p.analytics.winRate,
        roi: p => p.analytics.roi,
        totalTrades: p => p.analytics.totalTrades,
        avgProfit: p => p.analytics.avgProfitPerToken,
      };
      return (valMap[sortKey](a) - valMap[sortKey](b)) * dir;
    });
  }, [whales, sortKey, sortOrder]);

  const SortTh = ({ label, field, className = '' }: { label: string; field: ColKey; className?: string }) => (
    <th className={`px-4 py-3.5 cursor-pointer hover:text-white transition-colors ${className}`} onClick={() => handleSort(field)}>
      <div className="flex items-center gap-1.5">
        {label} <ArrowUpDown size={12} className={sortKey === field ? 'text-primary-400' : ''} />
      </div>
    </th>
  );

  return (
    <div className="glass-panel overflow-hidden border border-white/[0.05] shadow-2xl relative rounded-2xl animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.05] bg-black/20 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              <th className="px-4 py-3.5">Wallet</th>
              <SortTh label="Balance" field="balanceUsd" />
              <SortTh label="PnL" field="totalPnL" />
              <SortTh label="ROI" field="roi" />
              <SortTh label="Win Rate" field="winRate" />
              <SortTh label="Trades" field="totalTrades" />
              <SortTh label="Avg/Token" field="avgProfit" />
              <th className="px-4 py-3.5">Tags</th>
              <th className="px-4 py-3.5 text-right w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {sorted.map((whale) => (
              <tr key={whale.id} className="hover:bg-white/[0.02] transition-colors group">
                {/* Wallet */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${NET_COLORS[whale.network] || NET_COLORS.ETH} flex items-center justify-center text-[10px] font-bold`}>
                      {whale.network}
                    </div>
                    <div>
                      <div className="font-mono text-sm text-text-primary">
                        {whale.address.substring(0, 6)}...{whale.address.substring(whale.address.length - 4)}
                      </div>
                      <div className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                        <Activity size={9} className={whale.analytics.totalTrades > 50 ? 'text-primary-400' : 'text-text-muted'} />
                        {whale.tokenCount > 0 && <span>{whale.tokenCount} tokens</span>}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Balance */}
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-text-primary">
                    ${whale.balanceUsd > 1_000_000
                      ? (whale.balanceUsd / 1_000_000).toFixed(2) + 'M'
                      : whale.balanceUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </td>

                {/* PnL */}
                <td className="px-4 py-3">
                  <span className={`font-mono text-sm font-medium ${whale.analytics.totalPnL > 0 ? 'text-success-400' : whale.analytics.totalPnL < 0 ? 'text-danger-400' : 'text-text-muted'}`}>
                    {whale.analytics.totalPnL >= 0 ? '+' : ''}${Math.abs(whale.analytics.totalPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </td>

                {/* ROI */}
                <td className="px-4 py-3">
                  <span className={`font-mono text-sm font-medium ${whale.analytics.roi >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                    {whale.analytics.roi >= 0 ? '+' : ''}{whale.analytics.roi.toFixed(1)}%
                  </span>
                </td>

                {/* Win Rate */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${whale.analytics.winRate >= 60 ? 'bg-success-500' : whale.analytics.winRate >= 45 ? 'bg-warning-500' : 'bg-danger-500'}`}
                        style={{ width: `${whale.analytics.winRate}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-text-primary">{whale.analytics.winRate.toFixed(1)}%</span>
                  </div>
                </td>

                {/* Trades */}
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-text-secondary">{whale.analytics.totalTrades}</span>
                </td>

                {/* Avg Profit */}
                <td className="px-4 py-3">
                  <span className={`font-mono text-xs ${whale.analytics.avgProfitPerToken > 0 ? 'text-success-400/80' : whale.analytics.avgProfitPerToken < 0 ? 'text-danger-400/80' : 'text-text-muted'}`}>
                    {whale.analytics.avgProfitPerToken >= 0 ? '+' : ''}${Math.abs(whale.analytics.avgProfitPerToken).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </td>

                {/* Tags */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {whale.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary-500/10 text-primary-300 border border-primary-500/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Action */}
                <td className="px-4 py-3 text-right">
                  <Link href={`/whales/${whale.id}`}>
                    <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-all opacity-50 group-hover:opacity-100">
                      <ChevronRight size={16} />
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-xs text-text-muted">{totalCount} wallets total</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] text-text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-text-muted font-mono">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] text-text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
