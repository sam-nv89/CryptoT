/**
 * Exchange Data Service — collects real-time data from CEX/DEX via CCXT.
 *
 * NOTE: CCXT is server-side only (it uses Node.js APIs).
 * This module runs inside Next.js API routes / server actions.
 */
import ccxt, { type Exchange } from 'ccxt';
import type {
  ExchangeId,
  TickerData,
  FundingRateEntry,
  SpreadEntry,
} from '@/types';
import { CCXT_EXCHANGE_IDS, TRACKED_SYMBOLS } from '@/config/exchanges';

// === Exchange Instance Pool ===

const exchangeInstances = new Map<string, Exchange>();

function getExchangeInstance(ccxtId: string): Exchange {
  let instance = exchangeInstances.get(ccxtId);
  if (!instance) {
    const ExchangeClass = (ccxt as unknown as Record<string, new (opts?: object) => Exchange>)[ccxtId];
    if (!ExchangeClass) throw new Error(`Exchange "${ccxtId}" not found in CCXT`);
    instance = new ExchangeClass({
      enableRateLimit: true,
      timeout: 15_000,
    });
    exchangeInstances.set(ccxtId, instance);
  }
  return instance;
}

// === Ticker Fetching ===

export async function fetchTickers(): Promise<TickerData[]> {
  const results: TickerData[] = [];

  const tasks = Object.entries(CCXT_EXCHANGE_IDS).map(
    async ([exchangeId, ccxtId]) => {
      if (!ccxtId) return;

      try {
        const exchange = getExchangeInstance(ccxtId);
        const symbols = TRACKED_SYMBOLS.filter((s) => true); // all symbols

        // Attempt batch fetch first (cheaper)
        let tickers: Record<string, { bid?: number; ask?: number; last?: number; quoteVolume?: number; baseVolume?: number; timestamp?: number }>;
        try {
          tickers = await exchange.fetchTickers([...symbols]);
        } catch {
          // Fallback: fetch one by one
          tickers = {};
          for (const sym of symbols) {
            try {
              const t = await exchange.fetchTicker(sym);
              tickers[sym] = t;
            } catch {
              // Symbol may not exist on this exchange
            }
          }
        }

        for (const [symbol, ticker] of Object.entries(tickers)) {
          if (ticker.bid && ticker.ask && ticker.last) {
            results.push({
              exchange: exchangeId as ExchangeId,
              symbol,
              bid: ticker.bid,
              ask: ticker.ask,
              last: ticker.last,
              volume24h: ticker.quoteVolume ?? ticker.baseVolume ?? 0,
              timestamp: ticker.timestamp ?? Date.now(),
            });
          }
        }
      } catch (err) {
        console.error(`[ExchangeService] Ticker fetch failed for ${exchangeId}:`, err);
      }
    }
  );

  await Promise.allSettled(tasks);
  return results;
}

// === Funding Rate Fetching ===

export async function fetchFundingRates(): Promise<FundingRateEntry[]> {
  const results: FundingRateEntry[] = [];

  const tasks = Object.entries(CCXT_EXCHANGE_IDS).map(
    async ([exchangeId, ccxtId]) => {
      if (!ccxtId) return;

      try {
        const exchange = getExchangeInstance(ccxtId);

        for (const symbol of TRACKED_SYMBOLS) {
          try {
            const fr = await exchange.fetchFundingRate(symbol);

            if (fr.fundingRate !== undefined && fr.fundingRate !== null) {
              const rate = fr.fundingRate;
              // Annualize: funding is usually every 8h => 3 times/day => 1095 times/year
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

  // Group tickers by symbol
  const bySymbol = new Map<string, TickerData[]>();
  for (const t of tickers) {
    const group = bySymbol.get(t.symbol) ?? [];
    group.push(t);
    bySymbol.set(t.symbol, group);
  }

  // For each symbol, find all cross-exchange spread pairs
  for (const [symbol, symbolTickers] of bySymbol) {
    if (symbolTickers.length < 2) continue;

    for (let i = 0; i < symbolTickers.length; i++) {
      for (let j = i + 1; j < symbolTickers.length; j++) {
        const a = symbolTickers[i];
        const b = symbolTickers[j];

        // Direction 1: Buy on A (ask), Sell on B (bid)
        if (b.bid > a.ask) {
          const spreadAbs = b.bid - a.ask;
          const spreadPct = (spreadAbs / a.ask) * 100;
          spreads.push({
            symbol,
            buyExchange: a.exchange,
            sellExchange: b.exchange,
            buyPrice: a.ask,
            sellPrice: b.bid,
            spreadPercent: spreadPct,
            spreadAbsolute: spreadAbs,
            volume24h: Math.min(a.volume24h, b.volume24h),
            timestamp: Date.now(),
          });
        }

        // Direction 2: Buy on B (ask), Sell on A (bid)
        if (a.bid > b.ask) {
          const spreadAbs = a.bid - b.ask;
          const spreadPct = (spreadAbs / b.ask) * 100;
          spreads.push({
            symbol,
            buyExchange: b.exchange,
            sellExchange: a.exchange,
            buyPrice: b.ask,
            sellPrice: a.bid,
            spreadPercent: spreadPct,
            spreadAbsolute: spreadAbs,
            volume24h: Math.min(a.volume24h, b.volume24h),
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  // Sort by spread (highest first)
  return spreads.sort((a, b) => b.spreadPercent - a.spreadPercent);
}

// === Hyperliquid Specific (DEX, no CCXT support yet) ===

interface HyperliquidMeta {
  name: string;
  szDecimals: number;
}

interface HyperliquidAssetCtx {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  premium: string;
  markPx: string;
  midPx: string;
}

export async function fetchHyperliquidData(): Promise<{
  tickers: TickerData[];
  funding: FundingRateEntry[];
}> {
  const tickers: TickerData[] = [];
  const funding: FundingRateEntry[] = [];

  try {
    // Hyperliquid has a REST API at api.hyperliquid.xyz
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

    // Map Hyperliquid names to our CCXT symbols
    const nameToSymbol: Record<string, string> = {
      BTC: 'BTC/USDT:USDT',
      ETH: 'ETH/USDT:USDT',
      SOL: 'SOL/USDT:USDT',
      XRP: 'XRP/USDT:USDT',
      DOGE: 'DOGE/USDT:USDT',
      ADA: 'ADA/USDT:USDT',
      AVAX: 'AVAX/USDT:USDT',
      LINK: 'LINK/USDT:USDT',
      DOT: 'DOT/USDT:USDT',
      MATIC: 'MATIC/USDT:USDT',
      POL: 'MATIC/USDT:USDT',
    };

    for (let i = 0; i < meta.universe.length; i++) {
      const asset = meta.universe[i];
      const ctx = assetCtxs[i];
      const symbol = nameToSymbol[asset.name];

      if (!symbol || !ctx) continue;

      const midPx = parseFloat(ctx.midPx);
      const markPx = parseFloat(ctx.markPx);

      tickers.push({
        exchange: 'hyperliquid',
        symbol,
        bid: midPx * 0.9999, // Approximate bid/ask from mid
        ask: midPx * 1.0001,
        last: markPx,
        volume24h: parseFloat(ctx.dayNtlVlm),
        timestamp: Date.now(),
      });

      const fundingRate = parseFloat(ctx.funding);
      funding.push({
        exchange: 'hyperliquid',
        symbol,
        rate: fundingRate,
        annualizedRate: fundingRate * 3 * 365 * 100,
        nextFundingTime: 0,
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    console.error('[ExchangeService] Hyperliquid fetch failed:', err);
  }

  return { tickers, funding };
}
