import { NextResponse } from 'next/server';
import { whaleService } from '@/services/whale-service';
import { WhaleNetwork } from '@/types/whales';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const network = searchParams.get('network') as WhaleNetwork | null;
    const sortBy = (searchParams.get('sortBy') || 'pnl') as 'pnl' | 'winRate' | 'balance';

    const result = await whaleService.getWhales(page, limit, network || undefined, sortBy);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch whales:', error);
    return NextResponse.json({ error: 'Failed to fetch whales' }, { status: 500 });
  }
}
