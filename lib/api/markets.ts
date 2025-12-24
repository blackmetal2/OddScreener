import {
  Market,
  MarketDetail,
  MarketOutcome,
  MarketTrade,
  MarketHolder,
  PricePoint,
  MultiOutcomePricePoint,
  GlobalStats,
  Platform,
  Category,
} from '@/types/market';
import {
  fetchPolymarketMarkets,
  fetchPolymarketMarketsWithPagination,
  fetchPolymarketMarketById,
  fetchPolymarketPriceHistory,
  fetchAllOutcomesPriceHistory,
  fetchPolymarketHolders,
  fetchMarketTradesByConditionId,
  parsePolymarketOutcomes,
  getPolymarketTokenIds,
  getPolymarketEventSlug,
  mapPolymarketCategory,
  calculatePriceChange,
} from './polymarket';
import { PolymarketMarket, PolymarketPricePoint } from './types';
import { getBatchMarketPriceChanges } from './snapshots';

/**
 * Normalize a Polymarket market to our Market type
 */
async function normalizePolymarketMarket(
  pm: PolymarketMarket,
  fetchDetailedPriceChanges: boolean = false
): Promise<Market> {
  const { outcomes, prices } = parsePolymarketOutcomes(pm);
  const tokenIds = getPolymarketTokenIds(pm);
  const isMultiOutcome = outcomes.length > 2;

  // Get probability (first outcome price * 100)
  const probability = Math.round(prices[0] * 100);

  // Use API-provided price change for 24h (convert from decimal to percentage points)
  // oneDayPriceChange is like -0.02 meaning -2 percentage points
  let change24h = pm.oneDayPriceChange ? Math.round(pm.oneDayPriceChange * 100 * 10) / 10 : 0;
  let change1h = 0;
  let change6h = 0;

  // Only fetch detailed 1h/6h changes for top markets (expensive API calls)
  if (fetchDetailedPriceChanges && tokenIds[0]) {
    try {
      const history = await fetchPolymarketPriceHistory(tokenIds[0], '1d');
      change1h = Math.round(calculatePriceChange(history, 1) * 10) / 10;
      change6h = Math.round(calculatePriceChange(history, 6) * 10) / 10;
      // Also get more accurate 24h from history if available
      const historyChange24h = Math.round(calculatePriceChange(history, 24) * 10) / 10;
      if (historyChange24h !== 0) {
        change24h = historyChange24h;
      }
    } catch (e) {
      console.error('Error fetching Polymarket price history:', e);
    }
  }

  // Map category (with question fallback for better detection)
  const category = mapPolymarketCategory(pm.tags || [], pm.question) as Category;

  // Build market object
  const market: Market = {
    id: pm.id, // Use numeric ID for API lookups
    name: pm.question,
    platform: 'polymarket' as Platform,
    category,
    marketType: isMultiOutcome ? 'multi' : 'binary',
    probability,
    change1h,
    change6h,
    change24h,
    volume24h: pm.volume24hrNum || pm.volume24hr || 0,
    trades24h: 0, // Polymarket doesn't expose this directly
    endsAt: new Date(pm.endDate),
    createdAt: new Date(pm.createdAt),
    imageUrl: pm.image || pm.icon,
    isHot: pm.featured || pm.volume24hrNum > 1000000,
  };

  // Add outcomes for ALL markets (binary and multi-outcome)
  // This allows UI to show actual outcome names instead of generic "YES"/"NO"
  market.outcomes = outcomes.map((name, i) => ({
    id: `${pm.id}-${i}`,
    name,
    probability: Math.round(prices[i] * 100),
    change1h: 0, // Would need per-outcome price history
    change6h: 0,
    change24h: 0,
    volume24h: 0,
  }));

  return market;
}


/**
 * Calculate trending score for a market
 * Higher score = more trending (volume spike + price movement + recency)
 */
function calculateTrendingScore(pm: PolymarketMarket): number {
  const volume24h = pm.volume24hr || pm.volume24hrNum || 0;
  const volume7d = pm.volume1wk || 0;
  const priceChange = Math.abs(pm.oneDayPriceChange || 0);
  const createdAt = new Date(pm.createdAt);
  const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

  // Minimum volume threshold - no trending for garbage markets
  if (volume24h < 5000) return 0;

  // Volume spike ratio: compare 24h to daily average of 7d
  // If volume24h is 3x the daily average, spike ratio = 3
  const dailyAvg7d = volume7d > 0 ? volume7d / 7 : volume24h;
  const volumeSpike = dailyAvg7d > 0 ? volume24h / dailyAvg7d : 1;

  // Price velocity boost (bigger price swings = more trending)
  // priceChange of 0.10 (10%) gets 2x boost
  const priceBoost = 1 + priceChange * 10;

  // Recency boost for newer markets (decay over 30 days)
  const recencyBoost = Math.max(0, 1 - hoursOld / 720) * 0.5 + 1;

  // Final score: cap volume spike to avoid outliers dominating
  const cappedVolumeSpike = Math.min(volumeSpike, 10);
  return cappedVolumeSpike * priceBoost * recencyBoost;
}

/**
 * Fetch all markets from Polymarket with pagination and quality filtering
 */
export async function getAllMarkets(
  limit: number = 10000,
  fetchPriceChanges: boolean = false
): Promise<Market[]> {
  try {
    // Fetch from Polymarket with pagination and volume filtering
    const polymarketData = await fetchPolymarketMarketsWithPagination(limit, 1000).catch((e) => {
      console.error('Polymarket fetch error:', e);
      return [];
    });

    console.log(`[Markets] Processing ${polymarketData.length} markets from Polymarket`);

    // Calculate trending scores for all markets (before normalization)
    const trendingScores = new Map<string, number>();
    for (const pm of polymarketData) {
      trendingScores.set(pm.id, calculateTrendingScore(pm));
    }

    // Normalize markets (without individual price change fetching - we'll use snapshots)
    const normalizePromises: Promise<Market>[] = [];

    for (let i = 0; i < polymarketData.length; i++) {
      normalizePromises.push(
        normalizePolymarketMarket(polymarketData[i], false) // Don't fetch individual price changes
      );
    }

    const markets = await Promise.all(normalizePromises);

    // Get price changes from Upstash snapshots (one batch call for all markets)
    let priceChangesMap = new Map<string, { change1h: number; change6h: number; change24h: number }>();
    try {
      priceChangesMap = await getBatchMarketPriceChanges(
        markets.map((m) => ({ id: m.id, probability: m.probability }))
      );
      console.log(`[Markets] Got price changes from snapshots for ${priceChangesMap.size} markets`);
    } catch (e) {
      console.error('[Markets] Error fetching snapshot price changes:', e);
      // Continue without snapshot changes - markets will have API-provided 24h change only
    }

    // Apply snapshot-based price changes to markets
    const marketsWithChanges = markets.map((market) => {
      const changes = priceChangesMap.get(market.id);
      if (changes) {
        // Use snapshot changes if available, otherwise keep original
        return {
          ...market,
          change1h: changes.change1h || market.change1h,
          change6h: changes.change6h || market.change6h,
          change24h: changes.change24h || market.change24h,
          trendingScore: trendingScores.get(market.id) || 0,
        };
      }
      return {
        ...market,
        trendingScore: trendingScores.get(market.id) || 0,
      };
    });

    // Sort by volume descending (default)
    return marketsWithChanges.sort((a, b) => b.volume24h - a.volume24h);
  } catch (error) {
    console.error('Error fetching all markets:', error);
    return [];
  }
}

/**
 * Get a specific market by ID (Polymarket only)
 */
export async function getMarketById(
  id: string,
  platform: Platform
): Promise<MarketDetail | null> {
  try {
    const pm = await fetchPolymarketMarketById(id);
    if (!pm) return null;

    const market = await normalizePolymarketMarket(pm, true);
    const tokenIds = getPolymarketTokenIds(pm);

    // Fetch price history for the chart
    let priceHistory: PolymarketPricePoint[] = [];
    if (tokenIds[0]) {
      priceHistory = await fetchPolymarketPriceHistory(tokenIds[0], 'max');
    }

    // Find ATH/ATL from history
    let allTimeHigh = market.probability;
    let allTimeLow = market.probability;
    let allTimeHighDate = new Date();
    let allTimeLowDate = new Date();

    if (priceHistory.length > 0) {
      for (const point of priceHistory) {
        const prob = point.p * 100;
        if (prob > allTimeHigh) {
          allTimeHigh = prob;
          allTimeHighDate = new Date(point.t * 1000);
        }
        if (prob < allTimeLow) {
          allTimeLow = prob;
          allTimeLowDate = new Date(point.t * 1000);
        }
      }
    }

    const detail: MarketDetail = {
      ...market,
      description: pm.description || '',
      resolutionSource: 'Official sources',
      rules:
        pm.description ||
        'Market resolves YES if the condition is met, otherwise NO.',
      totalVolume: pm.volumeNum || pm.volume || 0,
      openInterest: pm.liquidityNum || pm.liquidity || 0,
      uniqueTraders: 0,
      liquidityDepth: pm.liquidityNum || pm.liquidity || 0,
      allTimeHigh: Math.round(allTimeHigh),
      allTimeHighDate,
      allTimeLow: Math.round(allTimeLow),
      allTimeLowDate,
      platformUrl: `https://polymarket.com/event/${getPolymarketEventSlug(pm)}`,
      stats: {
        trades: 0,
        yesTrades: 0,
        noTrades: 0,
        yesVolume: 0,
        noVolume: 0,
        uniqueTraders: 0,
      },
    };

    return detail;
  } catch (error) {
    console.error('Error fetching market detail:', error);
    return null;
  }
}

/**
 * Get price history for a market (Polymarket only)
 */
export async function getPriceHistory(
  id: string,
  platform: Platform,
  interval: '1h' | '6h' | '1d' | '1w' = '1d'
): Promise<PricePoint[]> {
  try {
    const pm = await fetchPolymarketMarketById(id);
    if (!pm) return [];

    const tokenIds = getPolymarketTokenIds(pm);
    if (!tokenIds[0]) return [];

    // Map 1w to max since Polymarket doesn't support 1w
    const pmInterval = interval === '1w' ? 'max' : interval;
    const history = await fetchPolymarketPriceHistory(tokenIds[0], pmInterval);
    return history.map((h) => ({
      timestamp: new Date(h.t * 1000),
      probability: h.p * 100,
      volume: 0,
    }));
  } catch (error) {
    console.error('Error fetching price history:', error);
    return [];
  }
}

/**
 * Get price history for all outcomes of a multi-outcome market (Polymarket only)
 */
export async function getMultiOutcomePriceHistory(
  id: string,
  platform: Platform,
  interval: '1h' | '6h' | '1d' | '1w' = '1d'
): Promise<MultiOutcomePricePoint[]> {
  try {
    const pm = await fetchPolymarketMarketById(id);
    if (!pm) {
      console.warn(`[Markets] Market ${id} not found for multi-outcome price history`);
      return [];
    }

    const tokenIds = getPolymarketTokenIds(pm);
    const { outcomes } = parsePolymarketOutcomes(pm);

    console.log(`[Markets] Multi-outcome for ${id}: tokenIds=${tokenIds.length}, outcomes=${outcomes.length}`);

    if (tokenIds.length === 0 || outcomes.length === 0) {
      console.warn(`[Markets] Cannot fetch multi-outcome history: tokenIds=${tokenIds.length}, outcomes=${outcomes.length}`);
      return [];
    }

    // Map interval for Polymarket
    const pmInterval = interval === '1w' ? 'max' : interval;

    return await fetchAllOutcomesPriceHistory(tokenIds, outcomes, pmInterval);
  } catch (error) {
    console.error('Error fetching multi-outcome price history:', error);
    return [];
  }
}

/**
 * Get recent trades for a market
 */
export async function getMarketTrades(
  id: string,
  platform: Platform,
  limit: number = 200
): Promise<MarketTrade[]> {
  try {
    // Fetch market to get the conditionId
    const pm = await fetchPolymarketMarketById(id);
    if (!pm || !pm.conditionId) {
      console.warn(`[Markets] Cannot fetch trades: no conditionId for market ${id}`);
      return [];
    }

    // Fetch trades using conditionId via 'market' parameter (per Polymarket docs)
    const trades = await fetchMarketTradesByConditionId(pm.conditionId, limit);

    console.log(`[Markets] Fetched ${trades.length} trades for market ${id} (${pm.question?.slice(0, 40)}...)`);

    // Transform to our MarketTrade type
    return trades.map((trade) => ({
      id: trade.transactionHash || `${trade.timestamp}-${trade.proxyWallet}`,
      timestamp: new Date(trade.timestamp * 1000),
      type: trade.side.toLowerCase() as 'buy' | 'sell',
      outcome: trade.outcome,
      amount: trade.size * trade.price, // USD value
      shares: trade.size,
      price: trade.price,
      trader: trade.name || trade.pseudonym || `${trade.proxyWallet.slice(0, 6)}...${trade.proxyWallet.slice(-4)}`,
      traderAddress: trade.proxyWallet,
    }));
  } catch (error) {
    console.error('Error fetching market trades:', error);
    return [];
  }
}

/**
 * Get global stats for Polymarket
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  try {
    const markets = await getAllMarkets(100, false);

    const totalVolume24h = markets.reduce((sum, m) => sum + m.volume24h, 0);
    // Sum unique traders as proxy for open positions
    const openPositions24h = markets.reduce((sum, m) => {
      // Estimate from volume - ~$100 per position average
      return sum + Math.round(m.volume24h / 100);
    }, 0);

    return {
      totalVolume24h,
      openPositions24h,
      activeMarkets: markets.length,
    };
  } catch (error) {
    console.error('Error calculating global stats:', error);
    return {
      totalVolume24h: 0,
      openPositions24h: 0,
      activeMarkets: 0,
    };
  }
}

/**
 * Get top holders for a market (Polymarket only)
 */
export async function getMarketHolders(
  id: string,
  platform: Platform
): Promise<MarketHolder[]> {
  try {
    const pm = await fetchPolymarketMarketById(id);
    if (!pm) return [];

    // Get the condition ID for the holders API
    const conditionId = pm.conditionId;
    if (!conditionId) {
      console.warn('[Markets] No conditionId for market', id);
      return [];
    }

    // Parse outcome names
    const { outcomes } = parsePolymarketOutcomes(pm);

    // Fetch holders
    const holdersData = await fetchPolymarketHolders(conditionId, 20);

    // Flatten and normalize holders from all tokens
    const holders: MarketHolder[] = [];

    for (const tokenData of holdersData) {
      for (const holder of tokenData.holders) {
        // Determine outcome name based on outcomeIndex
        const outcomeName =
          holder.outcomeIndex >= 0 && holder.outcomeIndex < outcomes.length
            ? outcomes[holder.outcomeIndex]
            : holder.outcomeIndex === 0
            ? 'YES'
            : 'NO';

        holders.push({
          wallet: holder.proxyWallet,
          name:
            holder.displayUsernamePublic && holder.name
              ? holder.name
              : holder.pseudonym || `${holder.proxyWallet.slice(0, 6)}...${holder.proxyWallet.slice(-4)}`,
          profileImage: holder.profileImageOptimized || holder.profileImage,
          outcome: outcomeName,
          amount: holder.amount,
          bio: holder.bio,
        });
      }
    }

    // Sort by amount descending
    return holders.sort((a, b) => b.amount - a.amount);
  } catch (error) {
    console.error('Error fetching market holders:', error);
    return [];
  }
}
