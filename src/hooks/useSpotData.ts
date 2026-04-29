'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  SpotSpreadEntry,
  RefreshConfig, RefreshIntervalOption,
} from '@/types';

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
  symbolCount: number;
  exchangeCount: number;
}

function spreadUid(s: SpotSpreadEntry): string {
  return `${s.symbol}::${s.buyExchange}->${s.sellExchange}`;
}

export function useSpotData(): UseSpotDataReturn {
  const [spreads, setSpreads] = useState<SpotSpreadEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [dataAgeSec, setDataAgeSec] = useState(0);
  const [changedSpreadIds, setChangedSpreadIds] = useState<Set<string>>(new Set());

  const [refreshConfig, setRefreshConfig] = useState<RefreshConfig>({
    autoRefresh: true,
    intervalSeconds: 30, // Spot is heavier, slower refresh
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSpreadMapRef = useRef<Map<string, number>>(new Map());

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

        prevSpreadMapRef.current = newMap;
        setChangedSpreadIds(changed);
        setSpreads(newSpreads);

        if (changed.size > 0) {
          setTimeout(() => setChangedSpreadIds(new Set()), 3000);
        }
      }

      setLastUpdated(Date.now());
      setDataAgeSec(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch spot data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchSpot(false);
  }, [fetchSpot]);

  const setAutoRefresh = useCallback((enabled: boolean) => {
    setRefreshConfig((prev) => ({ ...prev, autoRefresh: enabled }));
  }, []);

  const setRefreshInterval = useCallback((seconds: RefreshIntervalOption) => {
    setRefreshConfig((prev) => ({ ...prev, intervalSeconds: seconds }));
  }, []);

  useEffect(() => {
    fetchSpot(true);
  }, [fetchSpot]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshConfig.autoRefresh) {
      intervalRef.current = setInterval(() => fetchSpot(false), refreshConfig.intervalSeconds * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshConfig.autoRefresh, refreshConfig.intervalSeconds, fetchSpot]);

  const symbolCount = useMemo(() => new Set(spreads.map((s) => s.symbol)).size, [spreads]);
  const exchangeCount = useMemo(() => {
    const exSet = new Set<string>();
    spreads.forEach(s => {
      exSet.add(s.buyExchange);
      exSet.add(s.sellExchange);
    });
    return exSet.size;
  }, [spreads]);

  return {
    spreads, loading, error,
    lastUpdated, dataAgeSec, refresh,
    refreshConfig, setAutoRefresh, setRefreshInterval,
    changedSpreadIds, symbolCount, exchangeCount,
  };
}
