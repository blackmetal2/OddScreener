# Whale Recent Trades Feature

## Goal
Show recent trades for tracked whales, encouraging users to use the tracking feature for copy-trading insights.

## Current State
- Tracked wallets section shows: name, address, avatar, delete button
- No trade activity shown inline
- User must click through to trader profile to see trades

## Target State
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔔 TRACKED WHALES                                               │
│ Track whales to see their recent trading activity               │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🐋 ocanira                                              [×] │ │
│ │ Bought $5,240 YES @ 35%                             2h ago │ │
│ │ "Will Trump release Epstein files by Dec 30?"              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🐋 Tsetsefly                                            [×] │ │
│ │ Sold $2,100 NO @ 62%                                4h ago │ │
│ │ "Bitcoin above $90K by Jan 1?"                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🐋 newWhale                                             [×] │ │
│ │ No recent trades                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ [+ Add Wallet]                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Task 1: Add batch trade fetching function
**File:** `lib/api/polymarket.ts`

Add helper to fetch recent trades for multiple addresses in parallel:
```typescript
export async function fetchRecentTradesForAddresses(
  addresses: string[],
  tradesPerAddress: number = 1
): Promise<Map<string, PolymarketUserTrade[]>>
```

- [x] Parallel Promise.all for all addresses
- [x] Return Map<address, trades[]>
- [x] Handle errors gracefully (empty array for failed fetches)

---

### Task 2: Add server action for client use
**File:** `app/actions/markets.ts`

Add server action that client can call:
```typescript
export async function fetchTrackedWhaleTrades(
  addresses: string[]
): Promise<Map<string, TraderTrade[]>>
```

- [x] Call polymarket function
- [x] Transform to TraderTrade format
- [x] Return serializable data

---

### Task 3: Update WhaleTrackerClient component
**File:** `app/whales/WhaleTrackerClient.tsx`

Changes needed:
- [x] Add state for recent trades: `recentTrades: Map<string, TraderTrade>`
- [x] Add loading state for trades
- [x] useEffect to fetch trades when trackedWallets changes
- [x] Add refresh button to manually refetch

---

### Task 4: Update tracked wallet card UI
**File:** `app/whales/WhaleTrackerClient.tsx`

Redesign tracked wallet card to show:
- [x] Whale name + address (existing)
- [x] Recent trade: side, amount, outcome, price
- [x] Market question (truncated)
- [x] Time ago
- [x] Loading skeleton while fetching
- [x] "No recent trades" fallback

---

### Task 5: Add feature explanation text
**File:** `app/whales/WhaleTrackerClient.tsx`

- [x] Add subtitle under "Tracked Whales" header
- [x] Text: "Track whales to monitor their recent trading activity"
- [x] Muted color, small text

---

### Task 6: Add empty state with CTA
**File:** `app/whales/WhaleTrackerClient.tsx`

When no whales tracked:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔔 TRACKED WHALES                                           │
│                                                             │
│ 🐋 No whales tracked yet                                   │
│                                                             │
│ Track top traders from the leaderboard below to monitor    │
│ their recent trades and copy their strategies.             │
│                                                             │
│ Click the ⭐ button on any trader to start tracking.       │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

1. `lib/api/polymarket.ts` - Add batch fetch function
2. `app/actions/markets.ts` - Add server action
3. `app/whales/WhaleTrackerClient.tsx` - Main UI changes

## Estimated Complexity
- **Low-Medium**: Mostly UI changes + one new API helper
- **No new dependencies**
- **No database changes**
- **Client-side caching only** (60 second refetch)

---

## Review

### Changes Made

**1. `lib/api/polymarket.ts`** (lines 862-896)
- Added `fetchRecentTradesForAddresses()` function
- Fetches trades for multiple addresses in parallel
- Returns `Map<address, trades[]>`

**2. `app/actions/markets.ts`** (lines 404-438)
- Added `fetchTrackedWhaleTrades()` server action
- Transforms raw API data to `TraderTrade` format
- Returns serializable `Record<string, TraderTrade | null>`

**3. `app/whales/WhaleTrackerClient.tsx`** (major rewrite)
- Added state: `recentTrades`, `tradesLoading`, `lastFetched`
- Added `fetchTrades()` callback with loading states
- Redesigned tracked wallets from list to card grid
- Each card shows: name, address, recent trade details
- Added refresh button with loading spinner
- Added feature explanation text
- Added empty state CTA with instructions

**4. `app/api/cron/snapshot-prices/route.ts`** (line 115)
- Fixed pre-existing TypeScript error (type annotation for `spreadResult`)

### UI Changes

**Before:**
- Simple list of tracked wallets (name + address only)

**After:**
- Grid of cards (1/2/3 columns responsive)
- Each card shows latest trade:
  - Buy/Sell badge with color
  - Amount + outcome + price
  - Market title (truncated)
  - Time ago
- Loading skeleton while fetching
- Refresh button to manually update
- Improved empty state with visual icon and clear CTA

### Performance Notes
- Trades only fetched for tracked wallets (typically 1-5)
- Parallel fetching via `Promise.all`
- 60-second cache on API responses
- No impact on leaderboard load time
