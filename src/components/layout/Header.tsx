'use client';

import { RefreshCcw, Clock } from 'lucide-react';
import { useState, useCallback } from 'react';
import { clsx } from 'clsx';

interface HeaderProps {
  title: string;
  subtitle?: string;
  lastUpdated?: number;
  onRefresh?: () => void;
  action?: React.ReactNode;
}


export function Header({ title, subtitle, lastUpdated, onRefresh, action }: HeaderProps) {

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (refreshing || !onRefresh) return;
    setRefreshing(true);
    try {
      onRefresh();
    } finally {
      // Minimum visual feedback duration
      setTimeout(() => setRefreshing(false), 800);
    }
  }, [refreshing, onRefresh]);

  const formatTime = (ts: number) => {
    if (!ts) return '—';
    const date = new Date(ts);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-text-muted mt-1">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {lastUpdated !== undefined && lastUpdated > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Clock size={13} />
            <span>Обновлено: {formatTime(lastUpdated)}</span>
          </div>
        )}

        {onRefresh && (
          <button
            id="btn-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
              'bg-primary-500/10 text-primary-400 border border-primary-500/20',
              'hover:bg-primary-500/20 hover:border-primary-500/30',
              'disabled:opacity-50 transition-all duration-200',
              'active:scale-[0.97]'
            )}
          >
            <RefreshCcw
              size={15}
              className={clsx('transition-transform', refreshing && 'animate-spin')}
            />
            <span className="hidden sm:inline">Обновить</span>
          </button>
        )}

        {action && (
          <div className="flex items-center">
            {action}
          </div>
        )}
      </div>

    </header>
  );
}
