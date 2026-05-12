'use client';

import React, { useState, useMemo } from 'react';
import { TokenPnLEntry, WalletPnLResponse } from '@/types/whales';
import { ArrowUpDown, TrendingUp, TrendingDown, BarChart3, Filter } from 'lucide-react';

interface Props {
  data: WalletPnLResponse;
}

type SortField = 'realizedProfitUsd' | 'totalBoughtUsd' | 'realizedProfitPct' | 'countOfTrades';

export const WalletPnLBreakdown: React.FC<Props> = ({ data }) => {
  const [sortKey, setSortKey] = useState<SortField>('realizedProfitUsd');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showHeld, setShowHeld] = useState<'all' | 'held' | 'closed'>('all');

  const handleSort = (key: SortField) => {
    if (sortKey === key) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('desc'); }
  };

  const filtered = useMemo(() => {
    let items = [...data.entries];
    if (showHeld === 'held') items = items.filter(e => e.isCurrentlyHeld);
    if (showHeld === 'closed') items = items.filter(e => !e.isCurrentlyHeld);
    const dir = sortOrder === 'asc' ? 1 : -1;
    items.sort((a, b) => (a[sortKey] - b[sortKey]) * dir);
    return items;
  }, [data.entries, sortKey, sortOrder, showHeld]);

  const { summary } = data;

  if (data.entries.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <BarChart3 size={32} className="mx-auto mb-3 text-text-muted" />
        <p className="text-text-muted">No PnL data available for this wallet.</p>
        <p className="text-xs text-text-muted mt-1">Solana wallets have limited analytics support.</p>
      </div>
    );
  }

  const SortTh = ({ label, field }: { label: string; field: SortField }) => (
    <th className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort(field)}>
      <div className="flex items-center gap-1.5">
        {label} <ArrowUpDown size={12} className={sortKey === field ? 'text-primary-400' : ''} />
      </div>
    </th>
  );

  return (
    <div className="glass-panel overflow-hidden border border-white/[0.05] shadow-2xl rounded-2xl">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 border-b border-white/[0.05]">
        {[
          { label: 'Realized PnL', value: summary.totalRealizedPnL, fmt: 'pnl' },
          { label: 'Total Invested', value: summary.totalInvested, fmt: 'usd' },
          { label: 'Total Sold', value: summary.totalSold, fmt: 'usd' },
          { label: 'Overall ROI', value: summary.overallROI, fmt: 'pct' },
          { label: 'Win / Loss', value: 0, fmt: 'wl' },
        ].map((card, i) => (
          <div key={i} className="p-4 border-r border-white/[0.04] last:border-r-0">
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{card.label}</div>
            {card.fmt === 'pnl' ? (
              <div className={`text-lg font-bold font-mono ${card.value >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                {card.value >= 0 ? '+' : ''}${Math.abs(card.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            ) : card.fmt === 'usd' ? (
              <div className="text-lg font-bold font-mono text-text-primary">
                ${card.value > 1_000_000 ? (card.value / 1_000_000).toFixed(2) + 'M' : card.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            ) : card.fmt === 'pct' ? (
              <div className={`text-lg font-bold font-mono ${card.value >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                {card.value >= 0 ? '+' : ''}{card.value.toFixed(1)}%
              </div>
            ) : (
              <div className="text-lg font-bold font-mono text-text-primary">
                <span className="text-success-400">{summary.profitableCount}</span>
                <span className="text-text-muted mx-1">/</span>
                <span className="text-danger-400">{summary.unprofitableCount}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Filter Tabs + Title */}
      <div className="p-5 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-text-primary">PnL Breakdown</h2>
          <span className="text-xs text-text-muted">{filtered.length} tokens</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/[0.03] rounded-lg p-0.5">
          {(['all', 'held', 'closed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setShowHeld(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                showHeld === tab ? 'bg-white/[0.08] text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'held' ? 'Open' : 'Closed'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.05] bg-black/20 text-xs font-semibold text-text-muted uppercase tracking-wider">
              <th className="px-4 py-3.5">Token</th>
              <th className="px-4 py-3.5">Avg Buy</th>
              <th className="px-4 py-3.5">Avg Sell</th>
              <SortTh label="Invested" field="totalBoughtUsd" />
              <SortTh label="Realized PnL" field="realizedProfitUsd" />
              <SortTh label="ROI %" field="realizedProfitPct" />
              <SortTh label="Trades" field="countOfTrades" />
              <th className="px-4 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {filtered.map((entry) => (
              <tr key={entry.contractAddress} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {entry.logo ? (
                      <img src={entry.logo} alt={entry.symbol} className="w-6 h-6 rounded-full bg-white/5" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-text-muted">
                        {entry.symbol.substring(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-text-primary">{entry.symbol}</div>
                      <div className="text-[10px] text-text-muted truncate max-w-[100px]">{entry.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                  ${entry.avgBuyPriceUsd < 0.01 ? entry.avgBuyPriceUsd.toExponential(2) : entry.avgBuyPriceUsd.toFixed(2)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                  {entry.avgSellPriceUsd > 0 ? `$${entry.avgSellPriceUsd < 0.01 ? entry.avgSellPriceUsd.toExponential(2) : entry.avgSellPriceUsd.toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-sm text-text-primary">
                  ${entry.totalBoughtUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3">
                  <div className={`font-mono text-sm font-medium ${entry.realizedProfitUsd > 0 ? 'text-success-400' : entry.realizedProfitUsd < 0 ? 'text-danger-400' : 'text-text-muted'}`}>
                    {entry.realizedProfitUsd > 0 ? '+' : ''}${Math.abs(entry.realizedProfitUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className={`flex items-center gap-1 font-mono text-sm font-medium ${
                    entry.realizedProfitPct > 0 ? 'text-success-400' : entry.realizedProfitPct < 0 ? 'text-danger-400' : 'text-text-muted'
                  }`}>
                    {entry.realizedProfitPct > 0 ? <TrendingUp size={12} /> : entry.realizedProfitPct < 0 ? <TrendingDown size={12} /> : null}
                    {entry.realizedProfitPct > 0 ? '+' : ''}{entry.realizedProfitPct.toFixed(1)}%
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-sm text-text-secondary">{entry.countOfTrades}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                    entry.isCurrentlyHeld
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                      : 'bg-white/[0.04] text-text-muted border border-white/[0.08]'
                  }`}>
                    {entry.isCurrentlyHeld ? 'OPEN' : 'CLOSED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
