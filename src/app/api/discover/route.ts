import { NextResponse } from 'next/server';
import { discoverMarkets } from '@/services/exchange-service';
import { dataCache } from '@/services/data-cache';

/**
 * GET /api/discover
 *
 * Triggers market discovery — loads all markets from all exchanges,
 * finds USDT-margined perp symbols common to 2+ exchanges.
 * Should be called once on app startup, then periodically (e.g. every 6h).
 */
export async function GET() {
  try {
    const result = await discoverMarkets();

    return NextResponse.json({
      success: true,
      ...result,
      hasCache: dataCache.hasDiscoveredSymbols(),
    });
  } catch (error) {
    console.error('[API /discover] Error:', error);
    return NextResponse.json(
      { 
        error: 'Market discovery failed',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
