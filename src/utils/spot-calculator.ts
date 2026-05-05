/**
 * Spot Arbitrage Calculator — Three-tier confidence model
 *
 * Calculates cross-exchange spot arbitrage opportunities with
 * a progressive confidence system:
 *
 *   🟢 VERIFIED — Both exchanges provided network data via fetchCurrencies.
 *                 Real withdrawal fee, matched network route.
 *   🟡 ESTIMATED — Network data missing for ≥1 exchange.
 *                  Uses FALLBACK_WITHDRAW_FEES for a realistic estimate.
 *   🔴 RAW — No fee data at all, only price difference shown.
 *            Used only as a last resort for exotic tokens.
 *
 * KEY FIX: Most exchanges do NOT return bidVolume/askVolume in fetchTickers().
 * Previously this caused maxQuantity=0 → ALL pairs dropped. Now we estimate
 * executable depth from volume24h when direct depth data is unavailable.
 */
import type { TickerData, SpotSpreadEntry, SpotConfidence, NetworkInfo, ExchangeId } from '@/types';
import { normalizeSymbol } from '@/utils/crypto';
import {
  SPOT_TAKER_FEES,
  FALLBACK_WITHDRAW_FEES,
  DEFAULT_FALLBACK_WITHDRAW_FEE_USD,
  MIN_SPOT_SPREAD_PCT,
  MAX_SPOT_SPREAD_PCT,
  HOT_SPREAD_THRESHOLD,
  WARM_SPREAD_THRESHOLD,
  DEPTH_ESTIMATE_FACTOR,
  MIN_EXECUTABLE_USD,
} from '@/config/spot-config';

// Re-export for components that import from here
export { HOT_SPREAD_THRESHOLD, WARM_SPREAD_THRESHOLD };

// === Normalized ticker with computed fields ===
interface NormTicker extends TickerData {
  normPrice: number;
  normBid: number;
  normAsk: number;
  normBidVolume: number;
  normAskVolume: number;
  baseAsset: string;
}

// === Main calculation entry point ===

export function calculateSpotSpreads(
  tickers: TickerData[],
  currencies: Record<ExchangeId, Record<string, NetworkInfo[]>> | null
): SpotSpreadEntry[] {
  const spreads: SpotSpreadEntry[] = [];

  // 1. Group tickers by normalized symbol
  const bySymbol = new Map<string, NormTicker[]>();

  for (const t of tickers) {
    const { normalizedSymbol, multiplier, baseAsset: asset } = normalizeSymbol(t.symbol);
    const group = bySymbol.get(normalizedSymbol) ?? [];

    group.push({
      ...t,
      normPrice: t.last / multiplier,
      normBid: t.bid / multiplier,
      normAsk: t.ask / multiplier,
      // Normalize bid/ask volumes by multiplier (e.g., 1000PEPE → per-PEPE)
      normBidVolume: t.bidVolume * multiplier,
      normAskVolume: t.askVolume * multiplier,
      baseAsset: asset,
    });

    bySymbol.set(normalizedSymbol, group);
  }

  const currencyData = currencies ?? {} as Record<ExchangeId, Record<string, NetworkInfo[]>>;

  // 2. For each symbol, evaluate all cross-exchange pairs
  for (const [normSymbol, symbolTickers] of bySymbol) {
    if (symbolTickers.length < 2) continue;

    for (let i = 0; i < symbolTickers.length; i++) {
      for (let j = i + 1; j < symbolTickers.length; j++) {
        // Evaluate both directions
        evaluateDirection(symbolTickers[i], symbolTickers[j], normSymbol, currencyData, spreads);
        evaluateDirection(symbolTickers[j], symbolTickers[i], normSymbol, currencyData, spreads);
      }
    }
  }

  // 3. Sort by net spread descending
  return spreads.sort((a, b) => b.netSpreadPercent - a.netSpreadPercent);
}

// === Direction evaluator with three-tier confidence ===

function evaluateDirection(
  buyTick: NormTicker,
  sellTick: NormTicker,
  normSymbol: string,
  currencies: Record<ExchangeId, Record<string, NetworkInfo[]>>,
  spreads: SpotSpreadEntry[]
): void {
  // Basic price check: sell bid must be higher than buy ask
  if (sellTick.normBid <= buyTick.normAsk) return;

  const spreadAbs = sellTick.normBid - buyTick.normAsk;
  const spreadPct = (spreadAbs / buyTick.normAsk) * 100;

  // Sanity: skip if spread is below minimum (noise)
  if (spreadPct < MIN_SPOT_SPREAD_PCT) return;

  // Sanity: skip impossibly large spreads (usually different contract / stale data).
  // Use a per-exchange relaxed cap for known high-noise markets (mexc, gate, bitmart, xt).
  const highNoiseExchanges = new Set(['mexc', 'gate', 'bitmart', 'xt']);
  const cap = (highNoiseExchanges.has(buyTick.exchange) || highNoiseExchanges.has(sellTick.exchange))
    ? MAX_SPOT_SPREAD_PCT        // 8% — these can have genuine large dislocations
    : MAX_SPOT_SPREAD_PCT * 0.7; // 5.6% for premium exchanges

  if (spreadPct > cap) return;

  // === CRITICAL FIX: Depth Estimation ===
  // Most exchanges return bidVolume/askVolume = 0 in fetchTickers().
  // Estimate executable depth as DEPTH_ESTIMATE_FACTOR of daily volume.
  const buyVolumeUsd  = buyTick.normAskVolume > 0
    ? buyTick.normAskVolume * buyTick.normAsk     // Real order book depth in USD
    : buyTick.volume24h * DEPTH_ESTIMATE_FACTOR;  // Estimated: 0.5% of daily turnover

  const sellVolumeUsd = sellTick.normBidVolume > 0
    ? sellTick.normBidVolume * sellTick.normBid
    : sellTick.volume24h * DEPTH_ESTIMATE_FACTOR;

  // Executable depth = smaller of the two sides, in USD
  const executableUsd = Math.min(buyVolumeUsd, sellVolumeUsd);

  // Skip if no meaningful volume (genuine thin market)
  if (executableUsd < MIN_EXECUTABLE_USD) return;

  // Convert back to token quantity for fee calculations
  const maxQuantity = executableUsd / buyTick.normAsk;
  const estimatedProfit = maxQuantity * spreadAbs;

  // Trading fees (spot taker fees, stored as % like 0.10)
  const buyFeeRate  = (SPOT_TAKER_FEES[buyTick.exchange]  ?? 0.10) / 100;
  const sellFeeRate = (SPOT_TAKER_FEES[sellTick.exchange] ?? 0.10) / 100;
  const tradingFeesUsd =
    (maxQuantity * buyTick.normAsk  * buyFeeRate) +
    (maxQuantity * sellTick.normBid * sellFeeRate);

  // === Determine withdrawal fee and confidence ===
  const { withdrawFeeUsd, confidence, withdrawNetwork } = resolveWithdrawFee(
    buyTick.exchange,
    sellTick.exchange,
    buyTick.baseAsset,
    buyTick.normAsk,
    currencies
  );

  // Net profit after all costs
  const netProfit = estimatedProfit - tradingFeesUsd - withdrawFeeUsd;

  // Net spread % (what you actually earn)
  const totalCostPct   = ((tradingFeesUsd + withdrawFeeUsd) / (maxQuantity * buyTick.normAsk)) * 100;
  const netSpreadPct   = spreadPct - totalCostPct;
  const profitPer1000  = (netSpreadPct / 100) * 1000;

  // Filter: only show opportunities with positive net spread
  if (netSpreadPct < 0) return;

  spreads.push({
    symbol:          normSymbol,
    buyExchange:     buyTick.exchange,
    sellExchange:    sellTick.exchange,
    buyPrice:        buyTick.normAsk,
    sellPrice:       sellTick.normBid,
    spreadPercent:   spreadPct,
    spreadAbsolute:  spreadAbs,
    volume24h:       Math.min(buyTick.volume24h, sellTick.volume24h),
    buyVolume:       buyVolumeUsd / buyTick.normAsk,
    sellVolume:      sellVolumeUsd / sellTick.normBid,
    maxQuantity,
    estimatedProfit,
    timestamp:       Date.now(),
    withdrawNetwork,
    depositNetwork:  withdrawNetwork,
    withdrawFeeUsd,
    netProfit,
    confidence,
    tradingFeesUsd,
    netSpreadPercent: netSpreadPct,
    profitPer1000,
  });
}

// === Withdrawal fee resolution ===

interface WithdrawResult {
  withdrawFeeUsd: number;
  confidence: SpotConfidence;
  withdrawNetwork?: string;
}

function resolveWithdrawFee(
  buyExchange: ExchangeId,
  sellExchange: ExchangeId,
  baseAsset: string,
  priceUsd: number,
  currencies: Record<ExchangeId, Record<string, NetworkInfo[]>>
): WithdrawResult {
  const buyExNets  = currencies[buyExchange]?.[baseAsset]  || [];
  const sellExNets = currencies[sellExchange]?.[baseAsset] || [];

  // === Tier 1: VERIFIED — Both exchanges have network data ===
  if (buyExNets.length > 0 && sellExNets.length > 0) {
    let bestNetwork: string | undefined;
    let minWithdrawFeeUsd = Infinity;

    for (const bNet of buyExNets) {
      if (!bNet.withdrawEnable) continue;

      const match = sellExNets.find(sNet =>
        sNet.depositEnable &&
        networksMatch(bNet.network, sNet.network)
      );

      if (match) {
        const feeUsd = bNet.withdrawFee * priceUsd;
        if (feeUsd < minWithdrawFeeUsd) {
          minWithdrawFeeUsd = feeUsd;
          bestNetwork = bNet.network;
        }
      }
    }

    if (bestNetwork && minWithdrawFeeUsd < Infinity) {
      return {
        withdrawFeeUsd: minWithdrawFeeUsd,
        confidence:     'verified',
        withdrawNetwork: bestNetwork,
      };
    }
  }

  // === Tier 2: ESTIMATED — Use fallback fee table ===
  const fallbackFeeTokens = FALLBACK_WITHDRAW_FEES[baseAsset];
  if (fallbackFeeTokens !== undefined) {
    const feeUsd = fallbackFeeTokens * priceUsd;
    return {
      withdrawFeeUsd:  feeUsd,
      confidence:      'estimated',
      withdrawNetwork: guessNetwork(baseAsset),
    };
  }

  // === Tier 3: RAW — Use conservative percentage-based estimate ===
  // ~0.3% of token price as fee estimate, capped between $0.5 and $10
  const estimatedFeeUsd = priceUsd * 0.003;
  const rawFee = Math.min(Math.max(estimatedFeeUsd, DEFAULT_FALLBACK_WITHDRAW_FEE_USD), 10.0);
  return {
    withdrawFeeUsd:  rawFee,
    confidence:      'raw',
    withdrawNetwork: undefined,
  };
}

// === Network name fuzzy matching ===
function networksMatch(a: string, b: string): boolean {
  const na = a.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const nb = b.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return na === nb || na.includes(nb) || nb.includes(na);
}

// === Guess common network for a token ===
function guessNetwork(asset: string): string {
  const NETWORK_MAP: Record<string, string> = {
    BTC:    'BTC',
    ETH:    'ERC20',
    SOL:    'SOL',
    XRP:    'XRP',
    ADA:    'ADA',
    DOGE:   'DOGE',
    DOT:    'DOT',
    AVAX:   'AVAXC',
    LINK:   'ERC20',
    NEAR:   'NEAR',
    SUI:    'SUI',
    APT:    'APT',
    ARB:    'ARBITRUM',
    OP:     'OPTIMISM',
    MATIC:  'POLYGON',
    POL:    'POLYGON',
    TON:    'TON',
    TRX:    'TRC20',
    USDT:   'TRC20',
    USDC:   'TRC20',
    LTC:    'LTC',
    ATOM:   'COSMOS',
    SEI:    'SEI',
    TIA:    'CELESTIA',
    INJ:    'INJECTIVE',
    PEPE:   'ERC20',
    WIF:    'SOL',
    NOT:    'TON',
    SHIB:   'ERC20',
    BONK:   'SOL',
    JUP:    'SOL',
    JTO:    'SOL',
    PYTH:   'SOL',
    FLOKI:  'BSC',
    CAKE:   'BSC',
    GMT:    'SOL',
    STX:    'STX',
    STRK:   'STARKNET',
    RENDER: 'SOL',
    ORDI:   'BTC',
    ICP:    'ICP',
  };
  return NETWORK_MAP[asset] || 'ERC20';
}
