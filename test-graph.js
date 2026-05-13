const query = {
  query: `{
    swaps(first: 5, orderBy: timestamp, orderDirection: desc) {
      transaction { id }
      timestamp
      token0 { symbol }
      token1 { symbol }
      amountUSD
      origin
    }
  }`
};

fetch('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(query)
})
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(console.error);
