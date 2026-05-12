import { NextResponse } from 'next/server';
import { whaleService } from '@/services/whale-service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await whaleService.getPnLBreakdown(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch PnL breakdown:', error);
    return NextResponse.json({ error: 'Failed to fetch PnL breakdown' }, { status: 500 });
  }
}
