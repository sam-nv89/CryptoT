import 'dotenv/config';
import { runSpotCollectionCycle } from './src/services/spot-collector';
import { dataCache } from './src/services/data-cache';

async function test() {
  console.log('Running Spot Collection Cycle Test...');
  try {
    const result = await runSpotCollectionCycle();
    console.log('Result:', result);
    const spreads = dataCache.getSpotSpreads();
    console.log('Spreads found:', spreads.data.length);
    if (spreads.data.length > 0) {
      console.log('Sample Spread:', spreads.data[0]);
    }
  } catch (e) {
    console.error('Test failed:', e);
  }
}

test();
