# Quick Performance Fixes - Implementation Guide

## Phase 1: Immediate Wins (1-2 hours implementation)

### Fix 1: Reduce Initial Data Fetch

**File**: `/home/victor/predictscreener/app/actions/markets.ts`

**Change Line 34**:
```typescript
// BEFORE
let markets = await getAllMarkets(2000, true);

// AFTER
let markets = await getAllMarkets(100, false);
```

**Change Line 363** (global stats):
```typescript
// BEFORE
const markets = await getAllMarkets(100, false);

// AFTER  
const markets = await getAllMarkets(50, false);
```

**Impact**: Reduces load time from 9s to ~2s

---

### Fix 2: Reduce Page Size for Caching

**File**: `/home/victor/predictscreener/lib/api/polymarket.ts`

**Change Line 98**:
```typescript
// BEFORE
const pageSize = 500;

// AFTER
const pageSize = 100;
```

**Impact**: Enables Next.js caching (responses will be < 2MB)

---

### Fix 3: Disable Expensive Price Calculations

**File**: `/home/victor/predictscreener/lib/api/markets.ts`

**Change Line 139** (function signature):
```typescript
// BEFORE
export async function getAllMarkets(
  limit: number = 2000,
  fetchPriceChanges: boolean = true
): Promise<Market[]> {

// AFTER
export async function getAllMarkets(
  limit: number = 100,
  fetchPriceChanges: boolean = false
): Promise<Market[]> {
```

**Change Line 160**:
```typescript
// BEFORE
const topCount = fetchPriceChanges ? 100 : 0;

// AFTER
const topCount = fetchPriceChanges ? 20 : 0;
```

**Impact**: Eliminates 100 API calls, saves 2-3 seconds

---

### Fix 4: Lazy Load Charts (if imported on main page)

**File**: Any component importing chart components

**Add at top**:
```typescript
import dynamic from 'next/dynamic';

// Replace direct imports
const PriceChart = dynamic(() => import('@/components/charts/PriceChart'), {
  loading: () => <div className="animate-pulse h-64 bg-surface-hover rounded" />,
  ssr: false
});

const MultiOutcomePriceChart = dynamic(() => import('@/components/charts/MultiOutcomePriceChart'), {
  loading: () => <div className="animate-pulse h-64 bg-surface-hover rounded" />,
  ssr: false
});
```

**Impact**: Reduces initial bundle by ~400KB

---

### Fix 5: Optimize Pagination (already implemented)

**File**: `/home/victor/predictscreener/app/MarketsPageClient.tsx`

**Current implementation (Line 43)**:
```typescript
const marketsPerPage = 50; // ✅ Good - limits rendered items
```

**Note**: Pagination is already working well. No changes needed.

---

## Testing After Changes

### 1. Check Server Logs
```bash
npm run dev
```

Look for:
- ✅ `[Polymarket] Fetched 100 markets` (not 2000)
- ✅ No "Failed to set Next.js data cache" warnings
- ✅ Faster load times in console

### 2. Test in Browser

**Open Chrome DevTools → Network Tab**

Before fixes:
- ~104 requests
- ~16 MB transferred
- ~9 seconds load time

After fixes:
- ~5 requests
- ~1 MB transferred  
- ~2 seconds load time

### 3. Verify Functionality

- ✅ Markets table loads and displays
- ✅ Filters work correctly
- ✅ Sorting works
- ✅ Pagination works
- ⚠️ 1h/6h columns show 0 (expected - we disabled calculations)

---

## Alternative: Keep 1h/6h Columns

If you need 1h/6h data, implement client-side calculation:

**File**: `/home/victor/predictscreener/app/MarketsPageClient.tsx`

Add after WebSocket updates effect:
```typescript
// Calculate 1h/6h changes from WebSocket updates
useEffect(() => {
  if (updates.size === 0) return;
  
  // Track price history for each market
  setMarkets((prevMarkets) =>
    prevMarkets.map((market) => {
      const update = updates.get(market.id);
      if (!update) return market;
      
      // TODO: Store last 6 hours of updates in state
      // Calculate changes from stored data
      // This avoids 100 API calls on initial load
      
      return {
        ...market,
        probability: update.probability ?? market.probability,
        volume24h: update.volume24h ?? market.volume24h,
        change24h: update.change24h ?? market.change24h,
      };
    })
  );
}, [updates]);
```

---

## Expected Results

### Before Fixes:
```
Load Time:        9 seconds
Data Transfer:    16 MB
API Requests:     104
Cache Hit Rate:   0%
Bundle Size:      ~2 MB
```

### After Fixes:
```
Load Time:        2 seconds  ⬇️ 78%
Data Transfer:    1 MB       ⬇️ 94%
API Requests:     5          ⬇️ 95%
Cache Hit Rate:   90%        ⬆️ 90%
Bundle Size:      ~1.6 MB    ⬇️ 20%
```

---

## Rollback Plan

If issues occur, revert changes:

```bash
git diff app/actions/markets.ts
git checkout app/actions/markets.ts

git diff lib/api/markets.ts  
git checkout lib/api/markets.ts

git diff lib/api/polymarket.ts
git checkout lib/api/polymarket.ts
```

---

## Next Steps (Phase 2)

After Phase 1 is stable:

1. **Add Redis/KV cache** (1 day)
   - Cache Polymarket responses
   - 5-minute TTL
   - Bypass Next.js 2MB limit

2. **Server-side filtering** (2 days)
   - Move filter logic to server actions
   - Use URL params for state
   - Better SEO and shareability

3. **Database solution** (1 week)
   - PostgreSQL with incremental updates
   - Complex queries and aggregations
   - Historical data tracking

---

## Monitoring

Add to application:

```typescript
// Track performance metrics
if (typeof window !== 'undefined' && window.performance) {
  const perfData = window.performance.timing;
  const loadTime = perfData.loadEventEnd - perfData.navigationStart;
  
  console.log('Page Load Time:', loadTime + 'ms');
  
  // Send to analytics
  // analytics.track('page_load', { duration: loadTime });
}
```

---

## Questions?

- Performance not improved? Check Network tab for remaining slow requests
- Cache still failing? Verify response sizes are < 2MB
- Markets not loading? Check console for errors

See PERFORMANCE_AUDIT_REPORT.md for full analysis.
