/**
 * Alert Engine — evaluates spreads against thresholds, tracks history,
 * and produces actionable arbitrage signals with net-profit estimates.
 *
 * Exchange fee schedule (maker/taker):
 *   Binance:     0.02% / 0.04%
 *   Bybit:       0.01% / 0.06%
 *   OKX:         0.02% / 0.05%
 *   Hyperliquid: 0.01% / 0.035%
 *
 * Net spread = gross_spread% − buy_fee% − sell_fee% − slippage_estimate%
 */
import type { SpreadEntry, ExchangeId } from '@/types';

// === Fee Configuration ===

export interface ExchangeFees {
  maker: number;
  taker: number;
}

/** Taker fees per exchange (in %). Taker because arb execution is market-order. */
export const EXCHANGE_FEES: Record<ExchangeId, ExchangeFees> = {
  binance:     { maker: 0.02, taker: 0.04 },
  bybit:       { maker: 0.01, taker: 0.06 },
  okx:         { maker: 0.02, taker: 0.05 },
  gate:        { maker: 0.015, taker: 0.05 },
  bitget:      { maker: 0.02, taker: 0.06 },
  kucoin:      { maker: 0.02, taker: 0.06 },
  mexc:        { maker: 0.00, taker: 0.04 },
  htx:         { maker: 0.02, taker: 0.05 },
  phemex:      { maker: 0.01, taker: 0.06 },
  bingx:       { maker: 0.02, taker: 0.05 },
  coinex:      { maker: 0.02, taker: 0.05 },
  hyperliquid: { maker: 0.01, taker: 0.035 },
};

/** Default slippage estimate per leg (%) */
const DEFAULT_SLIPPAGE = 0.01;

// === Alert Configuration ===

export interface AlertThresholds {
  /** Minimum gross spread % to trigger an alert */
  minGrossSpread: number;
  /** Minimum NET spread % (after fees) to show as profitable */
  minNetSpread: number;
  /** Minimum 24h volume (USD) on the thinner side */
  minVolume: number;
  /** Whether to play browser notification sound */
  soundEnabled: boolean;
  /** Whether to show browser push notifications */
  pushEnabled: boolean;
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  minGrossSpread: 0.05,
  minNetSpread: 0.0,
  minVolume: 100_000,
  soundEnabled: true,
  pushEnabled: false,
};

// === Alert Event Types ===

export interface ArbitrageSignal {
  id: string;
  symbol: string;
  buyExchange: ExchangeId;
  sellExchange: ExchangeId;
  buyPrice: number;
  sellPrice: number;
  grossSpreadPercent: number;
  grossSpreadAbsolute: number;
  buyFeePercent: number;
  sellFeePercent: number;
  slippagePercent: number;
  netSpreadPercent: number;
  netProfitPer1000: number; // Net $ profit per $1000 capital
  volume24h: number;
  tier: 'hot' | 'warm' | 'cold';
  timestamp: number;
  expiresAt: number;
}

// === Engine Logic ===

/** Classify a signal based on net spread magnitude */
function classifyTier(netSpread: number): ArbitrageSignal['tier'] {
  if (netSpread >= 0.15) return 'hot';
  if (netSpread >= 0.05) return 'warm';
  return 'cold';
}

/** Generate a unique ID for deduplication */
function signalId(symbol: string, buy: ExchangeId, sell: ExchangeId): string {
  return `${symbol}::${buy}->${sell}`;
}

/**
 * Evaluate a batch of spreads against thresholds and produce
 * enriched ArbitrageSignals with fee-adjusted net profits.
 */
export function evaluateSpreads(
  spreads: SpreadEntry[],
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): ArbitrageSignal[] {
  const signals: ArbitrageSignal[] = [];

  for (const s of spreads) {
    // Gross spread filter
    if (s.spreadPercent < thresholds.minGrossSpread) continue;

    // Volume filter
    if (s.volume24h < thresholds.minVolume) continue;

    // Calculate fees
    const buyFee = EXCHANGE_FEES[s.buyExchange]?.taker ?? 0.05;
    const sellFee = EXCHANGE_FEES[s.sellExchange]?.taker ?? 0.05;
    const totalFees = buyFee + sellFee;
    const slippage = DEFAULT_SLIPPAGE * 2; // Both legs

    const netSpread = s.spreadPercent - totalFees - slippage;

    // Net spread filter
    if (netSpread < thresholds.minNetSpread) continue;

    const netProfitPer1000 = (netSpread / 100) * 1000;

    signals.push({
      id: signalId(s.symbol, s.buyExchange, s.sellExchange),
      symbol: s.symbol,
      buyExchange: s.buyExchange,
      sellExchange: s.sellExchange,
      buyPrice: s.buyPrice,
      sellPrice: s.sellPrice,
      grossSpreadPercent: s.spreadPercent,
      grossSpreadAbsolute: s.spreadAbsolute,
      buyFeePercent: buyFee,
      sellFeePercent: sellFee,
      slippagePercent: slippage,
      netSpreadPercent: netSpread,
      netProfitPer1000: netProfitPer1000,
      volume24h: s.volume24h,
      tier: classifyTier(netSpread),
      timestamp: Date.now(),
      expiresAt: Date.now() + 60_000, // Signal valid for 60s
    });
  }

  return signals.sort((a, b) => b.netSpreadPercent - a.netSpreadPercent);
}

// === Signal History (in-memory ring buffer) ===

const MAX_HISTORY = 200;

class SignalHistory {
  private entries: ArbitrageSignal[] = [];

  push(signals: ArbitrageSignal[]): void {
    this.entries.unshift(...signals);
    if (this.entries.length > MAX_HISTORY) {
      this.entries = this.entries.slice(0, MAX_HISTORY);
    }
  }

  getAll(): ArbitrageSignal[] {
    return this.entries;
  }

  /** Return only signals from the last N milliseconds */
  getRecent(windowMs: number): ArbitrageSignal[] {
    const cutoff = Date.now() - windowMs;
    return this.entries.filter((s) => s.timestamp > cutoff);
  }

  /** Count unique signals in a time window */
  countUnique(windowMs: number): number {
    const cutoff = Date.now() - windowMs;
    const ids = new Set<string>();
    for (const s of this.entries) {
      if (s.timestamp > cutoff) ids.add(s.id);
    }
    return ids.size;
  }

  clear(): void {
    this.entries = [];
  }
}

// Singleton — survives hot-reloads
const globalForHistory = globalThis as unknown as { signalHistory: SignalHistory };
export const signalHistory =
  globalForHistory.signalHistory ?? new SignalHistory();
if (process.env.NODE_ENV !== 'production') {
  globalForHistory.signalHistory = signalHistory;
}
