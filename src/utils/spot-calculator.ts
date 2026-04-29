import type { TickerData, SpotSpreadEntry, NetworkInfo, ExchangeId } from '@/types';
import { normalizeSymbol } from '@/utils/crypto';
import { EXCHANGE_FEES } from '@/services/alert-engine';

export function calculateSpotSpreads(
  tickers: TickerData[],
  currencies: Record<ExchangeId, Record<string, NetworkInfo[]>>
): SpotSpreadEntry[] {
  const spreads: SpotSpreadEntry[] = [];
  const bySymbol = new Map<string, (TickerData & { normPrice: number; normBid: number; normAsk: number; normBidVolume: number; normAskVolume: number; baseAsset: string })[]>();
  
  console.log(`[SpotCalc] Processing ${tickers.length} tickers across ${currencies ? Object.keys(currencies).length : 0} exchanges with currency info`);
  
  for (const t of tickers) {
    const { normalizedSymbol, multiplier, asset } = normalizeSymbol(t.symbol);
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

  for (const [normSymbol, symbolTickers] of bySymbol) {
    if (symbolTickers.length < 2) continue;

    for (let i = 0; i < symbolTickers.length; i++) {
      for (let j = i + 1; j < symbolTickers.length; j++) {
        const a = symbolTickers[i];
        const b = symbolTickers[j];

        // Evaluate both directions
        evaluateSpotDirection(a, b, normSymbol, currencies, spreads);
        evaluateSpotDirection(b, a, normSymbol, currencies, spreads);
      }
    }
  }

  return spreads.sort((a, b) => b.netProfit - a.netProfit);
}

function evaluateSpotDirection(
  buyTick: TickerData & { normPrice: number; normBid: number; normAsk: number; normBidVolume: number; normAskVolume: number; baseAsset: string },
  sellTick: TickerData & { normPrice: number; normBid: number; normAsk: number; normBidVolume: number; normAskVolume: number; baseAsset: string },
  normSymbol: string,
  currencies: Record<ExchangeId, Record<string, NetworkInfo[]>>,
  spreads: SpotSpreadEntry[]
) {
  if (sellTick.normBid <= buyTick.normAsk) return;

  const spreadAbs = sellTick.normBid - buyTick.normAsk;
  const spreadPct = (spreadAbs / buyTick.normAsk) * 100;
  
  if (spreadPct >= 50 || spreadPct <= 0.01) return; // Relaxed for debug

  const buyVolume = buyTick.normAskVolume;
  const sellVolume = sellTick.normBidVolume;
  const maxQuantity = Math.min(buyVolume, sellVolume);
  
  if (maxQuantity * buyTick.normAsk < 10) return; // Min $10 volume (relaxed)

  const estimatedProfit = maxQuantity * spreadAbs;

  // Trading fees (EXCHANGE_FEES are in %, e.g. 0.04 = 0.04%, so divide by 100 for rate)
  // Spot fees are usually 0.1% (0.001), so if taker is 0.05, we treat it as 0.05%
  const buyFeeRate = (EXCHANGE_FEES[buyTick.exchange]?.taker ?? 0.1) / 100; 
  const sellFeeRate = (EXCHANGE_FEES[sellTick.exchange]?.taker ?? 0.1) / 100;
  const tradingFeesUsd = (maxQuantity * buyTick.normAsk * buyFeeRate) + (maxQuantity * sellTick.normBid * sellFeeRate);

  // Network Routing
  const baseAsset = buyTick.baseAsset;
  const buyExNets = currencies[buyTick.exchange]?.[baseAsset] || [];
  const sellExNets = currencies[sellTick.exchange]?.[baseAsset] || [];

  let bestNetwork: string | undefined;
  let minWithdrawFeeUsd = Infinity;

  // If we have API data for both
  if (buyExNets.length > 0 && sellExNets.length > 0) {
    // if (normSymbol === 'BTC') console.log(`[SpotCalc] Matching networks for ${normSymbol} on ${buyTick.exchange} (${buyExNets.length}) and ${sellTick.exchange} (${sellExNets.length})`);

    for (const bNet of buyExNets) {
      if (!bNet.withdrawEnable) continue;
      
      const match = sellExNets.find(sNet => 
        sNet.depositEnable && 
        (sNet.network === bNet.network || sNet.network.includes(bNet.network) || bNet.network.includes(sNet.network))
      );
      
      if (match) {
        const feeUsd = bNet.withdrawFee * buyTick.normAsk;
        if (feeUsd < minWithdrawFeeUsd) {
          minWithdrawFeeUsd = feeUsd;
          bestNetwork = bNet.network;
        }
      }
    }

    if (bestNetwork) {
      // console.log(`[SpotCalc] Found network ${bestNetwork} for ${normSymbol} ${buyTick.exchange}->${sellTick.exchange}`);
    }

    // If no matching valid networks, skip this pair completely
    if (!bestNetwork) return;
  } else {
    // If we have no network info at all (most exchanges), for now we skip.
    // BUT let's log this to see if any tickers are even reaching this point.
    // console.log(`[SpotCalc] No network info for ${buyTick.exchange}->${sellTick.exchange} ${normSymbol}`);
    return;
  }

  const netProfit = estimatedProfit - tradingFeesUsd - minWithdrawFeeUsd;
  
  // if (normSymbol === 'BTC') {
  //   console.log(`[SpotCalc] BTC ${buyTick.exchange}->${sellTick.exchange}: Gross Profit: $${estimatedProfit.toFixed(2)}, Fees: $${tradingFeesUsd.toFixed(2)}, Net: $${netProfit.toFixed(2)}`);
  // }

  
  if (netProfit > 0) {
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
      withdrawNetwork: bestNetwork,
      depositNetwork: bestNetwork,
      withdrawFeeUsd: minWithdrawFeeUsd,
      netProfit,
    });
  }
}
