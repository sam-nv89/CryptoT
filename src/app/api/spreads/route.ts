import { NextResponse } from 'next/server';
import { dataCache } from '@/services/data-cache';
import { runCollectionCycle } from '@/services/collector';

/**
 * GET /api/spreads
 *
 * Returns current cross-exchange spreads.
 * Triggers a data collection cycle if cache is stale (>10s).
 */
export async function GET() {
  try {
    const cached = dataCache.getSpreads();

    // If cache is older than 10s, refresh in background
    if (dataCache.isStale(cached, 10_000)) {
      // Don't await — return stale data immediately, refresh in background
      runCollectionCycle().catch(console.error);
    }

    return NextResponse.json({
      data: cached.data,
      timestamp: cached.updatedAt,
      cached: !dataCache.isStale(cached, 10_000),
    });
  } catch (error) {
    console.error('[API /spreads] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spreads' },
      { status: 500 }
    );
  }
}
