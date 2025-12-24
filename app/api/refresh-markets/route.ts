import { NextResponse } from 'next/server';
import { getAllMarkets } from '@/lib/api/markets';
import { writeMarketsCache, readMarketsCache, getCacheAge } from '@/lib/cache/markets-cache';
import { GlobalStats } from '@/types/market';

// Prevent caching of this route
export const dynamic = 'force-dynamic';

/**
 * API route to refresh the markets cache
 * Can be triggered by:
 * - Cron job (Vercel cron, external cron service)
 * - Manual call: GET /api/refresh-markets
 * - First user request if cache is empty/stale
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // Check if cache exists and is fresh (optional skip)
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    if (!force) {
      const existingCache = await readMarketsCache();
      if (existingCache) {
        const ageSeconds = getCacheAge(existingCache);
        if (ageSeconds < 300) {
          // Less than 5 minutes old
          return NextResponse.json({
            success: true,
            message: 'Cache is fresh',
            marketsCount: existingCache.markets.length,
            cacheAgeSeconds: ageSeconds,
            skipped: true,
          });
        }
      }
    }

    // Fetch all markets from Polymarket (10,000 max with quality filtering)
    console.log('[Refresh] Fetching markets from Polymarket...');
    const markets = await getAllMarkets(10000, false);

    // Calculate basic stats
    const stats: GlobalStats = {
      totalVolume24h: markets.reduce((sum, m) => sum + m.volume24h, 0),
      openPositions24h: Math.round(markets.reduce((sum, m) => sum + m.volume24h, 0) / 100),
      activeMarkets: markets.filter((m) => new Date(m.endsAt) > new Date()).length,
    };

    // Write to cache
    await writeMarketsCache(markets, stats);

    const duration = Date.now() - startTime;
    console.log(`[Refresh] Completed in ${duration}ms - ${markets.length} markets cached`);

    return NextResponse.json({
      success: true,
      marketsCount: markets.length,
      activeMarkets: stats.activeMarkets,
      totalVolume24h: stats.totalVolume24h,
      refreshDurationMs: duration,
    });
  } catch (error) {
    console.error('[Refresh] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
