'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import {
  SlidersHorizontal,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import type { AlertThresholds } from '@/services/alert-engine';
import { EXCHANGE_FEES } from '@/services/alert-engine';
import { EXCHANGES } from '@/config/exchanges';
import type { ExchangeId } from '@/types';

interface SpreadAlertPanelProps {
  thresholds: AlertThresholds;
  onThresholdChange: (partial: Partial<AlertThresholds>) => void;
}

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint?: string;
  onChange: (val: number) => void;
}

function SliderField({ label, value, min, max, step, unit, hint, onChange }: SliderFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-secondary">
          {label}
        </label>
        <span className="mono-number text-xs font-bold text-primary-400">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer
          bg-bg-elevated
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-primary-400
          [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-bg-surface
          [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(6,182,212,0.4)]
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-shadow
          [&::-webkit-slider-thumb]:hover:shadow-[0_0_14px_rgba(6,182,212,0.6)]
          [&::-moz-range-thumb]:w-4
          [&::-moz-range-thumb]:h-4
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-primary-400
          [&::-moz-range-thumb]:border-2
          [&::-moz-range-thumb]:border-bg-surface
          [&::-moz-range-thumb]:cursor-pointer
        "
      />
      {hint && (
        <p className="text-[10px] text-text-muted flex items-start gap-1">
          <Info size={10} className="mt-0.5 flex-shrink-0" />
          {hint}
        </p>
      )}
    </div>
  );
}

export function SpreadAlertPanel({
  thresholds,
  onThresholdChange,
}: SpreadAlertPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* Header — always visible */}
      <button
        id="btn-alert-settings"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg-hover/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            Настройка фильтров
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="btn-toggle-sound"
            onClick={(e) => {
              e.stopPropagation();
              onThresholdChange({ soundEnabled: !thresholds.soundEnabled });
            }}
            className={clsx(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all',
              thresholds.soundEnabled
                ? 'bg-primary-500/15 text-primary-400'
                : 'bg-bg-elevated text-text-muted'
            )}
          >
            {thresholds.soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            Звук
          </button>
          {expanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
        </div>
      </button>

      {/* Expandable settings */}
      <div
        className={clsx(
          'overflow-hidden transition-all duration-300 ease-out',
          expanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-5 pb-5 space-y-5 border-t border-border/50 pt-4">
          <SliderField
            label="Мин. Gross Спред"
            value={thresholds.minGrossSpread}
            min={0} max={1} step={0.01} unit="%"
            hint="Минимальный валовый спред для отображения сигнала"
            onChange={(val) => onThresholdChange({ minGrossSpread: val })}
          />
          <SliderField
            label="Мин. Нетто Спред"
            value={thresholds.minNetSpread}
            min={-0.5} max={0.5} step={0.01} unit="%"
            hint="Отрицательное значение покажет сигналы, убыточные после комиссий"
            onChange={(val) => onThresholdChange({ minNetSpread: val })}
          />
          <SliderField
            label="Мин. Объём (24ч)"
            value={thresholds.minVolume / 1000}
            min={0} max={10000} step={50} unit="K $"
            hint="Минимальный суточный объём на слабой стороне пары"
            onChange={(val) => onThresholdChange({ minVolume: val * 1000 })}
          />

          {/* Fee Reference — dynamic from EXCHANGE_FEES */}
          <div className="bg-bg-elevated/50 rounded-xl p-3 border border-border/30">
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-2">
              Комиссии бирж (taker)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-[11px]">
              {(Object.entries(EXCHANGE_FEES) as [ExchangeId, { taker: number }][]).map(
                ([id, fees]) => (
                  <div key={id} className="flex items-center justify-between">
                    <span className="text-text-secondary">{EXCHANGES[id]?.name ?? id}</span>
                    <span className="mono-number text-text-muted">{fees.taker}%</span>
                  </div>
                )
              )}
            </div>
            <p className="text-[9px] text-text-muted mt-2">
              + Slippage estimate: 0.01% per leg
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
