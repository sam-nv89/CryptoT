import { NextResponse } from 'next/server';
import { runSpotCollectionCycle } from '@/services/spot-collector';
import { dataCache } from '@/services/data-cache';
import { SPOT_CACHE_MAX_AGE_MS, SPOT_CACHE_BG_REFRESH_MS } from '@/config/spot-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cached = dataCache.getSpotSpreads();
    const now = Date.now();
    const age = now - cached.updatedAt;

    // If cache is empty or extremely stale, block and await collection
    if (cached.data.length === 0 || age > SPOT_CACHE_MAX_AGE_MS) {
      console.log(`[API /spot/spreads] Cache empty or stale (${Math.round(age / 1000)}s), triggering collection...`);
      const result = await runSpotCollectionCycle().catch((err) => {
        console.error('[API /spot/spreads] Collection failed:', err);
        return null;
      });

      const freshCache = dataCache.getSpotSpreads();
      return NextResponse.json({
        data: freshCache.data,
        timestamp: freshCache.updatedAt,
        cached: false,
        meta: result ? {
          tickerCount: result.tickerCount,
          spreadCount: result.spreadCount,
          durationMs: result.durationMs,
          exchangesWithNetworks: result.exchangesWithNetworks,
        } : null,
      });
    }

    // If cache is slightly stale, return it immediately and trigger background refresh
    if (age > SPOT_CACHE_BG_REFRESH_MS) {
      runSpotCollectionCycle().catch(console.error);
    }

    // Return cached data instantly
    return NextResponse.json({
      data: cached.data,
      timestamp: cached.updatedAt,
      cached: true,
      meta: {
        spreadCount: cached.data.length,
        ageMs: age,
      },
    });
  } catch (error) {
    console.error('[API /spot/spreads] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spot spreads', data: [], timestamp: 0 },
      { status: 500 }
    );
  }
}
