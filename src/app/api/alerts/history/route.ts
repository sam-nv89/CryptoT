import { NextResponse } from 'next/server';
import { signalHistory } from '@/services/alert-engine';

/**
 * GET /api/alerts/history
 *
 * Returns historical arbitrage signals.
 * Query params:
 *   window — time window in minutes (default: 60)
 *   limit  — max entries to return (default: 50)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const windowMinutes = parseInt(searchParams.get('window') ?? '60', 10);
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    const windowMs = windowMinutes * 60 * 1000;
    const recent = signalHistory.getRecent(windowMs).slice(0, limit);
    const uniqueCount = signalHistory.countUnique(windowMs);

    return NextResponse.json({
      data: recent,
      count: recent.length,
      uniqueSignals: uniqueCount,
      windowMinutes,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[API /alerts/history] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert history' },
      { status: 500 }
    );
  }
}
