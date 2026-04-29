import { discoverMarkets } from './src/services/exchange-service';

async function test() {
  console.log("Running discoverMarkets...");
  const result = await discoverMarkets();
  console.log("Success. Common symbols:", result.commonSymbols);
}

test().catch(console.error);
