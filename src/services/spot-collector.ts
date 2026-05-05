/**
 * Spot Collection Orchestrator
 *
 * Runs the full spot data collection cycle:
 * 1. Fetch currencies/networks (cached for 1 hour)
 * 2. Fetch spot tickers from all exchanges
 * 3. Calculate cross-exchange spreads with confidence levels
 * 4. Store results in data cache
 */
import { fetchSpotTickers, fetchSpotCurrencies } from './spot-service';
import { calculateSpotSpreads } from '@/utils/spot-calculator';
import { dataCache } from './data-cache';
import type { ExchangeId, NetworkInfo } from '@/types';

let collectingSpot = false;

// Currency cache — refreshed every hour since networks rarely change
let cachedCurrencies: Record<ExchangeId, Record<string, NetworkInfo[]>> | null = null;
let lastCurrenciesFetch = 0;
const CURRENCIES_CACHE_TTL = 3600_000; // 1 hour

export async function runSpotCollectionCycle(): Promise<{
  tickerCount: number;
  spreadCount: number;
  durationMs: number;
  exchangesWithNetworks: number;
}> {
  if (collectingSpot) {
    return { tickerCount: 0, spreadCount: 0, durationMs: 0, exchangesWithNetworks: 0 };
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
        // Continue with null — calculator will use fallbacks
      }
    }

    const exchangesWithNetworks = cachedCurrencies ? Object.keys(cachedCurrencies).length : 0;

    // 2. Fetch all spot tickers in parallel
    console.log('[SpotCollector] Fetching spot tickers...');
    const spotTickers = await fetchSpotTickers();
    console.log(`[SpotCollector] Got ${spotTickers.length} spot tickers`);

    // 3. Calculate spreads with three-tier confidence
    console.log('[SpotCollector] Calculating spreads...');
    const spotSpreads = calculateSpotSpreads(spotTickers, cachedCurrencies);
    console.log(`[SpotCollector] Found ${spotSpreads.length} spot spread opportunities`);

    // Log confidence breakdown
    const verified = spotSpreads.filter(s => s.confidence === 'verified').length;
    const estimated = spotSpreads.filter(s => s.confidence === 'estimated').length;
    const raw = spotSpreads.filter(s => s.confidence === 'raw').length;
    console.log(`[SpotCollector] Confidence: ${verified} verified, ${estimated} estimated, ${raw} raw`);

    // 4. Update cache
    dataCache.setSpotSpreads(spotSpreads);

    const durationMs = Date.now() - start;
    console.log(
      `[SpotCollector] ✅ Cycle complete: ${spotTickers.length} tickers → ${spotSpreads.length} spreads — ${durationMs}ms`
    );

    return { tickerCount: spotTickers.length, spreadCount: spotSpreads.length, durationMs, exchangesWithNetworks };
  } catch (err) {
    console.error('[SpotCollector] Cycle failed:', err);
    return { tickerCount: 0, spreadCount: 0, durationMs: Date.now() - start, exchangesWithNetworks: 0 };
  } finally {
    collectingSpot = false;
  }
}
