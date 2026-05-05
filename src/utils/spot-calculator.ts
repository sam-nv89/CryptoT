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
 * This replaces the previous calculator that silently dropped
 * all pairs without full network data (returning 0 results).
 */
import type { TickerData, SpotSpreadEntry, SpotConfidence, NetworkInfo, ExchangeId } from '@/types';
import { normalizeSymbol } from '@/utils/crypto';
import {
  SPOT_TAKER_FEES,
  FALLBACK_WITHDRAW_FEES,
  MIN_SPOT_SPREAD_PCT,
  HOT_SPREAD_THRESHOLD,
  WARM_SPREAD_THRESHOLD,
} from '@/config/spot-config';

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

  // 3. Sort by net profit descending
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

  // Sanity: skip impossible spreads (>5% is usually different contract/junk data)
  if (spreadPct >= 5 || spreadPct < MIN_SPOT_SPREAD_PCT) return;

  // Volume: use the smaller side's available depth
  const buyVolume = buyTick.normAskVolume;
  const sellVolume = sellTick.normBidVolume;
  const maxQuantity = Math.min(buyVolume, sellVolume);

  // Require at least $10 in executable volume
  if (maxQuantity * buyTick.normAsk < 10) return;

  const estimatedProfit = maxQuantity * spreadAbs;

  // Trading fees (spot taker fees, stored as % like 0.10)
  const buyFeeRate = (SPOT_TAKER_FEES[buyTick.exchange] ?? 0.10) / 100;
  const sellFeeRate = (SPOT_TAKER_FEES[sellTick.exchange] ?? 0.10) / 100;
  const tradingFeesUsd =
    (maxQuantity * buyTick.normAsk * buyFeeRate) +
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
  const totalCostPct = ((tradingFeesUsd + withdrawFeeUsd) / (maxQuantity * buyTick.normAsk)) * 100;
  const netSpreadPct = spreadPct - totalCostPct;

  // Profit per $1000 capital deployed
  const profitPer1000 = (netSpreadPct / 100) * 1000;

  // Filter: only show actionable opportunities
  if (confidence === 'raw') {
    // Raw: needs positive net spread AND at least 0.3% gross AND max 3% (avoid junk)
    if (spreadPct < 0.3 || spreadPct > 3.0 || netSpreadPct < 0) return;
  } else {
    // Verified/Estimated: only show net-positive opportunities
    if (netSpreadPct < 0) return;
  }

  spreads.push({
    symbol: normSymbol,
    buyExchange: buyTick.exchange,
    sellExchange: sellTick.exchange,
    buyPrice: buyTick.normAsk,
    sellPrice: sellTick.normBid,
    spreadPercent: spreadPct,
    spreadAbsolute: spreadAbs,
    volume24h: Math.min(buyTick.volume24h, sellTick.volume24h),
    buyVolume,
    sellVolume,
    maxQuantity,
    estimatedProfit,
    timestamp: Date.now(),
    withdrawNetwork,
    depositNetwork: withdrawNetwork,
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
  const buyExNets = currencies[buyExchange]?.[baseAsset] || [];
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
        confidence: 'verified',
        withdrawNetwork: bestNetwork,
      };
    }
  }

  // === Tier 2: ESTIMATED — Use fallback fee table ===
  const fallbackFeeTokens = FALLBACK_WITHDRAW_FEES[baseAsset];
  if (fallbackFeeTokens !== undefined) {
    const feeUsd = fallbackFeeTokens * priceUsd;
    return {
      withdrawFeeUsd: feeUsd,
      confidence: 'estimated',
      withdrawNetwork: guessNetwork(baseAsset),
    };
  }

  // === Tier 3: RAW — Use percentage-based estimate ===
  // For unknown tokens, estimate withdrawal fee as ~0.3% of trade value
  // This is more realistic than a flat USD amount for cheap tokens
  const estimatedFeeUsd = priceUsd * 0.003; // ~0.3% of token price as fee
  const minRawFee = Math.max(estimatedFeeUsd, 0.50); // At least $0.50
  const maxRawFee = Math.min(minRawFee, 10.0); // Cap at $10
  return {
    withdrawFeeUsd: maxRawFee,
    confidence: 'raw',
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
    BTC: 'BTC',
    ETH: 'ERC20',
    SOL: 'SOL',
    XRP: 'XRP',
    ADA: 'ADA',
    DOGE: 'DOGE',
    DOT: 'DOT',
    AVAX: 'AVAXC',
    LINK: 'ERC20',
    NEAR: 'NEAR',
    SUI: 'SUI',
    APT: 'APT',
    ARB: 'ARBITRUM',
    OP: 'OPTIMISM',
    MATIC: 'POLYGON',
    POL: 'POLYGON',
    TON: 'TON',
    TRX: 'TRC20',
    USDT: 'TRC20',
    USDC: 'TRC20',
    LTC: 'LTC',
    ATOM: 'COSMOS',
    SEI: 'SEI',
    TIA: 'CELESTIA',
    INJ: 'INJECTIVE',
    PEPE: 'ERC20',
    WIF: 'SOL',
    NOT: 'TON',
    SHIB: 'ERC20',
  };
  return NETWORK_MAP[asset] || 'Unknown';
}
