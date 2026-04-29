'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  SpreadEntry, FundingRateEntry, TickerData,
  RefreshConfig, RefreshIntervalOption,
} from '@/types';

interface UseMarketDataReturn {
  tickers: TickerData[];
  spreads: SpreadEntry[];
  funding: FundingRateEntry[];
  loading: boolean;
  error: string | null;
  /** Timestamp when displayed data was last updated */
  lastUpdated: number;
  /** How many seconds ago data was refreshed */
  dataAgeSec: number;
  /** Manual refresh trigger */
  refresh: () => void;
  /** Refresh control */
  refreshConfig: RefreshConfig;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (seconds: RefreshIntervalOption) => void;
  /** IDs of spreads that appeared/changed since last update */
  changedSpreadIds: Set<string>;
  /** Number of unique symbols with data */
  symbolCount: number;
  /** Number of responding exchanges */
  exchangeCount: number;
  /** Whether initial discovery has been done */
  discoveryDone: boolean;
  /** Trigger market discovery */
  runDiscovery: () => void;
  discoveryLoading: boolean;
}

function spreadUid(s: SpreadEntry): string {
  return `${s.symbol}::${s.buyExchange}->${s.sellExchange}`;
}

/**
 * Client hook for fetching market data with full refresh control.
 *
 * Key behaviors:
 * - Pausing stops polling but still shows how old displayed data is.
 * - When resuming, data refreshes on next cycle.
 * - Changed/new spreads are tracked for brief UI highlighting.
 */
export function useMarketData(): UseMarketDataReturn {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [spreads, setSpreads] = useState<SpreadEntry[]>([]);
  const [funding, setFunding] = useState<FundingRateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [dataAgeSec, setDataAgeSec] = useState(0);
  const [changedSpreadIds, setChangedSpreadIds] = useState<Set<string>>(new Set());
  const [discoveryDone, setDiscoveryDone] = useState(false);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  const [refreshConfig, setRefreshConfig] = useState<RefreshConfig>({
    autoRefresh: true,
    intervalSeconds: 15,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSpreadMapRef = useRef<Map<string, number>>(new Map());

  // --- Data Age Ticker (updates every second while data is showing) ---
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

  // --- Fetch ---
  const fetchAll = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);

    try {
      await fetch('/api/collect').catch(() => {});

      const [tickersRes, spreadsRes, fundingRes] = await Promise.allSettled([
        fetch('/api/tickers').then((r) => r.json()),
        fetch('/api/spreads').then((r) => r.json()),
        fetch('/api/funding').then((r) => r.json()),
      ]);

      if (tickersRes.status === 'fulfilled' && tickersRes.value.data) {
        setTickers(tickersRes.value.data);
      }

      if (spreadsRes.status === 'fulfilled' && spreadsRes.value.data) {
        const newSpreads: SpreadEntry[] = spreadsRes.value.data;

        // Detect changed/new spreads by comparing with previous snapshot
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

        // Clear change highlights after 3 seconds
        if (changed.size > 0) {
          setTimeout(() => setChangedSpreadIds(new Set()), 3000);
        }
      }

      if (fundingRes.status === 'fulfilled' && fundingRes.value.data) {
        setFunding(fundingRes.value.data);
      }

      setLastUpdated(Date.now());
      setDataAgeSec(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchAll(false);
  }, [fetchAll]);

  // --- Discovery ---
  const runDiscovery = useCallback(async () => {
    setDiscoveryLoading(true);
    try {
      const res = await fetch('/api/discover');
      const data = await res.json();
      if (data.success) {
        setDiscoveryDone(true);
        // Refresh data after discovery
        fetchAll(false);
      }
    } catch {
      console.error('Discovery failed');
    } finally {
      setDiscoveryLoading(false);
    }
  }, [fetchAll]);

  // --- Auto-refresh control ---
  const setAutoRefresh = useCallback((enabled: boolean) => {
    setRefreshConfig((prev) => ({ ...prev, autoRefresh: enabled }));
  }, []);

  const setRefreshInterval = useCallback((seconds: RefreshIntervalOption) => {
    setRefreshConfig((prev) => ({ ...prev, intervalSeconds: seconds }));
  }, []);

  // --- Polling effect ---
  useEffect(() => {
    fetchAll(true);
  }, [fetchAll]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (refreshConfig.autoRefresh) {
      intervalRef.current = setInterval(
        () => fetchAll(false),
        refreshConfig.intervalSeconds * 1000
      );
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshConfig.autoRefresh, refreshConfig.intervalSeconds, fetchAll]);

  // --- Computed ---
  const symbolCount = useMemo(() => new Set(tickers.map((t) => t.symbol)).size, [tickers]);
  const exchangeCount = useMemo(() => new Set(tickers.map((t) => t.exchange)).size, [tickers]);

  return {
    tickers, spreads, funding, loading, error,
    lastUpdated, dataAgeSec, refresh,
    refreshConfig, setAutoRefresh, setRefreshInterval,
    changedSpreadIds, symbolCount, exchangeCount,
    discoveryDone, runDiscovery, discoveryLoading,
  };
}
