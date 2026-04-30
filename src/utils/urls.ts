import { ExchangeId } from '@/types';

/**
 * Generates a direct link to the futures trading page for a given exchange and symbol.
 * Handles different symbol formats across exchanges.
 */
export function getExchangeUrl(exchange: ExchangeId, ccxtSymbol: string): string {
  const base = ccxtSymbol.split('/')[0].replace('1000', ''); // Remove 1000 multiplier prefix if present
  const baseLower = base.toLowerCase();
  const baseUpper = base.toUpperCase();

  switch (exchange) {
    case 'binance':
      return `https://www.binance.com/en/futures/${baseUpper}USDT`;
    case 'bybit':
      return `https://www.bybit.com/futures/usdt/${baseUpper}USDT`;
    case 'okx':
      return `https://www.okx.com/trade-swap/${baseLower}-usdt-sw`;
    case 'gate':
      return `https://www.gate.io/futures/usdt/${baseUpper}_USDT`;
    case 'mexc':
      return `https://futures.mexc.com/exchange/${baseUpper}_USDT?type=linear_swap`;
    case 'bitget':
      return `https://www.bitget.com/mix/usdt/${baseUpper}USDT`;
    case 'kucoin':
      return `https://www.kucoin.com/futures/trade/${baseUpper}USDTM`;
    case 'bingx':
      return `https://bingx.com/en-us/futures/forward/${baseUpper}USDT`;
    case 'htx':
      return `https://www.htx.com/en-us/futures/linear_swap/exchange#contract_code=${baseUpper}-USDT`;
    case 'phemex':
      return `https://phemex.com/trade/${baseUpper}USDT`;
    case 'coinex':
      return `https://www.coinex.com/futures/trade/${baseUpper}USDT`;
    case 'hyperliquid':
      return `https://app.hyperliquid.xyz/trade/${baseUpper}`;
    default:
      return '#';
  }
}
