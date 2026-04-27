import { NextResponse } from 'next/server';
import { dataCache } from '@/services/data-cache';
import { runCollectionCycle } from '@/services/collector';

/**
 * GET /api/funding
 *
 * Returns current funding rates across all exchanges.
 */
export async function GET() {
  try {
    const cached = dataCache.getFunding();

    if (dataCache.isStale(cached, 30_000)) {
      runCollectionCycle().catch(console.error);
    }

    return NextResponse.json({
      data: cached.data,
      timestamp: cached.updatedAt,
      cached: !dataCache.isStale(cached, 30_000),
    });
  } catch (error) {
    console.error('[API /funding] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funding rates' },
      { status: 500 }
    );
  }
}
