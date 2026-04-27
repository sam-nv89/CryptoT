import { NextResponse } from 'next/server';
import { dataCache } from '@/services/data-cache';
import { runCollectionCycle } from '@/services/collector';

/**
 * GET /api/tickers
 *
 * Returns all current tickers from all exchanges.
 */
export async function GET() {
  try {
    const cached = dataCache.getTickers();

    if (dataCache.isStale(cached, 10_000)) {
      runCollectionCycle().catch(console.error);
    }

    return NextResponse.json({
      data: cached.data,
      timestamp: cached.updatedAt,
      cached: !dataCache.isStale(cached, 10_000),
    });
  } catch (error) {
    console.error('[API /tickers] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickers' },
      { status: 500 }
    );
  }
}
