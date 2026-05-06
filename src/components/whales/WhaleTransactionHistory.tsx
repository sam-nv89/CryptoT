import React from 'react';
import { WhaleTransaction, WhaleNetwork } from '@/types/whales';
import { ArrowDownLeft, ArrowUpRight, RefreshCcw, ArrowRightLeft, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getExplorerUrl } from '@/utils/explorer';

interface Props {
  transactions: WhaleTransaction[];
  network: WhaleNetwork;
}

export const WhaleTransactionHistory: React.FC<Props> = ({ transactions, network }) => {
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'BUY': return <ArrowDownLeft size={16} className="text-success-400" />;
      case 'SELL': return <ArrowUpRight size={16} className="text-danger-400" />;
      case 'SWAP': return <RefreshCcw size={16} className="text-primary-400" />;
      default: return <ArrowRightLeft size={16} className="text-text-muted" />;
    }
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'BUY': return 'bg-success-500/10 text-success-400 border border-success-500/20';
      case 'SELL': return 'bg-danger-500/10 text-danger-400 border border-danger-500/20';
      case 'SWAP': return 'bg-primary-500/10 text-primary-400 border border-primary-500/20';
      default: return 'bg-white/5 text-text-muted border border-white/10';
    }
  };

  return (
    <div className="glass-panel overflow-hidden border border-white/[0.05] shadow-2xl relative rounded-2xl">
      <div className="p-6 border-b border-white/[0.05] flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary">Recent Transactions</h2>
        <span className="text-sm text-text-muted px-3 py-1 rounded-full bg-white/5">
          {transactions.length} records
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.05] bg-black/20 text-xs font-semibold text-text-muted uppercase tracking-wider">
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Value (USD)</th>
              <th className="px-6 py-4">Tokens</th>
              <th className="px-6 py-4">Est. PnL</th>
              <th className="px-6 py-4">Venue</th>
              <th className="px-6 py-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {transactions.map((tx, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getBadgeClass(tx.type).split(' ')[0]}`}>
                      {getIcon(tx.type)}
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${getBadgeClass(tx.type)}`}>
                      {tx.type}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-mono text-sm font-medium text-text-primary">
                    ${tx.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {tx.type === 'SWAP' ? (
                    <div className="flex items-center gap-2 text-sm text-text-primary">
                      <span>{tx.amountIn?.toFixed(2)} {tx.assetIn}</span>
                      <ArrowRightLeft size={12} className="text-text-muted mx-1" />
                      <span>{tx.amountOut?.toFixed(2)} {tx.assetOut}</span>
                    </div>
                  ) : (
                    <div className="text-sm text-text-primary">
                      {tx.type === 'BUY' ? '+' : '-'}{tx.amountIn?.toFixed(4)} <span className="font-bold">{tx.assetIn}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {tx.pnl !== undefined ? (
                    <div className={`font-mono text-sm ${tx.pnl >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                      {tx.pnl >= 0 ? '+' : ''}
                      ${Math.abs(tx.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  ) : (
                    <span className="text-text-muted text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-text-secondary">
                    {tx.dex || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3 text-sm text-text-muted">
                    {formatDistanceToNow(new Date(tx.timestamp))} ago
                    {!tx.id.startsWith('sol_tx_') ? (
                      <a href={getExplorerUrl(network, 'tx', tx.id)} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors" title="View on Explorer">
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-primary-500/50 border border-primary-500/20 px-1.5 py-0.5 rounded" title="Simulated Data">Sim</span>
                    )}
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
