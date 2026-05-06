/**
 * Spot Exchange Service — fetches real-time spot tickers and currency/network data.
 *
 * Key differences from futures exchange-service.ts:
 * - Uses `defaultType: 'spot'` (not 'swap')
 * - Uses spot-specific CCXT class IDs (not binanceusdm, kucoinfutures)
 * - Scans 14 exchanges for maximum spread coverage
 * - Filters to USDT and USDC spot pairs
 * - Smart depth data: merges fetchTickers() + fetchBidsAsks() where available
 */
import ccxt, { type Exchange } from 'ccxt';
import type { ExchangeId, TickerData, NetworkInfo } from '@/types';
import {
  SPOT_CCXT_MAP,
  SPOT_EXCHANGES,
  SPOT_NO_CURRENCIES,
  SPOT_NO_BIDS_ASKS,
  MIN_SPOT_VOLUME_USD,
} from '@/config/spot-config';

/**
 * Vertex Market Data Fetcher (Native)
 * Vertex is not in CCXT, so we use their public Market Data API.
 */
async function fetchVertexTickers(): Promise<TickerData[]> {
  try {
    const url = 'https://archive.prod.vertexprotocol.com/v1/tickers';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 10 } // Cache for 10s
    });
    
    if (!response.ok) throw new Error(`Vertex API error: ${response.status}`);
    const data = await response.json();
    const results: TickerData[] = [];

    for (const [vSymbol, ticker] of Object.entries(data)) {
      // Vertex spot symbols are formatted as "ASSET-QUOTE_SPOT"
      if (!vSymbol.endsWith('_SPOT')) continue;
      
      const [base, rest] = vSymbol.split('-');
      const quote = rest.replace('_SPOT', '');
      const symbol = `${base}/${quote}`;

      const t = ticker as any;
      const last = parseFloat(t.last_price);
      const bid = parseFloat(t.bid);
      const ask = parseFloat(t.ask);
      const quoteVolume = parseFloat(t.quote_volume || '0');

      if (!bid || !ask || !last || quoteVolume < MIN_SPOT_VOLUME_USD) continue;

      results.push({
        exchange: 'vertex',
        symbol,
        bid,
        ask,
        last,
        volume24h: quoteVolume,
        bidVolume: 0, // Not available in ticker summary
        askVolume: 0,
        timestamp: Date.now(),
      });
    }

    return results;
  } catch (err) {
    console.warn('[SpotService] Vertex fetch failed:', (err as Error).message);
    return [];
  }
}

// === Exchange Instance Pool for Spot ===

const spotInstances = new Map<string, Exchange>();

function getSpotInstance(exchangeId: string): Exchange {
  const spotCcxtId = SPOT_CCXT_MAP[exchangeId] || exchangeId;
  let instance = spotInstances.get(spotCcxtId);

  if (!instance) {
    const ExchangeClass = (ccxt as unknown as Record<string, new (opts?: object) => Exchange>)[spotCcxtId];
    if (!ExchangeClass) throw new Error(`Exchange "${spotCcxtId}" not found in CCXT`);

    const options: Record<string, unknown> = {
      enableRateLimit: true,
      timeout: 30_000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      options: {
        defaultType: 'spot',
      },
    };

    // Exchange-specific overrides
    switch (spotCcxtId) {
      case 'bitmart':
        // BitMart requires access_token for some endpoints — use public only
        (options.options as Record<string, unknown>)['fetchCurrencies'] = false;
        break;
      case 'phemex':
        // Phemex spot market uses non-standard API path
        (options.options as Record<string, unknown>)['defaultType'] = 'spot';
        break;
      case 'lighter':
        // Lighter defaults to swap, force spot
        (options.options as Record<string, unknown>)['defaultType'] = 'spot';
        break;
    }

    instance = new ExchangeClass(options);

    // Hard-disable fetchCurrencies for known-problematic exchanges
    if (SPOT_NO_CURRENCIES.includes(spotCcxtId) || SPOT_NO_CURRENCIES.includes(exchangeId)) {
      instance.has['fetchCurrencies'] = false;
    }

    spotInstances.set(spotCcxtId, instance);
  }
  return instance;
}

// === Fetch Currencies (Networks) ===

export async function fetchSpotCurrencies(): Promise<Record<ExchangeId, Record<string, NetworkInfo[]>>> {
  const results: Record<string, Record<string, NetworkInfo[]>> = {};

  const tasks = SPOT_EXCHANGES.map(async (exchangeId) => {
    // Skip exchanges known to not support fetchCurrencies
    if (SPOT_NO_CURRENCIES.includes(exchangeId)) return;

    try {
      const exchange = getSpotInstance(exchangeId);
      if (!exchange.has['fetchCurrencies']) return;

      const currencies = await exchange.fetchCurrencies();
      const exNetworks: Record<string, NetworkInfo[]> = {};

      for (const [code, currency] of Object.entries(currencies)) {
        if (!currency || !currency.networks) continue;
        const networks: NetworkInfo[] = [];

        for (const [, netData] of Object.entries(currency.networks)) {
          if (!netData) continue;
          const net = netData as Record<string, unknown>;
          const netId = (net.id as string) || (net.network as string) || '';
          if (!netId) continue;

          networks.push({
            network:        netId,
            depositEnable:  (net.deposit as boolean) ?? (currency.deposit as boolean) ?? false,
            withdrawEnable: (net.withdraw as boolean) ?? (currency.withdraw as boolean) ?? false,
            withdrawFee:    (net.fee as number) ?? (currency.fee as number) ?? 0,
          });
        }

        if (networks.length > 0) {
          exNetworks[code] = networks;
        }
      }

      results[exchangeId] = exNetworks;
      console.log(`[SpotService] ${exchangeId}: fetched ${Object.keys(exNetworks).length} currencies`);
    } catch (err) {
      console.warn(
        `[SpotService] fetchCurrencies skipped for ${exchangeId}:`,
        (err as Error).message?.slice(0, 80)
      );
    }
  });

  await Promise.allSettled(tasks);
  const successCount = Object.keys(results).length;
  console.log(`[SpotService] Currencies available from ${successCount}/${SPOT_EXCHANGES.length} exchanges`);
  return results as Record<ExchangeId, Record<string, NetworkInfo[]>>;
}

// === Fetch Spot Tickers ===

export async function fetchSpotTickers(
  currencies?: Record<ExchangeId, Record<string, NetworkInfo[]>>
): Promise<TickerData[]> {
  const results: TickerData[] = [];
  const start = Date.now();
  const exchangeStats: Record<string, number> = {};

  const tasks = SPOT_EXCHANGES.map(async (exchangeId) => {
    try {
      const exchange = getSpotInstance(exchangeId);
      let tickers: Record<string, unknown> = {};
      let bidsAsks: Record<string, unknown> = {};

      // Fetch all tickers (always)
      try {
        tickers = await exchange.fetchTickers();
      } catch (err) {
        console.warn(`[SpotService] ${exchangeId}: fetchTickers failed — ${(err as Error).message?.slice(0, 60)}`);
        return;
      }

      // Merge bid/ask data where supported (improves depth accuracy)
      const noBidsAsks = SPOT_NO_BIDS_ASKS.includes(exchangeId);
      if (!noBidsAsks && exchange.has['fetchBidsAsks']) {
        try {
          bidsAsks = await exchange.fetchBidsAsks() as Record<string, unknown>;
        } catch {
          // Non-critical — ticker bid/ask will be used as fallback
        }
      }

      // Special handling for Lighter: it doesn't have bid/ask in tickers
      if (exchangeId === 'lighter') {
        const lighterSymbols = Object.keys(tickers).filter(s => s.includes('/USDC') && !s.includes(':'));
        const obTasks = lighterSymbols.map(async (sym) => {
          try {
            const ob = await exchange.fetchOrderBook(sym, 5);
            bidsAsks[sym] = {
              bid: ob.bids[0]?.[0],
              ask: ob.asks[0]?.[0],
              bidVolume: ob.bids[0]?.[1],
              askVolume: ob.asks[0]?.[1],
              timestamp: ob.timestamp,
            };
          } catch { /* skip failed pair */ }
        });
        await Promise.allSettled(obTasks);
      }

      let addedCount = 0;

      for (const [symbol, ticker] of Object.entries(tickers)) {
        // Only USDT and USDC spot pairs
        if (!symbol.includes('/USDT') && !symbol.includes('/USDC')) continue;
        // Skip futures/swap symbols (they contain ':')
        if (symbol.includes(':')) continue;

        const t = ticker as Record<string, number | string | undefined>;
        const book = (bidsAsks[symbol] || {}) as Record<string, number | undefined>;

        // Prefer order book data for bid/ask, fall back to ticker
        const bid  = (book.bid  as number | undefined) ?? (t.bid  as number | undefined);
        const ask  = (book.ask  as number | undefined) ?? (t.ask  as number | undefined);
        const last = (t.last   as number | undefined)  ?? (book.last as number | undefined);

        // Must have price data
        if (!bid || !ask || !last) continue;
        if (bid <= 0 || ask <= 0 || last <= 0) continue;
        // Skip invalid spreads (crossed book is exchange data error)
        if (bid > ask * 1.01) continue;

        const bidVolume  = (book.bidVolume  as number | undefined) ?? (t.bidVolume  as number | undefined) ?? 0;
        const askVolume  = (book.askVolume  as number | undefined) ?? (t.askVolume  as number | undefined) ?? 0;
        
        // FIX: CCXT often returns quoteVolume=undefined but baseVolume exists.
        // baseVolume is in tokens, so we multiply by last price to get USD.
        let quoteVolume = (t.quoteVolume as number | undefined) ?? (t.baseVolume as number | undefined) ?? 0;
        if ((!t.quoteVolume || t.quoteVolume === 0) && (t.baseVolume && (t.baseVolume as number) > 0)) {
          quoteVolume = (t.baseVolume as number) * last;
        }

        // Filter out ultra-low volume pairs (genuine noise)
        if (quoteVolume < MIN_SPOT_VOLUME_USD) continue;

        // Enrich with deposit/withdraw status if available
        const baseAsset = symbol.split('/')[0];
        const exNets = currencies?.[exchangeId as ExchangeId]?.[baseAsset] || [];
        const depositOpen = exNets.length > 0 ? exNets.some(n => n.depositEnable) : undefined;
        const withdrawOpen = exNets.length > 0 ? exNets.some(n => n.withdrawEnable) : undefined;

        results.push({
          exchange:  exchangeId as ExchangeId,
          symbol,
          bid,
          ask,
          last,
          volume24h:  quoteVolume,
          bidVolume,
          askVolume,
          timestamp: (t.timestamp as number) ?? (book.timestamp as number) ?? Date.now(),
          depositOpen,
          withdrawOpen,
        });
        addedCount++;
      }

      exchangeStats[exchangeId] = addedCount;
      console.log(
        `[SpotService] ${exchangeId}: ${addedCount} spot tickers (${Object.keys(tickers).length} raw, bidsAsks=${!noBidsAsks})`
      );
    } catch (err) {
      console.error(`[SpotService] ${exchangeId} failed:`, (err as Error).message?.slice(0, 100));
      exchangeStats[exchangeId] = 0;
    }
  });

  await Promise.allSettled(tasks);

  // 4. Fetch native DEXs (Vertex)
  if (SPOT_EXCHANGES.includes('vertex')) {
    console.log('[SpotService] Fetching Vertex native tickers...');
    const vertexTickers = await fetchVertexTickers();
    results.push(...vertexTickers);
    exchangeStats['vertex'] = vertexTickers.length;
    console.log(`[SpotService] vertex: ${vertexTickers.length} spot tickers (native)`);
  }

  const totalExchanges = Object.keys(exchangeStats).length;
  const activeExchanges = Object.values(exchangeStats).filter(n => n > 0).length;
  console.log(
    `[SpotService] Total: ${results.length} spot tickers from ${activeExchanges}/${totalExchanges} exchanges — ${Date.now() - start}ms`
  );

  return results;
}
