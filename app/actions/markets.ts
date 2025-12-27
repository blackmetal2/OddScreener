'use server';

import {
  getAllMarkets,
  getMarketById,
  getPriceHistory,
  getMultiOutcomePriceHistory,
  getMarketTrades,
  getMarketHolders,
  getGlobalStats,
} from '@/lib/api/markets';
import {
  readMarketsCache,
  writeMarketsCache,
  isCacheStale,
  hasSufficientMarkets,
} from '@/lib/cache/markets-cache';
import {
  readMarketsFromKV,
  writeMarketsToKV,
} from '@/lib/cache/markets-kv';
import {
  Market,
  MarketDetail,
  MarketTrade,
  MarketHolder,
  PricePoint,
  MultiOutcomePricePoint,
  GlobalStats,
  Platform,
  NewsArticle,
  Category,
  FilterState,
} from '@/types/market';

const EXPECTED_MARKET_LIMIT = 10000; // Increased from 2000 to support 10K+ markets

/**
 * Get markets from cache (KV first, then file fallback)
 * Cron job refreshes cache every 5 minutes - we just read here
 */
async function getMarketsFromCache(): Promise<Market[]> {
  // Try KV cache first (primary)
  const kvData = await readMarketsFromKV();
  if (kvData && kvData.markets.length > 0) {
    console.log(`[Markets] Using KV cache (${kvData.markets.length} markets)`);
    return kvData.markets;
  }

  // Fallback to file cache
  const cache = await readMarketsCache();
  if (cache && !isCacheStale(cache) && hasSufficientMarkets(cache, EXPECTED_MARKET_LIMIT)) {
    console.log(`[Markets] Using file cache (${cache.markets.length} markets)`);
    return cache.markets;
  }

  // Last resort: fetch directly from API (should rarely happen)
  console.log('[Markets] No cache available - fetching from API...');
  const markets = await getAllMarkets(EXPECTED_MARKET_LIMIT, false);

  // Calculate stats and write to both caches in background
  const stats: GlobalStats = {
    totalVolume24h: markets.reduce((sum, m) => sum + m.volume24h, 0),
    openPositions24h: Math.round(markets.reduce((sum, m) => sum + m.volume24h, 0) / 100),
    activeMarkets: markets.filter((m) => new Date(m.endsAt) > new Date()).length,
  };

  // Write to KV and file cache in background
  writeMarketsToKV(markets, stats, EXPECTED_MARKET_LIMIT).catch((e) =>
    console.error('[Markets] KV cache write failed:', e)
  );

  return markets;
}

/**
 * Fetch markets with filtering and sorting
 */
export async function fetchMarkets(
  filters?: Partial<FilterState>
): Promise<Market[]> {
  try {
    // Read from cache (fast) or fetch fresh if stale
    let markets = await getMarketsFromCache();

    // Apply platform filter
    if (filters?.platform && filters.platform !== 'all') {
      markets = markets.filter((m) => m.platform === filters.platform);
    }

    // Apply category filter
    if (filters?.category && filters.category !== 'all') {
      markets = markets.filter((m) => m.category === filters.category);
    }

    // Apply search filter
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      markets = markets.filter((m) => m.name.toLowerCase().includes(search));
    }

    // Apply sorting based on timeframe
    if (filters?.timeframe) {
      switch (filters.timeframe) {
        case '1h':
          markets.sort((a, b) => Math.abs(b.change1h) - Math.abs(a.change1h));
          break;
        case '6h':
          markets.sort((a, b) => Math.abs(b.change6h) - Math.abs(a.change6h));
          break;
        case '24h':
          markets.sort(
            (a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)
          );
          break;
        default:
          // 'all' or 'trending' - sort by volume
          markets.sort((a, b) => b.volume24h - a.volume24h);
      }
    }

    // Apply custom sorting
    if (filters?.sortBy) {
      const order = filters.sortOrder === 'asc' ? 1 : -1;
      switch (filters.sortBy) {
        case 'volume':
          markets.sort((a, b) => (b.volume24h - a.volume24h) * order);
          break;
        case 'change':
          markets.sort(
            (a, b) => (Math.abs(b.change24h) - Math.abs(a.change24h)) * order
          );
          break;
        case 'probability':
          markets.sort((a, b) => (b.probability - a.probability) * order);
          break;
        case 'ending':
          markets.sort(
            (a, b) =>
              (new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime()) *
              order
          );
          break;
      }
    }

    return markets;
  } catch (error) {
    console.error('Error in fetchMarkets:', error);
    return [];
  }
}

/**
 * Fetch a single market by ID and platform
 */
export async function fetchMarketDetail(
  id: string,
  platform: Platform
): Promise<MarketDetail | null> {
  try {
    return await getMarketById(id, platform);
  } catch (error) {
    console.error('Error in fetchMarketDetail:', error);
    return null;
  }
}

/**
 * Fetch price history for a market
 */
export async function fetchPriceHistory(
  id: string,
  platform: Platform,
  interval: '1h' | '6h' | '1d' | '1w' = '1d'
): Promise<PricePoint[]> {
  try {
    return await getPriceHistory(id, platform, interval);
  } catch (error) {
    console.error('Error in fetchPriceHistory:', error);
    return [];
  }
}

/**
 * Fetch multi-outcome price history for a market
 */
export async function fetchMultiOutcomePriceHistory(
  id: string,
  platform: Platform,
  interval: '1h' | '6h' | '1d' | '1w' = '1d'
): Promise<MultiOutcomePricePoint[]> {
  try {
    return await getMultiOutcomePriceHistory(id, platform, interval);
  } catch (error) {
    console.error('Error in fetchMultiOutcomePriceHistory:', error);
    return [];
  }
}

/**
 * Fetch recent trades for a market
 */
export async function fetchTrades(
  id: string,
  platform: Platform
): Promise<MarketTrade[]> {
  try {
    return await getMarketTrades(id, platform);
  } catch (error) {
    console.error('Error in fetchTrades:', error);
    return [];
  }
}

/**
 * Fetch global stats (from cache if available)
 */
export async function fetchGlobalStats(): Promise<GlobalStats> {
  try {
    // Try KV cache first (primary)
    const kvData = await readMarketsFromKV();
    if (kvData && kvData.stats) {
      console.log(`[Stats] Using KV cache (${kvData.stats.activeMarkets} markets)`);
      return kvData.stats;
    }

    // Fallback to file cache
    const cache = await readMarketsCache();
    if (cache && !isCacheStale(cache)) {
      return cache.stats;
    }
    // Fallback to API
    return await getGlobalStats();
  } catch (error) {
    console.error('Error in fetchGlobalStats:', error);
    return {
      totalVolume24h: 0,
      openPositions24h: 0,
      activeMarkets: 0,
    };
  }
}

/**
 * Fetch top holders for a market
 * Note: Only available for Polymarket.
 */
export async function fetchHolders(
  id: string,
  platform: Platform
): Promise<MarketHolder[]> {
  try {
    return await getMarketHolders(id, platform);
  } catch (error) {
    console.error('Error in fetchHolders:', error);
    return [];
  }
}

/**
 * Fetch contextual news for a market
 */
export async function fetchMarketNews(marketTitle: string): Promise<NewsArticle[]> {
  try {
    const { getContextualNews } = await import('@/lib/api/googleNews');
    return await getContextualNews(marketTitle);
  } catch (error) {
    console.error('Error in fetchMarketNews:', error);
    return [];
  }
}

// ============================================
// TRADER PROFILE ACTIONS
// ============================================

import { TraderPosition, TraderTrade, TraderProfile, TraderClosedPosition } from '@/types/market';
import {
  fetchUserPositions as fetchPositionsAPI,
  fetchUserTrades as fetchTradesAPI,
  fetchTraderProfile as fetchProfileAPI,
  fetchClosedPositions as fetchClosedPositionsAPI,
  fetchRecentTradesForAddresses,
  PolymarketUserPosition,
  PolymarketUserTrade,
  PolymarketClosedPosition,
} from '@/lib/api/polymarket';

/**
 * Infer market category from slug and title
 */
function inferCategoryFromSlug(slug: string, title: string = ''): Category {
  const s = (slug + ' ' + title).toLowerCase();

  // Politics
  if (s.includes('trump') || s.includes('biden') || s.includes('election') ||
      s.includes('senate') || s.includes('congress') || s.includes('governor') ||
      s.includes('president') || s.includes('political') || s.includes('vote') ||
      s.includes('democrat') || s.includes('republican') || s.includes('poll')) {
    return 'politics';
  }

  // Sports
  if (s.includes('nba') || s.includes('nfl') || s.includes('ufc') || s.includes('mlb') ||
      s.includes('nhl') || s.includes('soccer') || s.includes('football') ||
      s.includes('basketball') || s.includes('tennis') || s.includes('golf') ||
      s.includes('f1') || s.includes('formula') || s.includes('racing') ||
      s.includes('super bowl') || s.includes('world series') || s.includes('championship') ||
      s.includes('playoffs') || s.includes('match') || s.includes('game ')) {
    return 'sports';
  }

  // Crypto
  if (s.includes('bitcoin') || s.includes('btc') || s.includes('ethereum') || s.includes('eth') ||
      s.includes('crypto') || s.includes('solana') || s.includes('sol') ||
      s.includes('token') || s.includes('defi') || s.includes('nft') ||
      s.includes('binance') || s.includes('coinbase')) {
    return 'crypto';
  }

  // Finance
  if (s.includes('stock') || s.includes('nasdaq') || s.includes('s&p') || s.includes('dow') ||
      s.includes('fed') || s.includes('interest rate') || s.includes('inflation') ||
      s.includes('gdp') || s.includes('earnings') || s.includes('ipo') ||
      s.includes('tesla') || s.includes('apple') || s.includes('nvidia') ||
      s.includes('market cap') || s.includes('price target')) {
    return 'finance';
  }

  // Tech
  if (s.includes('ai') || s.includes('openai') || s.includes('chatgpt') || s.includes('google') ||
      s.includes('meta') || s.includes('microsoft') || s.includes('amazon') ||
      s.includes('twitter') || s.includes('tiktok') || s.includes('app store') ||
      s.includes('iphone') || s.includes('android') || s.includes('launch')) {
    return 'tech';
  }

  // Culture/Entertainment
  if (s.includes('oscar') || s.includes('grammy') || s.includes('emmy') ||
      s.includes('movie') || s.includes('film') || s.includes('album') ||
      s.includes('celebrity') || s.includes('kardashian') || s.includes('music') ||
      s.includes('taylor swift') || s.includes('concert') || s.includes('tour')) {
    return 'culture';
  }

  // Default to world/general
  return 'world';
}

/**
 * Transform Polymarket position to our TraderPosition type
 */
function transformPosition(pos: PolymarketUserPosition): TraderPosition {
  return {
    marketId: pos.conditionId,
    marketTitle: pos.title,
    marketSlug: pos.slug,
    marketImage: pos.icon,
    outcome: pos.outcome,
    side: pos.outcomeIndex === 0 ? 'YES' : 'NO',
    shares: pos.size,
    currentValue: pos.currentValue,
    avgPrice: pos.avgPrice,
    invested: pos.initialValue,
    realizedPnl: pos.realizedPnl,
    unrealizedPnl: pos.cashPnl - pos.realizedPnl,
    overallPnl: pos.cashPnl,
    resolved: pos.redeemable || pos.mergeable,
    category: inferCategoryFromSlug(pos.eventSlug || pos.slug, pos.title),
  };
}

/**
 * Transform Polymarket trade to our TraderTrade type
 */
function transformTrade(trade: PolymarketUserTrade): TraderTrade {
  // Determine side based on type and side fields
  let side: 'buy' | 'sell' | 'redeem' | 'merge';
  if (trade.type === 'REDEEM') {
    side = 'redeem';
  } else if (trade.type === 'MERGE') {
    side = 'merge';
  } else if (trade.side) {
    side = trade.side.toLowerCase() as 'buy' | 'sell';
  } else {
    side = 'buy'; // fallback
  }

  return {
    id: trade.transactionHash,
    timestamp: new Date(trade.timestamp * 1000), // API returns seconds, convert to ms
    side,
    marketTitle: trade.title,
    marketSlug: trade.slug,
    marketImage: trade.icon,
    outcome: trade.outcome || (trade.type === 'REDEEM' ? 'Won' : ''),
    outcomeIndex: trade.outcomeIndex,
    value: trade.usdcSize,
    price: trade.price,
    shares: trade.size,
    category: inferCategoryFromSlug(trade.slug, trade.title),
  };
}

/**
 * Fetch trader positions
 */
export async function fetchTraderPositions(address: string): Promise<TraderPosition[]> {
  try {
    const positions = await fetchPositionsAPI(address, 200);
    return positions.map(transformPosition);
  } catch (error) {
    console.error('Error in fetchTraderPositions:', error);
    return [];
  }
}

/**
 * Fetch trader trades
 */
export async function fetchTraderTrades(address: string, limit: number = 1000): Promise<TraderTrade[]> {
  try {
    const trades = await fetchTradesAPI(address, limit);
    return trades.map(transformTrade);
  } catch (error) {
    console.error('Error in fetchTraderTrades:', error);
    return [];
  }
}

/**
 * Transform Polymarket closed position to our TraderClosedPosition type
 */
function transformClosedPosition(pos: PolymarketClosedPosition): TraderClosedPosition {
  return {
    marketId: pos.conditionId,
    marketTitle: pos.title,
    marketSlug: pos.slug,
    marketImage: pos.icon,
    outcome: pos.outcome,
    avgPrice: pos.avgPrice,
    totalBought: pos.totalBought,
    realizedPnl: pos.realizedPnl,
    closedAt: new Date(pos.timestamp * 1000),
    category: inferCategoryFromSlug(pos.slug, pos.title),
  };
}

/**
 * Fetch trader closed positions (for accurate P&L calculation)
 */
export async function fetchTraderClosedPositions(address: string): Promise<TraderClosedPosition[]> {
  try {
    const closedPositions = await fetchClosedPositionsAPI(address, 500);
    return closedPositions.map(transformClosedPosition);
  } catch (error) {
    console.error('Error in fetchTraderClosedPositions:', error);
    return [];
  }
}

/**
 * Fetch complete trader profile with positions and basic stats
 */
export async function fetchTraderProfileData(address: string): Promise<TraderProfile | null> {
  try {
    const profile = await fetchProfileAPI(address);
    if (!profile) return null;

    const positions = await fetchPositionsAPI(address, 50);

    return {
      address,
      displayName: profile.displayName,
      profileImage: profile.profileImage,
      rank: profile.rank,
      pnl: profile.pnl,
      volume: profile.volume,
      positionsCount: positions.length,
      tradesCount: 0, // Will be fetched separately
    };
  } catch (error) {
    console.error('Error in fetchTraderProfileData:', error);
    return null;
  }
}

/**
 * Fetch recent trades for multiple tracked whales
 * Returns a serializable object (not Map) for client use
 */
export async function fetchTrackedWhaleTrades(
  addresses: string[]
): Promise<Record<string, TraderTrade | null>> {
  try {
    if (addresses.length === 0) {
      return {};
    }

    // Fetch 1 trade per address
    const tradesMap = await fetchRecentTradesForAddresses(addresses, 1);

    // Transform to serializable object with TraderTrade format
    const result: Record<string, TraderTrade | null> = {};

    for (const address of addresses) {
      const normalizedAddress = address.toLowerCase();
      const trades = tradesMap.get(normalizedAddress);

      if (trades && trades.length > 0) {
        result[normalizedAddress] = transformTrade(trades[0]);
      } else {
        result[normalizedAddress] = null;
      }
    }

    return result;
  } catch (error) {
    console.error('Error in fetchTrackedWhaleTrades:', error);
    return {};
  }
}
