# Market Quality & Quantity Improvements

## Problems Identified

### 1. Only 500 Markets (Competitors have 5,000+)
- **Current**: `getAllMarkets(500, true)` hardcoded in `app/actions/markets.ts:34`
- **Betmoar**: Caches 5,544 events in snapshot
- **Fix**: Increase limit to 2000+ or implement pagination

### 2. Trending = Just Volume Sorted (BROKEN)
- **Current**: Just orders by `volume24hr` descending - no actual trending logic
- **Problem**: Shows same high-volume markets forever, no spike detection
- **Fix**: Create trending score algorithm:
  ```
  trendingScore = (volume24h / avgVolume7d) * priceChangeVelocity * recentTradesBoost
  ```

### 3. New Markets Shows Garbage
- **Current**: Filters created <48h, sorts by newest
- **Problem**: New low-volume garbage markets appear first
- **PolymarketAnalytics**: Shows new markets with $50k+ volume
- **Fix**: Filter by recency + minimum volume ($5,000+)

### 4. No Spam Filtering
- **Betmoar excludes tag IDs**: 1312, 1, 100639, 102127
- **Fix**: Add `exclude_tag_id` to API calls

---

## Implementation Plan

### Task 1: Increase Market Limit + Add Volume Filter
**File**: `lib/api/polymarket.ts`

```typescript
// Add minimum volume parameter
export async function fetchPolymarketMarkets(
  limit: number = 100,
  offset: number = 0,
  minVolume: number = 1000  // NEW: Filter garbage
): Promise<PolymarketMarket[]> {
  // Fetch more, filter by volume
}
```

### Task 2: Add Tag Exclusion (Spam Filter)
**File**: `lib/api/polymarket.ts`

Add to query params:
```typescript
const EXCLUDED_TAG_IDS = ['1312', '1', '100639', '102127']; // Spam tags from betmoar
```

### Task 3: Create Trending Algorithm
**File**: `lib/api/markets.ts` (new function)

```typescript
function calculateTrendingScore(market: Market): number {
  // Volume spike ratio (vs baseline)
  const volumeSpike = market.volume24h / Math.max(market.avgVolume7d, 1000);

  // Price movement velocity (absolute change)
  const priceVelocity = Math.abs(market.change24h) / 24;

  // Recency boost (newer = higher)
  const hoursOld = (Date.now() - market.createdAt.getTime()) / 3600000;
  const recencyBoost = Math.max(0, 1 - hoursOld / 168); // Decay over 7 days

  // Minimum volume threshold
  if (market.volume24h < 5000) return 0;

  return volumeSpike * (1 + priceVelocity) * (1 + recencyBoost * 0.5);
}
```

### Task 4: Fix New Markets Filter
**File**: `app/MarketsPageClient.tsx`

```typescript
case 'new':
  const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
  marketsToFilter = marketsToFilter
    .filter((m) => new Date(m.createdAt) > threeDaysAgo)
    .filter((m) => m.volume24h >= 5000)  // Quality threshold
    .sort((a, b) => b.volume24h - a.volume24h);  // Best new markets first
  break;
```

---

## Checklist

- [x] Increase market limit from 500 to 2000
- [x] Add `minVolume` parameter to filter garbage (<$1000)
- [x] Add tag exclusion for spam markets
- [x] Create `calculateTrendingScore()` function
- [x] Update trending view to use trending score
- [x] Fix new markets: recency + volume threshold
- [x] Build compiles successfully

---

## Review

### Changes Made

**1. `lib/api/polymarket.ts`**
- Added `EXCLUDED_TAG_IDS` constant with spam tag IDs (1312, 1, 100639, 102127)
- Added `MIN_VOLUME_THRESHOLD` constant ($1,000)
- Updated `fetchPolymarketMarkets()` to support tag exclusion via `exclude_tag_id` params
- Added new `fetchPolymarketMarketsWithPagination()` function that:
  - Fetches multiple pages (500 per page) in parallel
  - Applies client-side volume filtering
  - Returns 2000+ quality markets instead of 500

**2. `lib/api/types.ts`**
- Added `volume1wk`, `volume1mo` fields to `PolymarketMarket`
- Added `oneDayPriceChange`, `oneWeekPriceChange`, `competitive` fields

**3. `lib/api/markets.ts`**
- Added `calculateTrendingScore()` function with algorithm:
  - Volume spike ratio (24h vs 7d daily average)
  - Price velocity boost (larger price moves = more trending)
  - Recency boost (newer markets get slight boost)
  - Minimum $5,000 volume threshold
- Updated `getAllMarkets()` to use pagination and attach trending scores

**4. `types/market.ts`**
- Added `trendingScore?: number` to `Market` interface

**5. `app/MarketsPageClient.tsx`**
- Updated `case 'trending'`: Now sorts by `trendingScore` descending
- Updated `case 'new'`: Now filters by 72h recency + $5,000 min volume, sorted by volume

**6. `app/actions/markets.ts`**
- Changed `getAllMarkets(500, true)` to `getAllMarkets(2000, true)`

### Results
| Metric | Before | After |
|--------|--------|-------|
| Market count | 500 | 2000+ |
| Trending logic | Volume sort only | Score algorithm |
| New Markets | Any new market | $5k+ volume only |
| Spam filter | None | 4 tag IDs excluded |

✅ **Build: Compiles successfully**
