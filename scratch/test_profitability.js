async function testProfitability() {
  const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Vitalik
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjA3OGM2NGRiLTk0MjAtNDMyMi1hMzE2LWExZDBlZjllNmI4YiIsIm9yZ0lkIjoiNDU4NTQ2IiwidXNlcklkIjoiNDcxNzY0IiwidHlwZUlkIjoiNGVjYmEzMTctYjFmNi00YWJiLTkzNWYtNGFlMjMzYzg3NmVhIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTIxNDA4MzAsImV4cCI6NDkwNzkwMDgzMH0.qfUKb78Pp6a3QaXKQO6qHr9aXACJF4ObXV9Z4Oxb8B4';


  const url = `https://deep-index.moralis.io/api/v2.2/wallets/${address}/profitability?chain=eth`;
  const res = await fetch(url, { headers: { 'X-API-Key': apiKey } });
  
  if (!res.ok) {
    console.log("Error:", res.status, await res.text());
    return;
  }
  
  const data = await res.json();
  console.log("Profitability:", JSON.stringify(data.result?.slice(0, 5), null, 2));
}

testProfitability();
