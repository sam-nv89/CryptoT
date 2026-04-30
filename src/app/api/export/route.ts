import { NextResponse } from 'next/server';
import { reportService } from '@/services/report-service';

/**
 * GET /api/export
 * 
 * Exports futures arbitrage data as JSON or CSV.
 * Query Params:
 * - format: 'json' | 'csv' (default: 'json')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const reports = await reportService.generateFuturesReport();

    if (format === 'csv') {
      const csv = reportService.toCSV(reports);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="futures_arbitrage_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      data: reports,
      timestamp: Date.now(),
      count: reports.length
    });
  } catch (error) {
    console.error('[API /export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}
