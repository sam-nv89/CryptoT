async function testHistory() {
  const address = '0x6cC5F688a315f3dC28A7781717a9A73330ee0167'; // Wintermute
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjA3OGM2NGRiLTk0MjAtNDMyMi1hMzE2LWExZDBlZjllNmI4YiIsIm9yZ0lkIjoiNDU4NTQ2IiwidXNlcklkIjoiNDcxNzY0IiwidHlwZUlkIjoiNGVjYmEzMTctYjFmNi00YWJiLTkzNWYtNGFlMjMzYzg3NmVhIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTIxNDA4MzAsImV4cCI6NDkwNzkwMDgzMH0.qfUKb78Pp6a3QaXKQO6qHr9aXACJF4ObXV9Z4Oxb8B4';

  const url = `https://deep-index.moralis.io/api/v2.2/wallets/${address}/history?chain=eth&limit=5`;
  const res = await fetch(url, { headers: { 'X-API-Key': apiKey } });
  
  if (!res.ok) {
    console.log("Error:", res.status, await res.text());
    return;
  }
  
  const data = await res.json();
  console.log("History:", JSON.stringify(data.result, null, 2));
}

testHistory();
