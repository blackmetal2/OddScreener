/**
 * Markets cache using Cloudflare KV
 *
 * Stores all markets (10,000+) in Cloudflare KV for:
 * - Global edge caching (faster reads)
 * - Large storage capacity (1GB free)
 * - No file system dependency (works on serverless)
 *
 * Falls back to JSON file cache if KV is not configured.
 */

import { Market, GlobalStats } from '@/types/market';
import { kvGet, kvPut, isKVConfigured } from '@/lib/cloudflare-kv';
import { readMarketsCache, writeMarketsCache, isCacheStale, hasSufficientMarkets } from './markets-cache';

// KV Keys
const MARKETS_KEY = 'markets:all';
const STATS_KEY = 'markets:stats';
const METADATA_KEY = 'markets:metadata';

// Cache TTL: 10 minutes (cron runs every 5 min, this gives buffer)
const CACHE_TTL_SECONDS = 10 * 60;

export interface MarketsMetadata {
  lastUpdated: string;
  count: number;
  limit: number;
}

/**
 * Read markets from KV (or fallback to file cache)
 */
export async function readMarketsFromKV(): Promise<{
  markets: Market[];
  stats: GlobalStats;
  metadata: MarketsMetadata;
} | null> {
  // Try KV first
  if (isKVConfigured()) {
    try {
      const [markets, stats, metadata] = await Promise.all([
        kvGet<Market[]>(MARKETS_KEY),
        kvGet<GlobalStats>(STATS_KEY),
        kvGet<MarketsMetadata>(METADATA_KEY),
      ]);

      if (markets && stats && metadata) {
        // Check if cache is still valid (within 10 min)
        const lastUpdated = new Date(metadata.lastUpdated).getTime();
        const age = Date.now() - lastUpdated;

        if (age < CACHE_TTL_SECONDS * 1000) {
          console.log(`[Markets-KV] Cache hit: ${markets.length} markets (${Math.round(age / 1000)}s old)`);

          // Convert date strings back to Date objects
          const hydratedMarkets = markets.map((m) => ({
            ...m,
            endsAt: new Date(m.endsAt),
            createdAt: new Date(m.createdAt),
          }));

          return { markets: hydratedMarkets, stats, metadata };
        }

        console.log(`[Markets-KV] Cache stale (${Math.round(age / 1000)}s old)`);
      }
    } catch (error) {
      console.warn('[Markets-KV] KV read failed, falling back to file cache:', error);
    }
  }

  // Fallback to file cache
  const fileCache = await readMarketsCache();
  if (fileCache && !isCacheStale(fileCache)) {
    console.log(`[Markets-KV] Using file cache fallback: ${fileCache.markets.length} markets`);
    return {
      markets: fileCache.markets,
      stats: fileCache.stats,
      metadata: {
        lastUpdated: fileCache.lastUpdated,
        count: fileCache.markets.length,
        limit: fileCache.limit || 2000,
      },
    };
  }

  return null;
}

/**
 * Write markets to KV (and file cache as backup)
 */
export async function writeMarketsToKV(
  markets: Market[],
  stats: GlobalStats,
  limit: number = 10000
): Promise<{ success: boolean; kvSuccess: boolean; fileSuccess: boolean }> {
  const metadata: MarketsMetadata = {
    lastUpdated: new Date().toISOString(),
    count: markets.length,
    limit,
  };

  let kvSuccess = false;
  let fileSuccess = false;

  // Write to KV (primary)
  if (isKVConfigured()) {
    try {
      const results = await Promise.all([
        kvPut(MARKETS_KEY, markets, { expirationTtl: CACHE_TTL_SECONDS * 2 }),
        kvPut(STATS_KEY, stats, { expirationTtl: CACHE_TTL_SECONDS * 2 }),
        kvPut(METADATA_KEY, metadata, { expirationTtl: CACHE_TTL_SECONDS * 2 }),
      ]);

      kvSuccess = results.every(Boolean);

      if (kvSuccess) {
        console.log(`[Markets-KV] Wrote ${markets.length} markets to KV`);
      } else {
        console.warn('[Markets-KV] Partial KV write failure');
      }
    } catch (error) {
      console.error('[Markets-KV] KV write failed:', error);
    }
  }

  // Write to file cache as backup (only if KV failed or not configured)
  if (!kvSuccess) {
    try {
      await writeMarketsCache(markets, stats, limit);
      fileSuccess = true;
      console.log(`[Markets-KV] Wrote ${markets.length} markets to file cache (backup)`);
    } catch (error) {
      console.error('[Markets-KV] File cache write also failed:', error);
    }
  }

  return {
    success: kvSuccess || fileSuccess,
    kvSuccess,
    fileSuccess,
  };
}

/**
 * Check if we have valid cached markets
 */
export async function hasValidMarketsCache(expectedLimit: number = 10000): Promise<boolean> {
  const data = await readMarketsFromKV();
  if (!data) return false;

  // Check if we have enough markets (at least 75% of expected)
  const minRequired = Math.floor(expectedLimit * 0.75);
  return data.markets.length >= minRequired;
}

/**
 * Get cache status for debugging
 */
export async function getMarketsCacheStatus(): Promise<{
  source: 'kv' | 'file' | 'none';
  count: number;
  age: number | null;
  kvConfigured: boolean;
}> {
  const kvConfigured = isKVConfigured();

  if (kvConfigured) {
    const metadata = await kvGet<MarketsMetadata>(METADATA_KEY);
    if (metadata) {
      const age = Math.round((Date.now() - new Date(metadata.lastUpdated).getTime()) / 1000);
      return { source: 'kv', count: metadata.count, age, kvConfigured };
    }
  }

  const fileCache = await readMarketsCache();
  if (fileCache) {
    const age = Math.round((Date.now() - new Date(fileCache.lastUpdated).getTime()) / 1000);
    return { source: 'file', count: fileCache.markets.length, age, kvConfigured };
  }

  return { source: 'none', count: 0, age: null, kvConfigured };
}
