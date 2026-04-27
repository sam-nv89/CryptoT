'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SpreadEntry, FundingRateEntry, TickerData } from '@/types';

interface UseMarketDataReturn {
  tickers: TickerData[];
  spreads: SpreadEntry[];
  funding: FundingRateEntry[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  refresh: () => void;
}

/**
 * Client hook for fetching all market data from the API.
 * Polls every `intervalMs` (default 10s).
 */
export function useMarketData(intervalMs = 10_000): UseMarketDataReturn {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [spreads, setSpreads] = useState<SpreadEntry[]>([]);
  const [funding, setFunding] = useState<FundingRateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);

    try {
      // First, trigger a collection cycle
      await fetch('/api/collect').catch(() => {
        // Non-critical — data may already be cached
      });

      // Then fetch the cached results
      const [tickersRes, spreadsRes, fundingRes] = await Promise.allSettled([
        fetch('/api/tickers').then((r) => r.json()),
        fetch('/api/spreads').then((r) => r.json()),
        fetch('/api/funding').then((r) => r.json()),
      ]);

      if (tickersRes.status === 'fulfilled' && tickersRes.value.data) {
        setTickers(tickersRes.value.data);
      }
      if (spreadsRes.status === 'fulfilled' && spreadsRes.value.data) {
        setSpreads(spreadsRes.value.data);
      }
      if (fundingRes.status === 'fulfilled' && fundingRes.value.data) {
        setFunding(fundingRes.value.data);
      }

      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchAll(false);
  }, [fetchAll]);

  useEffect(() => {
    // Initial fetch
    fetchAll(true);

    // Polling
    intervalRef.current = setInterval(() => fetchAll(false), intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll, intervalMs]);

  return { tickers, spreads, funding, loading, error, lastUpdated, refresh };
}
