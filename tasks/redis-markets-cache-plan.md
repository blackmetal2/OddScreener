# Redis Markets Cache Implementation Plan (v2)

## Overview

Migrate the markets cache from JSON file to Redis (Upstash) and integrate with the existing hourly cron job.

**Current Problem:**
- JSON file cache doesn't persist on Vercel serverless functions
- Not shared across function instances
- Every cold start refetches 2000 markets (~5-10s delay)

**Solution:**
- Use Upstash Redis for markets caching
- Integrate with existing `/api/cron/snapshot-prices` hourly cron
- Reuse already-fetched markets data (no extra API calls)
- 65 min TTL (slightly > 1 hour cron interval)

---

## Architecture

### Before (Current)
```
User Request → Check JSON file → Stale? → Fetch 2000 markets (slow)
                                    ↓
                              Return cached (fast)

Hourly Cron → Fetch markets → Store prices/spreads only
```

### After (New)
```
User Request → Check Redis → Always fresh from cron (fast)

Hourly Cron → Fetch markets → Store prices + spreads + MARKETS CACHE
```

**Key insight:** The cron already fetches all markets. We just add one more Redis write.

---

## Technical Details

### Data Size & Compression
- 2000 markets ≈ 3-4MB uncompressed JSON
- Upstash max value size: 1MB
- **Solution:** gzip compression via `pako` (3-4MB → ~300KB)

### TTL Strategy
```typescript
const CACHE_TTL_SECONDS = 65 * 60; // 65 minutes
```
- Cron runs at 0:00, 1:00, 2:00...
- Cache valid until 1:05, 2:05, 3:05...
- Next cron always refreshes before expiry
- **Users never trigger a refresh**

---

## Implementation Steps

### Step 1: Install Compression Library
```bash
npm install pako
npm install -D @types/pako
```

### Step 2: Create Redis Markets Cache Module

**File:** `lib/cache/markets-cache-redis.ts`

```typescript
import { redis, safeRedis } from '@/lib/upstash';
import { Market, GlobalStats } from '@/types/market';
import pako from 'pako';

// Redis key for markets cache
const MARKETS_CACHE_KEY = 'markets:cache';
const CACHE_TTL_SECONDS = 65 * 60; // 65 minutes (slightly > 1 hour cron)

export interface MarketsCache {
  lastUpdated: string;
  markets: Market[];
  stats: GlobalStats;
  limit?: number;
}

/**
 * Compress JSON data using gzip
 */
function compress(data: object): string {
  const json = JSON.stringify(data);
  const compressed = pako.gzip(json);
  return Buffer.from(compressed).toString('base64');
}

/**
 * Decompress gzip data back to JSON
 */
function decompress<T>(base64: string): T {
  const compressed = Buffer.from(base64, 'base64');
  const decompressed = pako.ungzip(compressed, { to: 'string' });
  return JSON.parse(decompressed);
}

/**
 * Read markets from Redis cache
 */
export async function readMarketsCache(): Promise<MarketsCache | null> {
  return safeRedis(
    async () => {
      const data = await redis.get<string>(MARKETS_CACHE_KEY);
      if (!data) return null;

      const cache = decompress<MarketsCache>(data);

      // Convert date strings back to Date objects
      cache.markets = cache.markets.map((m) => ({
        ...m,
        endsAt: new Date(m.endsAt),
        createdAt: new Date(m.createdAt),
      }));

      return cache;
    },
    null
  );
}

/**
 * Write markets to Redis cache (called by cron)
 */
export async function writeMarketsCache(
  markets: Market[],
  stats: GlobalStats,
  limit: number = 2000
): Promise<{ success: boolean; sizeKB: number; error?: string }> {
  try {
    const cache: MarketsCache = {
      lastUpdated: new Date().toISOString(),
      markets,
      stats,
      limit,
    };

    const compressed = compress(cache);
    const sizeKB = Math.round(compressed.length / 1024);

    await redis.set(MARKETS_CACHE_KEY, compressed, { ex: CACHE_TTL_SECONDS });
    console.log(`[Markets Cache] Written ${markets.length} markets (${sizeKB}KB compressed)`);

    return { success: true, sizeKB };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Markets Cache] Write failed:', errorMsg);
    return { success: false, sizeKB: 0, error: errorMsg };
  }
}

/**
 * Check if cache is stale (older than TTL)
 * Note: With cron integration, this should rarely be true
 */
export function isCacheStale(cache: MarketsCache): boolean {
  const lastUpdated = new Date(cache.lastUpdated).getTime();
  const now = Date.now();
  return now - lastUpdated > CACHE_TTL_SECONDS * 1000;
}

/**
 * Check if cache has enough markets (at least 75% of expected)
 */
export function hasSufficientMarkets(
  cache: MarketsCache,
  expectedLimit: number = 2000
): boolean {
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
```

### Step 3: Update Hourly Cron to Write Markets Cache

**File:** `app/api/cron/snapshot-prices/route.ts`

Add import at top:
```typescript
import { writeMarketsCache } from '@/lib/cache/markets-cache-redis';
import { GlobalStats } from '@/types/market';
```

Add after spread storage (around line 125), before `const duration = Date.now() - startTime;`:

```typescript
// ============================================
// STORE MARKETS CACHE
// ============================================
console.log('[Snapshot Cron] Updating markets cache...');

// Transform raw markets to Market type for cache
const { getAllMarkets } = await import('@/lib/api/markets');
const transformedMarkets = await getAllMarkets(10000, false); // Uses same data, applies transformations

// Calculate stats
const cacheStats: GlobalStats = {
  totalVolume24h: transformedMarkets.reduce((sum, m) => sum + m.volume24h, 0),
  openPositions24h: Math.round(transformedMarkets.reduce((sum, m) => sum + m.volume24h, 0) / 100),
  activeMarkets: transformedMarkets.filter((m) => new Date(m.endsAt) > new Date()).length,
};

const cacheResult = await writeMarketsCache(transformedMarkets, cacheStats);
console.log(`[Snapshot Cron] Markets cache: ${cacheResult.success ? 'OK' : 'FAILED'} (${cacheResult.sizeKB}KB)`);
```

Update the response to include cache status:
```typescript
return NextResponse.json({
  success: priceResult.success && spreadResult.success && cacheResult.success,
  marketsStored: priceResult.count,
  spreadsStored: spreadResult.count,
  marketsCached: cacheResult.success ? transformedMarkets.length : 0,
  cacheSizeKB: cacheResult.sizeKB,
  // ... rest of response
});
```

### Step 4: Update Consumer Imports

**File:** `app/actions/markets.ts`

```typescript
// Change import from:
import {
  readMarketsCache,
  writeMarketsCache,
  isCacheStale,
  hasSufficientMarkets,
} from '@/lib/cache/markets-cache';

// To:
import {
  readMarketsCache,
  writeMarketsCache,
  isCacheStale,
  hasSufficientMarkets,
} from '@/lib/cache/markets-cache-redis';
```

Also update the fallback behavior - since cron handles refresh, we can simplify:

```typescript
async function getMarketsFromCache(): Promise<Market[]> {
  const cache = await readMarketsCache();

  // Cache should always be fresh from hourly cron
  if (cache && !isCacheStale(cache) && hasSufficientMarkets(cache, EXPECTED_MARKET_LIMIT)) {
    console.log(`[Markets] Using Redis cache (${cache.markets.length} markets)`);
    return cache.markets;
  }

  // Fallback: fetch fresh (only happens if cron failed or first deployment)
  console.log('[Markets] Cache miss - fetching fresh data (cron may have failed)...');
  const markets = await getAllMarkets(EXPECTED_MARKET_LIMIT, false);

  // Don't write to cache here - let cron handle it
  // This prevents race conditions and keeps cron as single source of truth

  return markets;
}
```

**File:** `app/api/refresh-markets/route.ts`

Update import:
```typescript
import { writeMarketsCache, readMarketsCache, getCacheAge } from '@/lib/cache/markets-cache-redis';
```

### Step 5: Clean Up (After Testing)

Once confirmed working:
1. Delete `lib/cache/markets-cache.ts` (old JSON version)
2. Delete `data/markets-cache.json` (old cache file)
3. Optionally rename `markets-cache-redis.ts` → `markets-cache.ts`

---

## Files Summary

| File | Action |
|------|--------|
| `package.json` | Add `pako` dependency |
| `lib/cache/markets-cache-redis.ts` | **CREATE** - New Redis cache module |
| `app/api/cron/snapshot-prices/route.ts` | **MODIFY** - Add markets cache write |
| `app/actions/markets.ts` | **MODIFY** - Update import, simplify fallback |
| `app/api/refresh-markets/route.ts` | **MODIFY** - Update import |
| `lib/cache/markets-cache.ts` | **DELETE** (after testing) |
| `data/markets-cache.json` | **DELETE** (after testing) |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    HOURLY CRON JOB                          │
│                /api/cron/snapshot-prices                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Fetch 10,000 markets from Polymarket API                │
│                         ↓                                   │
│  2. Store price snapshots → Redis (prices:timestamp)        │
│                         ↓                                   │
│  3. Store spread snapshots → Redis (spreads:latest)         │
│                         ↓                                   │
│  4. Store markets cache → Redis (markets:cache) ← NEW       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUEST                             │
│                   fetchMarkets()                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Read from Redis (markets:cache)                         │
│                         ↓                                   │
│  2. Decompress gzip → Market[]                              │
│                         ↓                                   │
│  3. Apply filters/sorting                                   │
│                         ↓                                   │
│  4. Return to client (~100-200ms total)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Plan

### 1. Local Testing
```bash
# Install dependency
npm install pako && npm install -D @types/pako

# Start dev server
npm run dev

# Trigger cron manually (simulates hourly cron)
curl http://localhost:3000/api/cron/snapshot-prices

# Check response includes marketsCached and cacheSizeKB

# Visit homepage - should load from Redis cache
# Check server logs for "[Markets] Using Redis cache"
```

### 2. Verify Compression Size
- Should see `cacheSizeKB` in cron response
- Expected: 200-400KB for 2000 markets
- Must be under 1000KB (1MB Upstash limit)

### 3. Production Testing (Vercel)
```bash
# Deploy
vercel --prod

# Trigger cron
curl https://your-site.vercel.app/api/cron/snapshot-prices

# Visit site from different regions
# All should get fast cache hits
```

---

## Rollback Plan

If issues occur:
1. Revert imports back to `@/lib/cache/markets-cache`
2. The old JSON cache code still exists
3. Cron continues working for prices/spreads

---

## Performance Comparison

| Metric | Before (JSON) | After (Redis) |
|--------|---------------|---------------|
| Vercel cold start | ~8-10s | ~100-200ms |
| Cache shared across instances | ❌ No | ✅ Yes |
| Cache survives deployment | ❌ No | ✅ Yes |
| User-triggered refreshes | Often | Never (cron handles it) |
| Extra API calls | Yes (per-user) | No (cron only) |
| Cron jobs needed | 2 (snapshots + markets) | 1 (combined) |

---

## Checklist

- [ ] Install pako: `npm install pako && npm install -D @types/pako`
- [ ] Create `lib/cache/markets-cache-redis.ts`
- [ ] Update `app/api/cron/snapshot-prices/route.ts` to write markets cache
- [ ] Update import in `app/actions/markets.ts`
- [ ] Update import in `app/api/refresh-markets/route.ts`
- [ ] Test locally with manual cron trigger
- [ ] Verify compression size < 1MB
- [ ] Deploy to Vercel
- [ ] Trigger cron on production
- [ ] Verify fast loads from multiple regions
- [ ] Delete old `lib/cache/markets-cache.ts`
- [ ] Delete old `data/markets-cache.json`
