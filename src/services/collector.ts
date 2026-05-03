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

    let allFunding = [
      ...(cexFunding.status === 'fulfilled' ? cexFunding.value : []),
      ...(hlData.status === 'fulfilled' ? hlData.value.funding : []),
    ];

    // OMNI-MERGE: Attach price and volume to funding entries
    // Create a map for O(1) lookup
    const tickerMap = new Map<string, TickerData>();
    for (const t of allTickers) {
      tickerMap.set(`${t.exchange}:${t.symbol}`, t);
    }

    allFunding = allFunding.map(f => {
      const ticker = tickerMap.get(`${f.exchange}:${f.symbol}`);
      if (ticker) {
        return {
          ...f,
          price: ticker.last,
          volume24h: ticker.volume24h,
        };
      }
      return f;
    });

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
