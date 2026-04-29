import { fetchTickers } from './src/services/exchange-service';
import { calculateSpreads } from './src/services/exchange-service';

async function main() {
  console.log("Fetching tickers...");
  const tickers = await fetchTickers();
  
  const byEx = new Map();
  for (const t of tickers) {
    byEx.set(t.exchange, (byEx.get(t.exchange) || 0) + 1);
  }
  console.log("Tickers by exchange:", Object.fromEntries(byEx));
  
  const spreads = calculateSpreads(tickers);
  console.log(`Calculated ${spreads.length} spreads.`);
}

main().catch(console.error);
