import { NextResponse } from 'next/server';
import { whaleService } from '@/services/whale-service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await whaleService.getTokenHoldings(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch token holdings:', error);
    return NextResponse.json({ error: 'Failed to fetch token holdings' }, { status: 500 });
  }
}
