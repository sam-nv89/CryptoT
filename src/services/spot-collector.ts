import { fetchSpotTickers, fetchSpotCurrencies } from './spot-service';
import { calculateSpotSpreads } from '@/utils/spot-calculator';
import { dataCache } from './data-cache';
import { dataCache as baseDataCache } from './data-cache'; // Just to get discovered symbols from futures if needed

let collectingSpot = false;

// Cache currencies for 1 hour, because fetchCurrencies is slow and rarely changes
let cachedCurrencies: any = null;
let lastCurrenciesFetch = 0;

export async function runSpotCollectionCycle() {
  if (collectingSpot) return;
  collectingSpot = true;
  const start = Date.now();

  try {
    // 1. Fetch Currencies (Networks) periodically
    if (!cachedCurrencies || Date.now() - lastCurrenciesFetch > 3600_000) {
      console.log('[SpotCollector] Fetching networks/currencies...');
      cachedCurrencies = await fetchSpotCurrencies();
      lastCurrenciesFetch = Date.now();
      const exCount = Object.keys(cachedCurrencies).length;
      console.log(`[SpotCollector] Refreshed networks for ${exCount} exchanges`);
    }

    // 2. We need a list of symbols to fetch. We can use discovered symbols from the futures scanner 
    // or just pass an empty array to use FALLBACK_SYMBOLS inside fetchSpotTickers.
    const symbolsToFetch = dataCache.hasDiscoveredSymbols() 
      ? dataCache.getDiscoveredSymbols().map(s => s.split(':')[0])
      : [];
    
    console.log(`[SpotCollector] Symbols to fetch: ${symbolsToFetch.length} (from cache)`);

    // 3. Fetch Spot Tickers
    console.log(`[SpotCollector] Fetching tickers for ${symbolsToFetch.length || 'all'} symbols...`);
    const spotTickers = await fetchSpotTickers(symbolsToFetch);
    console.log(`[SpotCollector] Fetched ${spotTickers.length} spot tickers`);

    // 4. Calculate Spot Spreads
    console.log('[SpotCollector] Calculating spreads...');
    const spotSpreads = calculateSpotSpreads(spotTickers, cachedCurrencies);
    console.log(`[SpotCollector] Calculated ${spotSpreads.length} valid spot spreads`);

    // 5. Update cache
    dataCache.setSpotSpreads(spotSpreads);

    const durationMs = Date.now() - start;
    console.log(
      `[SpotCollector] Cycle complete: ${spotTickers.length} spot tickers, ${spotSpreads.length} spot spreads — ${durationMs}ms`
    );

    return {
      tickerCount: spotTickers.length,
      spreadCount: spotSpreads.length,
      durationMs,
    };
  } finally {
    collectingSpot = false;
  }
}
