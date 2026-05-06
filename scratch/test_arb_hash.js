const fs = require('fs');

async function testMoralis() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjA3OGM2NGRiLTk0MjAtNDMyMi1hMzE2LWExZDBlZjllNmI4YiIsIm9yZ0lkIjoiNDU4NTQ2IiwidXNlcklkIjoiNDcxNzY0IiwidHlwZUlkIjoiNGVjYmEzMTctYjFmNi00YWJiLTkzNWYtNGFlMjMzYzg3NmVhIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTIxNDA4MzAsImV4cCI6NDkwNzkwMDgzMH0.qfUKb78Pp6a3QaXKQO6qHr9aXACJF4ObXV9Z4Oxb8B4';
  const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
  const url = `https://deep-index.moralis.io/api/v2.2/${address}/erc20/transfers?chain=arbitrum&limit=5`;
  
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'X-API-Key': apiKey }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.result?.map(tx => tx.transaction_hash), null, 2));
}

testMoralis();
