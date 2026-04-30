import { 
  FuturesArbitrageReport, 
  ExchangeId, 
  SpreadEntry, 
  FundingRateEntry,
  ExchangePositionReport
} from '@/types';
import { fetchTickers, fetchFundingRates, calculateSpreads } from './exchange-service';
import { EXCHANGE_FEES } from './alert-engine';
import { getExchangeUrl } from '@/utils/urls';

/**
 * Report Service — generates enriched arbitrage reports for data export.
 * Specifically designed to match the data structure shown in professional arbitrage tools.
 */
export class ReportService {
  /**
   * Generates a full list of futures arbitrage opportunities with detailed exchange data.
   */
  async generateFuturesReport(): Promise<FuturesArbitrageReport[]> {
    const tickers = await fetchTickers();
    const fundingRates = await fetchFundingRates();
    const spreads = calculateSpreads(tickers);

    // Map funding rates for easy lookup: symbol -> exchange -> rate
    const fundingMap: Record<string, Partial<Record<ExchangeId, FundingRateEntry>>> = {};
    for (const fr of fundingRates) {
      if (!fundingMap[fr.symbol]) fundingMap[fr.symbol] = {};
      fundingMap[fr.symbol][fr.exchange] = fr;
    }

    const reports: FuturesArbitrageReport[] = [];

    for (const s of spreads) {
      const buyFR = fundingMap[s.symbol]?.[s.buyExchange];
      const sellFR = fundingMap[s.symbol]?.[s.sellExchange];

      // We focus on pairs where we have funding data (futures arbitrage)
      if (!buyFR || !sellFR) continue;

      const buyFee = EXCHANGE_FEES[s.buyExchange]?.taker ?? 0.05;
      const sellFee = EXCHANGE_FEES[s.sellExchange]?.taker ?? 0.05;
      const avgFee = (buyFee + sellFee) / 2;

      // Funding Difference (Total potential yield from funding)
      // Long side (buy) gets paid if funding is negative. 
      // Short side (sell) gets paid if funding is positive.
      // Net funding = sellRate - buyRate
      const fundingDiff = sellFR.rate - buyFR.rate;

      // Entry Spread (Gross)
      const entrySpread = s.spreadPercent;

      // Exit Spread (Projected/Target)
      // Often calculated as Entry Spread + 1 funding cycle or specific target
      // For this report, we'll use a standard formula: Entry + FundingDiff (as seen in some tools)
      const exitSpread = entrySpread + (fundingDiff * 100);

      reports.push({
        symbol: s.symbol,
        shortPosition: {
          exchange: s.sellExchange,
          fundingRate: sellFR.rate * 100,
          fundingForecast: sellFR.rate * 100, // Placeholder for forecast
          url: getExchangeUrl(s.sellExchange, s.symbol),
          nextFundingTime: sellFR.nextFundingTime,
          ask: s.sellPrice, // Using s.sellPrice for ask/bid context
          bid: s.sellPrice,
          takerFee: sellFee,
          volume24h: s.volume24h,
          timeframe: '4h' // Standard perp timeframe
        },
        longPosition: {
          exchange: s.buyExchange,
          fundingRate: buyFR.rate * 100,
          fundingForecast: buyFR.rate * 100,
          url: getExchangeUrl(s.buyExchange, s.symbol),
          nextFundingTime: buyFR.nextFundingTime,
          ask: s.buyPrice,
          bid: s.buyPrice,
          takerFee: buyFee,
          volume24h: s.volume24h,
          timeframe: '4h'
        },
        avgTakerFee: avgFee,
        entrySpread: entrySpread,
        exitSpread: exitSpread,
        fundingDiff: fundingDiff * 100,
        timestamp: Date.now()
      });
    }

    return reports.sort((a, b) => b.entrySpread - a.entrySpread);
  }

  /**
   * Converts a list of reports to CSV format for download.
   */
  toCSV(reports: FuturesArbitrageReport[]): string {
    const headers = [
      'Symbol',
      'Short Exchange', 'Short Funding %', 'Short Price', 'Short Volume',
      'Long Exchange', 'Long Funding %', 'Long Price', 'Long Volume',
      'Entry Spread %', 'Exit Spread %', 'Funding Diff %', 'Avg Fee %'
    ];

    const rows = reports.map(r => [
      r.symbol,
      r.shortPosition.exchange, r.shortPosition.fundingRate.toFixed(4), r.shortPosition.bid.toFixed(6), r.shortPosition.volume24h.toFixed(0),
      r.longPosition.exchange, r.longPosition.fundingRate.toFixed(4), r.longPosition.ask.toFixed(6), r.longPosition.volume24h.toFixed(0),
      r.entrySpread.toFixed(3), r.exitSpread.toFixed(3), r.fundingDiff.toFixed(3), r.avgTakerFee.toFixed(3)
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Formats the report into a Telegram-style message as seen in the user's screenshot.
   */
  static toTelegramMessage(report: FuturesArbitrageReport): string {
    const { shortPosition, longPosition, symbol, entrySpread, exitSpread, fundingDiff } = report;
    const base = symbol.split('/')[0];
    
    const fmtShort = this.formatExchangeBlock(shortPosition, 'Short');
    const fmtLong = this.formatExchangeBlock(longPosition, 'Long');

    return `
💰 **${base} Арбитраж фьючерсов**

${fmtShort}

${fmtLong}

**💰 Сумм. комиссия тейкера: ${(shortPosition.takerFee + longPosition.takerFee).toFixed(4)}%**

**Спреды:**
💰 Курсовой спред входа: ${entrySpread.toFixed(3)}%
💰 Курсовой спред выхода: ${exitSpread.toFixed(3)}%
🔥 Ставки: ${fundingDiff.toFixed(4)}%
    `.trim();
  }


  private static formatExchangeBlock(pos: ExchangePositionReport, type: string): string {
    const isShort = type === 'Short';
    const sideEmoji = isShort ? '🔴' : '🟢';
    
    return `
${sideEmoji} **${type}**
🏦 **${pos.exchange.toUpperCase()} ${pos.fundingRate.toFixed(4)}%**
🔮 Прогноз: ${pos.fundingForecast !== undefined ? pos.fundingForecast.toFixed(4) + '%' : '-'}
🔗 [URL](${pos.url})
⏳ До начисления: ${pos.nextFundingTime}
📕 Ask: ${pos.ask.toFixed(5)}
📗 Bid: ${pos.bid.toFixed(5)}
💰 Комиссия тейкера: ${pos.takerFee.toFixed(3)}%
🔄 Оборот за 24ч (USDT): ${new Intl.NumberFormat().format(Math.round(pos.volume24h))}
⏱ 4ч
    `.trim();
  }
}


export const reportService = new ReportService();
