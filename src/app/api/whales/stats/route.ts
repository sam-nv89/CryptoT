import { NextResponse } from 'next/server';
import { whaleService } from '@/services/whale-service';

export async function GET() {
  try {
    const stats = await whaleService.getGlobalStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch whale stats:', error);
    return NextResponse.json({ error: 'Failed to fetch whale stats' }, { status: 500 });
  }
}
