/**
 * Spot Arbitrage Configuration
 *
 * Centralizes all spot-specific settings:
 * - Reliable exchanges for spot scanning
 * - Spot taker fees (higher than futures, typically 0.1%)
 * - Fallback withdrawal fees when fetchCurrencies is unavailable
 * - Thresholds for filtering noise
 */
import type { ExchangeId } from '@/types';

// === Exchanges reliable for spot arbitrage scanning ===

export const SPOT_EXCHANGES: ExchangeId[] = [
  'binance', 'bybit', 'okx', 'kucoin', 'gate', 'mexc',
  'bitget', 'htx', 'coinex',
];

// CCXT class IDs for spot mode (NOT futures classes like binanceusdm)
export const SPOT_CCXT_MAP: Record<string, string> = {
  binance: 'binance',
  bybit: 'bybit',
  okx: 'okx',
  kucoin: 'kucoin',
  gate: 'gateio',
  mexc: 'mexc',
  bitget: 'bitget',
  htx: 'htx',
  coinex: 'coinex',
};

// === Spot Taker Fees (%) — typically higher than futures ===

export const SPOT_TAKER_FEES: Record<string, number> = {
  binance: 0.10,
  bybit: 0.10,
  okx: 0.10,
  kucoin: 0.10,
  gate: 0.10,
  mexc: 0.10,  // MEXC zero maker, 0.1% taker for spot
  bitget: 0.10,
  htx: 0.20,
  coinex: 0.20,
};

// === Fallback Withdrawal Fees (in token units) ===
// Used when fetchCurrencies is unavailable.
// Based on average cheapest network (TRC20 for USDT, native for most L1s).

export const FALLBACK_WITHDRAW_FEES: Record<string, number> = {
  // Major L1s
  BTC: 0.0002,    // ~$14 at $70K
  ETH: 0.001,     // ~$3 at $3K
  SOL: 0.01,      // ~$1.5
  XRP: 0.25,      // ~$0.15
  ADA: 1.0,       // ~$0.5
  DOGE: 5.0,      // ~$0.5
  DOT: 0.1,       // ~$0.6
  AVAX: 0.01,     // ~$0.3
  LINK: 0.3,      // ~$4
  NEAR: 0.01,     // ~$0.05
  SUI: 0.03,      // ~$0.1
  APT: 0.01,      // ~$0.1
  SEI: 0.1,       // ~$0.05
  TIA: 0.01,      // ~$0.1
  INJ: 0.01,      // ~$0.2

  // L2s & Memes
  ARB: 0.1,       // ~$0.1
  OP: 0.1,        // ~$0.2
  MATIC: 0.1,     // ~$0.05
  POL: 0.1,
  PEPE: 500000,   // ~$5
  WIF: 0.1,       // ~$0.2
  SHIB: 100000,   // ~$2
  FLOKI: 10000,   // ~$1
  NOT: 1.0,       // ~$0.01
  TON: 0.01,      // ~$0.05

  // DeFi & Infrastructure
  RENDER: 0.5,    // ~$3
  FET: 1.0,       // ~$2
  TAO: 0.001,     // ~$0.5
  FIL: 0.001,     // ~$0.01
  GRT: 10,        // ~$2
  AAVE: 0.01,     // ~$2
  UNI: 0.5,       // ~$4
  MKR: 0.002,     // ~$3
  LDO: 1.0,       // ~$2
  CRV: 5.0,       // ~$3

  // Stablecoins (TRC20 route)
  USDT: 1.0,      // ~$1
  USDC: 1.0,      // ~$1

  // Others
  LTC: 0.001,     // ~$0.1
  TRX: 1.0,       // ~$0.15
  ETC: 0.01,      // ~$0.2
  ATOM: 0.01,     // ~$0.1
  ALGO: 0.01,     // ~$0.01
  XLM: 0.01,      // ~$0.001
  VET: 20,        // ~$0.5
  HBAR: 0.5,      // ~$0.1
  ICP: 0.0003,    // ~$0.003
};

// Default fallback when coin is not in the table above (conservative)
export const DEFAULT_FALLBACK_WITHDRAW_FEE_USD = 5.0;

// === Thresholds ===

/** Minimum 24h quote volume (USD) to consider a pair */
export const MIN_SPOT_VOLUME_USD = 50_000;

/** Minimum gross spread % to display (filters noise) */
export const MIN_SPOT_SPREAD_PCT = 0.05;

/** Spread above this is flagged as HOT */
export const HOT_SPREAD_THRESHOLD = 0.30;

/** Spread above this is flagged as WARM */
export const WARM_SPREAD_THRESHOLD = 0.15;

/** Top N symbols to scan (by combined volume across exchanges) */
export const SPOT_TOP_SYMBOLS = 200;

/** Cache TTL: max data age before forcing a re-fetch (ms) */
export const SPOT_CACHE_MAX_AGE_MS = 60_000;

/** Background refresh: trigger bg update after this (ms) */
export const SPOT_CACHE_BG_REFRESH_MS = 20_000;
