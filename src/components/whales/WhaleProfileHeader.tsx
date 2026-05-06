import React from 'react';
import { WhaleProfile } from '@/types/whales';
import { Wallet, Clock, Activity, Copy, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getExplorerUrl } from '@/utils/explorer';
interface Props {
  whale: WhaleProfile;
}

export const WhaleProfileHeader: React.FC<Props> = ({ whale }) => {
  return (
    <div className="mb-8">
      <Link href="/whales" className="inline-flex items-center gap-2 text-text-muted hover:text-primary-400 transition-colors mb-6 text-sm">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>
      
      <div className="glass-card p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/30 flex items-center justify-center text-2xl font-bold text-white shadow-[0_0_30px_rgba(56,189,248,0.15)]">
            {whale.network.substring(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-text-primary font-mono tracking-tight">
                {whale.address}
              </h1>
              <button className="text-text-muted hover:text-white transition-colors" title="Copy Address">
                <Copy size={16} />
              </button>
              <a href={getExplorerUrl(whale.network, 'address', whale.address)} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors" title="View on Explorer">
                <ExternalLink size={16} />
              </a>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {whale.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-md text-xs font-medium bg-primary-500/10 text-primary-300 border border-primary-500/20">
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-text-muted">
              <div className="flex items-center gap-1.5">
                <Activity size={14} className="text-success-400" />
                Active {formatDistanceToNow(new Date(whale.lastActive))} ago
              </div>
              <div className="flex items-center gap-1.5">
                <Wallet size={14} className="text-primary-400" />
                Balance: ${whale.balanceUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-right flex-shrink-0">
          <div className="text-sm text-text-muted mb-1">Total PnL</div>
          <div className={`text-4xl font-bold font-mono tracking-tight ${whale.analytics.totalPnL > 0 ? 'text-success-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]' : whale.analytics.totalPnL < 0 ? 'text-danger-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.3)]' : 'text-text-muted'}`}>
            {whale.analytics.totalPnL > 0 ? '+' : ''}
            ${Math.abs(whale.analytics.totalPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>
    </div>
  );
};
