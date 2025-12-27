import {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketMarketEvent,
  PolymarketPriceHistoryResponse,
  PolymarketPricePoint,
  PolymarketTokenHolders,
} from './types';

// Re-export types needed by other modules
export type { PolymarketMarket };
import { sanitizeUsername } from '@/lib/utils';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';
const CLOB_API_BASE = 'https://clob.polymarket.com';
const DATA_API_BASE = 'https://data-api.polymarket.com';

// Cache duration for Next.js fetch
const CACHE_DURATION = 60; // 60 seconds

// Spam tag IDs to exclude (from competitor analysis)
const EXCLUDED_TAG_IDS = ['1312', '1', '100639', '102127'];

// Minimum volume threshold to filter garbage markets
const MIN_VOLUME_THRESHOLD = 100; // $100 minimum 24h volume

/**
 * Fetch all active events with their markets from Polymarket
 */
export async function fetchPolymarketEvents(
  limit: number = 100,
  offset: number = 0
): Promise<PolymarketEvent[]> {
  const params = new URLSearchParams({
    closed: 'false',
    limit: limit.toString(),
    offset: offset.toString(),
    order: 'volume24hr',
    ascending: 'false',
  });

  const response = await fetch(`${GAMMA_API_BASE}/events?${params}`, {
    next: { revalidate: CACHE_DURATION },
  });

  if (!response.ok) {
    throw new Error(`Polymarket API error: ${response.status}`);
  }

  const data = await response.json();
  return data as PolymarketEvent[];
}

/**
 * Fetch all active markets from Polymarket with pagination and filtering
 * @param limit - Max markets per page (max 500)
 * @param offset - Pagination offset
 * @param excludeTags - Whether to exclude spam tags
 */
export async function fetchPolymarketMarkets(
  limit: number = 100,
  offset: number = 0,
  excludeTags: boolean = true
): Promise<PolymarketMarket[]> {
  const params = new URLSearchParams({
    closed: 'false',
    limit: Math.min(limit, 500).toString(), // API max is 500
    offset: offset.toString(),
    order: 'volume24hr',
    ascending: 'false',
  });

  // Add tag exclusions for spam filtering
  if (excludeTags) {
    EXCLUDED_TAG_IDS.forEach(tagId => {
      params.append('exclude_tag_id', tagId);
    });
  }

  const response = await fetch(`${GAMMA_API_BASE}/markets?${params}`, {
    next: { revalidate: CACHE_DURATION },
  });

  if (!response.ok) {
    throw new Error(`Polymarket API error: ${response.status}`);
  }

  const data = await response.json();
  return data as PolymarketMarket[];
}

/**
 * Fetch markets with pagination - fetches multiple pages to get more markets
 * @param totalLimit - Total markets to fetch (will paginate automatically)
 * @param minVolume - Minimum 24h volume filter (client-side)
 */
export async function fetchPolymarketMarketsWithPagination(
  totalLimit: number = 2000,
  minVolume: number = MIN_VOLUME_THRESHOLD
): Promise<PolymarketMarket[]> {
  const pageSize = 500;
  const pages = Math.ceil(totalLimit / pageSize);
  const allMarkets: PolymarketMarket[] = [];

  // Fetch pages in parallel (max 4 concurrent to avoid rate limits)
  const fetchPromises: Promise<PolymarketMarket[]>[] = [];
  for (let i = 0; i < pages; i++) {
    fetchPromises.push(
      fetchPolymarketMarkets(pageSize, i * pageSize, true).catch((e) => {
        console.error(`Failed to fetch page ${i}:`, e);
        return [];
      })
    );
  }

  const results = await Promise.all(fetchPromises);
  results.forEach((markets) => allMarkets.push(...markets));

  // Filter by minimum volume to exclude garbage markets
  const filteredMarkets = allMarkets.filter(
    (m) => (m.volume24hrNum || m.volume24hr || 0) >= minVolume
  );

  console.log(`[Polymarket] Fetched ${allMarkets.length} markets, ${filteredMarkets.length} after volume filter (min $${minVolume})`);

  return filteredMarkets;
}

/**
 * Fetch a specific event by slug
 */
export async function fetchPolymarketEventBySlug(
  slug: string
): Promise<PolymarketEvent | null> {
  const response = await fetch(`${GAMMA_API_BASE}/events/slug/${slug}`, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Polymarket API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch a specific market by ID
 * Uses the list endpoint with ID filter to include events data
 */
export async function fetchPolymarketMarketById(
  marketId: string
): Promise<PolymarketMarket | null> {
  // Use list endpoint with ID filter to get events data (single market endpoint doesn't include it)
  // No cache for detail pages - always fetch fresh data for accurate liquidity/volume
  const response = await fetch(`${GAMMA_API_BASE}/markets?id=${marketId}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Polymarket API error: ${response.status}`);
  }

  const data = await response.json();
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Fetch price history for a specific token
 * @param tokenId - The CLOB token ID (from clobTokenIds)
 * @param interval - Time interval: '1h', '6h', '1d', '1w', '1m', 'max'
 */
export async function fetchPolymarketPriceHistory(
  tokenId: string,
  interval: '1h' | '6h' | '1d' | '1w' | '1m' | 'max' = '1d'
): Promise<PolymarketPricePoint[]> {
  const params = new URLSearchParams({
    market: tokenId,
    interval: interval,
  });

  const response = await fetch(`${CLOB_API_BASE}/prices-history?${params}`, {
    next: { revalidate: 300 }, // 5 min cache for price history
  });

  if (!response.ok) {
    console.error(`Polymarket price history error: ${response.status}`);
    return [];
  }

  const data: PolymarketPriceHistoryResponse = await response.json();
  return data.history || [];
}

// ============================================
// ORDER BOOK & SPREAD API
// ============================================

export interface OrderBookLevel {
  price: number;
  size: number;
}

export interface OrderBook {
  market: string;
  assetId: string;
  timestamp: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export interface SpreadData {
  tokenId: string;
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPercent: number;
  midPrice: number;
  depth1Pct: number; // Volume within 1% of mid
}

/**
 * Fetch order book for a specific token
 * @param tokenId - The CLOB token ID
 */
export async function fetchOrderBook(tokenId: string): Promise<OrderBook | null> {
  try {
    const response = await fetch(`${CLOB_API_BASE}/book?token_id=${tokenId}`, {
      next: { revalidate: 60 }, // 1 min cache for order book
    });

    if (!response.ok) {
      console.error(`[Polymarket] Order book error for ${tokenId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      market: data.market || '',
      assetId: data.asset_id || tokenId,
      timestamp: data.timestamp || new Date().toISOString(),
      bids: (data.bids || []).map((b: { price: string; size: string }) => ({
        price: parseFloat(b.price),
        size: parseFloat(b.size),
      })),
      asks: (data.asks || []).map((a: { price: string; size: string }) => ({
        price: parseFloat(a.price),
        size: parseFloat(a.size),
      })),
    };
  } catch (error) {
    console.error(`[Polymarket] Failed to fetch order book for ${tokenId}:`, error);
    return null;
  }
}

/**
 * Calculate spread data from an order book
 */
export function calculateSpreadFromOrderBook(orderBook: OrderBook, tokenId: string): SpreadData {
  const { bids, asks } = orderBook;

  // Default values for empty or invalid order books
  if (!bids.length || !asks.length) {
    return {
      tokenId,
      bestBid: 0,
      bestAsk: 1,
      spread: 1,
      spreadPercent: 100,
      midPrice: 0.5,
      depth1Pct: 0,
    };
  }

  // Polymarket API returns bids ascending (lowest first) and asks descending (highest first)
  // Best bid = highest bid price, Best ask = lowest ask price
  const bestBid = Math.max(...bids.map(b => b.price));
  const bestAsk = Math.min(...asks.map(a => a.price));
  const spread = bestAsk - bestBid;
  const midPrice = (bestBid + bestAsk) / 2;
  const spreadPercent = midPrice > 0 ? (spread / midPrice) * 100 : 100;

  // Calculate depth within 1% of mid price
  const lowerBound = midPrice * 0.99;
  const upperBound = midPrice * 1.01;

  const bidDepth = bids
    .filter((b) => b.price >= lowerBound)
    .reduce((sum, b) => sum + b.size * b.price, 0);

  const askDepth = asks
    .filter((a) => a.price <= upperBound)
    .reduce((sum, a) => sum + a.size * a.price, 0);

  const depth1Pct = bidDepth + askDepth;

  return {
    tokenId,
    bestBid,
    bestAsk,
    spread,
    spreadPercent,
    midPrice,
    depth1Pct,
  };
}

/**
 * Fetch spreads for multiple tokens in batch
 * Falls back to individual order book fetches if batch fails
 */
export async function fetchBatchSpreads(
  tokenIds: string[]
): Promise<Map<string, SpreadData>> {
  const spreadsMap = new Map<string, SpreadData>();

  if (tokenIds.length === 0) {
    return spreadsMap;
  }

  // Limit to first 100 tokens to avoid overwhelming the API
  const limitedTokenIds = tokenIds.slice(0, 100);

  try {
    // Try batch spreads endpoint first
    const response = await fetch(`${CLOB_API_BASE}/spreads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_ids: limitedTokenIds }),
      next: { revalidate: 60 }, // 1 min cache
    });

    if (response.ok) {
      const data = await response.json();
      // Process batch response
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.token_id) {
            const spread = parseFloat(item.spread || '0');
            const bestBid = parseFloat(item.bid || '0');
            const bestAsk = parseFloat(item.ask || '1');
            const midPrice = (bestBid + bestAsk) / 2;
            spreadsMap.set(item.token_id, {
              tokenId: item.token_id,
              bestBid,
              bestAsk,
              spread,
              spreadPercent: midPrice > 0 ? (spread / midPrice) * 100 : 100,
              midPrice,
              depth1Pct: 0, // Not available in batch endpoint
            });
          }
        }
        console.log(`[Polymarket] Batch spreads: ${spreadsMap.size}/${limitedTokenIds.length} tokens`);
        return spreadsMap;
      }
    }
  } catch (error) {
    console.warn('[Polymarket] Batch spreads failed, falling back to individual fetches:', error);
  }

  // Fallback: fetch order books individually (in parallel, limited concurrency)
  const CONCURRENCY = 10;
  for (let i = 0; i < limitedTokenIds.length; i += CONCURRENCY) {
    const batch = limitedTokenIds.slice(i, i + CONCURRENCY);
    const orderBooks = await Promise.all(batch.map((id) => fetchOrderBook(id)));

    for (let j = 0; j < batch.length; j++) {
      const orderBook = orderBooks[j];
      if (orderBook) {
        const spreadData = calculateSpreadFromOrderBook(orderBook, batch[j]);
        spreadsMap.set(batch[j], spreadData);
      }
    }
  }

  console.log(`[Polymarket] Individual order books: ${spreadsMap.size}/${limitedTokenIds.length} tokens`);
  return spreadsMap;
}

/**
 * Parse the outcomes from a Polymarket market
 */
export function parsePolymarketOutcomes(market: PolymarketMarket): {
  outcomes: string[];
  prices: number[];
} {
  try {
    const outcomes = JSON.parse(market.outcomes || '["Yes", "No"]');
    const prices = JSON.parse(market.outcomePrices || '[0.5, 0.5]').map(
      (p: string | number) => (typeof p === 'string' ? parseFloat(p) : p)
    );
    return { outcomes, prices };
  } catch {
    return { outcomes: ['Yes', 'No'], prices: [0.5, 0.5] };
  }
}

/**
 * Get the CLOB token IDs for a market
 */
export function getPolymarketTokenIds(market: PolymarketMarket): string[] {
  try {
    const tokenIds = JSON.parse(market.clobTokenIds || '[]');
    if (tokenIds.length === 0) {
      console.warn(`[Polymarket] Empty tokenIds for market ${market.id} (${market.question?.slice(0, 50)}...)`);
    }
    return tokenIds;
  } catch (e) {
    console.error(`[Polymarket] Failed to parse clobTokenIds for market ${market.id}:`, e);
    return [];
  }
}

/**
 * Get the event slug for a market (used for constructing Polymarket URLs)
 * The market slug is NOT valid for URLs - we need the parent event's slug
 */
export function getPolymarketEventSlug(market: PolymarketMarket): string {
  try {
    // Parse events if it's a string
    const events: PolymarketMarketEvent[] =
      typeof market.events === 'string'
        ? JSON.parse(market.events || '[]')
        : market.events || [];

    if (events.length > 0 && events[0].slug) {
      return events[0].slug;
    }

    // Fallback: try to derive event slug from market slug by removing trailing number suffix
    // e.g., "will-trump-release-the-epstein-files-by-december-19-771" -> strip "-771"
    const marketSlug = market.slug || '';
    const slugWithoutSuffix = marketSlug.replace(/-\d+$/, '');
    if (slugWithoutSuffix && slugWithoutSuffix !== marketSlug) {
      console.warn(`[Polymarket] Using derived event slug for market ${market.id}: ${slugWithoutSuffix}`);
      return slugWithoutSuffix;
    }

    // Last fallback: use market slug as-is
    return marketSlug;
  } catch (e) {
    console.error(`[Polymarket] Failed to get event slug for market ${market.id}:`, e);
    return market.slug || '';
  }
}

/**
 * Fetch price history for ALL outcomes of a multi-outcome market
 * Returns merged timeline with all outcome probabilities at each timestamp
 */
export async function fetchAllOutcomesPriceHistory(
  tokenIds: string[],
  outcomeNames: string[],
  interval: '1h' | '6h' | '1d' | '1w' | '1m' | 'max' = '1d'
): Promise<{ timestamp: Date; outcomes: { [name: string]: number } }[]> {
  console.log(`[Polymarket] fetchAllOutcomesPriceHistory: ${tokenIds.length} tokenIds, ${outcomeNames.length} outcomes`);

  if (tokenIds.length === 0) {
    console.warn('[Polymarket] No tokenIds for multi-outcome price history');
    return [];
  }

  if (outcomeNames.length === 0) {
    console.warn('[Polymarket] No outcomeNames for multi-outcome price history');
    return [];
  }

  // Use minimum length if mismatched (fetch what we can)
  const count = Math.min(tokenIds.length, outcomeNames.length);
  if (tokenIds.length !== outcomeNames.length) {
    console.warn(`[Polymarket] Mismatch: ${tokenIds.length} tokenIds vs ${outcomeNames.length} outcomes. Using first ${count}.`);
  }

  const usedTokenIds = tokenIds.slice(0, count);
  const usedOutcomeNames = outcomeNames.slice(0, count);

  // Fetch price history for all tokens in parallel
  const histories = await Promise.all(
    usedTokenIds.map((tokenId) => fetchPolymarketPriceHistory(tokenId, interval))
  );

  // Build a map of timestamp -> { outcomeName: probability }
  const timeMap = new Map<number, { [name: string]: number }>();

  histories.forEach((history, idx) => {
    const outcomeName = usedOutcomeNames[idx];
    for (const point of history) {
      const ts = point.t;
      if (!timeMap.has(ts)) {
        timeMap.set(ts, {});
      }
      timeMap.get(ts)![outcomeName] = point.p * 100; // Convert to percentage
    }
  });

  // Convert to sorted array
  const sortedTimestamps = Array.from(timeMap.keys()).sort((a, b) => a - b);

  // Fill missing values with previous known value
  const result: { timestamp: Date; outcomes: { [name: string]: number } }[] = [];
  const lastKnown: { [name: string]: number } = {};

  // Initialize with 0 for all outcomes
  usedOutcomeNames.forEach((name) => {
    lastKnown[name] = 0;
  });

  for (const ts of sortedTimestamps) {
    const outcomes = timeMap.get(ts)!;

    // Update lastKnown with new values
    for (const name of usedOutcomeNames) {
      if (outcomes[name] !== undefined) {
        lastKnown[name] = outcomes[name];
      }
    }

    // Create point with all outcomes (using lastKnown for missing)
    result.push({
      timestamp: new Date(ts * 1000),
      outcomes: { ...lastKnown },
    });
  }

  console.log(`[Polymarket] Returning ${result.length} price history points for ${count} outcomes`);
  return result;
}

/**
 * Map Polymarket tags to our category system
 * Falls back to question/title analysis if tags don't match
 */
export function mapPolymarketCategory(
  tags: { label: string; slug: string }[],
  question?: string
): string {
  const tagLabels = tags.map((t) => t.label.toLowerCase());
  const tagSlugs = tags.map((t) => t.slug.toLowerCase());

  // 1. Try tag-based matching first
  if (
    tagLabels.some((t) => t.includes('politic')) ||
    tagSlugs.includes('politics')
  )
    return 'politics';
  if (tagLabels.some((t) => t.includes('sport')) || tagSlugs.includes('sports'))
    return 'sports';
  if (
    tagLabels.some((t) => t.includes('crypto') || t.includes('bitcoin')) ||
    tagSlugs.includes('crypto')
  )
    return 'crypto';
  if (
    tagLabels.some((t) => t.includes('finance') || t.includes('econ')) ||
    tagSlugs.includes('finance')
  )
    return 'finance';
  if (
    tagLabels.some((t) => t.includes('tech')) ||
    tagSlugs.includes('technology')
  )
    return 'tech';
  if (
    tagLabels.some((t) => t.includes('science')) ||
    tagSlugs.includes('science')
  )
    return 'science';
  if (
    tagLabels.some((t) => t.includes('culture') || t.includes('entertainment'))
  )
    return 'culture';

  // 2. Fallback: analyze question/title for keywords
  if (question) {
    const q = question.toLowerCase();

    // Sports FIRST - NBA/NFL/MLB/NHL teams and common sports terms
    // Check before other categories to prevent "Rockets" matching "rocket" in science
    const sportsTeams = /\b(lakers|celtics|warriors|bulls|heat|knicks|nets|rockets|spurs|mavericks|suns|bucks|76ers|sixers|clippers|nuggets|grizzlies|hawks|hornets|jazz|kings|magic|pacers|pelicans|pistons|raptors|thunder|timberwolves|blazers|trail blazers|wizards|cavaliers|cowboys|eagles|chiefs|49ers|niners|patriots|bills|dolphins|jets|ravens|steelers|bengals|browns|titans|colts|texans|jaguars|commanders|giants|bears|packers|vikings|lions|saints|buccaneers|bucs|falcons|panthers|cardinals|rams|seahawks|chargers|raiders|broncos|yankees|red sox|dodgers|mets|cubs|braves|astros|phillies|padres|mariners|rangers|guardians|twins|tigers|white sox|royals|orioles|blue jays|angels|athletics|rays|marlins|nationals|reds|brewers|pirates|diamondbacks|rockies|giants|bruins|blackhawks|penguins|capitals|avalanche|lightning|hurricanes|panthers|rangers|islanders|devils|flyers|maple leafs|canadiens|senators|sabres|red wings|blue jackets|predators|stars|wild|jets|flames|oilers|canucks|kraken|golden knights|coyotes|sharks|ducks|kings)\b/;
    const sportsGeneral = /\bnfl\b|\bnba\b|\bmlb\b|\bnhl\b|\bufc\b|\bboxing\b|\bfight night\b|\bchampionship\b|\bsuper bowl\b|\bworld series\b|\bplayoff|\bplayoffs\b|\bmvp\b|\ball-star\b|\bstanley cup\b|\bworld cup\b|\beuro 202|\bpremier league\b|\bla liga\b|\bbundesliga\b|\bserie a\b|\bchampions league\b|vs\.?\s+[a-z]/;
    if (sportsTeams.test(q) || sportsGeneral.test(q))
      return 'sports';

    // Culture/Entertainment - check before crypto to prevent Oscar markets in crypto
    if (/\boscar|\boscars\b|\bacademy award|\bgrammy|\bgrammys\b|\bemmy|\bemmys\b|\bgolden globe|\bcelebrity|\bhollywood\b|\bnetflix\b|\balbum\b|\bconcert\b|\btour\b|\baward show|\bkardashian|\btaylor swift|\bbeyonce|\bdrake\b|\bkanye\b|\btravis scott|\bbillboard\b|\bstreaming\b|\bbox office\b|\bmovie\b|\bfilm\b|\bactor\b|\bactress\b/.test(q))
      return 'culture';

    // Politics - elections, government, politicians
    if (/trump|biden|harris|election|president|congress|senate|vote|democrat|republican|governor|mayor|political|impeach|cabinet/.test(q))
      return 'politics';

    // Crypto - cryptocurrencies (now checked after culture)
    if (/bitcoin|btc|eth|ethereum|crypto|solana|xrp|dogecoin|coinbase|binance|defi|nft/.test(q))
      return 'crypto';

    // Finance - economy, markets
    if (/fed |federal reserve|rate cut|rate hike|stock|economy|gdp|inflation|recession|s&p|nasdaq|dow|treasury|yield|unemployment/.test(q))
      return 'finance';

    // Tech - technology companies, AI
    if (/\bai\b|artificial intelligence|openai|chatgpt|apple|google|microsoft|meta|amazon|tesla|spacex|twitter|tiktok/.test(q))
      return 'tech';

    // Science - climate, space, research (rocket only in space context, not team names)
    if (/climate|nasa|\bspace\b|rocket launch|mars|moon|science|research|vaccine|covid|pandemic|hurricane|earthquake|weather/.test(q))
      return 'science';
  }

  return 'world'; // true default for international/general news
}

/**
 * Fetch top holders for a market's tokens
 * @param conditionId - The market condition ID (0x-prefixed hex string)
 * @param limit - Maximum number of holders to return (default 20, max 20)
 */
export async function fetchPolymarketHolders(
  conditionId: string,
  limit: number = 20
): Promise<PolymarketTokenHolders[]> {
  try {
    const params = new URLSearchParams({
      market: conditionId,
      limit: Math.min(limit, 20).toString(),
    });

    const response = await fetch(`${DATA_API_BASE}/holders?${params}`, {
      next: { revalidate: 300 }, // 5 min cache
    });

    if (!response.ok) {
      console.error(`Polymarket holders API error: ${response.status}`);
      return [];
    }

    const data: PolymarketTokenHolders[] = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching Polymarket holders:', error);
    return [];
  }
}

/**
 * Calculate price change from history
 */
export function calculatePriceChange(
  history: PolymarketPricePoint[],
  hoursAgo: number
): number {
  if (!history.length) return 0;

  const now = Date.now() / 1000;
  const targetTime = now - hoursAgo * 3600;

  // Get current price (last in history)
  const currentPrice = history[history.length - 1]?.p ?? 0;

  // Find price at target time
  let pastPrice = currentPrice;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].t <= targetTime) {
      pastPrice = history[i].p;
      break;
    }
  }

  // If no historical data, use first available
  if (pastPrice === currentPrice && history.length > 1) {
    pastPrice = history[0].p;
  }

  // Calculate change in percentage points (e.g., 0.55 - 0.50 = 5%)
  return (currentPrice - pastPrice) * 100;
}

// ============================================
// USER/TRADER API ENDPOINTS
// ============================================

export interface PolymarketUserPosition {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  totalSold: number;
  realizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositeAsset: string;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  endDate: string;
  negRisk: boolean;
}

export interface PolymarketUserTrade {
  proxyWallet: string;
  timestamp: number;
  conditionId: string;
  type: string;
  side: 'BUY' | 'SELL';
  outcome: string;
  outcomeIndex: number;
  title: string;
  slug: string;
  icon: string;
  transactionHash: string;
  price: number;
  size: number;
  usdcSize: number;
  asset: string;
  eventSlug: string;
  name?: string;
  pseudonym?: string;
}

export interface PolymarketClosedPosition {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  avgPrice: number;
  totalBought: number;
  realizedPnl: number;
  curPrice: number;
  timestamp: number;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  endDate: string;
}

/**
 * Fetch user positions from Polymarket Data API
 * @param address - User wallet address
 * @param limit - Maximum positions to return (default 100)
 */
export async function fetchUserPositions(
  address: string,
  limit: number = 100
): Promise<PolymarketUserPosition[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const params = new URLSearchParams({
      user: address.toLowerCase(),
      limit: limit.toString(),
      sortBy: 'CURRENT_VALUE',
      sortDirection: 'DESC',
    });

    const response = await fetch(`${DATA_API_BASE}/positions?${params}`, {
      cache: 'no-store', // Fresh data for trader profiles
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Polymarket] Positions API returned ${response.status} for ${address.slice(0, 8)}...`);
      return [];
    }

    const data: PolymarketUserPosition[] = await response.json();
    return data || [];
  } catch (error) {
    // Network errors are expected sometimes - use warn instead of error
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      console.warn(`[Polymarket] Positions fetch failed for ${address.slice(0, 8)}... (network issue)`);
    } else {
      console.warn('[Polymarket] Positions fetch error:', error);
    }
    return [];
  }
}

/**
 * Fetch closed positions from Polymarket Data API
 * These are positions that have been fully sold or resolved
 * @param address - User wallet address
 * @param limit - Maximum positions to return (default 500, max per request is 50)
 */
export async function fetchClosedPositions(
  address: string,
  limit: number = 300
): Promise<PolymarketClosedPosition[]> {
  try {
    const perPage = 50; // API max is 50
    const pagesPerDirection = Math.ceil(limit / 2 / perPage); // Split limit between both directions

    // Build all fetch requests upfront for parallel execution
    const fetchRequests: Promise<PolymarketClosedPosition[]>[] = [];

    for (const direction of ['DESC', 'ASC'] as const) {
      for (let i = 0; i < pagesPerDirection; i++) {
        const params = new URLSearchParams({
          user: address.toLowerCase(),
          limit: perPage.toString(),
          offset: (i * perPage).toString(),
          sortBy: 'REALIZEDPNL',
          sortDirection: direction,
        });

        // Create promise for each page fetch
        const fetchPromise = (async (): Promise<PolymarketClosedPosition[]> => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          try {
            const response = await fetch(`${DATA_API_BASE}/closed-positions?${params}`, {
              cache: 'no-store',
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              console.warn(`[Polymarket] Closed positions API returned ${response.status}`);
              return [];
            }

            return await response.json() || [];
          } catch {
            clearTimeout(timeoutId);
            return [];
          }
        })();

        fetchRequests.push(fetchPromise);
      }
    }

    // Execute ALL requests in parallel
    const results = await Promise.all(fetchRequests);

    // Deduplicate results
    const seenIds = new Set<string>();
    const allPositions: PolymarketClosedPosition[] = [];

    for (const pageResults of results) {
      for (const pos of pageResults) {
        const key = `${pos.conditionId}-${pos.outcome}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          allPositions.push(pos);
        }
      }
    }

    return allPositions;
  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      console.warn(`[Polymarket] Closed positions fetch failed for ${address.slice(0, 8)}... (network issue)`);
    } else {
      console.warn('[Polymarket] Closed positions fetch error:', error);
    }
    return [];
  }
}

/**
 * Fetch user trade activity from Polymarket Data API
 * @param address - User wallet address
 * @param limit - Maximum trades to return (default 200 for faster loads)
 */
export async function fetchUserTrades(
  address: string,
  limit: number = 200
): Promise<PolymarketUserTrade[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const params = new URLSearchParams({
      user: address.toLowerCase(),
      limit: limit.toString(),
    });

    const response = await fetch(`${DATA_API_BASE}/activity?${params}`, {
      cache: 'no-store', // Fresh data for trader profiles
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Polymarket] Activity API returned ${response.status} for ${address.slice(0, 8)}...`);
      return [];
    }

    const data: PolymarketUserTrade[] = await response.json();
    return data || [];
  } catch (error) {
    // Network errors are expected sometimes - use warn instead of error
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      console.warn(`[Polymarket] Activity fetch failed for ${address.slice(0, 8)}... (network issue)`);
    } else {
      console.warn('[Polymarket] Activity fetch error:', error);
    }
    return [];
  }
}

/**
 * Fetch recent trades for multiple addresses in parallel
 * Used for tracked whales feature
 * @param addresses - Array of wallet addresses
 * @param tradesPerAddress - Number of recent trades per address (default 1)
 */
export async function fetchRecentTradesForAddresses(
  addresses: string[],
  tradesPerAddress: number = 1
): Promise<Map<string, PolymarketUserTrade[]>> {
  const results = new Map<string, PolymarketUserTrade[]>();

  if (addresses.length === 0) {
    return results;
  }

  // Fetch in parallel
  const promises = addresses.map(async (address) => {
    try {
      const trades = await fetchUserTrades(address, tradesPerAddress);
      return { address: address.toLowerCase(), trades };
    } catch (error) {
      console.warn(`Failed to fetch trades for ${address}:`, error);
      return { address: address.toLowerCase(), trades: [] };
    }
  });

  const responses = await Promise.all(promises);

  for (const { address, trades } of responses) {
    results.set(address, trades);
  }

  return results;
}

/**
 * Get trader profile from leaderboard data
 * Uses timePeriod=ALL for all-time P&L and queries user directly
 * @param address - User wallet address
 */
export async function fetchTraderProfile(
  address: string
): Promise<{
  rank: number;
  displayName: string;
  pnl: number;
  volume: number;
  profileImage?: string;
} | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    // Fetch all-time leaderboard for this specific user
    const userParams = new URLSearchParams({
      timePeriod: 'ALL',
      user: address.toLowerCase(),
    });

    const userResponse = await fetch(
      `${DATA_API_BASE}/v1/leaderboard?${userParams}`,
      { cache: 'no-store', signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (userResponse.ok) {
      const userData = await userResponse.json();
      if (userData && userData.length > 0) {
        const entry = userData[0];
        return {
          rank: parseInt(entry.rank) || 0,
          displayName: sanitizeUsername(entry.userName, address),
          pnl: entry.pnl || 0,
          volume: entry.vol || 0,
          profileImage: entry.profileImage,
        };
      }
    }

    // Fallback: return basic info (user may not be on leaderboard)
    return {
      rank: 0,
      displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
      pnl: 0,
      volume: 0,
    };
  } catch (error) {
    // Network errors are expected sometimes - use warn instead of error
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      console.warn(`[Polymarket] Profile fetch failed for ${address.slice(0, 8)}... (network issue)`);
    } else {
      console.warn('[Polymarket] Profile fetch error:', error);
    }
    return null;
  }
}

// ============================================
// MARKET TRADES API
// ============================================

export interface PolymarketMarketTrade {
  proxyWallet: string;
  side: 'BUY' | 'SELL';
  asset: string;
  conditionId: string;
  size: number;
  price: number;
  timestamp: number;
  title: string;
  slug: string;
  outcome: string;
  outcomeIndex: number;
  transactionHash: string;
  name?: string;
  pseudonym?: string;
  profileImage?: string;
}

/**
 * Fetch recent trades for a specific market
 * @param slug - Market slug identifier
 * @param limit - Maximum trades to return (default 50, max 1000)
 */
export async function fetchMarketTrades(
  slug: string,
  limit: number = 50
): Promise<PolymarketMarketTrade[]> {
  try {
    const params = new URLSearchParams({
      slug: slug,
      limit: Math.min(limit, 1000).toString(),
    });

    const response = await fetch(`${DATA_API_BASE}/trades?${params}`, {
      next: { revalidate: 30 }, // 30 second cache for fresher trades
    });

    if (!response.ok) {
      console.error(`Polymarket trades API error: ${response.status}`);
      return [];
    }

    const data: PolymarketMarketTrade[] = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching market trades:', error);
    return [];
  }
}

/**
 * Fetch recent trades by condition ID
 * Uses the 'market' parameter (not 'conditionId') per Polymarket Data API docs
 * @param conditionId - Market condition ID (hex string)
 * @param limit - Maximum trades to return (default 50, max 10000)
 */
export async function fetchMarketTradesByConditionId(
  conditionId: string,
  limit: number = 50
): Promise<PolymarketMarketTrade[]> {
  try {
    // IMPORTANT: Use 'market' parameter, NOT 'conditionId'
    // Per docs: https://docs.polymarket.com/api-reference/core/get-trades-for-a-user-or-markets
    const params = new URLSearchParams({
      market: conditionId,
      limit: Math.min(limit, 10000).toString(),
    });

    const response = await fetch(`${DATA_API_BASE}/trades?${params}`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      console.error(`Polymarket trades API error: ${response.status}`);
      return [];
    }

    const data: PolymarketMarketTrade[] = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching market trades:', error);
    return [];
  }
}
