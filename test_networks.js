const ccxt = require('ccxt');
async function test() {
  const exchanges = ['kucoin', 'okx', 'binance', 'bybit', 'gateio', 'mexc', 'huobi', 'kraken', 'bitget'];
  for (const id of exchanges) {
    try {
      const ex = new ccxt[id]();
      const c = await ex.fetchCurrencies();
      const hasNetworks = Object.values(c).some(curr => curr.networks && Object.keys(curr.networks).length > 0);
      console.log(`${id}: Currencies count: ${Object.keys(c).length}, Has Networks: ${hasNetworks}`);
    } catch (e) {
      console.log(`${id}: Failed: ${e.message}`);
    }
  }
}
test();
