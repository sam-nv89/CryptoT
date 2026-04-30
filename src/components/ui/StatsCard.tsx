'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: 'primary' | 'green' | 'red' | 'amber' | 'muted';

  animationDelay?: number;
}

const accentMap = {
  primary: {
    iconBg: 'bg-primary-500/15',
    iconText: 'text-primary-400',
    glow: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)]',
  },
  green: {
    iconBg: 'bg-accent-green/15',
    iconText: 'text-accent-green',
    glow: 'shadow-[0_0_30px_-5px_rgba(52,211,153,0.15)]',
  },
  red: {
    iconBg: 'bg-accent-red/15',
    iconText: 'text-accent-red',
    glow: 'shadow-[0_0_30px_-5px_rgba(248,113,113,0.15)]',
  },
  amber: {
    iconBg: 'bg-accent-amber/15',
    iconText: 'text-accent-amber',
    glow: 'shadow-[0_0_30px_-5px_rgba(251,191,36,0.15)]',
  },
  muted: {
    iconBg: 'bg-white/5',
    iconText: 'text-text-muted',
    glow: '',
  },
};


export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  accentColor = 'primary',
  animationDelay = 0,
}: StatsCardProps) {
  const accent = accentMap[accentColor];

  return (
    <div
      className={clsx(
        'glass-card p-5 animate-slide-up opacity-0',
        accent.glow
      )}
      style={{ animationDelay: `${animationDelay * 0.08}s`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-2xl font-bold mono-number text-text-primary truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-text-muted mt-1.5">{subtitle}</p>
          )}
        </div>
        <div
          className={clsx(
            'flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0',
            accent.iconBg,
            accent.iconText
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
