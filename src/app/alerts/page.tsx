'use client';

import { Header } from '@/components/layout/Header';
import { Bell, Construction } from 'lucide-react';

export default function AlertsPage() {
  return (
    <>
      <Header title="Алерты" subtitle="Настройка уведомлений о спредах и фандингах" />

      <div className="glass-card p-12 text-center animate-fade-in max-w-lg mx-auto mt-12">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-amber/15 text-accent-amber mx-auto mb-4">
          <Construction size={32} />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">
          В разработке
        </h3>
        <p className="text-text-muted text-sm leading-relaxed">
          Модуль алертов находится в разработке. Скоро вы сможете настраивать
          автоматические уведомления при превышении порогов спреда и фандинга —
          через веб-интерфейс и Telegram-бот.
        </p>
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-text-muted">
          <Bell size={14} />
          <span>Push + Telegram уведомления</span>
        </div>
      </div>
    </>
  );
}
