import { NextResponse } from 'next/server';
import { whaleService } from '@/services/whale-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const network = searchParams.get('network') as any;

    let whale;
    if (address && network) {
      // Construction of dynamic whale definition
      whale = await whaleService.getWhaleById(id, {
        address,
        network,
        name: `Whale ${address.substring(0, 6)}`,
        tags: ['Custom', 'Tracked'],
        chainParam: network === 'SOL' ? 'mainnet' : (network === 'ARB' ? 'arbitrum' : network.toLowerCase())
      });
    } else {
      whale = await whaleService.getWhaleById(id);
    }

    if (!whale) {
      return NextResponse.json({ error: 'Whale not found' }, { status: 404 });
    }

    return NextResponse.json(whale); // Return the profile directly
  } catch (error) {
    console.error('Failed to fetch whale profile:', error);
    return NextResponse.json({ error: 'Failed to fetch whale profile' }, { status: 500 });
  }
}
