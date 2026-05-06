const https = require('https');

https.get('https://solscan.io/tx/sol_tx_abcdef123456', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (data.includes("unable to locate this tx hash") || data.includes("TxnHash")) {
      console.log("Found error text in Solscan");
    } else {
      console.log("Not found in Solscan. Snippet: ", data.substring(0, 200));
    }
  });
}).on('error', err => console.log(err));
