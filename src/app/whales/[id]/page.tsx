'use client';

import { Header } from '@/components/layout/Header';
import { useEffect, useState } from 'react';
import { WhaleProfile, WhaleTransaction } from '@/types/whales';
import { WhaleProfileHeader } from '@/components/whales/WhaleProfileHeader';
import { WhaleAnalyticsGrid } from '@/components/whales/WhaleAnalyticsGrid';
import { WhaleTransactionHistory } from '@/components/whales/WhaleTransactionHistory';
import { useParams } from 'next/navigation';

export default function WhaleProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [whale, setWhale] = useState<WhaleProfile | null>(null);
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchWhaleData = async () => {
      try {
        const [profileRes, txRes] = await Promise.all([
          fetch(`/api/whales/${id}`),
          fetch(`/api/whales/${id}/transactions`)
        ]);

        if (!profileRes.ok) throw new Error('Failed to fetch profile');

        const profileData = await profileRes.json();
        const txData = await txRes.json();

        setWhale(profileData);
        setTransactions(txData.transactions || []);
      } catch (error) {
        console.error('Error fetching whale data:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchWhaleData();
    }
  }, [id]);

  if (isLoading) {
    return (
      <>
        <Header title="Whale Tracker" subtitle="Загрузка профиля..." />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  if (isError || !whale) {
    return (
      <>
        <Header title="Whale Tracker" subtitle="Профиль не найден" />
        <div className="glass-card p-12 text-center max-w-lg mx-auto mt-12">
          <h3 className="text-xl font-bold text-danger-400 mb-2">Ошибка</h3>
          <p className="text-text-muted">Не удалось загрузить данные кошелька. Возможно, он был удален или указан неверный ID.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Whale Profile" subtitle="Глубокая аналитика и история транзакций" />
      
      <div className="animate-fade-in">
        <WhaleProfileHeader whale={whale} />
        <WhaleAnalyticsGrid analytics={whale.analytics} />
        <WhaleTransactionHistory transactions={transactions} network={whale.network} />
      </div>
    </>
  );
}
