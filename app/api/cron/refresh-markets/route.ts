import { NextResponse } from 'next/server';
import { writeMarketsToKV, getMarketsCacheStatus } from '@/lib/cache/markets-kv';
import { fetchPolymarketMarketsWithPagination, parsePolymarketOutcomes, PolymarketMarket } from '@/lib/api/polymarket';
import { getBatchMarketPriceChanges, getCachedSpreads } from '@/lib/api/snapshots';
import { getKVStatus } from '@/lib/cloudflare-kv';
import { Market, GlobalStats, Category, TradabilityStatus } from '@/types/market';

/**
 * Calculate tradability score and status from spread and depth data
 */
function calculateTradability(spread: number, depth: number): {
  score: number;
  status: TradabilityStatus;
} {
  // Spread scoring (0-5 points)
  let spreadScore = 0;
  if (spread < 0.005) spreadScore = 5;      // <0.5%
  else if (spread < 0.01) spreadScore = 4;  // <1%
  else if (spread < 0.02) spreadScore = 3;  // <2%
  else if (spread < 0.05) spreadScore = 2;  // <5%
  else if (spread < 0.10) spreadScore = 1;  // <10%

  // Depth scoring (0-5 points) based on $K available
  let depthScore = 0;
  if (depth > 100000) depthScore = 5;       // >$100K
  else if (depth > 50000) depthScore = 4;   // >$50K
  else if (depth > 20000) depthScore = 3;   // >$20K
  else if (depth > 5000) depthScore = 2;    // >$5K
  else if (depth > 1000) depthScore = 1;    // >$1K

  const score = spreadScore + depthScore;
  const status: TradabilityStatus = score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'fair' : 'poor';

  return { score, status };
}

/**
 * Calculate trending score for a market
 * Higher score = more trending (volume spike + price movement + recency)
 */
function calculateTrendingScore(pm: PolymarketMarket): number {
  const volume24h = pm.volume24hrNum || pm.volume24hr || 0;
  const volume7d = pm.volume1wk || 0;
  const priceChange = Math.abs(pm.oneDayPriceChange || 0);
  const liquidity = pm.liquidityNum || pm.liquidity || 0;
  const createdAt = new Date(pm.createdAt);
  const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

  // Minimum volume threshold - no trending for garbage markets
  if (volume24h < 5000) return 0;

  // 1. Volume Spike (40% weight)
  const dailyAvg7d = volume7d > 0 ? volume7d / 7 : volume24h;
  const volumeSpike = Math.min(volume24h / dailyAvg7d, 10);
  const volumeScore = volumeSpike * 4; // 0-40 points

  // 2. Volume-Weighted Price Movement (30% weight)
  const volumeRatio = Math.min(volume24h / 100000, 1);
  const priceScore = priceChange * volumeRatio * 100 * 3; // 0-30 points

  // 3. Liquidity Quality (20% weight)
  const liquidityScore = Math.min(liquidity / 500000, 1) * 20; // 0-20 points

  // 4. Recency Boost (10% weight)
  const recencyScore = Math.max(0, 1 - hoursOld / 720) * 10; // 0-10 points

  return Math.round(volumeScore + priceScore + liquidityScore + recencyScore);
}

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Allow up to 2 minutes for fetching 10K markets

// Cron job to refresh markets cache every 5 minutes
// Triggered by external cron service (cron-job.org)
export async function GET(request: Request) {
  const startTime = Date.now();

  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    if (!isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const kvStatus = getKVStatus();
    console.log(`[Refresh Markets] KV status:`, kvStatus);

    // Fetch all markets from Polymarket (up to 10,000)
    const MARKET_LIMIT = 10000;
    console.log(`[Refresh Markets] Fetching up to ${MARKET_LIMIT} markets...`);

    const rawMarkets = await fetchPolymarketMarketsWithPagination(MARKET_LIMIT);
    console.log(`[Refresh Markets] Fetched ${rawMarkets.length} raw markets`);

    if (rawMarkets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No markets fetched from API',
        duration: `${Date.now() - startTime}ms`,
      }, { status: 500 });
    }

    // Get price changes from Redis snapshots
    const marketsForPriceChange = rawMarkets.map((pm) => {
      const { prices } = parsePolymarketOutcomes(pm);
      return { id: pm.id, probability: Math.round(prices[0] * 100) };
    });

    const priceChanges = await getBatchMarketPriceChanges(marketsForPriceChange);
    console.log(`[Refresh Markets] Got price changes for ${priceChanges.size} markets`);

    // Get spread data from Redis
    const spreads = await getCachedSpreads();
    console.log(`[Refresh Markets] Got spread data for ${spreads ? Object.keys(spreads).length : 0} markets`);

    // Transform to Market type (with trendingScore calculation)
    const markets: Market[] = rawMarkets.map((pm) => {
      const { outcomes, prices } = parsePolymarketOutcomes(pm);
      const changes = priceChanges.get(pm.id) || { change1h: 0, change6h: 0, change24h: 0 };
      const spreadData = spreads?.[pm.id];
      const isMultiOutcome = outcomes.length > 2;
      const tagLabels = pm.tags?.map(t => t.label).join(' ') || '';
      const trendingScore = calculateTrendingScore(pm);

      // Calculate tradability from spread data
      let tradability: { score?: number; status?: TradabilityStatus; spread?: number } = {};
      if (spreadData) {
        const spreadDecimal = spreadData.spreadPercent / 100;
        const depth = spreadData.depth1Pct || pm.liquidityNum || 0;
        const { score, status } = calculateTradability(spreadDecimal, depth);
        tradability = {
          score,
          status,
          spread: spreadData.bestAsk - spreadData.bestBid,
        };
      }

      return {
        id: pm.id,
        name: pm.question || 'Unknown Market',
        category: inferCategory(tagLabels, pm.question || '') as Category,
        platform: 'polymarket' as const,
        marketType: isMultiOutcome ? 'multi' : 'binary',
        probability: Math.round(prices[0] * 100),
        volume24h: pm.volume24hrNum || pm.volume24hr || 0,
        trades24h: 0, // Polymarket doesn't expose this directly
        change1h: changes.change1h,
        change6h: changes.change6h,
        change24h: changes.change24h,
        endsAt: new Date(pm.endDate || Date.now() + 86400000),
        createdAt: new Date(pm.createdAt || Date.now()),
        imageUrl: pm.image || pm.icon,
        isHot: pm.featured || (pm.volume24hrNum || 0) > 1000000,
        trendingScore,
        // Include spread/tradability data if available
        spread: tradability.spread,
        spreadPercent: spreadData?.spreadPercent,
        depth1Pct: spreadData?.depth1Pct,
        tradabilityScore: tradability.score,
        tradabilityStatus: tradability.status,
      };
    });

    // Calculate global stats
    const stats: GlobalStats = {
      totalVolume24h: markets.reduce((sum, m) => sum + m.volume24h, 0),
      openPositions24h: Math.round(markets.reduce((sum, m) => sum + m.volume24h, 0) / 100),
      activeMarkets: markets.filter((m) => m.endsAt > new Date()).length,
    };

    // Write to KV (or fallback to file)
    console.log(`[Refresh Markets] Writing ${markets.length} markets to cache...`);
    const writeResult = await writeMarketsToKV(markets, stats, MARKET_LIMIT);

    const duration = Date.now() - startTime;
    const cacheStatus = await getMarketsCacheStatus();

    console.log(`[Refresh Markets] Complete in ${duration}ms`);

    return NextResponse.json({
      success: writeResult.success,
      marketsCount: markets.length,
      kvSuccess: writeResult.kvSuccess,
      fileSuccess: writeResult.fileSuccess,
      kvConfigured: kvStatus.configured,
      cacheStatus,
      stats: {
        totalVolume24h: Math.round(stats.totalVolume24h),
        activeMarkets: stats.activeMarkets,
      },
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Refresh Markets] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        kvStatus: getKVStatus(),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Infer category from Polymarket category and title
 */
function inferCategory(category: string, title: string): string {
  const c = category.toLowerCase();
  const t = title.toLowerCase();

  if (c.includes('politic') || t.includes('trump') || t.includes('biden') || t.includes('election')) {
    return 'politics';
  }
  if (c.includes('sport') || t.includes('nba') || t.includes('nfl') || t.includes('ufc')) {
    return 'sports';
  }
  if (c.includes('crypto') || t.includes('bitcoin') || t.includes('ethereum')) {
    return 'crypto';
  }
  if (c.includes('financ') || t.includes('stock') || t.includes('fed')) {
    return 'finance';
  }
  if (c.includes('tech') || t.includes('ai') || t.includes('openai')) {
    return 'tech';
  }
  if (c.includes('culture') || c.includes('entertainment')) {
    return 'culture';
  }

  return 'world';
}
