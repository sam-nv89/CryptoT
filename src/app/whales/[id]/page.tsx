'use client';

import { Header } from '@/components/layout/Header';
import { useEffect, useState } from 'react';
import { WhaleProfile, WhaleTransaction, WalletTokensResponse, WalletPnLResponse } from '@/types/whales';
import { WhaleProfileHeader } from '@/components/whales/WhaleProfileHeader';
import { WhaleAnalyticsGrid } from '@/components/whales/WhaleAnalyticsGrid';
import { WhaleTransactionHistory } from '@/components/whales/WhaleTransactionHistory';
import { WalletTokenHoldings } from '@/components/whales/WalletTokenHoldings';
import { WalletPnLBreakdown } from '@/components/whales/WalletPnLBreakdown';
import { useParams } from 'next/navigation';
import { Coins, BarChart3, ArrowRightLeft, LayoutDashboard } from 'lucide-react';

type TabKey = 'overview' | 'tokens' | 'pnl' | 'transactions';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
  { key: 'tokens', label: 'Holdings', icon: <Coins size={15} /> },
  { key: 'pnl', label: 'PnL Breakdown', icon: <BarChart3 size={15} /> },
  { key: 'transactions', label: 'Transactions', icon: <ArrowRightLeft size={15} /> },
];

export default function WhaleProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [whale, setWhale] = useState<WhaleProfile | null>(null);
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [tokensData, setTokensData] = useState<WalletTokensResponse | null>(null);
  const [pnlData, setPnlData] = useState<WalletPnLResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      try {
        const [profileRes, txRes, tokensRes, pnlRes] = await Promise.all([
          fetch(`/api/whales/${id}`),
          fetch(`/api/whales/${id}/transactions`),
          fetch(`/api/whales/${id}/tokens`),
          fetch(`/api/whales/${id}/pnl`),
        ]);

        if (!profileRes.ok) throw new Error('Failed to fetch profile');

        const profileData = await profileRes.json();
        const txData = await txRes.json();
        const tData = await tokensRes.json();
        const pData = await pnlRes.json();

        setWhale(profileData);
        setTransactions(txData.transactions || txData || []);
        setTokensData(tData);
        setPnlData(pData);
      } catch (error) {
        console.error('Error fetching whale data:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  if (isLoading) {
    return (
      <>
        <Header title="Wallet Profile" subtitle="Loading analytics..." />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
            <span className="text-sm text-text-muted">Fetching on-chain data...</span>
          </div>
        </div>
      </>
    );
  }

  if (isError || !whale) {
    return (
      <>
        <Header title="Wallet Profile" subtitle="Profile not found" />
        <div className="glass-card p-12 text-center max-w-lg mx-auto mt-12">
          <h3 className="text-xl font-bold text-danger-400 mb-2">Error</h3>
          <p className="text-text-muted">Could not load wallet data. The address may be invalid or the API is unavailable.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Wallet Profile" subtitle="Deep analytics & on-chain history" />

      <div className="animate-fade-in">
        <WhaleProfileHeader whale={whale} />
        <WhaleAnalyticsGrid analytics={whale.analytics} />

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 bg-white/[0.02] rounded-xl p-1 border border-white/[0.05]">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-text-muted hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {tokensData && tokensData.tokens.length > 0 && (
                <WalletTokenHoldings tokens={tokensData.tokens.slice(0, 10)} totalValueUsd={tokensData.totalValueUsd} />
              )}
              {pnlData && pnlData.entries.length > 0 && (
                <WalletPnLBreakdown data={{ ...pnlData, entries: pnlData.entries.slice(0, 10) }} />
              )}
            </div>
          )}

          {activeTab === 'tokens' && tokensData && (
            <WalletTokenHoldings tokens={tokensData.tokens} totalValueUsd={tokensData.totalValueUsd} />
          )}

          {activeTab === 'pnl' && pnlData && (
            <WalletPnLBreakdown data={pnlData} />
          )}

          {activeTab === 'transactions' && (
            <WhaleTransactionHistory transactions={transactions} network={whale.network} />
          )}
        </div>
      </div>
    </>
  );
}
