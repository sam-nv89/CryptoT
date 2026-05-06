const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjA3OGM2NGRiLTk0MjAtNDMyMi1hMzE2LWExZDBlZjllNmI4YiIsIm9yZ0lkIjoiNDU4NTQ2IiwidXNlcklkIjoiNDcxNzY0IiwidHlwZUlkIjoiNGVjYmEzMTctYjFmNi00YWJiLTkzNWYtNGFlMjMzYzg3NmVhIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTIxNDA4MzAsImV4cCI6NDkwNzkwMDgzMH0.qfUKb78Pp6a3QaXKQO6qHr9aXACJF4ObXV9Z4Oxb8B4';
const solAddress = '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pTEXPW'; // Random top solana holding address or Binance hot wallet? Let's use a known big solana wallet: '9WzDXwBbmcg8Zc8VqNNV6KcgN8sFm5ZqK3uDzvX3E72a' (Binance) Wait, let's use a random valid one.
const validSolAddress = 'FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5'; // Just testing syntax

async function testSolana() {
  const urls = [
    `https://solana-gateway.moralis.io/account/mainnet/${validSolAddress}/portfolio`,
    `https://solana-gateway.moralis.io/account/mainnet/${validSolAddress}/transfers`
  ];
  
  for (const url of urls) {
    try {
      console.log('Fetching', url);
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json', 'X-API-Key': apiKey }
      });
      console.log(`Status: ${res.status}`);
      if (!res.ok) {
         console.log(await res.text());
      } else {
         const data = await res.json();
         console.log(JSON.stringify(data).substring(0,200));
      }
    } catch(e) { console.log(e); }
  }
}

testSolana();
