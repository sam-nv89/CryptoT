import type { ExchangeId, ExchangeInfo } from '@/types';

export const EXCHANGES: Record<ExchangeId, ExchangeInfo> = {
  binance: {
    id: 'binance',
    name: 'Binance',
    type: 'cex',
    logo: '/exchanges/binance.svg',
    color: '#F0B90B',
    enabled: true,
  },
  bybit: {
    id: 'bybit',
    name: 'Bybit',
    type: 'cex',
    logo: '/exchanges/bybit.svg',
    color: '#F7A600',
    enabled: true,
  },
  okx: {
    id: 'okx',
    name: 'OKX',
    type: 'cex',
    logo: '/exchanges/okx.svg',
    color: '#FFFFFF',
    enabled: true,
  },
  hyperliquid: {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    type: 'dex',
    logo: '/exchanges/hyperliquid.svg',
    color: '#6EE7B7',
    enabled: true,
  },
};

/**
 * Tracked trading pairs — major perp futures symbols.
 * Using CCXT unified symbol format: BASE/QUOTE:SETTLE
 */
export const TRACKED_SYMBOLS = [
  'BTC/USDT:USDT',
  'ETH/USDT:USDT',
  'SOL/USDT:USDT',
  'XRP/USDT:USDT',
  'DOGE/USDT:USDT',
  'ADA/USDT:USDT',
  'AVAX/USDT:USDT',
  'LINK/USDT:USDT',
  'DOT/USDT:USDT',
  'MATIC/USDT:USDT',
] as const;

/**
 * Display-friendly symbol format (without settlement token)
 */
export function formatSymbol(ccxtSymbol: string): string {
  return ccxtSymbol.replace(/\/USDT:USDT$/, '').replace(/\/USDT$/, '');
}

/**
 * Get base asset from CCXT symbol
 */
export function getBaseAsset(ccxtSymbol: string): string {
  return ccxtSymbol.split('/')[0];
}

/** Refresh intervals in milliseconds */
export const REFRESH_INTERVALS = {
  TICKERS: 5_000,       // 5s — price tickers
  FUNDING: 60_000,      // 60s — funding rates update less frequently
  WHALE: 30_000,        // 30s — whale transactions
  HISTORY: 300_000,     // 5min — historical data backfill
} as const;

/** CEX exchange IDs compatible with CCXT */
export const CCXT_EXCHANGE_IDS: Partial<Record<ExchangeId, string>> = {
  binance: 'binanceusdm',
  bybit: 'bybit',
  okx: 'okx',
};
