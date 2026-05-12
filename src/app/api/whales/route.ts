import { NextResponse } from 'next/server';
import { whaleService } from '@/services/whale-service';
import { WhaleNetwork } from '@/types/whales';
import { WalletSearchFilters } from '@/types/whale-filters';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: WalletSearchFilters = {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
      sortBy: (searchParams.get('sortBy') || 'pnl') as WalletSearchFilters['sortBy'],
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      network: searchParams.get('network') as WhaleNetwork | undefined || undefined,
      minWinRate: searchParams.has('minWinRate') ? parseFloat(searchParams.get('minWinRate')!) : undefined,
      maxWinRate: searchParams.has('maxWinRate') ? parseFloat(searchParams.get('maxWinRate')!) : undefined,
      minPnL: searchParams.has('minPnL') ? parseFloat(searchParams.get('minPnL')!) : undefined,
      maxPnL: searchParams.has('maxPnL') ? parseFloat(searchParams.get('maxPnL')!) : undefined,
      minBalance: searchParams.has('minBalance') ? parseFloat(searchParams.get('minBalance')!) : undefined,
      minTrades: searchParams.has('minTrades') ? parseInt(searchParams.get('minTrades')!, 10) : undefined,
      minROI: searchParams.has('minROI') ? parseFloat(searchParams.get('minROI')!) : undefined,
    };

    const result = await whaleService.getWhales(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch whales:', error);
    return NextResponse.json({ error: 'Failed to fetch whales' }, { status: 500 });
  }
}
