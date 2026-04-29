import ccxt from 'ccxt';

async function test() {
  const binance = new ccxt.binance();
  const currencies = await binance.fetchCurrencies();
  
  const pepe = currencies['PEPE'];
  console.log("Binance PEPE:", JSON.stringify(pepe, null, 2));

  const gate = new ccxt.gate();
  const gateCurrencies = await gate.fetchCurrencies();
  console.log("Gate PEPE:", JSON.stringify(gateCurrencies['PEPE'], null, 2));
}

test().catch(console.error);
