/**
 * Data collector — runs a fetch cycle and updates the in-memory cache.
 * Called by the /api/cron route or manually for dev.
 */
import {
  fetchTickers,
  fetchFundingRates,
  fetchHyperliquidData,
  calculateSpreads,
} from './exchange-service';
import { dataCache } from './data-cache';

let collecting = false;

export async function runCollectionCycle(): Promise<{
  tickerCount: number;
  spreadCount: number;
  fundingCount: number;
  durationMs: number;
}> {
  if (collecting) {
    return { tickerCount: 0, spreadCount: 0, fundingCount: 0, durationMs: 0 };
  }

  collecting = true;
  const start = Date.now();

  try {
    // Fetch from all sources in parallel
    const [cexTickers, cexFunding, hlData] = await Promise.allSettled([
      fetchTickers(),
      fetchFundingRates(),
      fetchHyperliquidData(),
    ]);

    // Merge results
    const allTickers = [
      ...(cexTickers.status === 'fulfilled' ? cexTickers.value : []),
      ...(hlData.status === 'fulfilled' ? hlData.value.tickers : []),
    ];

    const allFunding = [
      ...(cexFunding.status === 'fulfilled' ? cexFunding.value : []),
      ...(hlData.status === 'fulfilled' ? hlData.value.funding : []),
    ];

    // Calculate spreads
    const spreads = calculateSpreads(allTickers);

    // Update cache
    dataCache.setTickers(allTickers);
    dataCache.setSpreads(spreads);
    dataCache.setFunding(allFunding);

    const durationMs = Date.now() - start;

    console.log(
      `[Collector] Cycle complete: ${allTickers.length} tickers, ${spreads.length} spreads, ${allFunding.length} funding — ${durationMs}ms`
    );

    return {
      tickerCount: allTickers.length,
      spreadCount: spreads.length,
      fundingCount: allFunding.length,
      durationMs,
    };
  } finally {
    collecting = false;
  }
}
