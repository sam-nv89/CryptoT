import { NextResponse } from 'next/server';
import { runSpotCollectionCycle } from '@/services/spot-collector';
import { dataCache } from '@/services/data-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cached = dataCache.getSpotSpreads();

    // If cache is empty, await the first collection
    if (cached.data.length === 0 || dataCache.isStale(cached, 300_000)) {
      console.log('[API /spot/spreads] Cache empty or very stale, triggering collection...');
      await runSpotCollectionCycle().catch(console.error);
    } else if (dataCache.isStale(cached, 15_000)) {
      // Periodic background refresh
      runSpotCollectionCycle().catch(console.error);
    }

    return NextResponse.json({
      data: cached.data,
      timestamp: cached.updatedAt,
      cached: !dataCache.isStale(cached, 15_000),
    });
  } catch (error) {
    console.error('[API /spot/spreads] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spot spreads' },
      { status: 500 }
    );
  }
}
