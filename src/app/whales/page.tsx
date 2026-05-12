'use client';

import { Header } from '@/components/layout/Header';
import { WhaleStatsOverview } from '@/components/whales/WhaleStatsOverview';
import { WhaleTable } from '@/components/whales/WhaleTable';
import { WhaleSearchBar } from '@/components/whales/WhaleSearchBar';
import { WalletFiltersPanel } from '@/components/whales/WalletFiltersPanel';
import { useEffect, useState, useCallback } from 'react';
import { WhaleProfile, WhaleNetwork } from '@/types/whales';
import { WalletSearchFilters, DEFAULT_FILTERS } from '@/types/whale-filters';

export default function WhalesPage() {
  const [whales, setWhales] = useState<WhaleProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<WalletSearchFilters>({ ...DEFAULT_FILTERS });

  const fetchWhales = useCallback(async (f: WalletSearchFilters) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', f.page.toString());
      params.set('limit', f.limit.toString());
      params.set('sortBy', f.sortBy);
      params.set('sortOrder', f.sortOrder);
      if (f.network) params.set('network', f.network);
      if (f.minWinRate !== undefined) params.set('minWinRate', f.minWinRate.toString());
      if (f.maxWinRate !== undefined) params.set('maxWinRate', f.maxWinRate.toString());
      if (f.minPnL !== undefined) params.set('minPnL', f.minPnL.toString());
      if (f.maxPnL !== undefined) params.set('maxPnL', f.maxPnL.toString());
      if (f.minBalance !== undefined) params.set('minBalance', f.minBalance.toString());
      if (f.minTrades !== undefined) params.set('minTrades', f.minTrades.toString());
      if (f.minROI !== undefined) params.set('minROI', f.minROI.toString());

      const response = await fetch(`/api/whales?${params.toString()}`);
      const data = await response.json();
      setWhales(data.whales || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch whales:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWhales(filters);
  }, [filters, fetchWhales]);

  const handleFiltersChange = (newFilters: WalletSearchFilters) => {
    setFilters(newFilters);
  };

  const handleNetworkChange = useCallback((net: WhaleNetwork | 'ALL') => {
    setFilters(prev => {
      const newNet = net === 'ALL' ? undefined : net;
      if (prev.network === newNet) return prev; // Avoid unnecessary updates
      return { ...prev, network: newNet, page: 1 };
    });
  }, []);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSearch = async (address: string, network: WhaleNetwork) => {
    setIsSearching(true);
    try {
      const id = `whale_${network.toLowerCase()}_${address.toLowerCase()}`;
      const response = await fetch(`/api/whales/${id}?address=${address}&network=${network}`);
      if (!response.ok) throw new Error('Wallet not found');

      const data = await response.json();
      if (data?.address) {
        setWhales(prev => {
          if (prev.find(w => w.address.toLowerCase() === address.toLowerCase() && w.network === network)) return prev;
          return [data, ...prev];
        });
        setTotalCount(prev => prev + 1);
      }
    } catch (error) {
      alert('Could not fetch wallet data. Please check the address and network.');
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <Header title="Smart Money Scanner" subtitle="On-chain wallet analytics & smart money tracking" />

      <WhaleStatsOverview />
      <WhaleSearchBar
        onSearch={handleSearch}
        onNetworkChange={handleNetworkChange}
        isLoading={isSearching}
      />
      <WalletFiltersPanel filters={filters} onChange={handleFiltersChange} />

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
            <span className="text-sm text-text-muted">Loading wallet data...</span>
          </div>
        </div>
      ) : whales.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-text-muted text-lg mb-2">No wallets match your filters</p>
          <p className="text-text-muted text-sm">Try adjusting your filter criteria or track a new wallet above.</p>
        </div>
      ) : (
        <WhaleTable
          whales={whales}
          totalCount={totalCount}
          page={filters.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </>
  );
}
