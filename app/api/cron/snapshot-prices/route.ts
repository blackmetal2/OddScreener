import { NextResponse } from 'next/server';
import { storePriceSnapshots, storeSpreadSnapshots, getSnapshotStats } from '@/lib/api/snapshots';
import { fetchPolymarketMarketsWithPagination, parsePolymarketOutcomes, fetchBatchSpreads, getPolymarketTokenIds } from '@/lib/api/polymarket';

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

    // Store price snapshot
    let priceResult;
    try {
      priceResult = await storePriceSnapshots(markets);
    } catch (storeError) {
      console.error('[Snapshot Cron] Store error:', storeError);
      return NextResponse.json({
        success: false,
        error: storeError instanceof Error ? storeError.message : 'Storage failed',
        marketsFetched: markets.length,
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }

    // ============================================
    // FETCH AND STORE SPREADS
    // ============================================
    console.log('[Snapshot Cron] Fetching spreads...');

    // Extract all token IDs (first token from each market - the "Yes" token)
    const allTokenIds: string[] = [];
    for (const pm of rawMarkets) {
      const tokenIds = getPolymarketTokenIds(pm);
      if (tokenIds.length > 0) {
        allTokenIds.push(tokenIds[0]); // Primary token
      }
    }

    // Fetch spreads in batches of 100
    const BATCH_SIZE = 100;
    const allSpreads: Array<{ tokenId: string; spreadPercent: number; bestBid: number; bestAsk: number }> = [];

    for (let i = 0; i < allTokenIds.length; i += BATCH_SIZE) {
      const batchTokenIds = allTokenIds.slice(i, i + BATCH_SIZE);
      try {
        const spreadsMap = await fetchBatchSpreads(batchTokenIds);
        for (const [tokenId, data] of spreadsMap) {
          allSpreads.push({
            tokenId,
            spreadPercent: data.spreadPercent,
            bestBid: data.bestBid,
            bestAsk: data.bestAsk,
          });
        }
        console.log(`[Snapshot Cron] Spreads batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allTokenIds.length / BATCH_SIZE)}: ${spreadsMap.size} fetched`);
      } catch (batchError) {
        console.warn(`[Snapshot Cron] Spread batch ${i}-${i + BATCH_SIZE} failed:`, batchError);
      }
    }

    // Store spreads
    let spreadResult: { success: boolean; count: number; error?: string } = { success: false, count: 0, error: 'Not attempted' };
    if (allSpreads.length > 0) {
      try {
        spreadResult = await storeSpreadSnapshots(allSpreads);
        console.log(`[Snapshot Cron] Stored ${spreadResult.count} spreads`);
      } catch (spreadError) {
        console.error('[Snapshot Cron] Store spreads error:', spreadError);
        spreadResult = { success: false, count: 0, error: spreadError instanceof Error ? spreadError.message : 'Unknown' };
      }
    }

    const duration = Date.now() - startTime;

    // Get current stats
    const stats = await getSnapshotStats();

    console.log(`[Snapshot Cron] Complete in ${duration}ms. Prices: ${priceResult.count}, Spreads: ${spreadResult.count}`);

    return NextResponse.json({
      success: priceResult.success && spreadResult.success,
      marketsStored: priceResult.count,
      spreadsStored: spreadResult.count,
      marketsFetched: markets.length,
      tokenIdCount: allTokenIds.length,
      duration: `${duration}ms`,
      stats,
      ...(priceResult.error && { priceError: priceResult.error }),
      ...(spreadResult.error && { spreadError: spreadResult.error }),
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
