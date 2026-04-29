import { NextResponse } from 'next/server';
import { dataCache } from '@/services/data-cache';
import { runCollectionCycle } from '@/services/collector';
import {
  evaluateSpreads,
  signalHistory,
  DEFAULT_THRESHOLDS,
} from '@/services/alert-engine';
import type { AlertThresholds } from '@/services/alert-engine';

/**
 * GET /api/alerts
 *
 * Returns current arbitrage signals evaluated against thresholds.
 * Query params:
 *   minGrossSpread — override minimum gross spread (default 0.05)
 *   minNetSpread   — override minimum net spread (default 0.0)
 *   minVolume      — override minimum volume in USD (default 100000)
 */
export async function GET(request: Request) {
  try {
    // Parse optional threshold overrides from query
    const { searchParams } = new URL(request.url);

    const thresholds: AlertThresholds = {
      ...DEFAULT_THRESHOLDS,
      ...(searchParams.has('minGrossSpread') && {
        minGrossSpread: parseFloat(searchParams.get('minGrossSpread')!),
      }),
      ...(searchParams.has('minNetSpread') && {
        minNetSpread: parseFloat(searchParams.get('minNetSpread')!),
      }),
      ...(searchParams.has('minVolume') && {
        minVolume: parseFloat(searchParams.get('minVolume')!),
      }),
    };

    // Ensure fresh data
    const cached = dataCache.getSpreads();
    if (dataCache.isStale(cached, 10_000)) {
      runCollectionCycle().catch(console.error);
    }

    // Evaluate spreads against thresholds
    const signals = evaluateSpreads(cached.data, thresholds);

    // Store in history
    if (signals.length > 0) {
      signalHistory.push(signals);
    }

    return NextResponse.json({
      data: signals,
      count: signals.length,
      hotCount: signals.filter((s) => s.tier === 'hot').length,
      warmCount: signals.filter((s) => s.tier === 'warm').length,
      thresholds,
      timestamp: Date.now(),
      cached: !dataCache.isStale(cached, 10_000),
    });
  } catch (error) {
    console.error('[API /alerts] Error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate alerts' },
      { status: 500 }
    );
  }
}
