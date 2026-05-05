/**
 * Spot Collection Orchestrator
 *
 * Runs the full spot data collection cycle:
 * 1. Fetch currencies/networks (cached for 1 hour)
 * 2. Fetch spot tickers from all exchanges (14 exchanges)
 * 3. Calculate cross-exchange spreads with confidence levels
 * 4. Store results in data cache
 *
 * Improvements:
 * - Tracks per-exchange ticker counts for diagnostics
 * - Retry logic: single retry on collection failure
 * - Reports exchange coverage in API response
 */
import { fetchSpotTickers, fetchSpotCurrencies } from './spot-service';
import { calculateSpotSpreads } from '@/utils/spot-calculator';
import { dataCache } from './data-cache';
import type { ExchangeId, NetworkInfo } from '@/types';
import { SPOT_EXCHANGES } from '@/config/spot-config';

let collectingSpot = false;

// Currency cache — refreshed every hour since networks rarely change
let cachedCurrencies: Record<ExchangeId, Record<string, NetworkInfo[]>> | null = null;
let lastCurrenciesFetch = 0;
const CURRENCIES_CACHE_TTL = 3_600_000; // 1 hour

export interface SpotCollectionResult {
  tickerCount: number;
  spreadCount: number;
  durationMs: number;
  exchangesWithNetworks: number;
  exchangesCovered: number;
  totalExchanges: number;
  confidenceBreakdown: {
    verified: number;
    estimated: number;
    raw: number;
  };
}

export async function runSpotCollectionCycle(): Promise<SpotCollectionResult> {
  if (collectingSpot) {
    console.log('[SpotCollector] Already collecting — skipping duplicate request');
    // Return current cache stats instead of empty
    const cached = dataCache.getSpotSpreads();
    return {
      tickerCount: 0, spreadCount: cached.data.length, durationMs: 0,
      exchangesWithNetworks: 0, exchangesCovered: 0, totalExchanges: SPOT_EXCHANGES.length,
      confidenceBreakdown: { verified: 0, estimated: 0, raw: 0 },
    };
  }

  collectingSpot = true;
  const start = Date.now();

  try {
    // 1. Refresh currencies/networks periodically
    if (!cachedCurrencies || Date.now() - lastCurrenciesFetch > CURRENCIES_CACHE_TTL) {
      console.log('[SpotCollector] Refreshing network/currency data...');
      try {
        cachedCurrencies = await fetchSpotCurrencies();
        lastCurrenciesFetch = Date.now();
      } catch (err) {
        console.error('[SpotCollector] Currency fetch failed:', (err as Error).message);
        // Continue with null — calculator uses fallback fee table
      }
    }

    const exchangesWithNetworks = cachedCurrencies ? Object.keys(cachedCurrencies).length : 0;

    // 2. Fetch all spot tickers in parallel
    console.log(`[SpotCollector] Fetching spot tickers from ${SPOT_EXCHANGES.length} exchanges...`);
    let spotTickers = await fetchSpotTickers();
    console.log(`[SpotCollector] Got ${spotTickers.length} spot tickers`);

    // Retry once if we got very few tickers (likely transient error)
    if (spotTickers.length < 50 && SPOT_EXCHANGES.length >= 5) {
      console.log('[SpotCollector] Low ticker count — retrying in 3s...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      spotTickers = await fetchSpotTickers();
      console.log(`[SpotCollector] Retry result: ${spotTickers.length} spot tickers`);
    }

    // Count unique exchanges in result
    const exchangesCovered = new Set(spotTickers.map(t => t.exchange)).size;

    // 3. Calculate spreads with three-tier confidence
    console.log('[SpotCollector] Calculating spreads...');
    const spotSpreads = calculateSpotSpreads(spotTickers, cachedCurrencies);
    console.log(`[SpotCollector] Found ${spotSpreads.length} spot spread opportunities`);

    // Log confidence breakdown
    const verified  = spotSpreads.filter(s => s.confidence === 'verified').length;
    const estimated = spotSpreads.filter(s => s.confidence === 'estimated').length;
    const raw       = spotSpreads.filter(s => s.confidence === 'raw').length;
    console.log(`[SpotCollector] Confidence: ${verified} verified, ${estimated} estimated, ${raw} raw`);
    console.log(`[SpotCollector] Exchanges covered: ${exchangesCovered}/${SPOT_EXCHANGES.length}`);

    // 4. Update cache
    dataCache.setSpotSpreads(spotSpreads);

    const durationMs = Date.now() - start;
    console.log(
      `[SpotCollector] ✅ Cycle complete: ${spotTickers.length} tickers → ${spotSpreads.length} spreads — ${durationMs}ms`
    );

    return {
      tickerCount:          spotTickers.length,
      spreadCount:          spotSpreads.length,
      durationMs,
      exchangesWithNetworks,
      exchangesCovered,
      totalExchanges:       SPOT_EXCHANGES.length,
      confidenceBreakdown:  { verified, estimated, raw },
    };
  } catch (err) {
    console.error('[SpotCollector] Cycle failed:', err);
    return {
      tickerCount: 0, spreadCount: 0, durationMs: Date.now() - start,
      exchangesWithNetworks: 0, exchangesCovered: 0, totalExchanges: SPOT_EXCHANGES.length,
      confidenceBreakdown: { verified: 0, estimated: 0, raw: 0 },
    };
  } finally {
    collectingSpot = false;
  }
}
