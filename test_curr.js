const ccxt = require('ccxt');
(async () => {
  const kucoin = new ccxt.kucoin();
  try {
    const c = await kucoin.fetchCurrencies();
    console.log('KuCoin:', Object.keys(c).slice(0, 5));
  } catch(e) { console.log('KuCoin Error:', e.message); }
  
  const mexc = new ccxt.mexc();
  try {
    const m = await mexc.fetchCurrencies();
    console.log('MEXC:', Object.keys(m).slice(0, 5));
  } catch(e) { console.log('MEXC Error:', e.message); }
})();
