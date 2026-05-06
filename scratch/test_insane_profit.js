const fs = require('fs');

async function testMoralis() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjA3OGM2NGRiLTk0MjAtNDMyMi1hMzE2LWExZDBlZjllNmI4YiIsIm9yZ0lkIjoiNDU4NTQ2IiwidXNlcklkIjoiNDcxNzY0IiwidHlwZUlkIjoiNGVjYmEzMTctYjFmNi00YWJiLTkzNWYtNGFlMjMzYzg3NmVhIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTIxNDA4MzAsImV4cCI6NDkwNzkwMDgzMH0.qfUKb78Pp6a3QaXKQO6qHr9aXACJF4ObXV9Z4Oxb8B4';
  
  const whales = [
    { name: 'Justin Sun BSC', address: '0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296', chain: 'bsc' },
    { name: 'Vitalik ARB', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', chain: 'arbitrum' }
  ];
  
  for (const w of whales) {
    const url = `https://deep-index.moralis.io/api/v2.2/wallets/${w.address}/profitability?chain=${w.chain}`;
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json', 'X-API-Key': apiKey }
      });
      const data = await res.json();
      
      let totalPnL = 0;
      if (data && data.result) {
        data.result.forEach(token => {
          const profit = parseFloat(token.realized_profit_usd || '0');
          if (profit > 1000000000) {
            console.log(`MASSIVE PROFIT TOKEN: ${token.token_symbol} - ${profit}`);
          }
          totalPnL += profit;
        });
      }
      console.log(`${w.name} Total PnL: $${totalPnL}`);
    } catch (e) {
      console.error(e);
    }
  }
}

testMoralis();
