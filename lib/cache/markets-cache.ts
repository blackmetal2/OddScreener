import { Market, GlobalStats } from '@/types/market';
import { promises as fs } from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'markets-cache.json');
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface MarketsCache {
  lastUpdated: string;
  markets: Market[];
  stats: GlobalStats;
  limit?: number;  // Expected market count when cache was written
}

/**
 * Read markets from JSON cache file
 */
export async function readMarketsCache(): Promise<MarketsCache | null> {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    const cache = JSON.parse(data) as MarketsCache;

    // Convert date strings back to Date objects
    cache.markets = cache.markets.map((m) => ({
      ...m,
      endsAt: new Date(m.endsAt),
      createdAt: new Date(m.createdAt),
    }));

    return cache;
  } catch (error) {
    // File doesn't exist or is invalid
    return null;
  }
}

/**
 * Write markets to JSON cache file
 */
export async function writeMarketsCache(markets: Market[], stats: GlobalStats, limit: number = 2000): Promise<void> {
  const cache: MarketsCache = {
    lastUpdated: new Date().toISOString(),
    markets,
    stats,
    limit,
  };

  // Ensure data directory exists
  const dir = path.dirname(CACHE_FILE);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(CACHE_FILE, JSON.stringify(cache), 'utf-8');
  console.log(`[Cache] Written ${markets.length} markets to cache`);
}

/**
 * Check if cache is stale (older than TTL)
 */
export function isCacheStale(cache: MarketsCache): boolean {
  const lastUpdated = new Date(cache.lastUpdated).getTime();
  const now = Date.now();
  return now - lastUpdated > CACHE_TTL_MS;
}

/**
 * Check if cache has enough markets (at least 75% of expected)
 */
export function hasSufficientMarkets(cache: MarketsCache, expectedLimit: number = 2000): boolean {
  const minRequired = Math.floor(expectedLimit * 0.75);
  return cache.markets.length >= minRequired;
}

/**
 * Get cache age in seconds
 */
export function getCacheAge(cache: MarketsCache): number {
  const lastUpdated = new Date(cache.lastUpdated).getTime();
  return Math.round((Date.now() - lastUpdated) / 1000);
}
