import { NextResponse } from 'next/server';
import { storePriceSnapshots, getSnapshotStats } from '@/lib/api/snapshots';
import { fetchPolymarketMarketsWithPagination, parsePolymarketOutcomes } from '@/lib/api/polymarket';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for this route

/**
 * Cron job to store price snapshots every hour
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/snapshot-prices",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  // Optional: Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow Vercel cron (no auth) or valid secret
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    if (!isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Debug: Check env vars
    const hasRedisUrl = !!process.env.UPSTASH_REDIS_REST_URL;
    const hasRedisToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;
    console.log(`[Snapshot Cron] Redis config: url=${hasRedisUrl}, token=${hasRedisToken}`);

    if (!hasRedisUrl || !hasRedisToken) {
      return NextResponse.json({
        success: false,
        error: 'Missing Redis configuration',
        debug: { hasRedisUrl, hasRedisToken },
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }

    // Fetch all markets from Polymarket (10,000 max)
    console.log('[Snapshot Cron] Fetching markets...');
    const rawMarkets = await fetchPolymarketMarketsWithPagination(10000);

    // Transform to simple format with probability
    const markets = rawMarkets.map((pm) => {
      const { prices } = parsePolymarketOutcomes(pm);
      return {
        id: pm.id,
        probability: Math.round(prices[0] * 100),
        volume24h: pm.volume24hrNum || pm.volume24hr || 0,
      };
    });

    console.log(`[Snapshot Cron] Storing ${markets.length} market prices...`);

    // Store snapshot
    let result;
    try {
      result = await storePriceSnapshots(markets);
    } catch (storeError) {
      console.error('[Snapshot Cron] Store error:', storeError);
      return NextResponse.json({
        success: false,
        error: storeError instanceof Error ? storeError.message : 'Storage failed',
        marketsFetched: markets.length,
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }

    const duration = Date.now() - startTime;

    // Get current stats
    const stats = await getSnapshotStats();

    console.log(`[Snapshot Cron] Complete in ${duration}ms. Stored: ${result.count}`);

    return NextResponse.json({
      success: result.success,
      marketsStored: result.count,
      marketsFetched: markets.length,
      duration: `${duration}ms`,
      stats,
      ...(result.error && { error: result.error }),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Snapshot Cron] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
