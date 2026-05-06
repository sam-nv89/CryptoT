const fs = require('fs');

async function testMoralis() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjA3OGM2NGRiLTk0MjAtNDMyMi1hMzE2LWExZDBlZjllNmI4YiIsIm9yZ0lkIjoiNDU4NTQ2IiwidXNlcklkIjoiNDcxNzY0IiwidHlwZUlkIjoiNGVjYmEzMTctYjFmNi00YWJiLTkzNWYtNGFlMjMzYzg3NmVhIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTIxNDA4MzAsImV4cCI6NDkwNzkwMDgzMH0.qfUKb78Pp6a3QaXKQO6qHr9aXACJF4ObXV9Z4Oxb8B4';
  const address = '0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296';
  const url = `https://deep-index.moralis.io/api/v2.2/${address}/erc20/transfers?chain=eth&limit=5`;
  
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'X-API-Key': apiKey }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.result.map(tx => tx.transaction_hash), null, 2));
}

testMoralis();
