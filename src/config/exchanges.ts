import type { ExchangeId, ExchangeInfo } from '@/types';

export const EXCHANGES: Record<ExchangeId, ExchangeInfo> = {
  binance: {
    id: 'binance', name: 'Binance', type: 'cex',
    logo: '/exchanges/binance.svg', color: '#F0B90B', enabled: true,
  },
  bybit: {
    id: 'bybit', name: 'Bybit', type: 'cex',
    logo: '/exchanges/bybit.svg', color: '#F7A600', enabled: true,
  },
  okx: {
    id: 'okx', name: 'OKX', type: 'cex',
    logo: '/exchanges/okx.svg', color: '#FFFFFF', enabled: true,
  },
  gate: {
    id: 'gate', name: 'Gate.io', type: 'cex',
    logo: '/exchanges/gate.svg', color: '#2354E6', enabled: true,
  },
  bitget: {
    id: 'bitget', name: 'Bitget', type: 'cex',
    logo: '/exchanges/bitget.svg', color: '#00F0FF', enabled: true,
  },
  kucoin: {
    id: 'kucoin', name: 'KuCoin', type: 'cex',
    logo: '/exchanges/kucoin.svg', color: '#23AF91', enabled: true,
  },
  mexc: {
    id: 'mexc', name: 'MEXC', type: 'cex',
    logo: '/exchanges/mexc.svg', color: '#2EBD85', enabled: true,
  },
  htx: {
    id: 'htx', name: 'HTX', type: 'cex',
    logo: '/exchanges/htx.svg', color: '#2B6DED', enabled: true,
  },
  phemex: {
    id: 'phemex', name: 'Phemex', type: 'cex',
    logo: '/exchanges/phemex.svg', color: '#C8F030', enabled: true,
  },
  bingx: {
    id: 'bingx', name: 'BingX', type: 'cex',
    logo: '/exchanges/bingx.svg', color: '#2D6FF7', enabled: true,
  },
  coinex: {
    id: 'coinex', name: 'CoinEx', type: 'cex',
    logo: '/exchanges/coinex.svg', color: '#3FCC8C', enabled: true,
  },
  hyperliquid: {
    id: 'hyperliquid', name: 'Hyperliquid', type: 'dex',
    logo: '/exchanges/hyperliquid.svg', color: '#6EE7B7', enabled: true,
  },
  dydx: {
    id: 'dydx', name: 'dYdX', type: 'dex',
    logo: '/exchanges/dydx.svg', color: '#6966FF', enabled: true,
  },
  apex: {
    id: 'apex', name: 'ApeX', type: 'dex',
    logo: '/exchanges/apex.svg', color: '#000000', enabled: true,
  },
  poloniex: {
    id: 'poloniex', name: 'Poloniex', type: 'cex',
    logo: '/exchanges/poloniex.svg', color: '#00C2A1', enabled: true,
  },
  xt: {
    id: 'xt', name: 'XT.com', type: 'cex',
    logo: '/exchanges/xt.svg', color: '#F0B90B', enabled: true,
  },
  bitmart: {
    id: 'bitmart', name: 'BitMart', type: 'cex',
    logo: '/exchanges/bitmart.svg', color: '#00BBFF', enabled: true,
  },
  ascendex: {
    id: 'ascendex', name: 'AscendEX', type: 'cex',
    logo: '/exchanges/ascendex.svg', color: '#1B2C5B', enabled: true,
  },
};

/** CEX exchange IDs mapped to CCXT class names */
export const CCXT_EXCHANGE_IDS: Partial<Record<ExchangeId, string>> = {
  binance: 'binanceusdm',
  bybit: 'bybit',
  okx: 'okx',
  gate: 'gate',
  bitget: 'bitget',
  kucoin: 'kucoinfutures',
  mexc: 'mexc',
  htx: 'htx',
  phemex: 'phemex',
  bingx: 'bingx',
  coinex: 'coinex',
  dydx: 'dydx',
  apex: 'apex',
  poloniex: 'poloniex',
  xt: 'xt',
  bitmart: 'bitmart',
  ascendex: 'ascendex',
};

/** Display-friendly symbol format (without settlement token) */
export function formatSymbol(ccxtSymbol: string): string {
  return ccxtSymbol
    .split(':')[0] // Remove settlement token
    .replace(/\/USDT$/, '')
    .replace(/\/USDC$/, '')
    .replace(/-USDT$/, '')
    .replace(/-USDC$/, '');
}

/** Get base asset from CCXT symbol */
export function getBaseAsset(ccxtSymbol: string): string {
  return ccxtSymbol.split('/')[0];
}

/** Refresh intervals in milliseconds */
export const REFRESH_INTERVALS = {
  TICKERS: 5_000,
  FUNDING: 60_000,
  WHALE: 30_000,
  HISTORY: 300_000,
} as const;

/**
 * Fallback symbols used when dynamic discovery hasn't run yet.
 * Once /api/discover is called, the system switches to dynamically
 * discovered symbols (all coins common to 2+ exchanges).
 */
export const FALLBACK_SYMBOLS = [
  'BTC/USDT:USDT', 'ETH/USDT:USDT', 'SOL/USDT:USDT', 'XRP/USDT:USDT',
  'DOGE/USDT:USDT', 'ADA/USDT:USDT', 'AVAX/USDT:USDT', 'LINK/USDT:USDT',
  'DOT/USDT:USDT', 'MATIC/USDT:USDT', 'SUI/USDT:USDT', 'ARB/USDT:USDT',
  'OP/USDT:USDT', 'APT/USDT:USDT', 'NEAR/USDT:USDT', 'WIF/USDT:USDT',
  'PEPE/USDT:USDT', 'FET/USDT:USDT', 'RENDER/USDT:USDT', 'INJ/USDT:USDT',
  'TON/USDT:USDT', 'NOT/USDT:USDT', 'TIA/USDT:USDT', 'SEI/USDT:USDT',
  'POKT/USDT:USDT', // Added for user requested example
  // USDC markets (dYdX, Hyperliquid, OKX)

  'BTC/USDC:USDC', 'ETH/USDC:USDC', 'SOL/USDC:USDC',
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'DOT/USDT', 'MATIC/USDT', 'SHIB/USDT', 'LTC/USDT', 'AVAX/USDT', 'LINK/USDT', 'TRX/USDT', 'NEAR/USDT', 'APT/USDT', 'OP/USDT', 'ARB/USDT', 'TIA/USDT', 'INJ/USDT', 'SEI/USDT', 'SUI/USDT', 'PEPE/USDT', 'ORDI/USDT'
] as const;
