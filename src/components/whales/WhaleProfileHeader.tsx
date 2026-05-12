'use client';

import React, { useState } from 'react';
import { WhaleProfile } from '@/types/whales';
import { Wallet, Activity, Copy, ExternalLink, ArrowLeft, Check, TrendingUp, Target, Percent } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getExplorerUrl } from '@/utils/explorer';

interface Props {
  whale: WhaleProfile;
}

export const WhaleProfileHeader: React.FC<Props> = ({ whale }) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(whale.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncated = `${whale.address.substring(0, 6)}...${whale.address.substring(whale.address.length - 4)}`;
  const pnlColor = whale.analytics.totalPnL > 0 ? 'text-success-400' : whale.analytics.totalPnL < 0 ? 'text-danger-400' : 'text-text-muted';
  const roiColor = whale.analytics.roi >= 0 ? 'text-success-400' : 'text-danger-400';

  return (
    <div className="mb-8">
      <Link href="/whales" className="inline-flex items-center gap-2 text-text-muted hover:text-primary-400 transition-colors mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="glass-card p-6 md:p-8 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Identity */}
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-[#a78bfa]/20 border border-primary-500/30 flex items-center justify-center text-xl font-bold text-white shadow-[0_0_30px_rgba(56,189,248,0.15)]">
              {whale.network}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-text-primary font-mono tracking-tight">{truncated}</h1>
                <button onClick={copyAddress} className="text-text-muted hover:text-white transition-colors" title="Copy Address">
                  {copied ? <Check size={16} className="text-success-400" /> : <Copy size={16} />}
                </button>
                <a href={getExplorerUrl(whale.network, 'address', whale.address)} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors" title="View on Explorer">
                  <ExternalLink size={16} />
                </a>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {whale.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary-500/10 text-primary-300 border border-primary-500/20">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm text-text-muted">
                <div className="flex items-center gap-1.5">
                  <Activity size={13} className="text-success-400" />
                  Active {formatDistanceToNow(new Date(whale.lastActive))} ago
                </div>
                <div className="flex items-center gap-1.5">
                  <Wallet size={13} className="text-primary-400" />
                  ${whale.balanceUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick metrics */}
          <div className="flex items-center gap-6 lg:gap-8">
            <div className="text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">PnL</div>
              <div className={`text-2xl md:text-3xl font-bold font-mono tracking-tight ${pnlColor}`}>
                {whale.analytics.totalPnL >= 0 ? '+' : ''}${Math.abs(whale.analytics.totalPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="w-px h-10 bg-white/[0.08]" />
            <div className="text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Win Rate</div>
              <div className="text-xl font-bold font-mono text-text-primary">{whale.analytics.winRate.toFixed(1)}%</div>
            </div>
            <div className="w-px h-10 bg-white/[0.08]" />
            <div className="text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">ROI</div>
              <div className={`text-xl font-bold font-mono ${roiColor}`}>{whale.analytics.roi >= 0 ? '+' : ''}{whale.analytics.roi.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
