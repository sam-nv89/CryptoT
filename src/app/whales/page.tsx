'use client';

import { Header } from '@/components/layout/Header';
import { WhaleStatsOverview } from '@/components/whales/WhaleStatsOverview';
import { WhaleTable } from '@/components/whales/WhaleTable';
import { WhaleSearchBar } from '@/components/whales/WhaleSearchBar';
import { useEffect, useState } from 'react';
import { WhaleProfile, WhaleNetwork } from '@/types/whales';

export default function WhalesPage() {
  const [whales, setWhales] = useState<WhaleProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWhales = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whales?limit=50');
      const data = await response.json();
      setWhales(data.whales || []);
    } catch (error) {
      console.error('Failed to fetch whales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWhales();
  }, []);

  const handleSearch = async (address: string, network: WhaleNetwork) => {
    try {
      // Генерируем ID для запроса к API (формат: whale_network_address)
      const id = `whale_${network.toLowerCase()}_${address.toLowerCase()}`;
      
      // Показываем лоадер для конкретной операции (опционально)
      const response = await fetch(`/api/whales/${id}?address=${address}&network=${network}`);
      if (!response.ok) throw new Error('Whale not found');
      
      const data = await response.json();
      if (data && data.address) {
        // Добавляем кита в начало списка, если его там еще нет
        setWhales(prev => {
          if (prev.find(w => w.address.toLowerCase() === address.toLowerCase())) return prev;
          return [data, ...prev];
        });
      }
    } catch (error) {
      alert('Could not fetch whale data. Please check the address and network.');
      console.error('Search failed:', error);
    }
  };

  return (
    <>
      <Header title="Whale Tracker" subtitle="Мониторинг крупных криптокошельков и смарт-мани" />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <WhaleStatsOverview />
          <WhaleSearchBar onSearch={handleSearch} />
          <WhaleTable whales={whales} />
        </>
      )}
    </>
  );
}
