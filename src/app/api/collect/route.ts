import { NextResponse } from 'next/server';
import { runCollectionCycle } from '@/services/collector';

/**
 * GET /api/collect
 *
 * Manually triggers a data collection cycle.
 * Can be called by a cron job or the frontend "refresh" button.
 */
export async function GET() {
  try {
    const result = await runCollectionCycle();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[API /collect] Error:', error);
    return NextResponse.json(
      { error: 'Collection cycle failed' },
      { status: 500 }
    );
  }
}
