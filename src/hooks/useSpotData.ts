'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  SpotSpreadEntry, SpotConfidence,
  RefreshConfig, RefreshIntervalOption,
} from '@/types';
import { HOT_SPREAD_THRESHOLD, WARM_SPREAD_THRESHOLD } from '@/config/spot-config';

// === Types ===

interface SpotStats {
  totalSpreads: number;
  verifiedCount: number;
  estimatedCount: number;
  rawCount: number;
  hotCount: number;
  warmCount: number;
  bestSpreadPct: number;
  bestProfitPer1000: number;
  uniqueSymbols: number;
  activeExchanges: number;
  avgSpreadPct: number;
}

interface UseSpotDataReturn {
  spreads: SpotSpreadEntry[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  dataAgeSec: number;
  refresh: () => void;
  refreshConfig: RefreshConfig;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (seconds: RefreshIntervalOption) => void;
  changedSpreadIds: Set<string>;
  stats: SpotStats;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

// === Unique ID for a spread ===
function spreadUid(s: SpotSpreadEntry): string {
  return `${s.symbol}::${s.buyExchange}->${s.sellExchange}`;
}

// === Compute stats from spreads ===
function computeStats(spreads: SpotSpreadEntry[]): SpotStats {
  const symbols = new Set<string>();
  const exchanges = new Set<string>();
  let verifiedCount = 0;
  let estimatedCount = 0;
  let rawCount = 0;
  let hotCount = 0;
  let warmCount = 0;
  let sumSpread = 0;

  for (const s of spreads) {
    symbols.add(s.symbol);
    exchanges.add(s.buyExchange);
    exchanges.add(s.sellExchange);
    sumSpread += s.spreadPercent;

    if (s.confidence === 'verified') verifiedCount++;
    else if (s.confidence === 'estimated') estimatedCount++;
    else rawCount++;

    if (s.spreadPercent >= HOT_SPREAD_THRESHOLD) hotCount++;
    else if (s.spreadPercent >= WARM_SPREAD_THRESHOLD) warmCount++;
  }

  return {
    totalSpreads: spreads.length,
    verifiedCount,
    estimatedCount,
    rawCount,
    hotCount,
    warmCount,
    bestSpreadPct: spreads.length > 0 ? Math.max(...spreads.map(s => s.spreadPercent)) : 0,
    bestProfitPer1000: spreads.length > 0 ? Math.max(...spreads.map(s => s.profitPer1000)) : 0,
    uniqueSymbols: symbols.size,
    activeExchanges: exchanges.size,
    avgSpreadPct: spreads.length > 0 ? sumSpread / spreads.length : 0,
  };
}

// === Audio notification ===
function playHotSignalSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Two-tone chime
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);

    setTimeout(() => ctx.close(), 500);
  } catch {
    // Audio not available (SSR or restricted)
  }
}

// === Main Hook ===

export function useSpotData(): UseSpotDataReturn {
  const [spreads, setSpreads] = useState<SpotSpreadEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [dataAgeSec, setDataAgeSec] = useState(0);
  const [changedSpreadIds, setChangedSpreadIds] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(false);

  const [refreshConfig, setRefreshConfig] = useState<RefreshConfig>({
    autoRefresh: true,
    intervalSeconds: 30,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSpreadMapRef = useRef<Map<string, number>>(new Map());
  const prevHotCountRef = useRef(0);

  // Data age ticker
  useEffect(() => {
    ageIntervalRef.current = setInterval(() => {
      if (lastUpdated > 0) {
        setDataAgeSec(Math.floor((Date.now() - lastUpdated) / 1000));
      }
    }, 1000);
    return () => {
      if (ageIntervalRef.current) clearInterval(ageIntervalRef.current);
    };
  }, [lastUpdated]);

  // Fetch spot data
  const fetchSpot = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/spot/spreads');
      const json = await res.json();

      if (json.data) {
        const newSpreads: SpotSpreadEntry[] = json.data;
        const newMap = new Map<string, number>();
        const changed = new Set<string>();

        for (const s of newSpreads) {
          const uid = spreadUid(s);
          newMap.set(uid, s.spreadPercent);
          const prev = prevSpreadMapRef.current.get(uid);
          if (prev === undefined || Math.abs(prev - s.spreadPercent) > 0.001) {
            changed.add(uid);
          }
        }

        // Sound notification for new HOT signals
        const newHotCount = newSpreads.filter(s => s.spreadPercent >= HOT_SPREAD_THRESHOLD).length;
        if (soundEnabled && newHotCount > prevHotCountRef.current && prevHotCountRef.current >= 0) {
          playHotSignalSound();
        }
        prevHotCountRef.current = newHotCount;

        prevSpreadMapRef.current = newMap;
        setChangedSpreadIds(changed);
        setSpreads(newSpreads);

        if (changed.size > 0) {
          setTimeout(() => setChangedSpreadIds(new Set()), 3000);
        }
      }

      setLastUpdated(json.timestamp || Date.now());
      setDataAgeSec(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch spot data');
    } finally {
      setLoading(false);
    }
  }, [soundEnabled]);

  const refresh = useCallback(() => {
    fetchSpot(false);
  }, [fetchSpot]);

  const setAutoRefresh = useCallback((enabled: boolean) => {
    setRefreshConfig(prev => ({ ...prev, autoRefresh: enabled }));
  }, []);

  const setRefreshInterval = useCallback((seconds: RefreshIntervalOption) => {
    setRefreshConfig(prev => ({ ...prev, intervalSeconds: seconds }));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSpot(true);
  }, [fetchSpot]);

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshConfig.autoRefresh) {
      intervalRef.current = setInterval(
        () => fetchSpot(false),
        refreshConfig.intervalSeconds * 1000
      );
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshConfig.autoRefresh, refreshConfig.intervalSeconds, fetchSpot]);

  // Computed stats
  const stats = useMemo(() => computeStats(spreads), [spreads]);

  return {
    spreads, loading, error,
    lastUpdated, dataAgeSec, refresh,
    refreshConfig, setAutoRefresh, setRefreshInterval,
    changedSpreadIds, stats,
    soundEnabled, setSoundEnabled,
  };
}
