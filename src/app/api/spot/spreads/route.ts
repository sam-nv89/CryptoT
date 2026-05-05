import { NextResponse } from 'next/server';
import { runSpotCollectionCycle } from '@/services/spot-collector';
import { dataCache } from '@/services/data-cache';
import { SPOT_CACHE_MAX_AGE_MS, SPOT_CACHE_BG_REFRESH_MS } from '@/config/spot-config';
import type { SpotSpreadEntry, SpotConfidence } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // Optional server-side filters (reduce payload size)
    const minSpread  = parseFloat(url.searchParams.get('min_spread')  ?? '0') || 0;
    const confParam  = url.searchParams.get('confidence');
    const allowedConf: Set<SpotConfidence> | null = confParam
      ? new Set(confParam.split(',') as SpotConfidence[])
      : null;

    const cached = dataCache.getSpotSpreads();
    const now    = Date.now();
    const age    = now - cached.updatedAt;

    // If cache is empty or extremely stale, block and await collection
    if (cached.data.length === 0 || age > SPOT_CACHE_MAX_AGE_MS) {
      console.log(`[API /spot/spreads] Cache empty or stale (${Math.round(age / 1000)}s), triggering collection...`);
      const result = await runSpotCollectionCycle().catch((err) => {
        console.error('[API /spot/spreads] Collection failed:', err);
        return null;
      });

      const freshCache = dataCache.getSpotSpreads();
      const data = applyFilters(freshCache.data, minSpread, allowedConf);

      return NextResponse.json({
        data,
        timestamp:  freshCache.updatedAt,
        cached:     false,
        meta: result ? {
          tickerCount:          result.tickerCount,
          spreadCount:          result.spreadCount,
          filteredCount:        data.length,
          durationMs:           result.durationMs,
          exchangesWithNetworks: result.exchangesWithNetworks,
          exchangesCovered:     result.exchangesCovered,
          totalExchanges:       result.totalExchanges,
          confidenceBreakdown:  result.confidenceBreakdown,
        } : null,
      });
    }

    // If cache is slightly stale, return immediately and trigger background refresh
    if (age > SPOT_CACHE_BG_REFRESH_MS) {
      runSpotCollectionCycle().catch(console.error);
    }

    const data = applyFilters(cached.data, minSpread, allowedConf);

    return NextResponse.json({
      data,
      timestamp: cached.updatedAt,
      cached:    true,
      meta: {
        spreadCount:   cached.data.length,
        filteredCount: data.length,
        ageMs:         age,
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

/** Apply optional server-side filters to reduce response payload */
function applyFilters(
  data: SpotSpreadEntry[],
  minSpread: number,
  allowedConf: Set<SpotConfidence> | null
): SpotSpreadEntry[] {
  let result = data;
  if (minSpread > 0)    result = result.filter(s => s.spreadPercent >= minSpread);
  if (allowedConf)      result = result.filter(s => allowedConf.has(s.confidence));
  return result;
}
