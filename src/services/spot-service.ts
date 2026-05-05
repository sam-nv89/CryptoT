/**
 * Spot Exchange Service — fetches real-time spot tickers and currency/network data.
 *
 * Key differences from futures exchange-service.ts:
 * - Uses `defaultType: 'spot'` (not 'swap')
 * - Uses spot-specific CCXT class IDs (not binanceusdm, kucoinfutures)
 * - Only scans the 9 most reliable exchanges for spot
 * - Filters to USDT/USDC quote pairs only
 */
import ccxt, { type Exchange } from 'ccxt';
import type { ExchangeId, TickerData, NetworkInfo } from '@/types';
import { SPOT_CCXT_MAP, SPOT_EXCHANGES, MIN_SPOT_VOLUME_USD } from '@/config/spot-config';

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
      timeout: 25_000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      options: {
        defaultType: 'spot',
        fetchCurrencies: !['gate', 'bitmart', 'ascendex', 'mexc'].includes(exchangeId),
      },
    };

    // Exchange-specific tweaks
    if (spotCcxtId === 'gateio') {
      (options.options as Record<string, unknown>)['fetchCurrencies'] = false;
    }

    instance = new ExchangeClass(options);

    // Hard-disable problematic features
    if (['gateio', 'mexc'].includes(spotCcxtId)) {
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
    try {
      const exchange = getSpotInstance(exchangeId);
      if (!exchange.has['fetchCurrencies']) return;

      const currencies = await exchange.fetchCurrencies();
      const exNetworks: Record<string, NetworkInfo[]> = {};

      for (const [code, currency] of Object.entries(currencies)) {
        if (!currency || !currency.networks) continue;
        const networks: NetworkInfo[] = [];

        for (const [netCode, netData] of Object.entries(currency.networks)) {
          if (!netData) continue;
          networks.push({
            network: netCode,
            depositEnable: netData.deposit ?? currency.deposit ?? false,
            withdrawEnable: netData.withdraw ?? currency.withdraw ?? false,
            withdrawFee: netData.fee ?? currency.fee ?? 0,
          });
        }

        if (networks.length > 0) {
          exNetworks[code] = networks;
        }
      }
      results[exchangeId] = exNetworks;
      console.log(`[SpotService] ${exchangeId}: fetched ${Object.keys(exNetworks).length} currencies`);
    } catch (err) {
      console.warn(`[SpotService] fetchCurrencies skipped for ${exchangeId}:`, (err as Error).message?.slice(0, 80));
    }
  });

  await Promise.allSettled(tasks);
  const successCount = Object.keys(results).length;
  console.log(`[SpotService] Currencies available from ${successCount}/${SPOT_EXCHANGES.length} exchanges`);
  return results as Record<ExchangeId, Record<string, NetworkInfo[]>>;
}

// === Fetch Spot Tickers ===

export async function fetchSpotTickers(): Promise<TickerData[]> {
  const results: TickerData[] = [];
  const start = Date.now();

  const tasks = SPOT_EXCHANGES.map(async (exchangeId) => {
    try {
      const exchange = getSpotInstance(exchangeId);
      let tickers: Record<string, unknown> = {};
      let bidsAsks: Record<string, unknown> = {};

      try {
        const [t, b] = await Promise.all([
          exchange.fetchTickers(),
          exchange.has['fetchBidsAsks']
            ? exchange.fetchBidsAsks().catch(() => ({}))
            : Promise.resolve({}),
        ]);
        tickers = t;
        bidsAsks = b as Record<string, unknown>;
      } catch {
        console.warn(`[SpotService] ${exchangeId}: fetchTickers failed, skipping`);
        return;
      }

      let addedCount = 0;
      for (const [symbol, ticker] of Object.entries(tickers)) {
        // Only USDT and USDC spot pairs
        if (!symbol.includes('/USDT') && !symbol.includes('/USDC')) continue;
        // Skip futures/swap symbols that might leak through
        if (symbol.includes(':')) continue;

        const t = ticker as Record<string, number | undefined>;
        const book = (bidsAsks[symbol] || {}) as Record<string, number | undefined>;
        const bid = book.bid ?? t.bid;
        const ask = book.ask ?? t.ask;
        const last = t.last ?? book.last;
        const bidVolume = book.bidVolume ?? t.bidVolume ?? 0;
        const askVolume = book.askVolume ?? t.askVolume ?? 0;
        const quoteVolume = t.quoteVolume ?? t.baseVolume ?? 0;

        if (!bid || !ask || !last) continue;
        if (bid <= 0 || ask <= 0 || last <= 0) continue;

        // Filter out ultra-low volume pairs (noise)
        if (quoteVolume < MIN_SPOT_VOLUME_USD) continue;

        results.push({
          exchange: exchangeId as ExchangeId,
          symbol,
          bid,
          ask,
          last,
          volume24h: quoteVolume,
          bidVolume,
          askVolume,
          timestamp: (t.timestamp as number) ?? (book.timestamp as number) ?? Date.now(),
        });
        addedCount++;
      }

      console.log(`[SpotService] ${exchangeId}: ${addedCount} spot tickers (${Object.keys(tickers).length} total)`);
    } catch (err) {
      console.error(`[SpotService] ${exchangeId} failed:`, (err as Error).message?.slice(0, 100));
    }
  });

  await Promise.allSettled(tasks);
  console.log(`[SpotService] Total: ${results.length} spot tickers in ${Date.now() - start}ms`);
  return results;
}
