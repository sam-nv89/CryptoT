import { NextResponse } from 'next/server';
import { whaleService } from '@/services/whale-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/whales/discover
 *
 * Triggers the Smart Money Discovery Engine.
 * Fetches real trending tokens from DexScreener and discovers (or simulates)
 * highly profitable wallets that interacted with those tokens.
 */
export async function GET() {
  try {
    const discoveredWhales = await whaleService.discoverSmartMoney();

    return NextResponse.json({
      success: true,
      count: discoveredWhales.length,
      whales: discoveredWhales
    });
  } catch (error) {
    console.error('[API /whales/discover] Error:', error);
    return NextResponse.json(
      { 
        error: 'Smart money discovery failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
