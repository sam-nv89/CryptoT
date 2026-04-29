import ccxt, { type Exchange } from 'ccxt';
import type { ExchangeId, TickerData, NetworkInfo, SpotSpreadEntry } from '@/types';
import { CCXT_EXCHANGE_IDS, FALLBACK_SYMBOLS } from '@/config/exchanges';
import { normalizeSymbol } from '@/utils/crypto';

// --- Spot-Specific CCXT Class Mapping ---
// We need the base classes for spot, not the futures-specific ones.
const SPOT_CCXT_IDS: Record<string, string> = {
  binance: 'binance',
  bybit: 'bybit',
  okx: 'okx',
  gate: 'gateio',
  bitget: 'bitget',
  kucoin: 'kucoin',
  mexc: 'mexc',
  htx: 'htx',
  phemex: 'phemex',
  bingx: 'bingx',
  coinex: 'coinex',
  poloniex: 'poloniex',
  xt: 'xt',
  bitmart: 'bitmart',
  ascendex: 'ascendex',
};

// --- Exchange Instance Pool for Spot ---
const spotInstances = new Map<string, Exchange>();

function getSpotInstance(exchangeId: string): Exchange {
  const spotCcxtId = SPOT_CCXT_IDS[exchangeId] || exchangeId;
  let instance = spotInstances.get(spotCcxtId);
  if (!instance) {
    const ExchangeClass = (ccxt as unknown as Record<string, new (opts?: object) => Exchange>)[spotCcxtId];
    if (!ExchangeClass) throw new Error(`Exchange "${spotCcxtId}" not found in CCXT`);
    
    const options: any = {
      enableRateLimit: true,
      timeout: 30_000,
      options: { defaultType: 'spot' },
    };

    if (spotCcxtId === 'okx') {
      options.options['fetchCurrencies'] = true;
    }

    instance = new ExchangeClass(options);
    spotInstances.set(spotCcxtId, instance);
  }
  return instance;
}

// --- Fetch Currencies (Networks) ---
export async function fetchSpotCurrencies(): Promise<Record<ExchangeId, Record<string, NetworkInfo[]>>> {
  const results: Record<string, Record<string, NetworkInfo[]>> = {};

  const tasks = Object.entries(CCXT_EXCHANGE_IDS).map(async ([exchangeId, ccxtId]) => {
    if (!ccxtId || exchangeId === 'hyperliquid') return;
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
    } catch (err) {
      console.warn(`[SpotService] fetchCurrencies failed for ${exchangeId}:`, (err as Error).message);
    }
  });

  await Promise.allSettled(tasks);
  return results as Record<ExchangeId, Record<string, NetworkInfo[]>>;
}

// --- Fetch Spot Tickers ---
export async function fetchSpotTickers(symbols: string[]): Promise<TickerData[]> {
  const results: TickerData[] = [];
  const symbolSet = new Set(symbols.length > 0 ? symbols : FALLBACK_SYMBOLS.map(s => s.replace(':USDT', '')));

  const tasks = Object.entries(CCXT_EXCHANGE_IDS).map(async ([exchangeId, ccxtId]) => {
    if (!ccxtId || exchangeId === 'hyperliquid') return; // HL is DEX perp mostly, though has spot, skipping for simplicity

    try {
      const exchange = getSpotInstance(exchangeId);
      let tickers: ccxt.Dictionary<ccxt.Ticker> = {};
      let bidsAsks: ccxt.Dictionary<ccxt.Ticker> = {};

      try {
        const [t, b] = await Promise.all([
          exchange.fetchTickers(),
          exchange.has['fetchBidsAsks'] ? exchange.fetchBidsAsks().catch(() => ({})) : Promise.resolve({})
        ]);
        tickers = t;
        bidsAsks = b as ccxt.Dictionary<ccxt.Ticker>;
      } catch {
        return; // Fallback skipped for brevity in spot
      }

      for (const [symbol, ticker] of Object.entries(tickers)) {
        // Unified symbols in CCXT for spot are usually BASE/QUOTE
        if (!symbol.includes('/USDT') && !symbol.includes('/USDC')) continue;
        
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
      console.error(`[SpotService] Ticker fetch failed for ${exchangeId}:`, (err as Error).message);
    }
  });

  await Promise.allSettled(tasks);
  return results;
}
