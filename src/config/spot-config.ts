/**
 * Spot Arbitrage Configuration
 *
 * Centralizes all spot-specific settings:
 * - Reliable exchanges for spot scanning (14 exchanges)
 * - Spot taker fees (higher than futures, typically 0.1%)
 * - Fallback withdrawal fees when fetchCurrencies is unavailable
 * - Thresholds for filtering noise
 */
import type { ExchangeId } from '@/types';

// === Exchanges reliable for spot arbitrage scanning ===
// Expanded from 9 → 14 to find significantly more spread opportunities

export const SPOT_EXCHANGES: ExchangeId[] = [
  'binance', 'bybit', 'okx', 'kucoin', 'gate', 'mexc',
  'bitget', 'htx', 'coinex', 'poloniex', 'xt', 'bitmart',
  'bingx', 'phemex', 'lighter', 'vertex',
];

// CCXT class IDs for spot mode (NOT futures classes like binanceusdm)
export const SPOT_CCXT_MAP: Record<string, string> = {
  binance:  'binance',
  bybit:    'bybit',
  okx:      'okx',
  kucoin:   'kucoin',
  gate:     'gateio',
  mexc:     'mexc',
  bitget:   'bitget',
  htx:      'htx',
  coinex:   'coinex',
  poloniex: 'poloniex',
  xt:       'xt',
  bitmart:  'bitmart',
  bingx:    'bingx',
  phemex:   'phemex',
  lighter:  'lighter',
};

// Exchanges that do NOT support fetchCurrencies (skip to avoid errors)
export const SPOT_NO_CURRENCIES: string[] = [
  'gate', 'mexc', 'bitmart', 'ascendex', 'poloniex', 'xt', 'bingx', 'phemex', 'lighter', 'vertex',
];

// Exchanges that do NOT support fetchBidsAsks (use ticker bid/ask instead)
export const SPOT_NO_BIDS_ASKS: string[] = [
  'poloniex', 'xt', 'bitmart', 'bingx', 'phemex', 'coinex', 'htx', 'lighter', 'vertex',
];

// === Spot Taker Fees (%) — typically higher than futures ===

export const SPOT_TAKER_FEES: Record<string, number> = {
  binance:  0.10,
  bybit:    0.10,
  okx:      0.10,
  kucoin:   0.10,
  gate:     0.10,
  mexc:     0.10,  // MEXC zero maker, 0.1% taker for spot
  bitget:   0.10,
  htx:      0.20,
  coinex:   0.20,
  poloniex: 0.14,
  xt:       0.20,
  bitmart:  0.25,
  bingx:    0.10,
  phemex:   0.10,
  lighter:  0.02, // Extremely low fees on Lighter
  vertex:   0.02, // Low fees on Vertex
};

// === Fallback Withdrawal Fees (in token units) ===
// Used when fetchCurrencies is unavailable.
// Based on average cheapest network (TRC20 for USDT, native for most L1s).

export const FALLBACK_WITHDRAW_FEES: Record<string, number> = {
  // Major L1s
  BTC:   0.0002,   // ~$14 at $70K
  ETH:   0.001,    // ~$3 at $3K
  SOL:   0.01,     // ~$1.5
  XRP:   0.25,     // ~$0.15
  ADA:   1.0,      // ~$0.5
  DOGE:  5.0,      // ~$0.5
  DOT:   0.1,      // ~$0.6
  AVAX:  0.01,     // ~$0.3
  LINK:  0.3,      // ~$4
  NEAR:  0.01,     // ~$0.05
  SUI:   0.03,     // ~$0.1
  APT:   0.01,     // ~$0.1
  SEI:   0.1,      // ~$0.05
  TIA:   0.01,     // ~$0.1
  INJ:   0.01,     // ~$0.2
  KAS:   10.0,     // ~$0.1
  ICP:   0.0003,   // ~$0.003

  // L2s & Ecosystem
  ARB:   0.1,      // ~$0.1
  OP:    0.1,      // ~$0.2
  MATIC: 0.1,      // ~$0.05
  POL:   0.1,
  STX:   0.1,      // ~$0.1
  STRK:  0.1,      // Starknet
  ZK:    1.0,      // ~$0.1
  ONDO:  0.5,
  W:     1.0,      // Wormhole

  // Memes
  PEPE:    500_000, // ~$5
  WIF:     0.1,    // ~$0.2
  SHIB:    100_000, // ~$2
  FLOKI:   10_000, // ~$1
  NOT:     1.0,    // ~$0.01
  BONK:    100_000, // ~$0.3
  POPCAT:  1.0,    // ~$0.5
  MEW:     50.0,   // ~$0.5
  NEIRO:   50.0,
  TURBO:   5000.0,
  MOG:     100_000.0,

  // DeFi & Infrastructure
  RENDER:  0.5,    // ~$3
  FET:     1.0,    // ~$2
  TAO:     0.001,  // ~$0.5
  FIL:     0.001,  // ~$0.01
  GRT:     10,     // ~$2
  AAVE:    0.01,   // ~$2
  UNI:     0.5,    // ~$4
  MKR:     0.002,  // ~$3
  LDO:     1.0,    // ~$2
  CRV:     5.0,    // ~$3
  JTO:     0.5,    // Jito
  JUP:     1.0,    // Jupiter
  PYTH:    5.0,    // Pyth
  TNSR:    1.0,
  EIGEN:   0.5,
  ENA:     5.0,    // Ethena
  PENDLE:  1.0,
  LISTA:   5.0,
  PORTAL:  2.0,
  OMNI:    0.5,
  REZ:     10.0,
  BOME:    50.0,
  ORDI:    0.001,  // ~$0.05
  SATS:    5000.0,
  RATS:    500.0,

  // Stablecoins (TRC20 route)
  USDT:    1.0,    // ~$1
  USDC:    1.0,    // ~$1
  FDUSD:   1.0,

  // Others
  LTC:   0.001,    // ~$0.1
  TRX:   1.0,      // ~$0.15
  ETC:   0.01,     // ~$0.2
  ATOM:  0.01,     // ~$0.1
  ALGO:  0.01,     // ~$0.01
  XLM:   0.01,     // ~$0.001
  VET:   20,       // ~$0.5
  HBAR:  0.5,      // ~$0.1
  TON:   0.01,     // ~$0.05
  CAKE:  0.1,      // ~$0.3
  GMT:   2.0,
  MANA:  10.0,
  SAND:  10.0,
  AXS:   0.5,
  CHZ:   10.0,
  FLOW:  0.01,
  IMX:   0.5,
  GALA:  100.0,
  HOT:   100.0,
};

// Default fallback when coin is not in the table above (conservative)
export const DEFAULT_FALLBACK_WITHDRAW_FEE_USD = 3.0;

// === Thresholds ===

/** Minimum 24h quote volume (USD) to consider a pair — lowered for altcoins */
export const MIN_SPOT_VOLUME_USD = 10_000;

/**
 * Minimum gross spread % to display (filters noise).
 * Kept low — let the net-spread filter do the real work.
 */
export const MIN_SPOT_SPREAD_PCT = 0.03;

/**
 * Maximum gross spread % for sanity check.
 * Raised to 20% to catch real meme/altcoin dislocations.
 */
export const MAX_SPOT_SPREAD_PCT = 20.0;

/** Spread above this is flagged as HOT */
export const HOT_SPREAD_THRESHOLD = 0.30;

/** Spread above this is flagged as WARM */
export const WARM_SPREAD_THRESHOLD = 0.10;

/** Top N symbols to scan (by combined volume across exchanges) */
export const SPOT_TOP_SYMBOLS = 500;

/** Cache TTL: max data age before forcing a re-fetch (ms) */
export const SPOT_CACHE_MAX_AGE_MS = 60_000;

/** Background refresh: trigger bg update after this (ms) */
export const SPOT_CACHE_BG_REFRESH_MS = 25_000;

/**
 * Depth estimation factor.
 * When bid/ask volume is 0, estimate executable depth as
 * (volume24h * factor / price) tokens.
 * 0.5% of daily turnover is typically available at top-of-book.
 */
export const DEPTH_ESTIMATE_FACTOR = 0.005;

/** Minimum USD executable volume to show a spread (after depth estimation) */
export const MIN_EXECUTABLE_USD = 10;

/** Maximum number of spreads to show per unique symbol (prevents one coin from dominating) */
export const MAX_SPREADS_PER_SYMBOL = 5;

/** Minimum net spread % for RAW signals (allow slightly negative to show potential) */
export const NET_SPREAD_RAW_MIN = -0.15;
