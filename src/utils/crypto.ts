/**
 * Normalizes a crypto ticker and extracts the multiplier.
 * e.g. "1000PEPE" -> { asset: "PEPE", multiplier: 1000 }
 * e.g. "kPEPE" -> { asset: "PEPE", multiplier: 1000 }
 * e.g. "BTC" -> { asset: "BTC", multiplier: 1 }
 */
export function normalizeTicker(ticker: string): { asset: string; multiplier: number } {
  // Common prefixes for multipliers
  const multipliers: Record<string, number> = {
    '1000000': 1000000,
    '100000': 100000,
    '10000': 10000,
    '1000': 1000,
    '100': 100,
    '10': 10,
    'k': 1000,
    'M': 1000000,
  };

  // Try to find a numeric prefix
  const numericMatch = ticker.match(/^(\d+)([A-Z]+)$/);
  if (numericMatch) {
    const num = parseInt(numericMatch[1]);
    if (multipliers[numericMatch[1]]) {
      return { asset: numericMatch[2], multiplier: num };
    }
  }

  // Try to find letter prefixes (k, M)
  const letterMatch = ticker.match(/^([kM])([A-Z]+)$/);
  if (letterMatch) {
    const prefix = letterMatch[1];
    return { asset: letterMatch[2], multiplier: multipliers[prefix] };
  }

  return { asset: ticker, multiplier: 1 };
}

/**
 * Normalizes a CCXT symbol like "1000PEPE/USDT:USDT" to a base representation.
 */
export function normalizeSymbol(symbol: string): { baseAsset: string; quoteAsset: string; multiplier: number; normalizedSymbol: string } {
  // 1. Remove settlement info and handle different separators: "BTC/USDT:USDT", "BTC-USDC", or "BTC_USDT"
  const cleanSymbol = symbol.split(':')[0].replace('-', '/').replace('_', '/');
  let [base, quote] = cleanSymbol.split('/');

  if (!base) {
    return { baseAsset: symbol, quoteAsset: '', multiplier: 1, normalizedSymbol: symbol };
  }

  // If no quote, assume USDT (e.g. Hyperliquid native assets)
  if (!quote) quote = 'USDT';

  // 2. Treat USDC and USDT as equivalent for spread purposes
  const normalizedQuote = quote.replace('USDC', 'USDT');

  const { asset, multiplier } = normalizeTicker(base);
  
  return {
    baseAsset: asset,
    quoteAsset: quote,
    multiplier,
    normalizedSymbol: `${asset}/${normalizedQuote}`
  };
}
