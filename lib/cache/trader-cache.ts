import { TraderProfile, TraderPosition, TraderTrade, TraderClosedPosition } from '@/types/market';
import { TokenTransfer } from '@/lib/api/polygonscan';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface TraderCacheEntry {
  lastUpdated: number;
  profile: TraderProfile | null;
  positions: TraderPosition[];
  closedPositions: TraderClosedPosition[];
  trades: TraderTrade[];
  transfers: TokenTransfer[];
}

// In-memory cache keyed by address (lowercase)
const traderCache = new Map<string, TraderCacheEntry>();

/**
 * Get cached trader data if valid
 */
export function getTraderCache(address: string): TraderCacheEntry | null {
  const key = address.toLowerCase();
  const cached = traderCache.get(key);

  if (!cached) return null;

  // Check if cache is stale
  if (Date.now() - cached.lastUpdated > CACHE_TTL_MS) {
    traderCache.delete(key);
    return null;
  }

  return cached;
}

/**
 * Set trader data in cache
 */
export function setTraderCache(
  address: string,
  data: Omit<TraderCacheEntry, 'lastUpdated'>
): void {
  const key = address.toLowerCase();
  traderCache.set(key, {
    ...data,
    lastUpdated: Date.now(),
  });

  // Cleanup old entries periodically (keep max 100 traders)
  if (traderCache.size > 100) {
    const entries = Array.from(traderCache.entries());
    entries.sort((a, b) => a[1].lastUpdated - b[1].lastUpdated);
    // Remove oldest 20 entries
    for (let i = 0; i < 20; i++) {
      traderCache.delete(entries[i][0]);
    }
  }
}

/**
 * Check if we have valid cache for a trader
 */
export function hasValidTraderCache(address: string): boolean {
  return getTraderCache(address) !== null;
}

/**
 * Get cache age in seconds (for display purposes)
 */
export function getTraderCacheAge(address: string): number | null {
  const cached = traderCache.get(address.toLowerCase());
  if (!cached) return null;
  return Math.round((Date.now() - cached.lastUpdated) / 1000);
}

/**
 * Invalidate cache for a specific trader
 */
export function invalidateTraderCache(address: string): void {
  traderCache.delete(address.toLowerCase());
}

/**
 * Clear all trader caches
 */
export function clearAllTraderCaches(): void {
  traderCache.clear();
}
