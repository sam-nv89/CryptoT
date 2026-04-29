'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ArbitrageSignal, AlertThresholds } from '@/services/alert-engine';
import { DEFAULT_THRESHOLDS } from '@/services/alert-engine';

interface UseSpreadAlertsReturn {
  signals: ArbitrageSignal[];
  history: ArbitrageSignal[];
  loading: boolean;
  error: string | null;
  thresholds: AlertThresholds;
  setThresholds: (t: Partial<AlertThresholds>) => void;
  hotCount: number;
  warmCount: number;
  totalCount: number;
  lastChecked: number;
  newSignalIds: Set<string>;
  refresh: () => void;
}

/**
 * Client hook for real-time arbitrage signal monitoring.
 * Polls /api/alerts every `intervalMs`, detects new signals, triggers
 * browser notification sound and optional push notifications.
 */
export function useSpreadAlerts(intervalMs = 10_000): UseSpreadAlertsReturn {
  const [signals, setSignals] = useState<ArbitrageSignal[]>([]);
  const [history, setHistory] = useState<ArbitrageSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState(0);
  const [thresholds, setThresholdsState] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);

  // Track which signal IDs are "new" (appeared in last cycle)
  const [newSignalIds, setNewSignalIds] = useState<Set<string>>(new Set());
  const prevSignalIdsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize notification sound once
  useEffect(() => {
    // Use a subtle notification sound via Web Audio API
    if (typeof window !== 'undefined') {
      audioRef.current = null; // Will create on demand
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!thresholds.soundEnabled) return;

    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Pleasant rising chime
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio context blocked — ignore silently
    }
  }, [thresholds.soundEnabled]);

  const setThresholds = useCallback((partial: Partial<AlertThresholds>) => {
    setThresholdsState((prev) => ({ ...prev, ...partial }));
  }, []);

  const fetchAlerts = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          minGrossSpread: thresholds.minGrossSpread.toString(),
          minNetSpread: thresholds.minNetSpread.toString(),
          minVolume: thresholds.minVolume.toString(),
        });

        const [alertsRes, historyRes] = await Promise.allSettled([
          fetch(`/api/alerts?${params}`).then((r) => r.json()),
          fetch('/api/alerts/history?window=60&limit=50').then((r) => r.json()),
        ]);

        if (alertsRes.status === 'fulfilled' && alertsRes.value.data) {
          const newSignals: ArbitrageSignal[] = alertsRes.value.data;
          setSignals(newSignals);

          // Detect truly new signals (not seen in previous cycle)
          const currentIds = new Set(newSignals.map((s) => s.id));
          const freshIds = new Set<string>();
          for (const id of currentIds) {
            if (!prevSignalIdsRef.current.has(id)) {
              freshIds.add(id);
            }
          }

          // If there are new HOT signals, play sound
          if (freshIds.size > 0 && !isInitial) {
            const hasHot = newSignals.some(
              (s) => freshIds.has(s.id) && s.tier === 'hot'
            );
            if (hasHot) {
              playNotificationSound();
            }
          }

          setNewSignalIds(freshIds);
          prevSignalIdsRef.current = currentIds;
        }

        if (historyRes.status === 'fulfilled' && historyRes.value.data) {
          setHistory(historyRes.value.data);
        }

        setLastChecked(Date.now());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      } finally {
        setLoading(false);
      }
    },
    [thresholds, playNotificationSound]
  );

  const refresh = useCallback(() => {
    fetchAlerts(false);
  }, [fetchAlerts]);

  useEffect(() => {
    fetchAlerts(true);

    intervalRef.current = setInterval(() => fetchAlerts(false), intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAlerts, intervalMs]);

  const hotCount = signals.filter((s) => s.tier === 'hot').length;
  const warmCount = signals.filter((s) => s.tier === 'warm').length;

  return {
    signals,
    history,
    loading,
    error,
    thresholds,
    setThresholds,
    hotCount,
    warmCount,
    totalCount: signals.length,
    lastChecked,
    newSignalIds,
    refresh,
  };
}
