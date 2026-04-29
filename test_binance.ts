import ccxt from 'ccxt';

async function test() {
  const ex = new ccxt.mexc();
  await ex.loadMarkets();
  const tickers = await ex.fetchTickers();
  console.log("BTC/USDT:USDT present?", 'BTC/USDT:USDT' in tickers);
  console.log("Some mexc keys:", Object.keys(tickers).filter(k => k.includes('BTC')).slice(0, 5));
}

test().catch(console.error);
