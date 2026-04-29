import 'dotenv/config';
import { runSpotCollectionCycle } from './src/services/spot-collector';
import { dataCache } from './src/services/data-cache';

async function test() {
  console.log('Running Spot Collection Cycle Test...');
  try {
    const result = await runSpotCollectionCycle();
    console.log('Result:', result);
    const spreads = dataCache.getSpotSpreads();
    console.log('Spreads found in cache:', spreads.data.length);
    if (spreads.data.length > 0) {
      console.log('Sample Spread:', JSON.stringify(spreads.data[0], null, 2));
    } else {
      console.log('No spreads found. This might be due to Network Routing filtering or lack of tickers.');
    }
  } catch (e) {
    console.error('Test failed:', e);
  }
}

test();
