'use client';

import { Header } from '@/components/layout/Header';
import { Wallet, Construction } from 'lucide-react';

export default function WhalesPage() {
  return (
    <>
      <Header title="Whale Tracker" subtitle="Мониторинг крупных криптокошельков" />

      <div className="glass-card p-12 text-center animate-fade-in max-w-lg mx-auto mt-12">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/15 text-primary-400 mx-auto mb-4">
          <Construction size={32} />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">
          В разработке
        </h3>
        <p className="text-text-muted text-sm leading-relaxed">
          Модуль отслеживания крупных кошельков находится в разработке.
          Планируется интеграция с Etherscan, Whale Alert и Dune Analytics
          для мониторинга транзакций «китов» в реальном времени.
        </p>
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-text-muted">
          <Wallet size={14} />
          <span>ETH • SOL • BTC сети</span>
        </div>
      </div>
    </>
  );
}
