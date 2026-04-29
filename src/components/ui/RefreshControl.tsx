'use client';

import { clsx } from 'clsx';
import {
  Play, Pause, RefreshCcw, Clock, ChevronDown, Radar,
} from 'lucide-react';
import { useState } from 'react';
import type { RefreshConfig, RefreshIntervalOption } from '@/types';

interface RefreshControlProps {
  config: RefreshConfig;
  onToggleAutoRefresh: (enabled: boolean) => void;
  onSetInterval: (seconds: RefreshIntervalOption) => void;
  onManualRefresh: () => void;
  dataAgeSec: number;
  loading: boolean;
  /** Show discovery button */
  discoveryDone: boolean;
  discoveryLoading: boolean;
  onRunDiscovery: () => void;
}

const INTERVAL_OPTIONS: { value: RefreshIntervalOption; label: string }[] = [
  { value: 5, label: '5с' },
  { value: 10, label: '10с' },
  { value: 15, label: '15с' },
  { value: 30, label: '30с' },
  { value: 60, label: '60с' },
];

function formatAge(sec: number): string {
  if (sec < 60) return `${sec}с`;
  return `${Math.floor(sec / 60)}м ${sec % 60}с`;
}

export function RefreshControl({
  config, onToggleAutoRefresh, onSetInterval, onManualRefresh,
  dataAgeSec, loading, discoveryDone, discoveryLoading, onRunDiscovery,
}: RefreshControlProps) {
  const [showIntervals, setShowIntervals] = useState(false);
  const isStale = dataAgeSec > config.intervalSeconds * 2;
  const isPaused = !config.autoRefresh;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Discovery button */}
      {!discoveryDone && (
        <button
          id="btn-discover"
          onClick={onRunDiscovery}
          disabled={discoveryLoading}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
            'bg-accent-amber/15 text-accent-amber border border-accent-amber/25',
            'hover:bg-accent-amber/25 disabled:opacity-50',
          )}
        >
          <Radar size={13} className={discoveryLoading ? 'animate-spin' : ''} />
          {discoveryLoading ? 'Поиск...' : 'Найти все монеты'}
        </button>
      )}

      {/* Data age */}
      <div
        className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs',
          isStale
            ? 'bg-accent-red/10 text-accent-red border border-accent-red/20'
            : isPaused
              ? 'bg-accent-amber/10 text-accent-amber border border-accent-amber/20'
              : 'bg-bg-elevated text-text-muted border border-border',
        )}
      >
        <Clock size={12} />
        <span className="mono-number">{formatAge(dataAgeSec)}</span>
        {isPaused && <span className="font-semibold">ПАУЗА</span>}
      </div>

      {/* Pause / Play */}
      <button
        id="btn-toggle-pause"
        onClick={() => onToggleAutoRefresh(!config.autoRefresh)}
        className={clsx(
          'flex items-center justify-center w-8 h-8 rounded-xl text-xs transition-all',
          config.autoRefresh
            ? 'bg-accent-green/15 text-accent-green border border-accent-green/25 hover:bg-accent-green/25'
            : 'bg-accent-amber/15 text-accent-amber border border-accent-amber/25 hover:bg-accent-amber/25',
        )}
        title={config.autoRefresh ? 'Поставить на паузу' : 'Возобновить обновление'}
      >
        {config.autoRefresh ? <Pause size={14} /> : <Play size={14} />}
      </button>

      {/* Interval selector */}
      <div className="relative">
        <button
          id="btn-interval-select"
          onClick={() => setShowIntervals(!showIntervals)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium
            bg-bg-elevated text-text-secondary border border-border
            hover:bg-bg-hover hover:text-text-primary transition-all"
        >
          <span className="mono-number">{config.intervalSeconds}с</span>
          <ChevronDown size={12} />
        </button>

        {showIntervals && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowIntervals(false)} />
            <div className="absolute top-full right-0 mt-1 z-50 bg-bg-surface border border-border rounded-xl shadow-xl overflow-hidden min-w-[100px]">
              {INTERVAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onSetInterval(opt.value);
                    setShowIntervals(false);
                  }}
                  className={clsx(
                    'w-full px-3 py-2 text-left text-xs hover:bg-bg-hover transition-colors',
                    opt.value === config.intervalSeconds
                      ? 'text-primary-400 font-semibold bg-primary-500/8'
                      : 'text-text-secondary',
                  )}
                >
                  Каждые {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Manual refresh */}
      <button
        id="btn-manual-refresh"
        onClick={onManualRefresh}
        disabled={loading}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
          'bg-primary-500/10 text-primary-400 border border-primary-500/20',
          'hover:bg-primary-500/20 disabled:opacity-50 active:scale-[0.97]',
        )}
      >
        <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} />
        Обновить
      </button>
    </div>
  );
}
