require('dotenv').config();
const { runSpotCollectionCycle } = require('./src/services/spot-collector');
const { dataCache } = require('./src/services/data-cache');

async function debugSpot() {
  console.log('Starting Spot debug...');
  try {
    const result = await runSpotCollectionCycle();
    console.log('Collection result:', result);
    
    const cached = dataCache.getSpotSpreads();
    console.log('Cached spot spreads count:', cached.data.length);
    if (cached.data.length > 0) {
      console.log('First 3 spreads:', JSON.stringify(cached.data.slice(0, 3), null, 2));
    } else {
      console.log('No spot spreads found in cache.');
    }
  } catch (err) {
    console.error('Debug error:', err);
  }
}

debugSpot();
