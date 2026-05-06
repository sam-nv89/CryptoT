
import axios from 'axios';

async function testVertex() {
  console.log('Testing Vertex Protocol Gateway...');
  const url = 'https://gateway.prod.vertexprotocol.com/query';
  const payload = { type: 'all_products' };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    console.log('Success!');
    const products = response.data.data;
    if (products) {
       const spotProducts = Object.values(products).filter((p: any) => p.product_type === 'spot');
       console.log(`Found ${spotProducts.length} spot products`);
       console.log('Sample spot product:', spotProducts[0]);
    } else {
       console.log('No data in response:', response.data);
    }

    console.log('Testing Archive API Tickers...');
    const tickersUrl = 'https://archive.prod.vertexprotocol.com/v1/tickers';
    const tickersRes = await axios.get(tickersUrl, {
       headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log(`Fetched ${Object.keys(tickersRes.data).length} tickers from archive`);
    console.log('Sample ticker:', tickersRes.data[Object.keys(tickersRes.data)[0]]);

  } catch (err: any) {
    console.error('Vertex test failed:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
  }
}

testVertex();
