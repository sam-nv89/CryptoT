import { NextResponse } from 'next/server';
import { whaleService } from '@/services/whale-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const transactions = await whaleService.getWhaleTransactions(id, limit);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Failed to fetch whale transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
