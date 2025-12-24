# Upstash Price Snapshots Implementation Blueprint

## Overview
This document provides a complete implementation plan for storing hourly price snapshots in Upstash Redis to calculate accurate 1h, 6h, and 24h price changes for all markets.

---

## 1. Upstash Client Setup

### File: `/home/victor/predictscreener/lib/upstash.ts`

```typescript
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
// Uses REST-based connection for serverless compatibility
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Helper to safely handle Redis errors
export async function safeRedisOperation<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('[Redis] Operation failed:', error);
    return fallback;
  }
}
```

### Environment Variables Required

Add to `/home/victor/predictscreener/.env.local`:

```bash
# Upstash Redis REST API credentials
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
```

### Dependencies

Add to `package.json`:

```bash
npm install @upstash/redis
```

---

## 2. Snapshot Storage Schema

### Key Naming Convention

```
Format: snapshot:{marketId}:{timestamp}
Example: snapshot:73289502:1735056000
```

- `marketId`: The Polymarket market ID (from `pm.id`)
- `timestamp`: Unix timestamp in seconds (rounded to the hour)

### Data Structure

```typescript
interface PriceSnapshot {
  marketId: string;
  probability: number;      // Current probability (0-100)
  timestamp: number;        // Unix timestamp in seconds
  volume24h: number;        // 24h volume at snapshot time
  outcomes?: Array<{       // For multi-outcome markets
    name: string;
    probability: number;
  }>;
}
```

Stored as JSON string in Redis.

### TTL Strategy

- **7-day retention**: Each snapshot expires after 7 days (604,800 seconds)
- This provides enough historical data for trend analysis while keeping storage costs low
- Snapshots older than 7 days are automatically deleted by Redis

### Storage Pattern

```typescript
// Store a snapshot
await redis.setex(
  `snapshot:${marketId}:${timestamp}`,
  604800, // 7 days TTL
  JSON.stringify(snapshot)
);

// Store current price in a separate "latest" key (no TTL)
await redis.set(
  `latest:${marketId}`,
  JSON.stringify({ probability, timestamp, outcomes })
);
```

---

## 3. Snapshot Storage Functions

### File: `/home/victor/predictscreener/lib/api/snapshots.ts`

```typescript
import { redis, safeRedisOperation } from '@/lib/upstash';
import { Market } from '@/types/market';

interface PriceSnapshot {
  marketId: string;
  probability: number;
  timestamp: number;
  volume24h: number;
  outcomes?: Array<{
    name: string;
    probability: number;
  }>;
}

/**
 * Get hourly timestamp (rounded down to the hour)
 */
function getHourlyTimestamp(date: Date = new Date()): number {
  const timestamp = Math.floor(date.getTime() / 1000);
  return timestamp - (timestamp % 3600);
}

/**
 * Store price snapshot for a market
 */
export async function storePriceSnapshot(market: Market): Promise<void> {
  const timestamp = getHourlyTimestamp();

  const snapshot: PriceSnapshot = {
    marketId: market.id,
    probability: market.probability,
    timestamp,
    volume24h: market.volume24h,
  };

  // Add outcomes for multi-outcome markets
  if (market.outcomes && market.outcomes.length > 0) {
    snapshot.outcomes = market.outcomes.map(o => ({
      name: o.name,
      probability: o.probability,
    }));
  }

  // Store hourly snapshot with 7-day TTL
  await safeRedisOperation(
    () => redis.setex(
      `snapshot:${market.id}:${timestamp}`,
      604800, // 7 days
      JSON.stringify(snapshot)
    ),
    undefined
  );

  // Store latest price (no TTL, always available)
  await safeRedisOperation(
    () => redis.set(
      `latest:${market.id}`,
      JSON.stringify({
        probability: market.probability,
        timestamp,
        outcomes: snapshot.outcomes,
      })
    ),
    undefined
  );
}

/**
 * Batch store snapshots for multiple markets
 */
export async function batchStorePriceSnapshots(markets: Market[]): Promise<{
  success: number;
  failed: number;
}> {
  const timestamp = getHourlyTimestamp();
  let success = 0;
  let failed = 0;

  // Use pipeline for batch operations (more efficient)
  const pipeline = redis.pipeline();

  for (const market of markets) {
    const snapshot: PriceSnapshot = {
      marketId: market.id,
      probability: market.probability,
      timestamp,
      volume24h: market.volume24h,
    };

    if (market.outcomes && market.outcomes.length > 0) {
      snapshot.outcomes = market.outcomes.map(o => ({
        name: o.name,
        probability: o.probability,
      }));
    }

    pipeline.setex(
      `snapshot:${market.id}:${timestamp}`,
      604800,
      JSON.stringify(snapshot)
    );

    pipeline.set(
      `latest:${market.id}`,
      JSON.stringify({
        probability: market.probability,
        timestamp,
        outcomes: snapshot.outcomes,
      })
    );
  }

  try {
    await pipeline.exec();
    success = markets.length;
  } catch (error) {
    console.error('[Snapshots] Batch storage failed:', error);
    failed = markets.length;
  }

  return { success, failed };
}

/**
 * Get snapshot from N hours ago
 */
export async function getSnapshotFromHoursAgo(
  marketId: string,
  hoursAgo: number
): Promise<PriceSnapshot | null> {
  const now = getHourlyTimestamp();
  const targetTimestamp = now - (hoursAgo * 3600);

  // Try exact timestamp first
  let snapshot = await safeRedisOperation(
    async () => {
      const data = await redis.get(`snapshot:${marketId}:${targetTimestamp}`);
      return data ? JSON.parse(data as string) as PriceSnapshot : null;
    },
    null
  );

  // If exact timestamp not found, search nearby timestamps (±30 min)
  if (!snapshot) {
    for (let offset = -1800; offset <= 1800; offset += 1800) {
      const altTimestamp = targetTimestamp + offset;
      snapshot = await safeRedisOperation(
        async () => {
          const data = await redis.get(`snapshot:${marketId}:${altTimestamp}`);
          return data ? JSON.parse(data as string) as PriceSnapshot : null;
        },
        null
      );
      if (snapshot) break;
    }
  }

  return snapshot;
}

/**
 * Calculate price change from snapshot
 */
export async function calculatePriceChangeFromSnapshot(
  marketId: string,
  currentProbability: number,
  hoursAgo: number
): Promise<number> {
  const snapshot = await getSnapshotFromHoursAgo(marketId, hoursAgo);

  if (!snapshot) {
    return 0; // No historical data available
  }

  // Return change in percentage points (e.g., 55 - 50 = +5)
  return Math.round((currentProbability - snapshot.probability) * 10) / 10;
}

/**
 * Get all price changes for a market (1h, 6h, 24h)
 */
export async function getMarketPriceChanges(
  marketId: string,
  currentProbability: number
): Promise<{
  change1h: number;
  change6h: number;
  change24h: number;
}> {
  const [change1h, change6h, change24h] = await Promise.all([
    calculatePriceChangeFromSnapshot(marketId, currentProbability, 1),
    calculatePriceChangeFromSnapshot(marketId, currentProbability, 6),
    calculatePriceChangeFromSnapshot(marketId, currentProbability, 24),
  ]);

  return { change1h, change6h, change24h };
}
```

---

## 4. Cron Job API Route

### File: `/home/victor/predictscreener/app/api/cron/snapshot-prices/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getAllMarkets } from '@/lib/api/markets';
import { batchStorePriceSnapshots } from '@/lib/api/snapshots';

// Prevent caching
export const dynamic = 'force-dynamic';

// Set max duration for Vercel serverless function (10 minutes)
export const maxDuration = 300;

/**
 * Cron job to snapshot current prices for all markets
 *
 * Trigger options:
 * 1. Vercel Cron (vercel.json): Runs automatically every hour
 * 2. External cron service (cron-job.org, EasyCron): GET request to this endpoint
 * 3. Manual trigger: GET /api/cron/snapshot-prices
 *
 * Authorization: Optional bearer token for security
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Snapshot Cron] Starting price snapshot job...');

    // Fetch all markets (no price changes needed, just current prices)
    const markets = await getAllMarkets(2000, false);

    if (markets.length === 0) {
      console.warn('[Snapshot Cron] No markets found to snapshot');
      return NextResponse.json({
        success: true,
        message: 'No markets to snapshot',
        marketsCount: 0,
      });
    }

    // Store snapshots in Redis
    const result = await batchStorePriceSnapshots(markets);

    const duration = Date.now() - startTime;

    console.log(
      `[Snapshot Cron] Completed in ${duration}ms - ` +
      `${result.success} success, ${result.failed} failed`
    );

    return NextResponse.json({
      success: true,
      marketsCount: markets.length,
      snapshotsStored: result.success,
      snapshotsFailed: result.failed,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Snapshot Cron] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

### Vercel Cron Configuration

Create `/home/victor/predictscreener/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/snapshot-prices",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.).

### Alternative: External Cron Service

If not using Vercel cron, set up external cron service:

**Service**: cron-job.org, EasyCron, or GitHub Actions

**Request**:
```bash
curl -H "Authorization: Bearer your_cron_secret" \
  https://your-app.vercel.app/api/cron/snapshot-prices
```

**Schedule**: Every hour (`0 * * * *`)

Add to `.env.local`:
```bash
CRON_SECRET=your_random_secret_here
```

---

## 5. Markets Fetch Integration

### Update: `/home/victor/predictscreener/lib/api/markets.ts`

Modify the `normalizePolymarketMarket` function to use snapshots:

```typescript
import { getMarketPriceChanges } from './snapshots';

async function normalizePolymarketMarket(
  pm: PolymarketMarket,
  fetchDetailedPriceChanges: boolean = false,
  useSnapshots: boolean = true // NEW: Enable snapshot-based changes
): Promise<Market> {
  const { outcomes, prices } = parsePolymarketOutcomes(pm);
  const tokenIds = getPolymarketTokenIds(pm);
  const isMultiOutcome = outcomes.length > 2;

  // Get probability (first outcome price * 100)
  const probability = Math.round(prices[0] * 100);

  // Default to API-provided 24h change
  let change24h = pm.oneDayPriceChange ? Math.round(pm.oneDayPriceChange * 100 * 10) / 10 : 0;
  let change1h = 0;
  let change6h = 0;

  // NEW: Use Upstash snapshots for accurate price changes
  if (useSnapshots) {
    try {
      const changes = await getMarketPriceChanges(pm.id, probability);
      change1h = changes.change1h;
      change6h = changes.change6h;
      // Use snapshot 24h if available, otherwise fall back to API
      change24h = changes.change24h !== 0 ? changes.change24h : change24h;
    } catch (e) {
      console.error(`[Markets] Snapshot price change error for ${pm.id}:`, e);
      // Fallback: use existing behavior (API + price history for top markets)
    }
  }

  // FALLBACK: Only fetch detailed history if snapshots unavailable AND requested
  if (!useSnapshots && fetchDetailedPriceChanges && tokenIds[0]) {
    try {
      const history = await fetchPolymarketPriceHistory(tokenIds[0], '1d');
      change1h = Math.round(calculatePriceChange(history, 1) * 10) / 10;
      change6h = Math.round(calculatePriceChange(history, 6) * 10) / 10;
      const historyChange24h = Math.round(calculatePriceChange(history, 24) * 10) / 10;
      if (historyChange24h !== 0) {
        change24h = historyChange24h;
      }
    } catch (e) {
      console.error('Error fetching Polymarket price history:', e);
    }
  }

  // ... rest of function remains the same
}
```

### Update `getAllMarkets` function

```typescript
export async function getAllMarkets(
  limit: number = 2000,
  fetchPriceChanges: boolean = false,
  useSnapshots: boolean = true // NEW parameter
): Promise<Market[]> {
  try {
    const polymarketData = await fetchPolymarketMarketsWithPagination(limit, 1000).catch((e) => {
      console.error('Polymarket fetch error:', e);
      return [];
    });

    console.log(`[Markets] Processing ${polymarketData.length} markets from Polymarket`);

    const trendingScores = new Map<string, number>();
    for (const pm of polymarketData) {
      trendingScores.set(pm.id, calculateTrendingScore(pm));
    }

    // Normalize markets with snapshot support
    const normalizePromises: Promise<Market>[] = [];

    for (let i = 0; i < polymarketData.length; i++) {
      // Pass useSnapshots flag to normalizer
      normalizePromises.push(
        normalizePolymarketMarket(polymarketData[i], fetchPriceChanges, useSnapshots)
      );
    }

    const markets = await Promise.all(normalizePromises);

    const marketsWithTrending = markets.map((market) => ({
      ...market,
      trendingScore: trendingScores.get(market.id) || 0,
    }));

    return marketsWithTrending.sort((a, b) => b.volume24h - a.volume24h);
  } catch (error) {
    console.error('Error fetching all markets:', error);
    return [];
  }
}
```

---

## 6. Edge Cases & Error Handling

### A. New Markets (No Historical Data)

**Problem**: A new market has no snapshots yet.

**Solution**:
```typescript
// In calculatePriceChangeFromSnapshot
if (!snapshot) {
  return 0; // Show 0% change for new markets
}
```

UI shows: `+0.0%` (neutral state)

### B. Missing Snapshots

**Problem**: Snapshot for specific hour doesn't exist (e.g., cron failed).

**Solution**: Search nearby timestamps (±30 minutes)
```typescript
// Try exact timestamp first
let snapshot = await redis.get(`snapshot:${marketId}:${targetTimestamp}`);

// If not found, check ±30 min
if (!snapshot) {
  for (let offset = -1800; offset <= 1800; offset += 1800) {
    snapshot = await redis.get(`snapshot:${marketId}:${targetTimestamp + offset}`);
    if (snapshot) break;
  }
}
```

### C. Redis Connection Failures

**Problem**: Upstash Redis is down or rate-limited.

**Solution**: Use `safeRedisOperation` wrapper
```typescript
export async function safeRedisOperation<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('[Redis] Operation failed:', error);
    return fallback; // Return safe fallback value
  }
}
```

**Fallback Behavior**:
- If Redis fails during snapshot storage → Log error, continue
- If Redis fails during price change calculation → Return 0 for changes
- System remains functional, just shows less data

### D. First 24 Hours After Deployment

**Problem**: No historical snapshots exist yet.

**Solution**: Gradual data buildup
- Hour 1: Only `change1h` works
- Hour 6: `change1h` and `change6h` work
- Hour 24+: All changes work

**UI Handling**:
```typescript
// In frontend, show "—" for unavailable changes
{change1h === 0 && marketAge < 1h ? '—' : `${change1h > 0 ? '+' : ''}${change1h}%`}
```

### E. Clock Skew

**Problem**: Server clocks slightly out of sync.

**Solution**: Round to hourly timestamps
```typescript
function getHourlyTimestamp(date: Date = new Date()): number {
  const timestamp = Math.floor(date.getTime() / 1000);
  return timestamp - (timestamp % 3600); // Round down to hour
}
```

All servers will use the same hourly timestamp (e.g., 1735056000 for 2024-12-24 14:00:00).

---

## 7. Deployment Checklist

### Step 1: Environment Setup

```bash
# Add to .env.local
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
CRON_SECRET=your_random_secret_here  # Optional, for security
```

### Step 2: Install Dependencies

```bash
npm install @upstash/redis
```

### Step 3: Create Files

- [ ] `/home/victor/predictscreener/lib/upstash.ts`
- [ ] `/home/victor/predictscreener/lib/api/snapshots.ts`
- [ ] `/home/victor/predictscreener/app/api/cron/snapshot-prices/route.ts`
- [ ] `/home/victor/predictscreener/vercel.json` (if using Vercel cron)

### Step 4: Update Existing Files

- [ ] Modify `/home/victor/predictscreener/lib/api/markets.ts`
  - Update `normalizePolymarketMarket` function
  - Update `getAllMarkets` function

### Step 5: Test Locally

```bash
# Run dev server
npm run dev

# Test snapshot endpoint manually
curl http://localhost:3000/api/cron/snapshot-prices

# Verify Redis data (use Upstash web console)
```

### Step 6: Deploy to Vercel

```bash
# Add env vars to Vercel
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add CRON_SECRET production

# Deploy
vercel --prod
```

### Step 7: Monitor Cron

- Check Vercel cron logs: Vercel Dashboard → Your Project → Cron
- Verify snapshots in Upstash console: Check key count increases hourly
- Monitor for errors in Vercel function logs

---

## 8. Performance Considerations

### Storage Costs

**Per market**: ~150 bytes per snapshot
- 2000 markets × 150 bytes = 300 KB per hour
- 300 KB × 24 hours = 7.2 MB per day
- 7.2 MB × 7 days = ~50 MB total storage (with TTL)

**Upstash Free Tier**: 10,000 commands/day, 256 MB storage
- Storage: 50 MB ✅ Well within limits
- Commands:
  - Snapshot cron: 2000 writes/hour × 24 = 48,000 writes/day ❌ Exceeds free tier
  - Reads: ~2000 markets × 3 changes = 6,000 reads per page load

**Recommendation**: Upgrade to Upstash paid tier (~$10/month for 100K commands)

### Rate Limiting

Use Redis pipeline for batch operations:
```typescript
const pipeline = redis.pipeline();
for (const market of markets) {
  pipeline.setex(key, ttl, value);
}
await pipeline.exec(); // Single API call instead of 2000
```

### Caching Strategy

- Store snapshots: Every hour via cron
- Read snapshots: On-demand during market fetch
- Latest prices: Cached with no TTL for fast access

---

## 9. Testing Strategy

### Unit Tests

Test snapshot functions:
```typescript
// Test hourly timestamp rounding
expect(getHourlyTimestamp(new Date('2024-12-24T14:45:30Z')))
  .toBe(1735056000); // 2024-12-24T14:00:00Z

// Test price change calculation
const snapshot = { probability: 50, ... };
const change = calculateChange(snapshot, 55);
expect(change).toBe(5.0); // +5 percentage points
```

### Integration Tests

```typescript
// Test snapshot storage and retrieval
await storePriceSnapshot(mockMarket);
const snapshot = await getSnapshotFromHoursAgo(mockMarket.id, 0);
expect(snapshot.probability).toBe(mockMarket.probability);

// Test fallback to nearby timestamps
await storePriceSnapshot(mockMarket); // t=1000
const snapshot = await getSnapshotFromHoursAgo(mockMarket.id, 0); // t=1030
expect(snapshot).not.toBeNull(); // Should find nearby snapshot
```

### Manual Testing

```bash
# 1. Run snapshot cron
curl http://localhost:3000/api/cron/snapshot-prices

# 2. Check Redis (Upstash console)
# Should see keys like: snapshot:73289502:1735056000

# 3. Fetch markets
curl http://localhost:3000/api/markets

# 4. Verify change1h, change6h, change24h fields are populated
```

---

## 10. Migration Plan

### Phase 1: Deploy with Fallback (Week 1)

- Deploy snapshot system alongside existing Polymarket API approach
- Set `useSnapshots=false` by default
- Cron runs to build historical data
- No user-facing changes

### Phase 2: A/B Test (Week 2)

- Enable snapshots for 50% of requests
- Monitor accuracy vs. Polymarket API
- Compare performance (latency, error rates)

### Phase 3: Full Rollout (Week 3)

- Set `useSnapshots=true` by default
- Remove expensive price history API calls
- Keep Polymarket API as fallback for errors

### Phase 4: Cleanup (Week 4)

- Remove old price change calculation code
- Optimize snapshot queries
- Add monitoring/alerting for cron failures

---

## 11. Monitoring & Alerts

### Key Metrics to Track

1. **Snapshot Success Rate**: % of markets successfully snapshotted each hour
2. **Redis Availability**: Uptime of Upstash connection
3. **Cron Execution Time**: Duration of snapshot job (should be < 60 seconds)
4. **Data Completeness**: % of markets with 1h/6h/24h snapshots

### Alerts

- ❌ Cron job fails → Send notification (email/Slack)
- ❌ Snapshot success rate < 95% → Investigate Redis issues
- ❌ Redis connection errors > 10/min → Check Upstash status

### Logging

```typescript
console.log('[Snapshot Cron] Starting...');
console.log(`[Snapshot Cron] Stored ${success}/${total} snapshots`);
console.error('[Snapshot Cron] Error:', error);
```

Use Vercel logs or external logging service (LogDNA, Datadog).

---

## Summary

This implementation provides:

✅ **Accurate price changes**: Real snapshots every hour, not approximated
✅ **Scalable**: Redis pipeline reduces API calls
✅ **Resilient**: Fallback handling for missing data
✅ **Cost-efficient**: 7-day TTL keeps storage minimal
✅ **Simple**: One cron job, automatic cleanup

**Next Steps**:
1. Set up Upstash Redis account
2. Create environment variables
3. Implement files in order (upstash.ts → snapshots.ts → route.ts)
4. Test locally
5. Deploy to Vercel
6. Monitor for 24 hours to build initial data
