const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjA3OGM2NGRiLTk0MjAtNDMyMi1hMzE2LWExZDBlZjllNmI4YiIsIm9yZ0lkIjoiNDU4NTQ2IiwidXNlcklkIjoiNDcxNzY0IiwidHlwZUlkIjoiNGVjYmEzMTctYjFmNi00YWJiLTkzNWYtNGFlMjMzYzg3NmVhIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTIxNDA4MzAsImV4cCI6NDkwNzkwMDgzMH0.qfUKb78Pp6a3QaXKQO6qHr9aXACJF4ObXV9Z4Oxb8B4';
const solAddress = '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pTEXPW';
const aptAddress = '0x1'; // Some basic aptos address

async function testNonEvm() {
  const chains = [{c: 'solana', a: solAddress}, {c: 'aptos', a: aptAddress}];
  
  for (const {c, a} of chains) {
    try {
      const res = await fetch(`https://deep-index.moralis.io/api/v2.2/wallets/${a}/net-worth?chain=${c}`, {
        headers: { 'Accept': 'application/json', 'X-API-Key': apiKey }
      });
      console.log(`${c} ${a}: ${res.status}`);
      if (!res.ok) {
         console.log(await res.text());
      } else {
         const data = await res.json();
         console.log(JSON.stringify(data).substring(0,200));
      }
    } catch(e) { console.log(e); }
  }
}

testNonEvm();
