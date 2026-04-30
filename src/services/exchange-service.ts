/**
 * Exchange Data Service — collects real-time data from CEX/DEX via CCXT.
 *
 * Key design decisions:
 * - fetchTickers() fetches ALL tickers from each exchange (1 API call per exchange)
 *   then filters to relevant symbols. More efficient than per-symbol fetching.
 * - discoverMarkets() runs once (or manually) to find all USDT-margined perp
 *   symbols common to 2+ exchanges — this is the "all coins" approach.
 * - Hyperliquid uses native REST API (not in CCXT for perps).
 */
import ccxt, { type Exchange } from 'ccxt';
import type {
  ExchangeId,
  TickerData,
  FundingRateEntry,
  SpreadEntry,
} from '@/types';
import { CCXT_EXCHANGE_IDS, FALLBACK_SYMBOLS } from '@/config/exchanges';
import { dataCache } from './data-cache';
import { normalizeSymbol, normalizeTicker } from '@/utils/crypto';

// === Exchange Instance Pool ===

const exchangeInstances = new Map<string, Exchange>();

function getExchangeInstance(ccxtId: string): Exchange {
  let instance = exchangeInstances.get(ccxtId);
  if (!instance) {
    const ExchangeClass = (ccxt as unknown as Record<string, new (opts?: object) => Exchange>)[ccxtId];
    if (!ExchangeClass) throw new Error(`Exchange "${ccxtId}" not found in CCXT`);
    
    const options: any = {
      enableRateLimit: true,
      timeout: 30_000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      options: {
        defaultType: 'swap',
      },
    };

    // Specific tweaks for stability
    if (ccxtId === 'okx') {
      options.options['defaultType'] = 'swap';
      options.options['fetchMarkets'] = ['swap'];
      options.options['fetchCurrencies'] = false;
    }
    if (ccxtId === 'bitmart' || ccxtId === 'gate' || ccxtId === 'ascendex') {
      options.options['fetchCurrencies'] = false;
      options.options['fetchMarkets'] = ['swap', 'future']; // Prevent fetchSpotMarkets which throws FORBIDDEN/Network errors
      if (ccxtId === 'ascendex') {
        options.options['defaultType'] = 'swap';
      }
    }

    instance = new ExchangeClass(options);

    // Hard-disable problematic features that block loadMarkets
    if (ccxtId === 'gate' || ccxtId === 'ascendex' || ccxtId === 'bitmart') {
      instance.has['fetchCurrencies'] = false;
    }

    exchangeInstances.set(ccxtId, instance);
  }
  return instance;
}

// === Market Discovery ===

export interface DiscoveryResult {
  symbols: string[];
  symbolsByExchange: Record<string, string[]>;
  exchangeStatus: Record<string, 'ok' | 'error'>;
  totalSymbols: number;
  commonSymbols: number;
  durationMs: number;
}

/**
 * Discover all USDT-margined perpetual futures symbols across all exchanges.
 * Finds symbols common to 2+ exchanges — these are arbitrage candidates.
 */
export async function discoverMarkets(): Promise<DiscoveryResult> {
  const start = Date.now();
  const symbolsByExchange: Record<string, string[]> = {};
  const exchangeStatus: Record<string, 'ok' | 'error'> = {};
  const symbolCount = new Map<string, number>();

  const tasks = [
    ...Object.entries(CCXT_EXCHANGE_IDS).map(
      async ([exchangeId, ccxtId]) => {
        if (!ccxtId) return;
        try {
          const exchange = getExchangeInstance(ccxtId);
          await exchange.loadMarkets();

          const rawSymbols = Object.keys(exchange.markets).filter((s) => {
            const m = exchange.markets[s];
            // USDT-margined linear perpetual futures
            return (
              m.active !== false &&
              m.type === 'swap' &&
              m.linear === true &&
              (m.settle === 'USDT' || m.settle === 'USDC' || s.endsWith(':USDT') || s.endsWith(':USDC'))
            );
          });

          symbolsByExchange[exchangeId] = rawSymbols;
          exchangeStatus[exchangeId] = 'ok';

          for (const s of rawSymbols) {
            const { normalizedSymbol } = normalizeSymbol(s);
            symbolCount.set(normalizedSymbol, (symbolCount.get(normalizedSymbol) ?? 0) + 1);
          }

          console.log(`[Discovery] ${exchangeId}: ${rawSymbols.length} perp symbols`);
        } catch (err) {
          exchangeStatus[exchangeId] = 'error';
          console.error(`[Discovery] ${exchangeId} failed:`, err);
        }
      }
    ),
    // Hyperliquid Discovery
    (async () => {
      try {
        const hlData = await fetchHyperliquidData();
        const rawSymbols = hlData.tickers.map((t) => t.symbol);
        symbolsByExchange['hyperliquid'] = rawSymbols;
        exchangeStatus['hyperliquid'] = 'ok';
        for (const s of rawSymbols) {
          const { normalizedSymbol } = normalizeSymbol(s);
          symbolCount.set(
            normalizedSymbol,
            (symbolCount.get(normalizedSymbol) ?? 0) + 1
          );
        }
        console.log(`[Discovery] hyperliquid: ${rawSymbols.length} assets`);
      } catch (err) {
        exchangeStatus['hyperliquid'] = 'error';
        console.error(`[Discovery] hyperliquid failed:`, err);
      }
    })(),
  ];

  await Promise.allSettled(tasks);

  // 1. Find normalized symbols that appear on 2+ exchanges
  const commonNormSymbols = new Set(
    [...symbolCount.entries()]
      .filter(([, count]) => count >= 2)
      .map(([normSymbol]) => normSymbol)
  );

  // 2. Collect ALL raw symbols that map to these common normalized symbols
  const allRawSymbols = new Set<string>();
  for (const exchangeSymbols of Object.values(symbolsByExchange)) {
    for (const s of exchangeSymbols) {
      const { normalizedSymbol } = normalizeSymbol(s);
      if (commonNormSymbols.has(normalizedSymbol)) {
        allRawSymbols.add(s);
      }
    }
  }

  const result: DiscoveryResult = {
    symbols: [...allRawSymbols].sort(),
    symbolsByExchange,
    exchangeStatus,
    totalSymbols: symbolCount.size,
    commonSymbols: commonNormSymbols.size,
    durationMs: Date.now() - start,
  };

  // Cache raw symbols so fetchers can use them
  dataCache.setDiscoveredSymbols(result.symbols);

  console.log(
    `[Discovery] Complete: ${result.commonSymbols} common assets (${result.symbols.length} raw symbols) from ${Object.keys(symbolsByExchange).length} exchanges — ${result.durationMs}ms`
  );

  return result;
}

// === Ticker Fetching ===

/**
 * Fetch ALL tickers from all exchanges.
 * Uses fetchTickers() without args for maximum efficiency (1 API call per exchange).
 * Then filters to only include symbols in our tracked set.
 */
export async function fetchTickers(): Promise<TickerData[]> {
  const results: TickerData[] = [];
  const trackedSymbols = dataCache.getDiscoveredSymbols();
  const symbolSet = trackedSymbols.length > 0
    ? new Set(trackedSymbols)
    : new Set<string>(FALLBACK_SYMBOLS);

  const tasks = Object.entries(CCXT_EXCHANGE_IDS).map(
    async ([exchangeId, ccxtId]) => {
      if (!ccxtId) return;

      try {
        const exchange = getExchangeInstance(ccxtId);

        // Try fetching ALL tickers (most efficient, 1 API call)
        let tickers: Record<string, any> = {};
        let bidsAsks: Record<string, any> = {};


        try {
          const [t, b] = await Promise.all([
            exchange.fetchTickers(),
            exchange.has['fetchBidsAsks'] ? exchange.fetchBidsAsks().catch(() => ({})) : Promise.resolve({})
          ]);
          tickers = t;
          bidsAsks = b as Record<string, any>;

        } catch {
          // Fallback: fetch specific symbols in batch
          try {
            const symArray = [...symbolSet];
            const [t, b] = await Promise.all([
              exchange.fetchTickers(symArray),
              exchange.has['fetchBidsAsks'] ? exchange.fetchBidsAsks(symArray).catch(() => ({})) : Promise.resolve({})
            ]);
            tickers = t;
            bidsAsks = b as Record<string, any>;

          } catch (e) {
            // Last resort: skip this exchange this cycle
            console.warn(`[ExchangeService] ${exchangeId}: fetchTickers/BidsAsks failed`, (e as Error).message);
            return;
          }
        }

        for (const [symbol, ticker] of Object.entries(tickers)) {
          // Only include symbols that are in our tracked set
          if (!symbolSet.has(symbol)) continue;
          
          const book = bidsAsks[symbol] || {};
          const bid = book.bid ?? ticker.bid;
          const ask = book.ask ?? ticker.ask;
          const last = ticker.last ?? book.last;
          const bidVolume = book.bidVolume ?? ticker.bidVolume ?? 0;
          const askVolume = book.askVolume ?? ticker.askVolume ?? 0;
          
          if (!bid || !ask || !last) continue;

          results.push({
            exchange: exchangeId as ExchangeId,
            symbol,
            bid,
            ask,
            last,
            volume24h: ticker.quoteVolume ?? ticker.baseVolume ?? 0,
            bidVolume,
            askVolume,
            timestamp: ticker.timestamp ?? book.timestamp ?? Date.now(),
          });
        }
      } catch (err) {
        console.error(`[ExchangeService] Ticker fetch failed for ${exchangeId}:`, (err as Error).message);
      }
    }
  );

  await Promise.allSettled(tasks);
  return results;
}

// === Funding Rate Fetching ===

export async function fetchFundingRates(): Promise<FundingRateEntry[]> {
  const results: FundingRateEntry[] = [];
  const trackedSymbols = dataCache.getDiscoveredSymbols();
  // Only fetch funding for top symbols (funding is expensive per-symbol)
  const fundingSymbols = (trackedSymbols.length > 0 ? trackedSymbols : [...FALLBACK_SYMBOLS]).slice(0, 30);

  const tasks = Object.entries(CCXT_EXCHANGE_IDS).map(
    async ([exchangeId, ccxtId]) => {
      if (!ccxtId) return;

      try {
        const exchange = getExchangeInstance(ccxtId);

        for (const symbol of fundingSymbols) {
          try {
            const fr = await exchange.fetchFundingRate(symbol);

            if (fr.fundingRate !== undefined && fr.fundingRate !== null) {
              const rate = fr.fundingRate;
              const annualized = rate * 3 * 365 * 100;

              results.push({
                exchange: exchangeId as ExchangeId,
                symbol,
                rate,
                annualizedRate: annualized,
                nextFundingTime: fr.fundingTimestamp ?? 0,
                timestamp: fr.timestamp ?? Date.now(),
              });
            }
          } catch {
            // Symbol may not be listed on this exchange
          }
        }
      } catch (err) {
        console.error(`[ExchangeService] Funding fetch failed for ${exchangeId}:`, err);
      }
    }
  );

  await Promise.allSettled(tasks);
  return results;
}

// === Spread Calculation ===

export function calculateSpreads(tickers: TickerData[]): SpreadEntry[] {
  const spreads: SpreadEntry[] = [];

  // Group tickers by normalized symbol
  const bySymbol = new Map<string, (TickerData & { normPrice: number; normBid: number; normAsk: number; normBidVolume: number; normAskVolume: number })[]>();
  
  for (const t of tickers) {
    const { normalizedSymbol, multiplier } = normalizeSymbol(t.symbol);
    const group = bySymbol.get(normalizedSymbol) ?? [];
    
    group.push({
      ...t,
      normPrice: t.last / multiplier,
      normBid: t.bid / multiplier,
      normAsk: t.ask / multiplier,
      normBidVolume: t.bidVolume * multiplier,
      normAskVolume: t.askVolume * multiplier,
    });
    
    bySymbol.set(normalizedSymbol, group);
  }

  // For each normalized symbol, find all cross-exchange spread pairs
  for (const [normSymbol, symbolTickers] of bySymbol) {
    if (symbolTickers.length < 2) continue;

    for (let i = 0; i < symbolTickers.length; i++) {
      for (let j = i + 1; j < symbolTickers.length; j++) {
        const a = symbolTickers[i];
        const b = symbolTickers[j];

        // Direction 1: Buy on A (ask), Sell on B (bid)
        if (b.normBid > a.normAsk) {
          const spreadAbs = b.normBid - a.normAsk;
          const spreadPct = (spreadAbs / a.normAsk) * 100;
          
          // Sanity check: Spreads > 50% are usually different contracts or junk data
          if (spreadPct < 50) {
            const buyVolume = a.normAskVolume;
            const sellVolume = b.normBidVolume;
            const maxQuantity = Math.min(buyVolume, sellVolume);
            const estimatedProfit = maxQuantity * spreadAbs;

            spreads.push({
              symbol: normSymbol,
              buyExchange: a.exchange,
              sellExchange: b.exchange,
              buyPrice: a.normAsk,
              sellPrice: b.normBid,
              spreadPercent: spreadPct,
              spreadAbsolute: spreadAbs,
              volume24h: Math.min(a.volume24h, b.volume24h),
              buyVolume,
              sellVolume,
              maxQuantity,
              estimatedProfit,
              timestamp: Date.now(),
            });
          }
        }

        // Direction 2: Buy on B (ask), Sell on A (bid)
        if (a.normBid > b.normAsk) {
          const spreadAbs = a.normBid - b.normAsk;
          const spreadPct = (spreadAbs / b.normAsk) * 100;
          
          if (spreadPct < 50) {
            const buyVolume = b.normAskVolume;
            const sellVolume = a.normBidVolume;
            const maxQuantity = Math.min(buyVolume, sellVolume);
            const estimatedProfit = maxQuantity * spreadAbs;

            spreads.push({
              symbol: normSymbol,
              buyExchange: b.exchange,
              sellExchange: a.exchange,
              buyPrice: b.normAsk,
              sellPrice: a.normBid,
              spreadPercent: spreadPct,
              spreadAbsolute: spreadAbs,
              volume24h: Math.min(a.volume24h, b.volume24h),
              buyVolume,
              sellVolume,
              maxQuantity,
              estimatedProfit,
              timestamp: Date.now(),
            });
          }
        }
      }
    }
  }

  return spreads.sort((a, b) => b.spreadPercent - a.spreadPercent);
}

// === Hyperliquid Specific (DEX, native REST API) ===

interface HyperliquidMeta { name: string; szDecimals: number; }
interface HyperliquidAssetCtx {
  funding: string; openInterest: string; prevDayPx: string;
  dayNtlVlm: string; premium: string; markPx: string; midPx: string;
}

export async function fetchHyperliquidData(): Promise<{
  tickers: TickerData[];
  funding: FundingRateEntry[];
}> {
  const tickers: TickerData[] = [];
  const funding: FundingRateEntry[] = [];

  try {
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
    });

    if (!response.ok) throw new Error(`Hyperliquid API error: ${response.status}`);

    const data = (await response.json()) as [
      { universe: HyperliquidMeta[] },
      HyperliquidAssetCtx[],
    ];

    const [meta, assetCtxs] = data;

    // Dynamically map ALL Hyperliquid assets to CCXT symbol format
    for (let i = 0; i < meta.universe.length; i++) {
      const asset = meta.universe[i];
      const ctx = assetCtxs[i];
      if (!ctx) continue;

      const { asset: base, multiplier } = normalizeTicker(asset.name);
      const symbol = `${base}/USDT:USDT`;
      const midPx = parseFloat(ctx.midPx);
      const markPx = parseFloat(ctx.markPx);
      if (!midPx || !markPx) continue;

      const estimatedDepthUsd = 100_000;
      const defaultVolume = estimatedDepthUsd / midPx;
      tickers.push({
        exchange: 'hyperliquid',
        symbol,
        bid: midPx * 0.9999,
        ask: midPx * 1.0001,
        last: markPx,
        volume24h: parseFloat(ctx.dayNtlVlm),
        bidVolume: defaultVolume,
        askVolume: defaultVolume,
        timestamp: Date.now(),
      });

      const fundingRate = parseFloat(ctx.funding);
      if (!isNaN(fundingRate)) {
        funding.push({
          exchange: 'hyperliquid',
          symbol,
          rate: fundingRate,
          annualizedRate: fundingRate * 3 * 365 * 100,
          nextFundingTime: 0,
          timestamp: Date.now(),
        });
      }
    }
  } catch (err) {
    console.error('[ExchangeService] Hyperliquid fetch failed:', err);
  }

  return { tickers, funding };
}
