import ccxt from 'ccxt';

async function test() {
  const binance = new ccxt.binanceusdm();
  const bybit = new ccxt.bybit({ options: { defaultType: 'swap' } });
  
  await Promise.all([binance.loadMarkets(), bybit.loadMarkets()]);

  const binancePepe = Object.values(binance.markets).find(m => m.base === 'PEPE' || m.symbol.includes('PEPE'));
  const bybitPepe = Object.values(bybit.markets).find(m => m.base === 'PEPE' || m.symbol.includes('PEPE'));

  console.log("Binance PEPE Market:", JSON.stringify({
    symbol: binancePepe?.symbol,
    base: binancePepe?.base,
    quote: binancePepe?.quote,
    contractSize: binancePepe?.contractSize,
  }, null, 2));

  console.log("Bybit PEPE Market:", JSON.stringify({
    symbol: bybitPepe?.symbol,
    base: bybitPepe?.base,
    quote: bybitPepe?.quote,
    contractSize: bybitPepe?.contractSize,
  }, null, 2));
}

test().catch(console.error);
