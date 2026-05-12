'use client';

import React, { useState, useMemo } from 'react';
import { WalletTokenHolding } from '@/types/whales';
import { ArrowUpDown, Coins, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  tokens: WalletTokenHolding[];
  totalValueUsd: number;
}

export const WalletTokenHoldings: React.FC<Props> = ({ tokens, totalValueUsd }) => {
  const [sortKey, setSortKey] = useState<'balanceUsd' | 'priceChange24h' | 'portfolioPercentage'>('balanceUsd');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('desc'); }
  };

  const sorted = useMemo(() =>
    [...tokens].sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      return (a[sortKey] - b[sortKey]) * dir;
    }),
    [tokens, sortKey, sortOrder]
  );

  if (tokens.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <Coins size={32} className="mx-auto mb-3 text-text-muted" />
        <p className="text-text-muted">No token holdings found for this wallet.</p>
        <p className="text-xs text-text-muted mt-1">Solana wallets have limited analytics support.</p>
      </div>
    );
  }

  const SortHeader = ({ label, field }: { label: string; field: typeof sortKey }) => (
    <th className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort(field)}>
      <div className="flex items-center gap-1.5">
        {label}
        <ArrowUpDown size={12} className={sortKey === field ? 'text-primary-400' : ''} />
      </div>
    </th>
  );

  return (
    <div className="glass-panel overflow-hidden border border-white/[0.05] shadow-2xl rounded-2xl">
      <div className="p-5 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-text-primary">Token Holdings</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary-500/10 text-primary-400 font-medium border border-primary-500/20">
            {tokens.length} tokens
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs text-text-muted">Total Value</div>
          <div className="text-lg font-bold font-mono text-text-primary">
            ${totalValueUsd > 1_000_000
              ? (totalValueUsd / 1_000_000).toFixed(2) + 'M'
              : totalValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Top 5 distribution bar */}
      <div className="px-5 py-3 border-b border-white/[0.05]">
        <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.04]">
          {sorted.slice(0, 5).map((t, i) => {
            const colors = ['bg-primary-500', 'bg-success-500', 'bg-warning-500', 'bg-[#a78bfa]', 'bg-[#f472b6]'];
            return (
              <div
                key={t.contractAddress || i}
                className={`${colors[i]} transition-all`}
                style={{ width: `${t.portfolioPercentage}%` }}
                title={`${t.symbol}: ${t.portfolioPercentage.toFixed(1)}%`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {sorted.slice(0, 5).map((t, i) => {
            const dots = ['bg-primary-500', 'bg-success-500', 'bg-warning-500', 'bg-[#a78bfa]', 'bg-[#f472b6]'];
            return (
              <span key={t.contractAddress || i} className="text-[10px] text-text-muted flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${dots[i]}`} />
                {t.symbol} {t.portfolioPercentage.toFixed(1)}%
              </span>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.05] bg-black/20 text-xs font-semibold text-text-muted uppercase tracking-wider">
              <th className="px-4 py-3.5">Token</th>
              <th className="px-4 py-3.5">Balance</th>
              <th className="px-4 py-3.5">Price</th>
              <SortHeader label="Value" field="balanceUsd" />
              <SortHeader label="24h %" field="priceChange24h" />
              <SortHeader label="Portfolio %" field="portfolioPercentage" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {sorted.map((token) => (
              <tr key={token.contractAddress} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {token.logo ? (
                      <img src={token.logo} alt={token.symbol} className="w-7 h-7 rounded-full bg-white/5" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-text-muted">
                        {token.symbol.substring(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-text-primary">{token.symbol}</div>
                      <div className="text-[10px] text-text-muted truncate max-w-[120px]">{token.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-text-secondary">
                    {token.balance > 1_000_000
                      ? (token.balance / 1_000_000).toFixed(2) + 'M'
                      : token.balance > 1000
                      ? (token.balance / 1000).toFixed(2) + 'K'
                      : token.balance.toFixed(4)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-text-secondary">
                    ${token.priceUsd < 0.01
                      ? token.priceUsd.toExponential(2)
                      : token.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-sm font-medium text-text-primary">
                    ${token.balanceUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className={`flex items-center gap-1 text-sm font-mono font-medium ${
                    token.priceChange24h > 0 ? 'text-success-400' : token.priceChange24h < 0 ? 'text-danger-400' : 'text-text-muted'
                  }`}>
                    {token.priceChange24h > 0 ? <TrendingUp size={12} /> : token.priceChange24h < 0 ? <TrendingDown size={12} /> : null}
                    {token.priceChange24h > 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500/70 rounded-full" style={{ width: `${Math.min(token.portfolioPercentage, 100)}%` }} />
                    </div>
                    <span className="font-mono text-xs text-text-muted">{token.portfolioPercentage.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
